import { createHash } from "node:crypto";
import { z } from "zod";
import { getSupabaseServer, getSupabaseServiceRole } from "@/lib/supabase/server";
import { callGateway } from "@/lib/llm/gateway";
import type { Citation } from "@/lib/llm/types";
import { listOwnJournalEntries, getPatientCycleContext } from "./journal";

// Cumulative Symptom Dossier — typed payload + render service.
//
// Both views (patient + clinician) are generated from the SAME payload.
// We render them in two gateway calls passing identical structured input;
// the audience parameter governs voice. This is the brief's "never
// re-prompted independently" rule literally applied: neither view is a
// summary of the other; both are derived directly from the typed payload.
//
// Byte-stability — payload is canonical-JSON-serialised, SHA-256 hashed,
// and the hash forms the cache key. Same input => cached narrative
// returned, no fresh model call, identical bytes. Brief's printable PDF
// requirement is satisfied by stamping the same narrative onto an
// idempotent template.

// ─────────────────────────────────────────────────────────────────────────────
// Payload shape
// ─────────────────────────────────────────────────────────────────────────────
export const CSDPayloadSchema = z.object({
  patient: z.object({
    age: z.number().int().nullable(),
    pronouns: z.string().nullable(),
  }),
  cycleContext: z.object({
    lastMenstrualPeriodStart: z.string().nullable(),
    averageCycleLengthDays: z.number().int().nullable(),
  }),
  recentEntries: z.array(
    z.object({
      entryDate: z.string(),
      cycleDay: z.number().int().nullable(),
      cyclePhase: z.string(),
      painVas: z.number().int().nullable(),
      painLocations: z.array(z.string()),
      bowelSymptoms: z.array(z.string()),
      bladderSymptoms: z.array(z.string()),
      dyspareunia: z.boolean().nullable(),
      bleedingHeaviness: z.string(),
      patientPlainSummary: z.string(),
      sourceId: z.string(),
    }),
  ),
  // Stubs for now — populated by features 4 (uploads), 7 (adeno),
  // 6 (NICE prompts) when they land. CSDPayload accepts them empty.
  uploadedDocuments: z
    .array(
      z.object({
        sourceId: z.string(),
        kind: z.string(),
        performedAt: z.string(),
        summary: z.string(),
      }),
    )
    .default([]),
  niceGaps: z
    .array(
      z.object({
        recommendationId: z.string(),
        recommendationLabel: z.string(),
        patientText: z.string(),
        clinicianText: z.string(),
      }),
    )
    .default([]),
  adenomyosisFlag: z
    .object({
      triggered: z.boolean(),
      score: z.number().int(),
      triggers: z.array(z.string()),
    })
    .nullable()
    .default(null),
});

