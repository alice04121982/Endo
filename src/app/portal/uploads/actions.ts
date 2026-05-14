"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { callGateway } from "@/lib/llm/gateway";
import { getSupabaseServer } from "@/lib/supabase/server";
import {
  finaliseExtraction,
  insertPendingDocument,
  type DocumentKind,
  type ImagingFindings,
} from "@/lib/clinical/documents";

const ImagingKindEnum = z.enum(["tvs_report", "mri_report"]);

const AddImagingInput = z.object({
  kind: ImagingKindEnum,
  filename: z.string().min(1).max(200).default("Imaging report"),
  rawText: z
    .string()
    .min(50, "Imaging report text looks too short")
    .max(40_000, "Imaging report text is too long — paste the relevant section only"),
  performedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
    .nullable()
    .optional(),
  source: z.string().max(200).nullable().optional(),
});

export type AddImagingState =
  | { kind: "idle" }
  | { kind: "error"; message: string }
  | { kind: "success"; documentId: string; extractionStatus: string };

export async function addImagingReportText(
  _prevState: AddImagingState | undefined,
  formData: FormData,
): Promise<AddImagingState> {
  const parsed = AddImagingInput.safeParse({
    kind: formData.get("kind"),
    filename: formData.get("filename") || "Imaging report",
    rawText: formData.get("rawText"),
    performedAt: formData.get("performedAt") || null,
    source: formData.get("source") || null,
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { kind: "error", message: first?.message ?? "Invalid input" };
  }

  const supabase = await getSupabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) {
    return { kind: "error", message: "You need to be signed in to upload." };
  }

  const inserted = await insertPendingDocument({
    kind: parsed.data.kind as DocumentKind,
    filename: parsed.data.filename,
    rawText: parsed.data.rawText,
    performedAt: parsed.data.performedAt ?? null,
    source: parsed.data.source ?? null,
  });
  if (!inserted.ok) {
    return { kind: "error", message: inserted.error };
  }

  // Run extraction synchronously. Haiku tier latency is short enough
  // that the patient sees the result on the next page render.
  const response = await callGateway({
    audience: "patient",
    task: "extract-imaging-report",
    inputs: {
      documentId: inserted.id,
      kind: parsed.data.kind,
      rawText: parsed.data.rawText,
    },
    callerSubjectId: user.id,
    patientSubjectId: user.id,
  });

  if (response.outcome !== "success") {
    await finaliseExtraction(inserted.id, {
      extractionError:
        response.refusalReason ??
        `Extraction failed (${response.outcome}). The report is stored but couldn't be auto-extracted.`,
      rulePackVersion: response.promptTemplateVersion,
      gatewayAuditId: response.auditEntryId,
      status: "extraction_failed",
    });
    revalidatePath("/portal/uploads");
    return {
      kind: "success",
      documentId: inserted.id,
      extractionStatus: "extraction_failed",
    };
  }

  const output = response.output as {
    summary?: string;
    performedAt?: string | null;
    source?: string | null;
    findings?: ImagingFindings;
  } | null;

  if (!output?.findings || !output.summary) {
    await finaliseExtraction(inserted.id, {
      extractionError: "Extractor returned an empty result.",
      rulePackVersion: response.promptTemplateVersion,
      gatewayAuditId: response.auditEntryId,
      status: "extraction_failed",
    });
    revalidatePath("/portal/uploads");
    return {
      kind: "success",
      documentId: inserted.id,
      extractionStatus: "extraction_failed",
    };
  }

  await finaliseExtraction(inserted.id, {
    extracted: output.findings,
    summary: output.summary,
    rulePackVersion: response.promptTemplateVersion,
    gatewayAuditId: response.auditEntryId,
    status: "ai_extracted_pending_review",
  });

  // performedAt / source could be back-filled here if the extractor
  // returned them and the upload form left them blank; structural
  // columns are immutable post-insert so back-fill needs a separate
  // append-mode design. Deferred to chunk 2.

  revalidatePath("/portal/uploads");
  revalidatePath("/portal/dossier");
  revalidatePath("/cdss");
  return {
    kind: "success",
    documentId: inserted.id,
    extractionStatus: "ai_extracted_pending_review",
  };
}
