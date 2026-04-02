/**
 * Demo seed data — realistic endometriosis patient cohort for demonstrations.
 * Loaded automatically on first launch when localStorage is empty.
 */
import type { BiomarkerValue, PatientHistory, SymptomLog } from "@/lib/types/cdss";
import { BIOMARKER_META } from "@/lib/types/cdss";
import { flagBiomarker } from "@/lib/engine/risk-engine";

// ── Patient IDs ──────────────────────────────────────────────────────────────

const PT1 = "demo-pt-001"; // Emma Clarke — suspected, first appointment
const PT2 = "demo-pt-002"; // Sarah Okafor — confirmed stage II, ongoing care
const PT3 = "demo-pt-003"; // Jess Whitfield — post-laparoscopy, monitoring
const PT4 = "demo-pt-004"; // Priya Mehta — GP referral, high-risk presentation

// ── Patients ─────────────────────────────────────────────────────────────────

export const DEMO_PATIENTS: PatientHistory[] = [
  {
    id: PT1,
    created_at: "2026-01-08T09:15:00Z",
    name: "Emma Clarke",
    age: 28,
    bmi: 22.4,
    menarche_age: 12,
    cycle_length_days: 26,
    cycle_regularity: "irregular",
    dysmenorrhoea_severity: 8,
    dysmenorrhoea_onset_age: 14,
    gravidity: 0,
    parity: 0,
    fertility_concerns: true,
    symptom_duration_months: 36,
    chronic_pelvic_pain: true,
    dyspareunia: true,
    dyschezia: false,
    dysuria: false,
    cyclical_bowel_symptoms: true,
    cyclical_bladder_symptoms: false,
    non_cyclical_pain: true,
    previous_ultrasound: true,
    previous_laparoscopy: false,
    previous_mri: false,
    known_endometriosis_stage: null,
    current_treatments: ["Mefenamic acid", "Combined oral contraceptive pill"],
    failed_treatments: [
      { name: "Ibuprofen", type: "analgesic", duration_months: 6, outcome: "mild_improvement" },
    ],
    comorbidities: ["IBS"],
    family_history_endo: true,
    consultation_notes: [
      {
        id: "note-demo-001",
        date: "2026-01-08",
        clinician: "Dr. Sarah Johnson",
        content: `SOAP NOTE — 8 January 2026
Summary: 28-year-old presenting with 3-year history of severe dysmenorrhoea and chronic pelvic pain, mother has confirmed endometriosis.

SUBJECTIVE
Patient reports severe period pain scoring 8/10, present since age 14. Describes cramping, lower abdominal pain radiating to back and thighs, lasting 4–5 days. Also reports deep dyspareunia and chronic pelvic pain throughout the month. Bowel symptoms worsen perimenstrually. Concerned about fertility. Family history: mother diagnosed with endometriosis stage III aged 32.

OBJECTIVE
Pelvic examination: mild uterine tenderness on bimanual. No adnexal masses palpable. Transvaginal ultrasound (Jan 2026): no obvious endometrioma, possible adenomyosis features. CA-125 pending.

ASSESSMENT
High clinical suspicion for endometriosis meeting multiple NICE NG73 criteria: severe dysmenorrhoea, dyspareunia, chronic pelvic pain, cyclical bowel symptoms, positive family history. Risk stratification: HIGH. Differential includes adenomyosis.

PLAN
1. Request CA-125, CRP, HE4 bloods
2. Refer for diagnostic laparoscopy — urgent pathway
3. Continue mefenamic acid for pain management
4. Discuss Mirena IUS as bridging therapy pending diagnosis
5. Fertility counselling referral given patient's concerns
6. Follow up in 6 weeks with results`,
      },
    ],
  },

  {
    id: PT2,
    created_at: "2025-04-15T10:30:00Z",
    name: "Sarah Okafor",
    age: 34,
    bmi: 24.8,
    menarche_age: 13,
    cycle_length_days: 28,
    cycle_regularity: "regular",
    dysmenorrhoea_severity: 7,
    dysmenorrhoea_onset_age: 16,
    gravidity: 1,
    parity: 0,
    fertility_concerns: true,
    symptom_duration_months: 60,
    chronic_pelvic_pain: true,
    dyspareunia: true,
    dyschezia: true,
    dysuria: false,
    cyclical_bowel_symptoms: true,
    cyclical_bladder_symptoms: false,
    non_cyclical_pain: false,
    previous_ultrasound: true,
    previous_laparoscopy: true,
    previous_mri: true,
    known_endometriosis_stage: "stage_ii",
    current_treatments: ["Norethisterone", "Naproxen"],
    failed_treatments: [
      { name: "Combined oral contraceptive pill", type: "hormonal", duration_months: 18, outcome: "mild_improvement" },
      { name: "Zoladex (goserelin)", type: "hormonal", duration_months: 6, outcome: "mild_improvement" },
    ],
    comorbidities: ["Hypothyroidism"],
    family_history_endo: false,
    consultation_notes: [
      {
        id: "note-demo-002a",
        date: "2025-04-15",
        clinician: "Dr. Sarah Johnson",
        content: `SOAP NOTE — 15 April 2025
Summary: New patient with confirmed stage II endometriosis post-laparoscopy, currently on norethisterone with partial symptom control.

SUBJECTIVE
34-year-old with confirmed stage II endometriosis diagnosed via laparoscopy in 2023. Reports ongoing dysmenorrhoea 7/10, deep dyspareunia, and dyschezia particularly perimenstrually. Currently taking norethisterone with partial response. One miscarriage 2024, keen to conceive. Hypothyroidism well-controlled on levothyroxine.

OBJECTIVE
MRI pelvis (March 2025): bilateral ovarian endometriomas <2cm, no deep infiltrating endometriosis identified. TSH within normal range. CA-125 68 U/mL (elevated).

ASSESSMENT
Stage II endometriosis with confirmed ovarian involvement. Symptom burden moderate-high despite hormonal treatment. Fertility planning complicates treatment options — long-term GnRH agonist not appropriate given conception goals.

PLAN
1. Refer to fertility specialist — IVF pathway discussion given endometrioma presence
2. Continue norethisterone short-term for symptom management
3. Repeat CA-125 in 3 months
4. Discuss surgical options (cystectomy) vs expectant management for endometriomas
5. Dietitian referral for anti-inflammatory dietary advice`,
      },
      {
        id: "note-demo-002b",
        date: "2025-10-22",
        clinician: "Dr. Sarah Johnson",
        content: `SOAP NOTE — 22 October 2025
Summary: Follow-up visit — endometriomas stable, fertility treatment deferred, trialling dienogest.

SUBJECTIVE
Patient reports slight improvement in pelvic pain on norethisterone but ongoing dyspareunia impacting quality of life. Has decided to defer IVF by 6 months. Fatigue remains significant. No new symptoms.

OBJECTIVE
Repeat ultrasound: endometriomas unchanged at <2cm bilaterally. CA-125 improved to 48 U/mL. Weight stable. BP normal.

ASSESSMENT
Stable disease. Modest response to current progestogen. Changing to dienogest (Visanne) given evidence for endometrioma stabilisation and pain control.

PLAN
1. Switch to dienogest 2mg daily
2. Repeat pelvic ultrasound in 6 months
3. Review IVF timing at next appointment
4. Prescribe topical lidocaine gel for dyspareunia — trial for 8 weeks
5. Return in 3 months or sooner if symptoms worsen`,
      },
    ],
  },

  {
    id: PT3,
    created_at: "2024-09-03T14:00:00Z",
    name: "Jess Whitfield",
    age: 31,
    bmi: 21.1,
    menarche_age: 11,
    cycle_length_days: 30,
    cycle_regularity: "regular",
    dysmenorrhoea_severity: 4,
    dysmenorrhoea_onset_age: 13,
    gravidity: 0,
    parity: 0,
    fertility_concerns: false,
    symptom_duration_months: 84,
    chronic_pelvic_pain: false,
    dyspareunia: false,
    dyschezia: false,
    dysuria: false,
    cyclical_bowel_symptoms: false,
    cyclical_bladder_symptoms: false,
    non_cyclical_pain: false,
    previous_ultrasound: true,
    previous_laparoscopy: true,
    previous_mri: true,
    known_endometriosis_stage: "stage_i",
    current_treatments: ["Mirena IUS"],
    failed_treatments: [],
    comorbidities: [],
    family_history_endo: false,
    consultation_notes: [
      {
        id: "note-demo-003a",
        date: "2024-09-03",
        clinician: "Dr. Sarah Johnson",
        content: `SOAP NOTE — 3 September 2024
Summary: Post-laparoscopy monitoring visit. Stage I endometriosis — excellent response to Mirena IUS, now largely asymptomatic.

SUBJECTIVE
Patient underwent diagnostic and excision laparoscopy for stage I endometriosis in March 2024. Reports significant improvement in dysmenorrhoea since Mirena IUS insertion (post-op). Currently rating period pain as 3-4/10 compared to 9/10 pre-treatment. No dyspareunia, no bowel symptoms. Quality of life markedly improved.

OBJECTIVE
Mirena IUS confirmed in situ on ultrasound. Minimal bleeding reported. Pelvic examination: no tenderness. CA-125 12 U/mL (within normal range).

ASSESSMENT
Excellent treatment response to combined surgical excision and Mirena IUS. Stage I disease — low recurrence risk at 6 months. Continue current management.

PLAN
1. Continue Mirena IUS for 5-year duration
2. Annual review with USS
3. Advise patient to return promptly if symptoms recur — early intervention shown to prevent progression
4. Patient given written information on endometriosis recurrence signs`,
      },
    ],
  },

  {
    id: PT4,
    created_at: "2026-02-14T11:00:00Z",
    name: "Priya Mehta",
    age: 26,
    bmi: 20.3,
    menarche_age: 12,
    cycle_length_days: 25,
    cycle_regularity: "irregular",
    dysmenorrhoea_severity: 9,
    dysmenorrhoea_onset_age: 12,
    gravidity: 0,
    parity: 0,
    fertility_concerns: true,
    symptom_duration_months: 84,
    chronic_pelvic_pain: true,
    dyspareunia: true,
    dyschezia: true,
    dysuria: true,
    cyclical_bowel_symptoms: true,
    cyclical_bladder_symptoms: true,
    non_cyclical_pain: true,
    previous_ultrasound: true,
    previous_laparoscopy: false,
    previous_mri: false,
    known_endometriosis_stage: null,
    current_treatments: ["Tranexamic acid", "Tramadol"],
    failed_treatments: [
      { name: "Combined oral contraceptive pill", type: "hormonal", duration_months: 24, outcome: "no_change" },
      { name: "Ibuprofen", type: "analgesic", duration_months: 12, outcome: "no_change" },
      { name: "Co-codamol", type: "analgesic", duration_months: 6, outcome: "mild_improvement" },
    ],
    comorbidities: ["Anxiety", "Iron deficiency anaemia"],
    family_history_endo: true,
    consultation_notes: [
      {
        id: "note-demo-004",
        date: "2026-02-14",
        clinician: "Dr. Sarah Johnson",
        content: `SOAP NOTE — 14 February 2026
Summary: Urgent GP referral. 26-year-old with 7-year symptom history, very high risk profile, multiple treatment failures. Warrants urgent laparoscopy.

SUBJECTIVE
GP referral — 26-year-old with 7-year history of severe dysmenorrhoea (9/10), chronic pelvic pain, deep dyspareunia, dyschezia, dysuria, and cyclical bladder symptoms. All symptoms significantly impact daily functioning; has missed work approximately 3 days/month. Two previous GP-trial treatments (COCP, NSAIDs) with no meaningful benefit. Currently on tramadol. Maternal aunt has confirmed endometriosis. Concerned about fertility.

OBJECTIVE
Pelvic USS (GP, Jan 2026): bulky uterus with heterogeneous myometrium — possible adenomyosis. No discrete endometrioma identified. Haemoglobin 94 g/L (low). CA-125 112 U/mL (significantly elevated). CRP 14 mg/L (mildly elevated). Iron deficiency confirmed on bloods.

ASSESSMENT
Very high clinical suspicion for endometriosis — NICE NG73 criteria met across all symptom domains. CA-125 significantly elevated. Risk stratification: VERY HIGH. Haematological compromise (Hb 94) secondary to heavy menstrual bleeding. Possible concomitant adenomyosis. Multiple treatment failures. Urgent surgical assessment warranted.

PLAN
1. URGENT laparoscopy referral — 2-week wait pathway where possible
2. IV iron infusion for anaemia prior to surgery
3. Increase analgesic ladder: add naproxen + PPI cover, reduce tramadol reliance
4. MRI pelvis — rule out deep infiltrating endometriosis prior to surgery
5. Pre-surgical multidisciplinary discussion given complex presentation
6. Fertility counselling — egg freezing discussion given likely need for surgical intervention
7. Anxiety: refer to specialist perinatal/gynaecological psychology service`,
      },
    ],
  },
];

