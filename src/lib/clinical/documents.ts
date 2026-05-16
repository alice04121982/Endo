import { getSupabaseServer, getSupabaseServiceRole } from "@/lib/supabase/server";

// Patient-uploaded documents + AI-extracted structured findings.
//
// Chunk 1 (this file): typed-text / .txt uploads only. The patient
// pastes (or attaches) the body of a TVS / MRI report and the gateway
// extraction task pulls structured fields out. PDF + image OCR lands
// in chunk 2 once the gateway grows multimodal inputs.

export type DocumentKind =
  | "tvs_report"
  | "mri_report"
  | "blood_test"
  | "gp_letter"
  | "operative_note"
  | "histology"
  | "biomarker_report";

export type DocumentExtractionStatus =
  | "pending"
  | "ai_extracted_pending_review"
  | "clinician_confirmed"
  | "extraction_failed";

/**
 * Structured findings extracted from an imaging report. Both TVS and
 * MRI use the same shape — the modality is on the parent document.
 *
 * Fields are tri-state where ambiguity matters: `true` means present,
 * `false` means explicitly noted as absent, `null` means not addressed
 * in the report. The adenomyosis engine treats `null` as
 * awaiting_data; the NICE rules treat absence of a TVS / MRI document
 * as awaiting_data and the `inconclusive` flag as the
 * §1.5.3 trigger.
 */
export interface ImagingFindings {
  jzIrregularity: boolean | null;
  bulkyUterus: boolean | null;
  endometrioma: boolean | null;
  posteriorAdhesions: boolean | null;
  freeFluid: boolean | null;
  endometrialThicknessMm: number | null;
  inconclusive: boolean;
  otherFindings: string[];
}

export interface Document {
  id: string;
  createdAt: string;
  patientSubjectId: string;
  uploadedBy: string;
  kind: DocumentKind;
  filename: string;
  performedAt: string | null;
  source: string | null;
  rawText: string;
  extracted: ImagingFindings | Record<string, unknown> | null;
  extractedSummary: string | null;
  extractionStatus: DocumentExtractionStatus;
  extractionError: string | null;
  rulePackVersion: string | null;
  gatewayAuditId: string | null;
}

interface DbDocument {
  id: string;
  created_at: string;
  patient_subject_id: string;
  uploaded_by: string;
  kind: DocumentKind;
  filename: string;
  performed_at: string | null;
  source: string | null;
  raw_text: string;
  extracted: ImagingFindings | Record<string, unknown> | null;
  extracted_summary: string | null;
  extraction_status: DocumentExtractionStatus;
  extraction_error: string | null;
  rule_pack_version: string | null;
  gateway_audit_id: string | null;
}

function fromDb(row: DbDocument): Document {
  return {
    id: row.id,
    createdAt: row.created_at,
    patientSubjectId: row.patient_subject_id,
    uploadedBy: row.uploaded_by,
    kind: row.kind,
    filename: row.filename,
    performedAt: row.performed_at,
    source: row.source,
    rawText: row.raw_text,
    extracted: row.extracted,
    extractedSummary: row.extracted_summary,
    extractionStatus: row.extraction_status,
    extractionError: row.extraction_error,
    rulePackVersion: row.rule_pack_version,
    gatewayAuditId: row.gateway_audit_id,
  };
}

const SELECT =
  "id, created_at, patient_subject_id, uploaded_by, kind, filename, performed_at, source, raw_text, extracted, extracted_summary, extraction_status, extraction_error, rule_pack_version, gateway_audit_id";

export async function listOwnDocuments(limit = 60): Promise<Document[]> {
  const supabase = await getSupabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return [];
  const { data } = await supabase
    .from("documents")
    .select(SELECT)
    .eq("patient_subject_id", user.id)
    .order("performed_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<DbDocument[]>();
  return (data ?? []).map(fromDb);
}

export async function listDocumentsForPatient(
  patientSubjectId: string,
  limit = 60,
): Promise<Document[]> {
  const service = getSupabaseServiceRole();
  if (!service) return [];
  const { data } = await service
    .from("documents")
    .select(SELECT)
    .eq("patient_subject_id", patientSubjectId)
    .order("performed_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<DbDocument[]>();
  return (data ?? []).map(fromDb);
}

export interface SaveDocumentArgs {
  kind: DocumentKind;
  filename: string;
  rawText: string;
  performedAt?: string | null;
  source?: string | null;
}

export interface SavedPendingDocument {
  id: string;
}

/**
 * Insert a pending document row. The caller — currently the upload
 * server action — must hold an authenticated patient session; RLS
 * enforces ownership.
 */
export async function insertPendingDocument(
  args: SaveDocumentArgs,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supabase = await getSupabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return { ok: false, error: "Not signed in" };

  const { data, error } = await supabase
    .from("documents")
    .insert({
      patient_subject_id: user.id,
      uploaded_by: user.id,
      kind: args.kind,
      filename: args.filename,
      raw_text: args.rawText,
      performed_at: args.performedAt ?? null,
      source: args.source ?? null,
      extraction_status: "pending",
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Insert failed" };
  }
  return { ok: true, id: data.id };
}

/**
 * Finalise an extraction. Writes the extracted blob, the summary, the
 * gateway audit id, and the new status. Only mutates the extraction
 * fields — the trigger blocks any change to the structural columns.
 */
export async function finaliseExtraction(
  documentId: string,
  args: {
    extracted: ImagingFindings | Record<string, unknown>;
    summary: string;
    rulePackVersion: string;
    gatewayAuditId: string;
    status: "ai_extracted_pending_review";
  } | {
    extractionError: string;
    rulePackVersion: string;
    gatewayAuditId: string | null;
    status: "extraction_failed";
  },
): Promise<void> {
  const service = getSupabaseServiceRole();
  if (!service) return;
  if (args.status === "ai_extracted_pending_review") {
    await service
      .from("documents")
      .update({
        extracted: args.extracted,
        extracted_summary: args.summary,
        rule_pack_version: args.rulePackVersion,
        gateway_audit_id: args.gatewayAuditId,
        extraction_status: args.status,
        extraction_error: null,
      })
      .eq("id", documentId);
  } else {
    await service
      .from("documents")
      .update({
        extracted: null,
        extracted_summary: null,
        rule_pack_version: args.rulePackVersion,
        gateway_audit_id: args.gatewayAuditId,
        extraction_status: args.status,
        extraction_error: args.extractionError,
      })
      .eq("id", documentId);
  }
}

/**
 * True when this document's kind is an imaging report (TVS / MRI).
 * Used by the engines that consult only imaging.
 */
export function isImagingKind(kind: DocumentKind): kind is "tvs_report" | "mri_report" {
  return kind === "tvs_report" || kind === "mri_report";
}
