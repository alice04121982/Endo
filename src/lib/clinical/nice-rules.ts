import type { JournalEntry } from "./journal";

// NICE NG73 compliance prompter — rule-based, deterministic, no LLM in
// the trigger path.
//
// Each rule receives the same `NiceRuleInputs` and returns a `NicePrompt`
// with one of four statuses:
//   - satisfied      — the recommendation is met by the patient's record
//   - gap            — the recommendation applies and is not met
//   - partial        — the recommendation applies and is partly met
//   - not_applicable — the patient's record doesn't trigger the rule
//   - awaiting_data  — the rule depends on data Endo doesn't yet hold
//                      (e.g. uploaded documents — feature 4)
//
// Every prompt carries the rule pack version. The audit log writer stamps
// this onto every gateway call where a NICE rule fires. Rule changes
// are PR-reviewable: bump the version constant + edit the rule body.

export const NICE_RULE_PACK_VERSION = "nice-ng73@2024-11-01.r1";

export type NicePromptStatus =
  | "satisfied"
  | "gap"
  | "partial"
  | "not_applicable"
  | "awaiting_data";

export interface NicePrompt {
  recommendationId: string;            // e.g. "NG73:1.5.2"
  recommendationLabel: string;          // human-readable
  rulePackVersion: string;
  status: NicePromptStatus;
  patientText: string | null;           // null when not_applicable
  clinicianText: string | null;         // null when not_applicable
}

// ─────────────────────────────────────────────────────────────────────────────
// Inputs
// ─────────────────────────────────────────────────────────────────────────────
// Most fields come from the patient's record (journal entries, profile,
// uploaded documents). When a feature that supplies a field hasn't shipped,
// the corresponding input is null/empty and the rule resolves to
// awaiting_data.

export interface UploadedImagingDoc {
  modality: "tvs" | "mri";
  performedAt: string;
  inconclusive: boolean;
}

