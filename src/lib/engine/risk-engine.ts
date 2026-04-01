/**
 * Endometriosis Risk Stratification Engine
 *
 * Computes a composite risk score from biomarker values and patient clinical
 * history, generates investigation recommendations and clinical alerts aligned
 * with NICE NG73 guidelines.
 */

import type {
  BiomarkerValue,
  PatientHistory,
  RiskLevel,
  RiskStratification,
  Investigation,
  ClinicalAlert,
  BIOMARKER_META,
} from "@/lib/types/cdss";

// ── Helpers ──

function riskLevel(score: number): RiskLevel {
  if (score >= 76) return "very_high";
  if (score >= 51) return "high";
  if (score >= 26) return "moderate";
  return "low";
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

// ── Biomarker scoring ──

function scoreBiomarkers(
  biomarkers: BiomarkerValue[]
): { score: number; factors: string[]; alerts: ClinicalAlert[] } {
  let score = 0;
  const factors: string[] = [];
  const alerts: ClinicalAlert[] = [];

  const latest = new Map<string, BiomarkerValue>();
  for (const b of biomarkers) {
    const existing = latest.get(b.marker);
    if (!existing || b.date_collected > existing.date_collected) {
      latest.set(b.marker, b);
    }
  }

  const ca125 = latest.get("ca125");
  if (ca125) {
    if (ca125.value > 200) {
      score += 35;
      factors.push(`CA-125 critically elevated (${ca125.value} U/mL)`);
      alerts.push({
        severity: "critical",
        message: `CA-125 = ${ca125.value} U/mL — significantly elevated. Must exclude ovarian malignancy.`,
        action: "Urgent 2-week pathway referral. Consider CT abdomen/pelvis and gynaecology oncology review.",
        guideline_ref: "NICE NG73 1.2.1",
      });
    } else if (ca125.value > 35) {
      score += 20;
      factors.push(`CA-125 elevated (${ca125.value} U/mL, ref <35)`);
    }
  }

  const he4 = latest.get("he4");
  if (he4 && he4.value > 140) {
    score += 15;
    factors.push(`HE4 elevated (${he4.value} pmol/L)`);
    alerts.push({
      severity: "warning",
      message: `HE4 = ${he4.value} pmol/L — consider ROMA score calculation in context of CA-125.`,
      action: "Calculate ROMA score to stratify ovarian mass risk.",
      guideline_ref: null,
    });
  }

  const crp = latest.get("crp");
  if (crp && crp.value > 5) {
    score += 10;
    factors.push(`CRP elevated (${crp.value} mg/L) — active inflammation`);
  }

  const nlr = latest.get("neutrophil_lymphocyte_ratio");
  if (nlr && nlr.value > 3) {
    score += 10;
    factors.push(`NLR elevated (${nlr.value}) — systemic inflammatory response`);
  }

  const esr = latest.get("esr");
  if (esr && esr.value > 20) {
    score += 5;
    factors.push(`ESR elevated (${esr.value} mm/hr)`);
  }

  const il6 = latest.get("il6");
  if (il6 && il6.value > 7) {
    score += 8;
    factors.push(`IL-6 elevated (${il6.value} pg/mL) — cytokine-mediated inflammation`);
  }

  const tnf = latest.get("tnf_alpha");
  if (tnf && tnf.value > 8.1) {
    score += 8;
    factors.push(`TNF-α elevated (${tnf.value} pg/mL)`);
  }

  const amh = latest.get("amh");
  if (amh && amh.value < 7) {
    // Scored contextually in clinical section if fertility concerns present
    factors.push(`AMH low (${amh.value} pmol/L) — reduced ovarian reserve`);
  }

  const ferritin = latest.get("ferritin");
  const hb = latest.get("fbc_haemoglobin");
  if (ferritin && ferritin.value < 15) {
    factors.push(`Ferritin low (${ferritin.value} μg/L)`);
    if (hb && hb.value < 120) {
      score += 5;
      alerts.push({
        severity: "warning",
        message: `Iron deficiency anaemia detected (Hb ${hb.value} g/L, Ferritin ${ferritin.value} μg/L). May indicate heavy menstrual bleeding or chronic blood loss.`,
        action: "Consider iron replacement. Investigate for adenomyosis if heavy menstrual bleeding present.",
        guideline_ref: "NICE NG88",
      });
    }
  }

  const tsh = latest.get("tsh");
  if (tsh && (tsh.value < 0.4 || tsh.value > 4)) {
    alerts.push({
      severity: "info",
      message: `TSH ${tsh.value < 0.4 ? "suppressed" : "elevated"} (${tsh.value} mIU/L). Thyroid dysfunction can mimic or compound endometriosis symptoms.`,
      action: "Consider thyroid function assessment (free T4, free T3). Treat thyroid disorder if confirmed.",
      guideline_ref: null,
    });
  }

  const vitD = latest.get("vitamin_d");
  if (vitD && vitD.value < 25) {
    alerts.push({
      severity: "info",
      message: `Severe vitamin D deficiency (${vitD.value} nmol/L). Associated with increased pelvic pain and inflammatory burden in endometriosis.`,
      action: "Recommend high-dose vitamin D supplementation (loading dose protocol).",
      guideline_ref: null,
    });
  }

  return { score: clamp(score, 0, 100), factors, alerts };
}

// ── Clinical history scoring ──

function scoreClinicalHistory(
  patient: PatientHistory
): { score: number; factors: string[]; alerts: ClinicalAlert[]; nice_criteria: string[] } {
  let score = 0;
  const factors: string[] = [];
  const alerts: ClinicalAlert[] = [];
  const nice_criteria: string[] = [];

  if (patient.symptom_duration_months >= 6) {
    score += 15;
    factors.push(`Chronic symptoms (${patient.symptom_duration_months} months)`);
    nice_criteria.push("Chronic pelvic pain ≥6 months (NG73 1.3.1)");
  }

  if (patient.dysmenorrhoea_severity >= 7) {
    score += 10;
    factors.push(`Severe dysmenorrhoea (VAS ${patient.dysmenorrhoea_severity}/10)`);
    nice_criteria.push("Severe dysmenorrhoea affecting daily activities (NG73 1.1.1)");
  }

  if (patient.cyclical_bowel_symptoms) {
    score += 15;
    factors.push("Cyclical bowel symptoms present");
    nice_criteria.push("Cyclical GI symptoms — consider deep endometriosis (NG73 1.2.3)");
  }

  if (patient.cyclical_bladder_symptoms) {
    score += 15;
    factors.push("Cyclical bladder symptoms present");
    nice_criteria.push("Cyclical urinary symptoms — consider deep endometriosis (NG73 1.2.3)");
  }

  if (patient.dyspareunia) {
    score += 10;
    factors.push("Deep dyspareunia reported");
    nice_criteria.push("Deep dyspareunia (NG73 1.1.1)");
  }

  if (patient.dyschezia) {
    score += 10;
    factors.push("Dyschezia (cyclical painful defecation)");
    nice_criteria.push("Dyschezia — consider rectovaginal endometriosis (NG73 1.2.3)");
  }

  if (patient.dysuria) {
    score += 5;
    factors.push("Dysuria present");
  }

  if (patient.chronic_pelvic_pain && patient.non_cyclical_pain) {
    score += 5;
    factors.push("Non-cyclical chronic pelvic pain — consider central sensitisation");
  }

  const failedCount = patient.failed_treatments.filter(
    (t) => t.outcome === "no_change" || t.outcome === "worsened"
  ).length;
  if (failedCount >= 2) {
    score += 15;
    factors.push(`${failedCount} failed primary care treatments`);
    nice_criteria.push("Inadequate response to initial management (NG73 1.4.1)");
  }

  if (patient.family_history_endo) {
    score += 5;
    factors.push("First-degree family history of endometriosis");
  }

  if (patient.known_endometriosis_stage === "stage_iii" || patient.known_endometriosis_stage === "stage_iv") {
    score += 20;
    factors.push(`Known ${patient.known_endometriosis_stage.replace("_", " ")} endometriosis`);
  }

  if (patient.fertility_concerns) {
    alerts.push({
      severity: "warning",
      message: "Patient reports fertility concerns. Endometriosis is present in 25-50% of infertile women.",
      action: "Consider early fertility specialist referral. Assess ovarian reserve (AMH, AFC).",
      guideline_ref: "NICE NG73 1.5.1",
    });
  }

  if (patient.comorbidities.some((c) => c.toLowerCase().includes("adenomyosis"))) {
    score += 5;
    factors.push("Concurrent adenomyosis — associated with more severe disease");
  }

  return { score: clamp(score, 0, 100), factors, alerts, nice_criteria };
}

// ── Investigation recommendations ──

function recommendInvestigations(
  overallRisk: RiskLevel,
  patient: PatientHistory,
  biomarkerAlerts: ClinicalAlert[]
): Investigation[] {
  const investigations: Investigation[] = [];

  const hasCriticalCA125 = biomarkerAlerts.some(
    (a) => a.severity === "critical" && a.message.includes("CA-125")
  );

  if (hasCriticalCA125) {
    investigations.push({
      name: "Urgent 2-week pathway referral",
      urgency: "immediate",
      rationale: "CA-125 >200 U/mL requires exclusion of ovarian malignancy",
      guideline_ref: "NICE NG73 1.2.1 / CG122",
    });
    investigations.push({
      name: "CT Abdomen & Pelvis",
      urgency: "immediate",
      rationale: "Staging investigation for significantly elevated CA-125",
      guideline_ref: "NICE CG122",
    });
  }

  if (overallRisk !== "low") {
    investigations.push({
      name: "Transvaginal Ultrasound",
      urgency: overallRisk === "very_high" ? "urgent" : "routine",
      rationale: "First-line imaging for suspected endometriosis. Can identify endometriomas and deep disease.",
      guideline_ref: "NICE NG73 1.4.2",
    });
  }

  if (
    (overallRisk === "high" || overallRisk === "very_high") &&
    (patient.cyclical_bowel_symptoms || patient.dyschezia)
  ) {
    investigations.push({
      name: "MRI Pelvis",
      urgency: "urgent",
      rationale: "Cyclical bowel symptoms with high risk profile — assess for deep infiltrating endometriosis of rectovaginal septum/bowel.",
      guideline_ref: "NICE NG73 1.4.3",
    });
    investigations.push({
      name: "Referral to BSGE Accredited Endometriosis Centre",
      urgency: "urgent",
      rationale: "Suspected deep endometriosis requires specialist multidisciplinary assessment.",
      guideline_ref: "NICE NG73 1.4.5",
    });
  }

  if (
    (overallRisk === "high" || overallRisk === "very_high") &&
    patient.cyclical_bladder_symptoms
  ) {
    investigations.push({
      name: "Cystoscopy",
      urgency: "routine",
      rationale: "Cyclical bladder symptoms — exclude bladder endometriosis.",
      guideline_ref: "NICE NG73 1.4.3",
    });
  }

  if (patient.fertility_concerns) {
    investigations.push({
      name: "Fertility specialist referral",
      urgency: "routine",
      rationale: "Endometriosis-associated subfertility. Assess ovarian reserve and discuss management options.",
      guideline_ref: "NICE NG73 1.5.1",
    });
  }

  return investigations;
}

// ── Main entry point ──

export function assessRisk(
  patient: PatientHistory,
  biomarkers: BiomarkerValue[]
): RiskStratification {
  const bio = scoreBiomarkers(biomarkers);
  const clinical = scoreClinicalHistory(patient);

  // Weighted composite: 40% biomarker + 60% clinical (clinical history is more predictive)
  const compositeScore = clamp(
    Math.round(bio.score * 0.4 + clinical.score * 0.6),
    0,
    100
  );
  const overall = riskLevel(compositeScore);

  const investigations = recommendInvestigations(
    overall,
    patient,
    bio.alerts
  );

  return {
    overall_risk: overall,
    score: compositeScore,
    biomarker_risk: {
      level: riskLevel(bio.score),
      score: bio.score,
      factors: bio.factors,
    },
    clinical_risk: {
      level: riskLevel(clinical.score),
      score: clinical.score,
      factors: clinical.factors,
    },
    recommended_investigations: investigations,
    clinical_alerts: [...bio.alerts, ...clinical.alerts],
    nice_ng73_criteria_met: clinical.nice_criteria,
  };
}

/** Flag a single biomarker value against its reference range */
export function flagBiomarker(
  marker: keyof typeof BIOMARKER_META,
  value: number,
  meta: { reference: { low: number; high: number } }
): "normal" | "elevated" | "low" | "critical" {
  // Critical thresholds for specific markers
  if (marker === "ca125" && value > 200) return "critical";
  if (marker === "fbc_haemoglobin" && value < 80) return "critical";

  if (value < meta.reference.low) return "low";
  if (value > meta.reference.high) return "elevated";
  return "normal";
}
