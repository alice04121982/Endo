import type { JournalEntry } from "./journal";
import { getSupabaseServer, getSupabaseServiceRole } from "@/lib/supabase/server";

// Red-flag triage — highest-stakes output. Rule-based, deterministic,
// no LLM in trigger or action. The headline and CTA copy below are
// written by clinical leadership; the engine never paraphrases them.
//
// LLM is permitted only for the optional patient-facing rationale that
// explains *why* the rule fired, and even then the AI text must be
// labelled and reviewable. This chunk does not yet wire the rationale
// to the gateway; the rule's own `clinicianDescription` does the job.

export const RED_FLAG_RULE_PACK_VERSION = "red-flags@2026-05-08.r1";

export type RedFlagId =
  | "heavy_acute_bleeding"
  | "ovarian_torsion_suspect"
  | "bowel_obstruction_suspect"
  | "severe_ureteric_involvement"
  | "ectopic_or_pregnancy_complication";

export interface RedFlag {
  id: RedFlagId;
  rulePackVersion: string;
  severity: "urgent";
  /** Clinician-facing one-liner. */
  clinicianDescription: string;
  /** Patient-facing headline. NEVER softened. NEVER AI-rewritten. */
  patientHeadline: string;
  /** Patient-facing action copy. NEVER softened. NEVER AI-rewritten. */
  patientAction: string;
  /** Free-text rationale describing what triggered the rule. */
  rationale: string;
  /** Region-aware urgent-care resources. UK defaults below. */
  resources: { label: string; href: string }[];
}

export interface ActiveSymptomCheck {
  submittedAt: string;
  bleedingThroughPad: boolean; // Soaking >1 pad/hour for >2h
  severeOneSidedPain: boolean; // Sudden severe one-sided pelvic pain
  pregnancyBleeding: boolean; // Bleeding while pregnant or possibly pregnant
  severeAbdominalSwelling: boolean; // Possible bowel obstruction
  severeFlankPain: boolean; // Possible ureteric involvement
  fainting: boolean;
}

export interface RedFlagInputs {
  recentEntries: JournalEntry[];
  activeCheck: ActiveSymptomCheck | null;
}

