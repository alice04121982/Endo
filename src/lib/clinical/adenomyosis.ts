import type { JournalEntry } from "./journal";

// Adenomyosis co-detection — versioned, weighted scoring rule.
//
// Per the brief, adenomyosis must surface as a parallel — never
// subordinate — clinical consideration to endometriosis. The 2025
// systematic review (Vannuccini et al. 2025) reports 17% focal /
// 15% diffuse prevalence in general gynaecology cohorts, 41–49% in
// symptomatic populations, with 10× under-diagnosis vs histological
// confirmation. The clinician copy below references those figures.
//
// Engine is rule-based, deterministic, no LLM in the trigger path.

export const ADENOMYOSIS_RULE_PACK_VERSION = "adenomyosis@2026-05-08.r1";
export const ADENOMYOSIS_TRIGGER_THRESHOLD = 3; // out of 7

export interface AdenomyosisInputs {
  recentEntries: JournalEntry[];
  // Captured from a future treatment-trial table.
  hormonalNonResponse: boolean | null;
  // Captured from a future profile-edit page.
  priorPregnancyLosses: number | null;
  // Captured from feature 4 (document extraction).
  jzIrregularityOnImaging: boolean | null;
  bulkyUterusOnImaging: boolean | null;
}

interface ScoreCriterion {
  id: string;
  label: string;
  weight: number;
  triggered: boolean;
  evaluable: boolean; // false when the underlying data isn't captured yet
  evidence: string;   // short text shown to the clinician
}

