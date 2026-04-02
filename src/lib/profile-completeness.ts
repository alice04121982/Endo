import type { PatientHistory } from "./types/cdss";

export interface ProfileCompleteness {
  pct: number;
  level: "minimal" | "partial" | "complete";
  missingSections: string[];
}

/**
 * Returns a completeness assessment for a patient profile.
 * "minimal" = only name/age, no clinical data entered yet.
 * "partial"  = some sections filled but key areas missing.
 * "complete" = enough data for meaningful risk stratification.
 */
export function getProfileCompleteness(
  patient: PatientHistory,
  biomarkerCount: number
): ProfileCompleteness {
  const sections: { label: string; filled: boolean }[] = [
    {
      label: "Menstrual history",
      filled:
        patient.menarche_age !== null ||
        patient.dysmenorrhoea_onset_age !== null ||
        patient.symptom_duration_months !== 12, // 12 is initial default
    },
    {
      label: "Symptoms",
      filled:
        patient.chronic_pelvic_pain ||
        patient.dyspareunia ||
        patient.dyschezia ||
        patient.dysuria ||
        patient.cyclical_bowel_symptoms ||
        patient.cyclical_bladder_symptoms ||
        patient.non_cyclical_pain ||
        patient.family_history_endo,
    },
    {
      label: "Investigation history",
      filled:
        patient.previous_ultrasound ||
        patient.previous_laparoscopy ||
        patient.previous_mri ||
        (patient.known_endometriosis_stage !== null &&
          patient.known_endometriosis_stage !== "none"),
    },
    {
      label: "Treatment history",
      filled:
        patient.current_treatments.length > 0 ||
        patient.failed_treatments.length > 0,
    },
    {
      label: "Blood test results",
      filled: biomarkerCount > 0,
    },
  ];

  const filledCount = sections.filter((s) => s.filled).length;
  const missingSections = sections
    .filter((s) => !s.filled)
    .map((s) => s.label);

  // Demographics always counts as 1 filled section (name is required)
  const totalSections = sections.length + 1;
  const pct = Math.round(((filledCount + 1) / totalSections) * 100);

  const level: ProfileCompleteness["level"] =
    filledCount === 0
      ? "minimal"
      : filledCount < 3
      ? "partial"
      : "complete";

  return { pct, level, missingSections };
}
