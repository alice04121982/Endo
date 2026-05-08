import "server-only";
import { generateObject } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { z } from "zod";
import { appendAuditRow } from "./audit";
import { buildSystemPrompt } from "./audience";
import { AI_DISCLAIMER } from "./disclaimer";
import { resolveModel } from "./models";
import { getTask } from "./prompts";
import { detectsDiagnosticConclusion } from "./refusal";
import {
  GatewayRequestSchema,
  type Citation,
  type GatewayRequest,
  type GatewayResponse,
} from "./types";

/**
 * Single server-side choke point for every clinical LLM call.
 *
 * Responsibilities:
 *   1. Validate the request shape and look up the registered task.
 *   2. Validate task-specific inputs against the task's Zod schema.
 *   3. Compose system prompt: base voice rules + audience block + task block.
 *      Tasks cannot suppress the base rules.
 *   4. Call the model via AI SDK + Vercel AI Gateway.
 *   5. Validate the model's structured output against the task schema.
 *   6. Sweep textual output for diagnostic-conclusion patterns. Refuse if found.
 *   7. Enforce citation policy.
 *   8. Append an audit row (hash-chained) regardless of outcome.
 *   9. Return a typed GatewayResponse carrying the disclaimer.
 *
 * Application code never imports the model SDK directly — it goes through here.
 */