export interface AdenomyosisResult {
  rulePackVersion: string;
  status: "triggered" | "below_threshold" | "awaiting_data";
  score: number;
  thresholdScore: number;
  evaluableMaxScore: number;
  triggers: { id: string; label: string; evidence: string }[];
  awaitingInputs: { id: string; label: string }[];
  /** Patient-facing copy. Plain English; never alarmist; non-subordinate. */
  patientText: string;
  /** Clinician summary with cited prevalence. */
  clinicianText: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-criterion derivers
// ─────────────────────────────────────────────────────────────────────────────

function criterionPbacOver100(entries: JournalEntry[]): ScoreCriterion {
  // PBAC is not yet captured per-cycle. Use a heuristic: ≥3 heavy or
  // very-heavy entries on the journal in the last cycle implies the
  // patient is likely above the >100 threshold. This is a pragmatic
  // proxy until the bleeding-pattern feature lands.
  const heavyCount = entries.filter((e) =>
    ["heavy", "very_heavy"].includes(e.bleedingHeaviness),
  ).length;
  const proxyMet = heavyCount >= 3;
  return {
    id: "pbac_over_100",
    label: "PBAC > 100 (heavy menstrual bleeding)",
    weight: 2,
    triggered: proxyMet,
    evaluable: entries.length >= 5, // need at least 5 days of journal to estimate
    evidence: proxyMet
      ? `${heavyCount} heavy or very-heavy bleeding entries in the journal (PBAC proxy)`
      : `${heavyCount} heavy/very-heavy entries — below proxy threshold`,
  };
}

function criterionSeverityWorseningWithAge(
  entries: JournalEntry[],
): ScoreCriterion {
  if (entries.length < 6) {
    return {
      id: "severity_worsening_with_age",
      label: "Symptom severity worsening over time",
      weight: 1,
      triggered: false,
      evaluable: false,
      evidence: "Insufficient journal history (need ≥ 6 entries)",
    };
  }
  const sorted = [...entries].sort((a, b) =>
    a.entryDate.localeCompare(b.entryDate),
  );
  const mid = Math.floor(sorted.length / 2);
  const oldVas = avg(sorted.slice(0, mid).map((e) => e.painVas));
  const newVas = avg(sorted.slice(mid).map((e) => e.painVas));
  const triggered = newVas - oldVas >= 1;
  return {
    id: "severity_worsening_with_age",
    label: "Symptom severity worsening over time",
    weight: 1,
    triggered,
    evaluable: true,
    evidence: triggered
      ? `Mean VAS ${oldVas.toFixed(1)} → ${newVas.toFixed(1)} across ${sorted.length} entries`
      : `Mean VAS stable: ${oldVas.toFixed(1)} → ${newVas.toFixed(1)}`,
  };
}

function criterionHormonalNonResponse(
  inputs: AdenomyosisInputs,
): ScoreCriterion {
  return {
    id: "hormonal_non_response",
    label: "Hormonal therapy non-response",
    weight: 1,
    triggered: inputs.hormonalNonResponse === true,
    evaluable: inputs.hormonalNonResponse !== null,
    evidence:
      inputs.hormonalNonResponse === true
        ? "Treatment-trial record indicates hormonal non-response"
        : inputs.hormonalNonResponse === false
          ? "Treatment-trial record shows hormonal response present"
          : "Treatment-trial history not yet captured",
  };
}

function criterionPriorPregnancyLosses(
  inputs: AdenomyosisInputs,
): ScoreCriterion {
  return {
    id: "prior_pregnancy_losses",
    label: "Prior pregnancy losses",
    weight: 1,
    triggered: (inputs.priorPregnancyLosses ?? 0) >= 1,
    evaluable: inputs.priorPregnancyLosses !== null,
    evidence:
      inputs.priorPregnancyLosses == null
        ? "Pregnancy history not yet captured"
        : inputs.priorPregnancyLosses >= 1
          ? `${inputs.priorPregnancyLosses} prior pregnancy loss(es) recorded`
          : "No prior pregnancy losses recorded",
  };
}

function criterionJzIrregularity(inputs: AdenomyosisInputs): ScoreCriterion {
  return {
    id: "jz_irregularity",
    label: "Junctional-zone irregularity on imaging",
    weight: 1,
    triggered: inputs.jzIrregularityOnImaging === true,
    evaluable: inputs.jzIrregularityOnImaging !== null,
    evidence:
      inputs.jzIrregularityOnImaging === true
        ? "Imaging report notes junctional-zone irregularity"
        : inputs.jzIrregularityOnImaging === false
          ? "Imaging report does not note junctional-zone irregularity"
          : "Imaging not yet uploaded",
  };
}

function criterionBulkyUterus(inputs: AdenomyosisInputs): ScoreCriterion {
  return {
    id: "bulky_uterus",
    label: "Bulky / globular uterus on imaging",
    weight: 1,
    triggered: inputs.bulkyUterusOnImaging === true,
    evaluable: inputs.bulkyUterusOnImaging !== null,
    evidence:
      inputs.bulkyUterusOnImaging === true
        ? "Imaging report describes bulky or globular uterus"
        : inputs.bulkyUterusOnImaging === false
          ? "Imaging report does not describe bulky or globular uterus"
          : "Imaging not yet uploaded",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Engine
// ─────────────────────────────────────────────────────────────────────────────

export function evaluateAdenomyosis(inputs: AdenomyosisInputs): AdenomyosisResult {
  const criteria: ScoreCriterion[] = [
    criterionPbacOver100(inputs.recentEntries),
    criterionSeverityWorseningWithAge(inputs.recentEntries),
    criterionHormonalNonResponse(inputs),
    criterionPriorPregnancyLosses(inputs),
    criterionJzIrregularity(inputs),
    criterionBulkyUterus(inputs),
  ];

  const evaluable = criteria.filter((c) => c.evaluable);
  const score = evaluable
    .filter((c) => c.triggered)
    .reduce((sum, c) => sum + c.weight, 0);
  const evaluableMaxScore = evaluable.reduce((sum, c) => sum + c.weight, 0);

  const triggers = evaluable
    .filter((c) => c.triggered)
    .map((c) => ({ id: c.id, label: c.label, evidence: c.evidence }));

  const awaitingInputs = criteria
    .filter((c) => !c.evaluable)
    .map((c) => ({ id: c.id, label: c.label }));

  let status: AdenomyosisResult["status"];
  if (score >= ADENOMYOSIS_TRIGGER_THRESHOLD) status = "triggered";
  else if (evaluableMaxScore < ADENOMYOSIS_TRIGGER_THRESHOLD) status = "awaiting_data";
  else status = "below_threshold";

  return {
    rulePackVersion: ADENOMYOSIS_RULE_PACK_VERSION,
    status,
    score,
    thresholdScore: ADENOMYOSIS_TRIGGER_THRESHOLD,
    evaluableMaxScore,
    triggers,
    awaitingInputs,
    patientText: buildPatientText(status, triggers),
    clinicianText: buildClinicianText(status, score, triggers),
  };
}

function avg(values: (number | null)[]): number {
  const ns = values.filter((v): v is number => v != null);
  if (ns.length === 0) return 0;
  return ns.reduce((a, b) => a + b, 0) / ns.length;
}

// ─────────────────────────────────────────────────────────────────────────────
// Static text — never AI-rewritten
// ─────────────────────────────────────────────────────────────────────────────

function buildPatientText(
  status: AdenomyosisResult["status"],
  triggers: AdenomyosisResult["triggers"],
): string {
  if (status !== "triggered") {
    return "";
  }
  const triggerList = triggers.length > 0
    ? `Specifically, your record shows: ${triggers.map((t) => t.label.toLowerCase()).join("; ")}.`
    : "";
  return `Your record suggests we should also consider adenomyosis alongside endometriosis. Adenomyosis is when the lining of the womb grows into the muscle wall — it can cause heavy, painful periods. It's separate from endometriosis but the two often happen together. ${triggerList} This isn't a diagnosis; it's a clinical consideration to discuss with your clinician.`;
}

function buildClinicianText(
  status: AdenomyosisResult["status"],
  score: number,
  triggers: AdenomyosisResult["triggers"],
): string {
  if (status !== "triggered") return "";
  return `Adenomyosis co-consideration. Score ${score}/${7}. Triggers: ${triggers.map((t) => t.evidence.toLowerCase()).join("; ")}. 2025 systematic review (Vannuccini et al.) reports 17% focal / 15% diffuse prevalence in general gynaecology cohorts, 41–49% in symptomatic populations, with 10× under-diagnosis vs histological confirmation. Suggest pelvic MRI with junctional-zone protocol where not yet performed.`;
}

/**
 * Convenience for call sites that only have journal entries.
 * Other inputs default to null (awaiting_data).
 */
export function defaultAdenomyosisInputs(
  entries: JournalEntry[],
): AdenomyosisInputs {
  return {
    recentEntries: entries,
    hormonalNonResponse: null,
    priorPregnancyLosses: null,
    jzIrregularityOnImaging: null,
    bulkyUterusOnImaging: null,
  };
}