export interface NiceRuleInputs {
  entries: JournalEntry[];
  imaging: UploadedImagingDoc[];           // empty until feature 4 lands
  treatmentTrial: {
    onCocpOrHormonal: boolean;
    firstLineEffective: boolean | null;    // null when not yet assessable
    hasGnRHTrial: boolean;
    hasLngIusTrial: boolean;
  };
  fertilityIntent: "wishes_to_conceive" | "no_intent" | "unknown";
  hasSpecialistEndoReferral: boolean;
  hasFertilitySpecialistInput: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers — symptom counts from journal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Counts how many of the canonical endometriosis-suggestive symptoms the
 * patient has reported across their journal. NICE NG73 §1.6.1 names the
 * combination as a referral trigger; we use the same set as a
 * "suggestive symptoms" indicator throughout.
 */
export function countEndoSuggestiveSymptoms(entries: JournalEntry[]): number {
  let count = 0;
  // Dysmenorrhoea — cyclical pain on menstrual phase with VAS >= 5
  if (
    entries.some(
      (e) =>
        e.cyclePhase === "menstrual" && (e.painVas ?? 0) >= 5,
    )
  ) {
    count++;
  }
  // Cyclical pelvic pain — pain present on at least one luteal entry too
  if (entries.some((e) => e.cyclePhase === "luteal" && (e.painVas ?? 0) >= 4)) {
    count++;
  }
  // Deep dyspareunia
  if (entries.some((e) => e.dyspareunia === true)) count++;
  // Cyclical bowel symptoms — present on at least one menstrual-phase entry
  if (
    entries.some(
      (e) => e.cyclePhase === "menstrual" && e.bowelSymptoms.length > 0,
    )
  ) {
    count++;
  }
  // Cyclical bladder symptoms
  if (
    entries.some(
      (e) => e.cyclePhase === "menstrual" && e.bladderSymptoms.length > 0,
    )
  ) {
    count++;
  }
  // Heavy menstrual bleeding
  if (
    entries.some((e) => ["heavy", "very_heavy"].includes(e.bleedingHeaviness))
  ) {
    count++;
  }
  return count;
}

function severityTrend(entries: JournalEntry[]): "improving" | "stable" | "worsening" | "unknown" {
  if (entries.length < 4) return "unknown";
  const sorted = [...entries].sort((a, b) => a.entryDate.localeCompare(b.entryDate));
  const mid = Math.floor(sorted.length / 2);
  const first = sorted.slice(0, mid).map((e) => e.painVas).filter((v): v is number => v != null);
  const second = sorted.slice(mid).map((e) => e.painVas).filter((v): v is number => v != null);
  if (first.length === 0 || second.length === 0) return "unknown";
  const oldAvg = first.reduce((a, b) => a + b, 0) / first.length;
  const newAvg = second.reduce((a, b) => a + b, 0) / second.length;
  if (newAvg - oldAvg >= 1) return "worsening";
  if (oldAvg - newAvg >= 1) return "improving";
  return "stable";
}

// ─────────────────────────────────────────────────────────────────────────────
// Individual rules
// ─────────────────────────────────────────────────────────────────────────────

const RULE_PACK_VERSION_FIELD = { rulePackVersion: NICE_RULE_PACK_VERSION };

function ruleTvs(inputs: NiceRuleInputs): NicePrompt {
  const suggestive = countEndoSuggestiveSymptoms(inputs.entries) >= 3;
  const tvs = inputs.imaging.find((d) => d.modality === "tvs");
  const id = "NG73:1.5.2";
  const label = "TVS for suspected endometriosis (NICE NG73 §1.5.2, Nov 2024)";

  if (!suggestive) {
    return {
      recommendationId: id,
      recommendationLabel: label,
      ...RULE_PACK_VERSION_FIELD,
      status: "not_applicable",
      patientText: null,
      clinicianText: null,
    };
  }
  if (!tvs && inputs.imaging.length === 0 && inputs.entries.length > 0) {
    // Imaging tracking isn't wired yet — distinguish from "definitely no TVS".
    // Once feature 4 lands and the patient has uploaded any imaging, this
    // collapses to one of the deterministic branches.
    return {
      recommendationId: id,
      recommendationLabel: label,
      ...RULE_PACK_VERSION_FIELD,
      status: "awaiting_data",
      patientText:
        "Endo can prompt about whether you've had a transvaginal ultrasound once you've uploaded your imaging reports.",
      clinicianText:
        "TVS status indeterminate — patient has not yet uploaded imaging documents. Recommendation §1.5.2 cannot be evaluated.",
    };
  }
  if (!tvs) {
    return {
      recommendationId: id,
      recommendationLabel: label,
      ...RULE_PACK_VERSION_FIELD,
      status: "gap",
      patientText:
        "An ultrasound (TVS) is recommended for everyone with suspected endometriosis. You may want to ask your clinician.",
      clinicianText:
        "TVS not in record. NICE NG73 §1.5.2 — TVS recommended for suspected endometriosis.",
    };
  }
  return {
    recommendationId: id,
    recommendationLabel: label,
    ...RULE_PACK_VERSION_FIELD,
    status: "satisfied",
    patientText: `You've had a transvaginal ultrasound on ${tvs.performedAt} — that's recommended for everyone with suspected endometriosis.`,
    clinicianText: `TVS performed ${tvs.performedAt} — recommendation §1.5.2 satisfied.`,
  };
}

function ruleMri(inputs: NiceRuleInputs): NicePrompt {
  const tvs = inputs.imaging.find((d) => d.modality === "tvs");
  const mri = inputs.imaging.find((d) => d.modality === "mri");
  const id = "NG73:1.5.3";
  const label = "MRI when TVS inconclusive (NICE NG73 §1.5.3)";

  if (!tvs || !tvs.inconclusive) {
    return {
      recommendationId: id,
      recommendationLabel: label,
      ...RULE_PACK_VERSION_FIELD,
      status: "not_applicable",
      patientText: null,
      clinicianText: null,
    };
  }
  if (!mri) {
    return {
      recommendationId: id,
      recommendationLabel: label,
      ...RULE_PACK_VERSION_FIELD,
      status: "gap",
      patientText:
        "Your ultrasound didn't fully explain your symptoms. NICE recommends considering an MRI in this case. You may want to ask your clinician.",
      clinicianText:
        "MRI not performed. TVS inconclusive on " +
        tvs.performedAt +
        ". NICE NG73 §1.5.3 — consider pelvic MRI.",
    };
  }
  return {
    recommendationId: id,
    recommendationLabel: label,
    ...RULE_PACK_VERSION_FIELD,
    status: "satisfied",
    patientText: `You've had a follow-up MRI on ${mri.performedAt} — that's the recommended next step after an inconclusive ultrasound.`,
    clinicianText: `MRI performed ${mri.performedAt} after inconclusive TVS — recommendation §1.5.3 satisfied.`,
  };
}

function ruleHormonalEscalation(inputs: NiceRuleInputs): NicePrompt {
  const id = "NG73:1.4.6";
  const label = "Hormonal escalation when first-line ineffective (NICE NG73 §1.4.6)";
  const trend = severityTrend(inputs.entries);

  if (
    inputs.treatmentTrial.firstLineEffective === null &&
    !inputs.treatmentTrial.onCocpOrHormonal
  ) {
    return {
      recommendationId: id,
      recommendationLabel: label,
      ...RULE_PACK_VERSION_FIELD,
      status: "awaiting_data",
      patientText: null,
      clinicianText:
        "Treatment trial history not yet captured; recommendation §1.4.6 cannot be evaluated.",
    };
  }

  // Worsening trend on first-line hormonal therapy → escalation prompt
  if (
    inputs.treatmentTrial.onCocpOrHormonal &&
    trend === "worsening" &&
    !inputs.treatmentTrial.hasGnRHTrial &&
    !inputs.treatmentTrial.hasLngIusTrial
  ) {
    return {
      recommendationId: id,
      recommendationLabel: label,
      ...RULE_PACK_VERSION_FIELD,
      status: "gap",
      patientText:
        "Your current hormonal treatment seems to be helping less recently. There are other hormonal options to consider — worth discussing with your clinician.",
      clinicianText:
        "First-line hormonal response waning (severity worsening on journal). Recommendation §1.4.6 — consider alternative hormonal management (LNG-IUS, progestin, GnRH-analogue).",
    };
  }

  return {
    recommendationId: id,
    recommendationLabel: label,
    ...RULE_PACK_VERSION_FIELD,
    status: "not_applicable",
    patientText: null,
    clinicianText: null,
  };
}

function ruleSpecialistReferral(inputs: NiceRuleInputs): NicePrompt {
  const id = "NG73:1.6.1";
  const label = "Specialist endometriosis service referral (NICE NG73 §1.6.1)";
  const suggestive = countEndoSuggestiveSymptoms(inputs.entries) >= 3;
  const trend = severityTrend(inputs.entries);
  const meetsCriteria =
    suggestive &&
    (trend === "worsening" || inputs.treatmentTrial.firstLineEffective === false);

  if (!meetsCriteria) {
    return {
      recommendationId: id,
      recommendationLabel: label,
      ...RULE_PACK_VERSION_FIELD,
      status: "not_applicable",
      patientText: null,
      clinicianText: null,
    };
  }
  if (inputs.hasSpecialistEndoReferral) {
    return {
      recommendationId: id,
      recommendationLabel: label,
      ...RULE_PACK_VERSION_FIELD,
      status: "satisfied",
      patientText:
        "You've been referred to a specialist endometriosis service — that's recommended given your history.",
      clinicianText:
        "Specialist endometriosis referral on file — recommendation §1.6.1 satisfied.",
    };
  }
  return {
    recommendationId: id,
    recommendationLabel: label,
    ...RULE_PACK_VERSION_FIELD,
    status: "gap",
    patientText:
      "Given how your symptoms have been going, NICE recommends a referral to a specialist endometriosis service. Worth raising with your clinician.",
    clinicianText:
      "Severity worsening with ≥3 endo-suggestive symptoms; no specialist referral on file. NICE NG73 §1.6.1 — refer to specialist endometriosis service.",
  };
}

function ruleFertility(inputs: NiceRuleInputs): NicePrompt {
  const id = "NG73:1.7.1";
  const label = "Fertility — specialist input (NICE NG73 §1.7.1)";
  if (inputs.fertilityIntent !== "wishes_to_conceive") {
    return {
      recommendationId: id,
      recommendationLabel: label,
      ...RULE_PACK_VERSION_FIELD,
      status: "not_applicable",
      patientText: null,
      clinicianText: null,
    };
  }
  if (inputs.hasFertilitySpecialistInput) {
    return {
      recommendationId: id,
      recommendationLabel: label,
      ...RULE_PACK_VERSION_FIELD,
      status: "satisfied",
      patientText:
        "You've had specialist fertility input — that's recommended given you wish to conceive.",
      clinicianText:
        "Fertility specialist input on file — recommendation §1.7.1 satisfied.",
    };
  }
  return {
    recommendationId: id,
    recommendationLabel: label,
    ...RULE_PACK_VERSION_FIELD,
    status: "gap",
    patientText:
      "Because you'd like to conceive, NICE recommends specialist fertility input alongside your endometriosis care. Worth discussing.",
    clinicianText:
      "Patient wishes to conceive; no fertility specialist input on file. NICE NG73 §1.7.1 — consider referral.",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Engine
// ─────────────────────────────────────────────────────────────────────────────
export function evaluateNiceRules(inputs: NiceRuleInputs): NicePrompt[] {
  return [
    ruleTvs(inputs),
    ruleMri(inputs),
    ruleHormonalEscalation(inputs),
    ruleSpecialistReferral(inputs),
    ruleFertility(inputs),
  ];
}

/**
 * Convenience: only the prompts that should surface in UI (gaps, partials,
 * and satisfied items if the caller wants them). Rules with status
 * 'not_applicable' or 'awaiting_data' are omitted from the visible list
 * unless explicitly requested.
 */
export function visibleNicePrompts(
  prompts: NicePrompt[],
  options?: { includeSatisfied?: boolean; includeAwaitingData?: boolean },
): NicePrompt[] {
  return prompts.filter((p) => {
    if (p.status === "gap" || p.status === "partial") return true;
    if (p.status === "satisfied") return options?.includeSatisfied ?? false;
    if (p.status === "awaiting_data") return options?.includeAwaitingData ?? false;
    return false;
  });
}

/**
 * Default NiceRuleInputs that report awaiting_data for fields the platform
 * doesn't yet capture. Used by call sites that only have journal entries.
 */
export function defaultEmptyInputs(entries: JournalEntry[]): NiceRuleInputs {
  return {
    entries,
    imaging: [],
    treatmentTrial: {
      onCocpOrHormonal: false,
      firstLineEffective: null,
      hasGnRHTrial: false,
      hasLngIusTrial: false,
    },
    fertilityIntent: "unknown",
    hasSpecialistEndoReferral: false,
    hasFertilitySpecialistInput: false,
  };
}