export async function callGateway(rawRequest: unknown): Promise<GatewayResponse> {
  const requestParsed = GatewayRequestSchema.safeParse(rawRequest);
  if (!requestParsed.success) {
    throw new Error(`Invalid gateway request: ${requestParsed.error.message}`);
  }
  const request: GatewayRequest = requestParsed.data;

  const task = getTask(request.task);
  if (!task) {
    throw new Error(`Unknown task: ${request.task}`);
  }
  if (!task.audiences.includes(request.audience)) {
    throw new Error(
      `Task ${task.name} not allowed for audience ${request.audience}`,
    );
  }

  const inputParsed = task.inputSchema.safeParse(request.inputs);
  if (!inputParsed.success) {
    return finaliseFailure({
      request,
      task,
      modelId: resolveModel(task.modelTier),
      output: null,
      citations: [],
      outcome: "validation_failed",
      refusalReason: `Input validation failed: ${inputParsed.error.message}`,
      latencyMs: null,
    });
  }
  const input = inputParsed.data;

  const modelId = resolveModel(task.modelTier);
  const systemPrompt = buildSystemPrompt(
    request.audience,
    task.buildTaskBlock(request.audience),
  );
  const userPrompt = JSON.stringify(input);

  const startedAt = Date.now();
  let modelOutput: unknown;
  try {
    const result = await generateObject({
      model: gateway(`anthropic/${modelId}`),
      system: systemPrompt,
      prompt: userPrompt,
      schema: task.outputSchema as z.ZodType<unknown>,
    });
    modelOutput = result.object;
  } catch (err) {
    return finaliseFailure({
      request,
      task,
      modelId,
      output: null,
      citations: [],
      outcome: "model_error",
      refusalReason:
        err instanceof Error ? err.message : "unknown model error",
      latencyMs: Date.now() - startedAt,
    });
  }
  const latencyMs = Date.now() - startedAt;

  // Output schema is enforced by generateObject, but re-parse defensively
  // so any future runtime extraction goes through the same pipe.
  const outputParsed = task.outputSchema.safeParse(modelOutput);
  if (!outputParsed.success) {
    return finaliseFailure({
      request,
      task,
      modelId,
      output: modelOutput,
      citations: [],
      outcome: "validation_failed",
      refusalReason: `Output schema mismatch: ${outputParsed.error.message}`,
      latencyMs,
    });
  }
  const output = outputParsed.data;

  // Diagnostic-conclusion sweep on the serialised output. Coarse but effective:
  // catches any string field. The system prompt is the primary control.
  const serialisedOutput = JSON.stringify(output);
  if (detectsDiagnosticConclusion(serialisedOutput)) {
    return finaliseFailure({
      request,
      task,
      modelId,
      output,
      citations: [],
      outcome: "refused_diagnostic_conclusion",
      refusalReason:
        "Output contained a diagnostic-shaped statement. Endo never produces a diagnosis.",
      latencyMs,
    });
  }

  // Compose citations: defaults from task (e.g. source utterance id) merged
  // with hints from the model. Model hints are demoted to source_data; only
  // the gateway can emit guideline citations (later, when corpus lands).
  const defaultCitations = task.defaultCitations
    ? task.defaultCitations(input)
    : [];
  const hintCitations: Citation[] = extractCitationHints(output).map((h) => ({
    kind: "source_data" as const,
    sourceId: h.sourceId,
    label: h.label,
  }));
  const citations: Citation[] = [...defaultCitations, ...hintCitations];

  if (task.requiresCitations && citations.length === 0) {
    return finaliseFailure({
      request,
      task,
      modelId,
      output,
      citations: [],
      outcome: "validation_failed",
      refusalReason: "Task requires at least one citation; none provided.",
      latencyMs,
    });
  }

  const audit = await appendAuditRow({
    callerSubjectId: request.callerSubjectId,
    patientSubjectId: request.patientSubjectId,
    consentTokenId: request.consentTokenId ?? null,
    audience: request.audience,
    taskName: task.name,
    promptTemplateVersion: task.version,
    modelId,
    inputs: input as Record<string, unknown>,
    output,
    citations,
    outcome: "success",
    refusalReason: null,
    latencyMs,
  });

  return {
    outputId: crypto.randomUUID(),
    auditEntryId: audit.auditEntryId,
    aiGenerated: true,
    reviewStatus: "pending_clinician_review",
    audience: request.audience,
    taskName: task.name,
    modelId,
    promptTemplateVersion: task.version,
    output,
    citations,
    outcome: "success",
    refusalReason: null,
    disclaimer: AI_DISCLAIMER,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Internals
// ─────────────────────────────────────────────────────────────────────────────

function extractCitationHints(
  output: unknown,
): Array<{ sourceId: string; label: string }> {
  if (!output || typeof output !== "object") return [];
  const hints = (output as { citationsHint?: unknown }).citationsHint;
  if (!Array.isArray(hints)) return [];
  return hints.flatMap((h) => {
    if (
      h &&
      typeof h === "object" &&
      typeof (h as { sourceId?: unknown }).sourceId === "string" &&
      typeof (h as { label?: unknown }).label === "string"
    ) {
      return [{ sourceId: (h as { sourceId: string }).sourceId, label: (h as { label: string }).label }];
    }
    return [];
  });
}

interface FailureContext {
  request: GatewayRequest;
  task: ReturnType<typeof getTask> & object;
  modelId: string;
  output: unknown;
  citations: Citation[];
  outcome: Exclude<GatewayResponse["outcome"], "success">;
  refusalReason: string;
  latencyMs: number | null;
}

async function finaliseFailure(ctx: FailureContext): Promise<GatewayResponse> {
  const audit = await appendAuditRow({
    callerSubjectId: ctx.request.callerSubjectId,
    patientSubjectId: ctx.request.patientSubjectId,
    consentTokenId: ctx.request.consentTokenId ?? null,
    audience: ctx.request.audience,
    taskName: ctx.task.name,
    promptTemplateVersion: ctx.task.version,
    modelId: ctx.modelId,
    inputs: ctx.request.inputs,
    output: ctx.output,
    citations: ctx.citations,
    outcome: ctx.outcome,
    refusalReason: ctx.refusalReason,
    latencyMs: ctx.latencyMs,
  });
  return {
    outputId: crypto.randomUUID(),
    auditEntryId: audit.auditEntryId,
    aiGenerated: true,
    reviewStatus: "pending_clinician_review",
    audience: ctx.request.audience,
    taskName: ctx.task.name,
    modelId: ctx.modelId,
    promptTemplateVersion: ctx.task.version,
    output: ctx.output ?? null,
    citations: ctx.citations,
    outcome: ctx.outcome,
    refusalReason: ctx.refusalReason,
    disclaimer: AI_DISCLAIMER,
  };
}
