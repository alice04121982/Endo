/** Clinical Decision Support System types for endometriosis risk stratification */

// ── Biomarker definitions ──

export type BiomarkerType =
  | "ca125"                       // Cancer Antigen 125 (U/mL)
  | "crp"                         // C-Reactive Protein (mg/L)
  | "amh"                         // Anti-Müllerian Hormone (pmol/L)
  | "il6"                         // Interleukin-6 (pg/mL)
  | "tnf_alpha"                   // TNF-alpha (pg/mL)
  | "he4"                         // Human Epididymis Protein 4 (pmol/L)
  | "neutrophil_lymphocyte_ratio" // NLR
  | "esr"                         // Erythrocyte Sedimentation Rate (mm/hr)
  | "ferritin"                    // Ferritin (μg/L)
  | "vitamin_d"                   // 25-OH Vitamin D (nmol/L)
  | "fbc_haemoglobin"             // Haemoglobin (g/L)
  | "tsh"                         // Thyroid Stimulating Hormone (mIU/L)
  | "promarker_endo"              // ProMarker Endo risk score (0-10)
  | "arelis_endo";                // ARELIS Endo test score (0-100)

export interface BiomarkerMeta {
  label: string;
  unit: string;
  reference: { low: number; high: number };
  category: "tumour_marker" | "inflammatory" | "hormonal" | "haematology" | "diagnostic";
}

export const BIOMARKER_META: Record<BiomarkerType, BiomarkerMeta> = {
  ca125:                       { label: "CA-125",          unit: "U/mL",   reference: { low: 0, high: 35 },   category: "tumour_marker" },
  he4:                         { label: "HE4",             unit: "pmol/L", reference: { low: 0, high: 140 },  category: "tumour_marker" },
  crp:                         { label: "CRP",             unit: "mg/L",   reference: { low: 0, high: 5 },    category: "inflammatory" },
  esr:                         { label: "ESR",             unit: "mm/hr",  reference: { low: 0, high: 20 },   category: "inflammatory" },
  neutrophil_lymphocyte_ratio: { label: "NLR",             unit: "ratio",  reference: { low: 1, high: 3 },    category: "inflammatory" },
  il6:                         { label: "IL-6",            unit: "pg/mL",  reference: { low: 0, high: 7 },    category: "inflammatory" },
  tnf_alpha:                   { label: "TNF-α",           unit: "pg/mL",  reference: { low: 0, high: 8.1 },  category: "inflammatory" },
  amh:                         { label: "AMH",             unit: "pmol/L", reference: { low: 7, high: 48 },   category: "hormonal" },
  tsh:                         { label: "TSH",             unit: "mIU/L",  reference: { low: 0.4, high: 4 },  category: "hormonal" },
  vitamin_d:                   { label: "Vitamin D",       unit: "nmol/L", reference: { low: 50, high: 150 }, category: "hormonal" },
  fbc_haemoglobin:             { label: "Haemoglobin",     unit: "g/L",    reference: { low: 120, high: 160 },category: "haematology" },
  ferritin:                    { label: "Ferritin",        unit: "μg/L",   reference: { low: 15, high: 200 }, category: "haematology" },
  promarker_endo:              { label: "ProMarker Endo",  unit: "score",  reference: { low: 0, high: 5 },   category: "diagnostic" },
  arelis_endo:                 { label: "ARELIS Endo",     unit: "score",  reference: { low: 0, high: 50 },  category: "diagnostic" },
};

export type BiomarkerFlag = "normal" | "elevated" | "low" | "critical";

// ── Lab notifications ──

export interface LabNotification {
  id: string;
  patient_id: string;
  patient_name: string;
  marker: BiomarkerType;
  marker_label: string;
  value: number;
  unit: string;
  flag: "elevated" | "low" | "critical";
  date_collected: string;
  read: boolean;
  created_at: string;
}

export type BiomarkerSource =
  | "nhs_api"
  | "hospital_lab"
  | "gp_referral"
  | "private_lab"
  | "manual";

export const BIOMARKER_SOURCE_LABELS: Record<BiomarkerSource, string> = {
  nhs_api:      "NHS API",
  hospital_lab: "Hospital Lab",
  gp_referral:  "GP Referral",
  private_lab:  "Private Lab",
  manual:       "Manual entry",
};