// ── Biomarkers ────────────────────────────────────────────────────────────────

function bm(
  id: string,
  patientId: string,
  marker: Parameters<typeof flagBiomarker>[0],
  value: number,
  date: string
): BiomarkerValue {
  return {
    id,
    patient_id: patientId,
    marker,
    value,
    date_collected: date,
    flag: flagBiomarker(marker, value, BIOMARKER_META[marker]),
  };
}

export const DEMO_BIOMARKERS: BiomarkerValue[] = [
  // Emma Clarke (PT1) — elevated CA-125, raised CRP
  bm("dbm-001", PT1, "ca125", 62, "2026-01-10"),
  bm("dbm-002", PT1, "crp", 9.2, "2026-01-10"),
  bm("dbm-003", PT1, "he4", 88, "2026-01-10"),
  bm("dbm-004", PT1, "amh", 22, "2026-01-10"),

  // Sarah Okafor (PT2) — improving CA-125, stable markers
  bm("dbm-010", PT2, "ca125", 68, "2025-04-18"),
  bm("dbm-011", PT2, "crp", 6.1, "2025-04-18"),
  bm("dbm-012", PT2, "ca125", 48, "2025-10-25"),
  bm("dbm-013", PT2, "crp", 4.8, "2025-10-25"),
  bm("dbm-014", PT2, "tsh", 1.8, "2025-10-25"),
  bm("dbm-015", PT2, "amh", 14, "2025-10-25"),

  // Jess Whitfield (PT3) — normalised post-treatment
  bm("dbm-020", PT3, "ca125", 28, "2024-03-01"),
  bm("dbm-021", PT3, "ca125", 12, "2024-09-05"),
  bm("dbm-022", PT3, "crp", 2.1, "2024-09-05"),

  // Priya Mehta (PT4) — very elevated CA-125, anaemia
  bm("dbm-030", PT4, "ca125", 112, "2026-02-01"),
  bm("dbm-031", PT4, "crp", 14.0, "2026-02-01"),
  bm("dbm-032", PT4, "fbc_haemoglobin", 94, "2026-02-01"),
  bm("dbm-033", PT4, "ferritin", 8, "2026-02-01"),
  bm("dbm-034", PT4, "he4", 124, "2026-02-01"),
  bm("dbm-035", PT4, "amh", 31, "2026-02-01"),
];