const UK_RESOURCES = [
  { label: "Call 111 (NHS non-emergency)", href: "tel:111" },
  { label: "Find your nearest A&E", href: "https://www.nhs.uk/service-search/other-services/Accident-and-emergency-services/LocationSearch/428" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Rules
// ─────────────────────────────────────────────────────────────────────────────

function ruleHeavyAcuteBleeding(inputs: RedFlagInputs): RedFlag | null {
  const triggered =
    inputs.activeCheck?.bleedingThroughPad === true ||
    journalShowsAcuteHeavyBleed(inputs.recentEntries);
  if (!triggered) return null;
  return {
    id: "heavy_acute_bleeding",
    rulePackVersion: RED_FLAG_RULE_PACK_VERSION,
    severity: "urgent",
    clinicianDescription:
      "Heavy acute bleeding consistent with potential haemorrhage — soaking through more than one pad per hour for two consecutive hours, or two consecutive very-heavy bleeding entries.",
    patientHeadline: "Seek urgent care now",
    patientAction:
      "Heavy bleeding like this needs urgent assessment. Call NHS 111 now, or go to your nearest A&E.",
    rationale:
      inputs.activeCheck?.bleedingThroughPad
        ? "You reported soaking through more than one pad per hour for two consecutive hours."
        : "Two consecutive very-heavy bleeding entries on your journal.",
    resources: UK_RESOURCES,
  };
}

function ruleOvarianTorsion(inputs: RedFlagInputs): RedFlag | null {
  if (!inputs.activeCheck?.severeOneSidedPain) return null;
  return {
    id: "ovarian_torsion_suspect",
    rulePackVersion: RED_FLAG_RULE_PACK_VERSION,
    severity: "urgent",
    clinicianDescription:
      "Sudden severe one-sided pelvic pain — ovarian torsion red flag. Time-critical surgical emergency.",
    patientHeadline: "Seek urgent care now",
    patientAction:
      "This kind of pain can be a sign of a problem that needs urgent surgery. Call NHS 111 now or go straight to your nearest A&E.",
    rationale: "You reported sudden severe one-sided pelvic pain.",
    resources: UK_RESOURCES,
  };
}

function ruleBowelObstruction(inputs: RedFlagInputs): RedFlag | null {
  if (!inputs.activeCheck?.severeAbdominalSwelling) return null;
  return {
    id: "bowel_obstruction_suspect",
    rulePackVersion: RED_FLAG_RULE_PACK_VERSION,
    severity: "urgent",
    clinicianDescription:
      "Severe abdominal swelling with associated symptoms — possible bowel obstruction.",
    patientHeadline: "Seek urgent care now",
    patientAction:
      "Severe abdominal swelling like this needs urgent assessment. Call NHS 111 now, or go to your nearest A&E.",
    rationale: "You reported severe abdominal swelling.",
    resources: UK_RESOURCES,
  };
}

function ruleSevereUreteric(inputs: RedFlagInputs): RedFlag | null {
  if (!inputs.activeCheck?.severeFlankPain) return null;
  return {
    id: "severe_ureteric_involvement",
    rulePackVersion: RED_FLAG_RULE_PACK_VERSION,
    severity: "urgent",
    clinicianDescription:
      "Severe flank pain — possible ureteric obstruction or severe ureteric endometriosis. Risk of silent kidney damage.",
    patientHeadline: "Seek urgent care now",
    patientAction:
      "Severe pain in your side or back like this can be a sign of a kidney or urinary tract problem. Call NHS 111 now, or go to your nearest A&E.",
    rationale: "You reported severe flank pain.",
    resources: UK_RESOURCES,
  };
}

function ruleEctopicOrPregnancy(inputs: RedFlagInputs): RedFlag | null {
  const c = inputs.activeCheck;
  if (!c) return null;
  if (!c.pregnancyBleeding && !(c.fainting && c.pregnancyBleeding)) return null;
  return {
    id: "ectopic_or_pregnancy_complication",
    rulePackVersion: RED_FLAG_RULE_PACK_VERSION,
    severity: "urgent",
    clinicianDescription:
      "Bleeding in pregnancy or with possible pregnancy — ectopic / miscarriage red flag.",
    patientHeadline: "Seek urgent care now",
    patientAction:
      "Bleeding in pregnancy needs urgent assessment. Call NHS 111 now, or go to your nearest A&E.",
    rationale: c.fainting
      ? "Bleeding in pregnancy with light-headedness or fainting."
      : "Bleeding while pregnant or possibly pregnant.",
    resources: UK_RESOURCES,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function journalShowsAcuteHeavyBleed(entries: JournalEntry[]): boolean {
  if (entries.length < 2) return false;
  const sorted = [...entries].sort((a, b) =>
    b.entryDate.localeCompare(a.entryDate),
  );
  // Two consecutive very-heavy days → fire.
  return (
    sorted[0].bleedingHeaviness === "very_heavy" &&
    sorted[1].bleedingHeaviness === "very_heavy"
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Public engine
// ─────────────────────────────────────────────────────────────────────────────

export function evaluateRedFlags(inputs: RedFlagInputs): RedFlag[] {
  const out: RedFlag[] = [];
  const rules = [
    ruleHeavyAcuteBleeding,
    ruleOvarianTorsion,
    ruleBowelObstruction,
    ruleSevereUreteric,
    ruleEctopicOrPregnancy,
  ];
  for (const rule of rules) {
    const r = rule(inputs);
    if (r) out.push(r);
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Persistence — service-role write of triggered events
// ─────────────────────────────────────────────────────────────────────────────

interface ActiveEventRow {
  id: string;
  rule_id: RedFlagId;
  rule_pack_version: string;
  inputs: unknown;
  patient_response: "unread" | "opened" | "cta_followed" | "no_longer_relevant";
  created_at: string;
}

export interface ActiveRedFlagEvent {
  id: string;
  ruleId: RedFlagId;
  rulePackVersion: string;
  inputs: unknown;
  patientResponse: "unread" | "opened" | "cta_followed" | "no_longer_relevant";
  createdAt: string;
}

export async function listActiveRedFlagEventsForCurrentPatient(): Promise<
  ActiveRedFlagEvent[]
> {
  const supabase = await getSupabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return [];
  const { data } = await supabase
    .from("red_flag_events")
    .select("id, rule_id, rule_pack_version, inputs, patient_response, created_at")
    .eq("patient_subject_id", user.id)
    .neq("patient_response", "no_longer_relevant")
    .order("created_at", { ascending: false })
    .limit(5)
    .returns<ActiveEventRow[]>();
  return (data ?? []).map((r) => ({
    id: r.id,
    ruleId: r.rule_id,
    rulePackVersion: r.rule_pack_version,
    inputs: r.inputs,
    patientResponse: r.patient_response,
    createdAt: r.created_at,
  }));
}

export async function listActiveRedFlagEventsForPatient(
  patientSubjectId: string,
): Promise<ActiveRedFlagEvent[]> {
  // Used from the clinician path — RLS join via consent_tokens permits the
  // signed-in clinician to read for any patient they hold consent for.
  const supabase = await getSupabaseServer();
  const { data } = await supabase
    .from("red_flag_events")
    .select("id, rule_id, rule_pack_version, inputs, patient_response, created_at")
    .eq("patient_subject_id", patientSubjectId)
    .neq("patient_response", "no_longer_relevant")
    .order("created_at", { ascending: false })
    .limit(5)
    .returns<ActiveEventRow[]>();
  return (data ?? []).map((r) => ({
    id: r.id,
    ruleId: r.rule_id,
    rulePackVersion: r.rule_pack_version,
    inputs: r.inputs,
    patientResponse: r.patient_response,
    createdAt: r.created_at,
  }));
}

export async function persistRedFlagFire(
  patientSubjectId: string,
  flag: RedFlag,
  inputs: RedFlagInputs,
): Promise<void> {
  const service = getSupabaseServiceRole();
  if (!service) return; // Local dev fallback — no DB persistence.
  await service.from("red_flag_events").insert({
    patient_subject_id: patientSubjectId,
    rule_id: flag.id,
    rule_pack_version: flag.rulePackVersion,
    severity: "urgent",
    inputs: inputs as unknown as Record<string, unknown>,
  });
}