export interface BiomarkerValue {
  id: string;
  patient_id: string;
  marker: BiomarkerType;
  value: number;
  date_collected: string; // ISO date
  flag: BiomarkerFlag;
  // Provenance
  source?: BiomarkerSource;
  ordered_by?: string;    // clinician name who ordered the test
  cycle_day?: number | null; // day of menstrual cycle when drawn
}

// ── Patient clinical history ──

export interface FailedTreatment {
  name: string;
  type: "hormonal" | "analgesic" | "surgical" | "physiotherapy" | "other";
  duration_months: number;
  outcome: "no_change" | "worsened" | "mild_improvement";
}

export interface PatientHistory {
  id: string;
  created_at: string;
  name: string;
  // Demographics
  age: number;
  bmi: number | null;
  // Menstrual history
  menarche_age: number | null;
  cycle_length_days: number | null;
  cycle_regularity: "regular" | "irregular" | "absent";
  dysmenorrhoea_severity: number; // 0-10 VAS
  dysmenorrhoea_onset_age: number | null;
  // Reproductive
  gravidity: number;
  parity: number;
  fertility_concerns: boolean;
  // Symptom duration
  symptom_duration_months: number;
  // Pain profile
  chronic_pelvic_pain: boolean;
  dyspareunia: boolean;
  dyschezia: boolean;
  dysuria: boolean;
  cyclical_bowel_symptoms: boolean;
  cyclical_bladder_symptoms: boolean;
  non_cyclical_pain: boolean;
  // Previous investigations
  previous_ultrasound: boolean;
  previous_laparoscopy: boolean;
  previous_mri: boolean;
  known_endometriosis_stage: "none" | "stage_i" | "stage_ii" | "stage_iii" | "stage_iv" | null;
  // Treatment history
  current_treatments: string[];
  failed_treatments: FailedTreatment[];
  // Comorbidities
  comorbidities: string[];
  family_history_endo: boolean;
  // Consultation notes (clinician records from each visit)
  consultation_notes: ConsultationNote[];
}

export interface ConsultationNote {
  id: string;
  date: string;        // ISO date
  clinician: string;
  content: string;     // Free-text clinical notes from consultation
}

// ── Patient-reported outcomes ──

export type BleedingHeaviness = "light" | "moderate" | "heavy" | "very_heavy";
export type CyclePhase = "menstrual" | "follicular" | "ovulatory" | "luteal";

export interface SymptomLog {
  id: string;
  patient_id: string;
  logged_at: string; // ISO datetime
  // General
  pain_score: number;     // 0-10 VAS overall
  fatigue_score: number;  // 0-10
  mood_score: number;     // 0-10
  // Period-specific (nullable — may not be applicable)
  period_pain_score: number | null;   // 0-10 VAS for period pain specifically
  period_duration_hours: number | null; // how long period pain lasts
  bleeding_heaviness: BleedingHeaviness | null;
  cycle_phase: CyclePhase | null;
  symptoms: {
    bloating: boolean;
    nausea: boolean;
    painful_periods: boolean;
    painful_intercourse: boolean;
    bowel_symptoms: boolean;
    bladder_symptoms: boolean;
    pelvic_pain: boolean;
  };
  notes: string;
  transcript: string | null; // original voice transcript if logged via voice
}

// ── Risk stratification ──

export type RiskLevel = "low" | "moderate" | "high" | "very_high";

export interface Investigation {
  name: string;
  urgency: "routine" | "urgent" | "immediate";
  rationale: string;
  guideline_ref: string;
}

export interface ClinicalAlert {
  severity: "info" | "warning" | "critical";
  message: string;
  action: string;
  guideline_ref: string | null;
}

export interface RiskStratification {
  overall_risk: RiskLevel;
  score: number; // 0-100
  biomarker_risk: { level: RiskLevel; score: number; factors: string[] };
  clinical_risk: { level: RiskLevel; score: number; factors: string[] };
  recommended_investigations: Investigation[];
  clinical_alerts: ClinicalAlert[];
  nice_ng73_criteria_met: string[];
}