// ── Symptom logs (portal contributions) ─────────────────────────────────────

export const DEMO_SYMPTOM_LOGS: SymptomLog[] = [
  // Jess Whitfield — active portal user, post-treatment monitoring
  {
    id: "dsl-001",
    patient_id: PT3,
    logged_at: "2026-03-20T08:30:00Z",
    pain_score: 3,
    fatigue_score: 2,
    mood_score: 8,
    period_pain_score: 4,
    period_duration_hours: 12,
    bleeding_heaviness: "light",
    cycle_phase: "menstrual",
    symptoms: {
      bloating: true,
      nausea: false,
      painful_periods: true,
      painful_intercourse: false,
      bowel_symptoms: false,
      bladder_symptoms: false,
      pelvic_pain: false,
    },
    notes: "Much better than before the op. Period pain manageable with paracetamol only.",
    transcript: null,
  },
  {
    id: "dsl-002",
    patient_id: PT3,
    logged_at: "2026-02-19T19:15:00Z",
    pain_score: 2,
    fatigue_score: 3,
    mood_score: 7,
    period_pain_score: 3,
    period_duration_hours: 8,
    bleeding_heaviness: "light",
    cycle_phase: "menstrual",
    symptoms: {
      bloating: false,
      nausea: false,
      painful_periods: true,
      painful_intercourse: false,
      bowel_symptoms: false,
      bladder_symptoms: false,
      pelvic_pain: false,
    },
    notes: "Good month overall. Feeling positive.",
    transcript: null,
  },
  {
    id: "dsl-003",
    patient_id: PT3,
    logged_at: "2026-01-22T10:00:00Z",
    pain_score: 5,
    fatigue_score: 6,
    mood_score: 5,
    period_pain_score: 6,
    period_duration_hours: 24,
    bleeding_heaviness: "moderate",
    cycle_phase: "menstrual",
    symptoms: {
      bloating: true,
      nausea: true,
      painful_periods: true,
      painful_intercourse: false,
      bowel_symptoms: true,
      bladder_symptoms: false,
      pelvic_pain: true,
    },
    notes: "Worse than usual this month — lots of stress at work. Took time off.",
    transcript: null,
  },
  // Emma Clarke — recently started portal
  {
    id: "dsl-010",
    patient_id: PT1,
    logged_at: "2026-03-25T20:00:00Z",
    pain_score: 7,
    fatigue_score: 7,
    mood_score: 4,
    period_pain_score: 8,
    period_duration_hours: 72,
    bleeding_heaviness: "heavy",
    cycle_phase: "menstrual",
    symptoms: {
      bloating: true,
      nausea: true,
      painful_periods: true,
      painful_intercourse: true,
      bowel_symptoms: true,
      bladder_symptoms: false,
      pelvic_pain: true,
    },
    notes: "Worst period in months. Couldn't leave the house for 3 days. The COCP doesn't seem to be helping.",
    transcript: null,
  },
  {
    id: "dsl-011",
    patient_id: PT1,
    logged_at: "2026-02-26T21:30:00Z",
    pain_score: 6,
    fatigue_score: 8,
    mood_score: 3,
    period_pain_score: 8,
    period_duration_hours: 60,
    bleeding_heaviness: "heavy",
    cycle_phase: "menstrual",
    symptoms: {
      bloating: true,
      nausea: false,
      painful_periods: true,
      painful_intercourse: true,
      bowel_symptoms: true,
      bladder_symptoms: false,
      pelvic_pain: true,
    },
    notes: "Pain radiating down my legs again. Feel exhausted all the time.",
    transcript: null,
  },
  // Priya Mehta — first portal entries
  {
    id: "dsl-020",
    patient_id: PT4,
    logged_at: "2026-03-15T09:00:00Z",
    pain_score: 9,
    fatigue_score: 9,
    mood_score: 2,
    period_pain_score: 9,
    period_duration_hours: 120,
    bleeding_heaviness: "very_heavy",
    cycle_phase: "menstrual",
    symptoms: {
      bloating: true,
      nausea: true,
      painful_periods: true,
      painful_intercourse: true,
      bowel_symptoms: true,
      bladder_symptoms: true,
      pelvic_pain: true,
    },
    notes: "Completely debilitating. Off work again. Had to call 111 — pain was a 10. They advised A&E but I managed at home.",
    transcript: null,
  },
];