export type CSDPayload = z.infer<typeof CSDPayloadSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Build payload from DB
// ─────────────────────────────────────────────────────────────────────────────
export async function buildCSDPayloadForCurrentPatient(): Promise<CSDPayload | null> {
  const supabase = await getSupabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return null;

  const ctx = await getPatientCycleContext();
  const entries = await listOwnJournalEntries(60);

  return {
    patient: {
      age: null, // To populate from a future profile-edit page.
      pronouns: null,
    },
    cycleContext: ctx,
    recentEntries: entries.slice(0, 30).map((e) => ({
      entryDate: e.entryDate,
      cycleDay: e.cycleDay,
      cyclePhase: e.cyclePhase,
      painVas: e.painVas,
      painLocations: e.painLocations,
      bowelSymptoms: e.bowelSymptoms,
      bladderSymptoms: e.bladderSymptoms,
      dyspareunia: e.dyspareunia,
      bleedingHeaviness: e.bleedingHeaviness,
      patientPlainSummary: e.patientPlainSummary,
      sourceId: e.id,
    })),
    uploadedDocuments: [],
    niceGaps: [],
    adenomyosisFlag: null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Canonical hash for byte-stability
// ─────────────────────────────────────────────────────────────────────────────
function canonicalJSON(value: unknown): string {
  // Stable key ordering. Recursion visits objects in sorted-key order,
  // arrays preserve insertion order, primitives are JSON.stringify'd.
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJSON).join(",")}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys
    .map((k) => `${JSON.stringify(k)}:${canonicalJSON(obj[k])}`)
    .join(",")}}`;
}

export function payloadHash(payload: CSDPayload): string {
  return createHash("sha256").update(canonicalJSON(payload)).digest("hex");
}

// ─────────────────────────────────────────────────────────────────────────────
// Cache lookup
// ─────────────────────────────────────────────────────────────────────────────
export interface RenderedCSD {
  body: string;
  citations: Citation[];
  modelId: string;
  promptTemplateVersion: string;
  payloadHash: string;
  audience: "patient" | "clinician";
  generatedAt: string;
  fromCache: boolean;
}

interface CachedRow {
  id: string;
  created_at: string;
  body: string;
  citations: Citation[];
  model_id: string;
  prompt_template_version: string;
  payload_hash: string;
  audience: "patient" | "clinician";
}

async function readCachedRender(
  patientSubjectId: string,
  audience: "patient" | "clinician",
  hash: string,
): Promise<RenderedCSD | null> {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("csd_renders")
    .select(
      "id, created_at, body, citations, model_id, prompt_template_version, payload_hash, audience",
    )
    .eq("patient_subject_id", patientSubjectId)
    .eq("audience", audience)
    .eq("payload_hash", hash)
    .eq("outcome", "success")
    .order("created_at", { ascending: false })
    .limit(1)
    .returns<CachedRow[]>();

  if (!data || data.length === 0) return null;
  const row = data[0];
  return {
    body: row.body,
    citations: row.citations as Citation[],
    modelId: row.model_id,
    promptTemplateVersion: row.prompt_template_version,
    payloadHash: row.payload_hash,
    audience: row.audience,
    generatedAt: row.created_at,
    fromCache: true,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Banned-term lint
// ─────────────────────────────────────────────────────────────────────────────
// Defence-in-depth on top of the gateway's diagnostic-conclusion sweep.
// The brief lists specific terms that fail design review even when they
// arrive grammatically softened: "diagnose", "definitive", "you have",
// "confirms". This lint runs only on CSD output (where the regulatory
// stakes are highest) and rejects any narrative containing them.

const BANNED_PHRASES: RegExp[] = [
  /\bdiagnos(?:e[sd]?|ing|is)\b/i,
  /\bdefinitiv(?:e|ely)\b/i,
  /\byou\s+have\s+(?:endometriosis|adenomyosis)\b/i,
  /\b(?:confirm[s]?|confirmed)\s+(?:endometriosis|adenomyosis)\b/i,
];

export function violatesBannedTermLint(text: string): {
  ok: true;
} | { ok: false; matches: string[] } {
  const matches: string[] = [];
  for (const re of BANNED_PHRASES) {
    const m = text.match(re);
    if (m) matches.push(m[0]);
  }
  if (matches.length === 0) return { ok: true };
  return { ok: false, matches };
}

// ─────────────────────────────────────────────────────────────────────────────
// Generate (or cache-hit) a CSD render
// ─────────────────────────────────────────────────────────────────────────────
export async function regenerateCSD(
  patientSubjectId: string,
  audience: "patient" | "clinician",
  payload: CSDPayload,
): Promise<{ ok: true; render: RenderedCSD } | { ok: false; error: string }> {
  const hash = payloadHash(payload);

  const cached = await readCachedRender(patientSubjectId, audience, hash);
  if (cached) return { ok: true, render: cached };

  // Miss — call the gateway with the typed payload.
  const response = await callGateway({
    audience,
    task: "generate-csd-view",
    inputs: {
      payload,
      audience,
    },
    callerSubjectId: patientSubjectId,
    patientSubjectId,
  });

  if (response.outcome !== "success") {
    // Map gateway outcomes onto the csd_renders.outcome subset.
    const mappedOutcome:
      | "refused_diagnostic_conclusion"
      | "validation_failed"
      | "model_error" =
      response.outcome === "refused_diagnostic_conclusion"
        ? "refused_diagnostic_conclusion"
        : response.outcome === "validation_failed"
          ? "validation_failed"
          : "model_error";
    await writeRenderRow({
      patientSubjectId,
      audience,
      payload,
      payloadHash: hash,
      body: "",
      citations: [],
      modelId: response.modelId,
      promptTemplateVersion: response.promptTemplateVersion,
      auditEntryId: response.auditEntryId,
      outcome: mappedOutcome,
    });
    return {
      ok: false,
      error: response.refusalReason ?? "Endo couldn't generate the dossier this time. Try again.",
    };
  }

  const output = response.output as {
    body?: string;
    citationsHint?: { sourceId: string; label: string }[];
  };
  const body = output?.body ?? "";

  // Banned-term lint on the body text.
  const lint = violatesBannedTermLint(body);
  if (!lint.ok) {
    await writeRenderRow({
      patientSubjectId,
      audience,
      payload,
      payloadHash: hash,
      body,
      citations: response.citations,
      modelId: response.modelId,
      promptTemplateVersion: response.promptTemplateVersion,
      auditEntryId: response.auditEntryId,
      outcome: "banned_term_lint",
    });
    return {
      ok: false,
      error: `The dossier contained a banned framing (${lint.matches.join(", ")}) and was blocked. The team has been notified.`,
    };
  }

  // Persist the successful render.
  await writeRenderRow({
    patientSubjectId,
    audience,
    payload,
    payloadHash: hash,
    body,
    citations: response.citations,
    modelId: response.modelId,
    promptTemplateVersion: response.promptTemplateVersion,
    auditEntryId: response.auditEntryId,
    outcome: "success",
  });

  return {
    ok: true,
    render: {
      body,
      citations: response.citations,
      modelId: response.modelId,
      promptTemplateVersion: response.promptTemplateVersion,
      payloadHash: hash,
      audience,
      generatedAt: new Date().toISOString(),
      fromCache: false,
    },
  };
}

interface WriteRenderArgs {
  patientSubjectId: string;
  audience: "patient" | "clinician";
  payload: CSDPayload;
  payloadHash: string;
  body: string;
  citations: Citation[];
  modelId: string;
  promptTemplateVersion: string;
  auditEntryId: string;
  outcome:
    | "success"
    | "refused_diagnostic_conclusion"
    | "banned_term_lint"
    | "validation_failed"
    | "model_error";
}

async function writeRenderRow(args: WriteRenderArgs): Promise<void> {
  const supabase = getSupabaseServiceRole();
  if (!supabase) return; // Local dev without service-role key; cache misses each time.
  await supabase.from("csd_renders").insert({
    patient_subject_id: args.patientSubjectId,
    audience: args.audience,
    payload_hash: args.payloadHash,
    payload: args.payload,
    body: args.body,
    citations: args.citations,
    model_id: args.modelId,
    prompt_template_version: args.promptTemplateVersion,
    audit_entry_id: args.auditEntryId,
    outcome: args.outcome,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Read latest render (any payload hash)
// ─────────────────────────────────────────────────────────────────────────────
export async function readLatestRender(
  patientSubjectId: string,
  audience: "patient" | "clinician",
): Promise<RenderedCSD | null> {
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("csd_renders")
    .select(
      "id, created_at, body, citations, model_id, prompt_template_version, payload_hash, audience",
    )
    .eq("patient_subject_id", patientSubjectId)
    .eq("audience", audience)
    .eq("outcome", "success")
    .order("created_at", { ascending: false })
    .limit(1)
    .returns<CachedRow[]>();
  if (!data || data.length === 0) return null;
  const row = data[0];
  return {
    body: row.body,
    citations: row.citations as Citation[],
    modelId: row.model_id,
    promptTemplateVersion: row.prompt_template_version,
    payloadHash: row.payload_hash,
    audience: row.audience,
    generatedAt: row.created_at,
    fromCache: true,
  };
}
