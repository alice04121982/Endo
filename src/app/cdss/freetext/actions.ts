"use server";

import { z } from "zod";
import { callGateway } from "@/lib/llm/gateway";
import { getSupabaseServer, getSupabaseServiceRole } from "@/lib/supabase/server";
import { getActiveClinicianAccess } from "@/lib/auth/consent";
import { buildCSDPayloadForCurrentPatient } from "@/lib/clinical/csd";
import { listOwnJournalEntries } from "@/lib/clinical/journal";

const QuestionSchema = z.object({
  question: z.string().trim().min(3).max(500),
});

export interface QueryResult {
  ok: true;
  question: string;
  answer: string;
  citations: { sourceId: string; label: string }[];
  modelId: string;
  promptTemplateVersion: string;
  auditEntryId: string;
}

export interface QueryFailure {
  ok: false;
  error: string;
}

export async function askPatientRecord(
  questionText: string,
): Promise<QueryResult | QueryFailure> {
  const parsed = QuestionSchema.safeParse({ question: questionText });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid question" };
  }

  const supabase = await getSupabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) {
    return {
      ok: false,
      error: "Sign in as a clinician with active patient consent to ask the record.",
    };
  }

  const access = await getActiveClinicianAccess();
  if (!access) {
    return {
      ok: false,
      error: "No active patient consent. Follow a patient access link first.",
    };
  }

  // Load the patient's data via service-role since the clinician's RLS
  // doesn't directly read the patient's profile cycle context.
  const service = getSupabaseServiceRole();
  let recordSnapshot: Record<string, unknown>;

  if (service) {
    const { data: profile } = await service
      .from("profiles")
      .select("display_name, last_menstrual_period_start, average_cycle_length_days")
      .eq("id", access.token.patientSubjectId)
      .single<{
        display_name: string | null;
        last_menstrual_period_start: string | null;
        average_cycle_length_days: number | null;
      }>();
    const { data: entries } = await service
      .from("journal_entries")
      .select(
        "id, entry_date, cycle_day, cycle_phase, pain_vas, pain_locations, bowel_symptoms, bladder_symptoms, dyspareunia, bleeding_heaviness, patient_plain_summary",
      )
      .eq("patient_subject_id", access.token.patientSubjectId)
      .order("entry_date", { ascending: false })
      .limit(60);

    recordSnapshot = {
      patient: {
        displayName: profile?.display_name ?? "Patient",
      },
      cycleContext: {
        lastMenstrualPeriodStart: profile?.last_menstrual_period_start ?? null,
        averageCycleLengthDays: profile?.average_cycle_length_days ?? null,
      },
      recentEntries: (entries ?? []).map((e) => ({
        sourceId: e.id,
        entryDate: e.entry_date,
        cycleDay: e.cycle_day,
        cyclePhase: e.cycle_phase,
        painVas: e.pain_vas,
        painLocations: e.pain_locations,
        bowelSymptoms: e.bowel_symptoms,
        bladderSymptoms: e.bladder_symptoms,
        dyspareunia: e.dyspareunia,
        bleedingHeaviness: e.bleeding_heaviness,
        patientPlainSummary: e.patient_plain_summary,
      })),
    };
  } else {
    // Fallback when service role isn't configured (local dev). Use the
    // signed-in user's perspective — works for the patient's own portal
    // but produces an empty snapshot for the clinician path.
    const payload = await buildCSDPayloadForCurrentPatient();
    const entries = await listOwnJournalEntries(60);
    recordSnapshot = {
      payload: payload ?? {},
      entries,
    };
  }

  const response = await callGateway({
    audience: "clinician",
    task: "clinician-freetext-qa",
    inputs: {
      question: parsed.data.question,
      recordSnapshot,
    },
    callerSubjectId: user.id,
    patientSubjectId: access.token.patientSubjectId,
    consentTokenId: access.token.id,
  });

  if (response.outcome !== "success") {
    return {
      ok: false,
      error:
        response.refusalReason ??
        "Endo couldn't answer that this time. Try rephrasing or ask the timeline directly.",
    };
  }

  const output = response.output as {
    answer?: string;
    citationsHint?: { sourceId: string; label: string }[];
  };

  return {
    ok: true,
    question: parsed.data.question,
    answer: output?.answer ?? "",
    citations: output?.citationsHint ?? [],
    modelId: response.modelId,
    promptTemplateVersion: response.promptTemplateVersion,
    auditEntryId: response.auditEntryId,
  };
}
