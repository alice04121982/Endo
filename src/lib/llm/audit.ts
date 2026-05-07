import { getSupabaseServiceRole } from "@/lib/supabase/server";
import type { Audience, Citation, Outcome } from "./types";

export interface AppendAuditRowInput {
  callerSubjectId: string | null;
  patientSubjectId: string | null;
  consentTokenId: string | null;
  audience: Audience;
  taskName: string;
  promptTemplateVersion: string;
  modelId: string;
  inputs: Record<string, unknown>;
  output: unknown | null;
  citations: Citation[];
  outcome: Outcome;
  refusalReason: string | null;
  latencyMs: number | null;
}

export interface AppendAuditRowResult {
  auditEntryId: string;
  rowHash: string;
  // True when no Supabase service-role key is configured. The gateway still
  // returns a result so the call site can render output, but the regulator-
  // facing chain is not persisted. Surface this explicitly in non-prod UIs.
  ephemeral: boolean;
}

/**
 * Append a row to llm_audit_log via the security-definer stored procedure.
 * Hash chain is computed inside the same transaction as the insert, so
 * concurrent appends cannot share a prev_hash.
 *
 * In environments without a service-role key (local dev, tests), this
 * function returns an ephemeral id and a stub hash. Production deploys must
 * have the key set; the /api/llm route checks for it on boot.
 */
export async function appendAuditRow(
  input: AppendAuditRowInput,
): Promise<AppendAuditRowResult> {
  const supabase = getSupabaseServiceRole();
  if (!supabase) {
    return {
      auditEntryId: crypto.randomUUID(),
      rowHash: "ephemeral-no-service-role-key",
      ephemeral: true,
    };
  }

  const { data, error } = await supabase.rpc("llm_audit_log_append", {
    p_caller_subject_id: input.callerSubjectId,
    p_patient_subject_id: input.patientSubjectId,
    p_consent_token_id: input.consentTokenId,
    p_audience: input.audience,
    p_task_name: input.taskName,
    p_prompt_template_version: input.promptTemplateVersion,
    p_model_id: input.modelId,
    p_inputs: input.inputs,
    p_output: input.output,
    p_citations: input.citations,
    p_outcome: input.outcome,
    p_refusal_reason: input.refusalReason,
    p_latency_ms: input.latencyMs,
  });

  if (error) {
    throw new Error(`audit log append failed: ${error.message}`);
  }

  const row = Array.isArray(data) ? data[0] : data;
  return {
    auditEntryId: row.id as string,
    rowHash: row.row_hash as string,
    ephemeral: false,
  };
}
