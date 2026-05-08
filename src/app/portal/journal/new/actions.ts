"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { callGateway } from "@/lib/llm/gateway";
import { getSupabaseServer } from "@/lib/supabase/server";
import {
  computeCycleDay,
  computeCyclePhase,
  type CyclePhase,
} from "@/lib/clinical/cycle";
import { getPatientCycleContext } from "@/lib/clinical/journal";

// ─────────────────────────────────────────────────────────────────────────────
// Voice path: transcribe (browser-side) → extract → return for confirmation
// ─────────────────────────────────────────────────────────────────────────────
//
// The browser captures speech via the Web Speech API and posts the
// resulting transcript here. We never receive raw audio. The transcript
// goes to the gateway's `extract-symptom-from-voice` task; the response
// is returned to the client for the patient to confirm before save.
//
// Audit log: writing to llm_audit_log is the gateway's job. We pass the
// patient's subject id so the row is attributed correctly.

const TranscribeSchema = z.object({
  transcript: z.string().min(2).max(8000),
});

export interface ExtractionPreview {
  ok: true;
  utteranceId: string;
  transcript: string;
  plainSummary: string;
  observations: { kind: string; value: string; cycleDay: number | null }[];
  modelId: string;
  promptTemplateVersion: string;
  auditEntryId: string;
}

export interface ExtractionFailure {
  ok: false;
  error: string;
}

export async function extractFromTranscript(
  rawTranscript: string,
): Promise<ExtractionPreview | ExtractionFailure> {
  const parsed = TranscribeSchema.safeParse({ transcript: rawTranscript });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Empty transcript" };
  }

  const supabase = await getSupabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) {
    return { ok: false, error: "You need to be signed in to log a journal entry." };
  }

  const utteranceId = `utt-${Date.now()}-${user.id.slice(0, 8)}`;

  const response = await callGateway({
    audience: "patient",
    task: "extract-symptom-from-voice",
    inputs: {
      utteranceId,
      transcript: parsed.data.transcript,
    },
    callerSubjectId: user.id,
    patientSubjectId: user.id,
  });

  if (response.outcome !== "success") {
    return {
      ok: false,
      error:
        response.refusalReason ??
        "Endo could not extract a structured entry from that transcript. Try saying it again or use the form.",
    };
  }

  const output = response.output as {
    plainSummary?: string;
    observations?: { kind: string; value: string; cycleDay: number | null }[];
  };

  if (!output?.plainSummary) {
    return { ok: false, error: "Extraction was empty. Try again." };
  }

  return {
    ok: true,
    utteranceId,
    transcript: parsed.data.transcript,
    plainSummary: output.plainSummary,
    observations: output.observations ?? [],
    modelId: response.modelId,
    promptTemplateVersion: response.promptTemplateVersion,
    auditEntryId: response.auditEntryId,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Save (voice and quick-tap paths share this shape)
// ─────────────────────────────────────────────────────────────────────────────

const SaveSchema = z.object({
  source: z.enum(["voice", "quick_tap"]),
  patientPlainSummary: z.string().min(1),
  painVas: z.number().int().min(0).max(10).nullable().optional(),
  painLocations: z.array(z.string()).default([]),
  bowelSymptoms: z.array(z.string()).default([]),
  bladderSymptoms: z.array(z.string()).default([]),
  dyspareunia: z.boolean().nullable().optional(),
  bleedingHeaviness: z
    .enum([
      "none",
      "spotting",
      "light",
      "moderate",
      "heavy",
      "very_heavy",
    ])
    .default("none"),
  fatigueVas: z.number().int().min(0).max(10).nullable().optional(),
  moodScore: z.number().int().min(1).max(5).nullable().optional(),
  notes: z.string().nullable().optional(),
  // Voice-only provenance
  transcript: z.string().nullable().optional(),
  modelId: z.string().nullable().optional(),
  promptTemplateVersion: z.string().nullable().optional(),
  auditEntryId: z.string().uuid().nullable().optional(),
});

export type SaveJournalInput = z.input<typeof SaveSchema>;

export async function saveJournalEntry(
  input: SaveJournalInput,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const parsed = SaveSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid entry" };
  }
  const data = parsed.data;

  const supabase = await getSupabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return { ok: false, error: "Not signed in" };

  // Cycle context — read once for this entry.
  const ctx = await getPatientCycleContext();
  const today = new Date().toISOString().slice(0, 10);
  const cycleDay = computeCycleDay(today, ctx.lastMenstrualPeriodStart, ctx.averageCycleLengthDays);
  const cyclePhase: CyclePhase = computeCyclePhase(cycleDay, ctx.averageCycleLengthDays);

  const { data: inserted, error } = await supabase
    .from("journal_entries")
    .insert({
      patient_subject_id: user.id,
      entry_date: today,
      cycle_day: cycleDay,
      cycle_phase: cyclePhase,
      pain_vas: data.painVas ?? null,
      pain_locations: data.painLocations,
      bowel_symptoms: data.bowelSymptoms,
      bladder_symptoms: data.bladderSymptoms,
      dyspareunia: data.dyspareunia ?? null,
      bleeding_heaviness: data.bleedingHeaviness,
      fatigue_vas: data.fatigueVas ?? null,
      mood_score: data.moodScore ?? null,
      notes: data.notes ?? null,
      source: data.source,
      transcript: data.transcript ?? null,
      patient_plain_summary: data.patientPlainSummary,
      ai_extracted: data.source === "voice",
      model_id: data.modelId ?? null,
      prompt_template_version: data.promptTemplateVersion ?? null,
      audit_entry_id: data.auditEntryId ?? null,
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !inserted) {
    return { ok: false, error: error?.message ?? "Could not save" };
  }

  revalidatePath("/portal/journal");
  revalidatePath("/portal");
  return { ok: true, id: inserted.id };
}
