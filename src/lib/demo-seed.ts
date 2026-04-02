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
        content: `CONSULTATION HISTORY — 8 January 2026
Summary: 28-year-old presenting with 3-year history of severe dysmenorrhoea and chronic pelvic pain. High clinical suspicion for endometriosis meeting NICE NG73 criteria. Mother has confirmed endometriosis.

CO — Complains Of
Severe period pain and chronic pelvic pain. Concerned about fertility.

HPC — History of Present Complaint
3-year history of severe dysmenorrhoea scoring 8/10 on VAS, onset age 14. Describes cramping lower abdominal pain radiating to back and thighs, lasting 4–5 days per cycle. Reports deep dyspareunia and chronic pelvic pain throughout the month. Bowel symptoms worsen perimenstrually (loose stool, urgency). Symptoms significantly impact daily functioning and quality of life. Fertility concerns prominent — nulliparous, wishes to conceive in the next 2 years.

PMH — Past Medical History
No previous laparoscopy or pelvic surgery. Transvaginal ultrasound January 2026: no obvious endometrioma, possible adenomyosis features noted. No previous MRI. No significant medical history. No hospitalisations.

FH — Family History
Mother diagnosed with endometriosis stage III aged 32. No other relevant family history of gynaecological malignancy or autoimmune conditions reported.

Allergies
NKDA — no known drug allergies.

Drugs / Current Medications
Mefenamic acid 500mg TDS (days 1–5 of cycle). No hormonal contraception. No supplements reported.`,
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
        content: `CONSULTATION HISTORY — 15 April 2025
Summary: New patient with confirmed stage II endometriosis post-laparoscopy. Ongoing pain despite norethisterone. Fertility-preserving management required. CA-125 elevated at 68 U/mL.

CO — Complains Of
Ongoing pelvic pain and deep dyspareunia despite hormonal treatment. Wishes to discuss fertility options.

HPC — History of Present Complaint
Stage II endometriosis confirmed at diagnostic laparoscopy in 2023. Since diagnosis: persistent dysmenorrhoea 7/10, deep dyspareunia limiting sexual activity, and dyschezia perimenstrually. Norethisterone commenced post-laparoscopy with partial pain response only. One miscarriage in 2024. Keen to conceive — requests fertility referral. Fatigue significant throughout cycle.

PMH — Past Medical History
Diagnostic laparoscopy 2023 — stage II endometriosis confirmed, excision performed. Miscarriage 2024 (spontaneous, 8 weeks). Hypothyroidism diagnosed 2019, stable on levothyroxine. MRI pelvis March 2025: bilateral ovarian endometriomas <2cm, no deep infiltrating endometriosis identified.

FH — Family History
Not reported.

Allergies
NKDA — no known drug allergies.

Drugs / Current Medications
Norethisterone 5mg BD. Levothyroxine 50mcg OD. Naproxen 500mg BD PRN (period pain).`,
      },
      {
        id: "note-demo-002b",
        date: "2025-10-22",
        clinician: "Dr. Sarah Johnson",
        content: `CONSULTATION HISTORY — 22 October 2025
Summary: Follow-up — endometriomas stable on repeat USS. CA-125 improved to 48 U/mL. Switching from norethisterone to dienogest. IVF deferred 6 months.

CO — Complains Of
Ongoing dyspareunia and pelvic pain. Persistent fatigue. Wishes to defer IVF.

HPC — History of Present Complaint
Modest improvement in pelvic pain on norethisterone but dyspareunia remains significant, impacting quality of life and relationship. Fatigue continues throughout cycle. No new symptoms. Patient has decided to defer IVF by 6 months for personal reasons. CA-125 improved from 68 to 48 U/mL suggesting some treatment response.

PMH — Past Medical History
Stage II endometriosis — laparoscopy 2023. Miscarriage 2024. Hypothyroidism (stable). Repeat pelvic ultrasound October 2025: endometriomas unchanged bilaterally <2cm.

FH — Family History
Not reported.

Allergies
NKDA — no known drug allergies.

Drugs / Current Medications
Switching: norethisterone 5mg BD → dienogest (Visanne) 2mg OD. Levothyroxine 50mcg OD. Topical lidocaine 5% gel PRN for dyspareunia (new prescription, 8-week trial).`,
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
        content: `CONSULTATION HISTORY — 3 September 2024
Summary: Post-laparoscopy review at 6 months. Stage I endometriosis — excellent response to surgical excision and Mirena IUS. Now largely asymptomatic. CA-125 normalised.

CO — Complains Of
Routine post-operative review. Patient reports she is doing well and symptoms have markedly improved.

HPC — History of Present Complaint
Diagnostic and excision laparoscopy for stage I endometriosis performed March 2024. Mirena IUS inserted at time of surgery. Pre-operatively: dysmenorrhoea 9/10, cyclical bowel symptoms, significant impact on work and quality of life. Post-operatively: dysmenorrhoea now 3–4/10, manageable with paracetamol alone. No dyspareunia. No bowel symptoms. Periods lighter and shorter. Quality of life markedly improved. No fertility concerns at present.

PMH — Past Medical History
Diagnostic and excision laparoscopy March 2024 — stage I endometriosis confirmed and excised. Mirena IUS in situ (March 2024). No other relevant medical history. Pelvic USS September 2024: Mirena confirmed in situ, no endometrioma.

FH — Family History
Not reported.

Allergies
NKDA — no known drug allergies.

Drugs / Current Medications
Mirena IUS (levonorgestrel 52mg, inserted March 2024 — valid 5 years). Paracetamol 1g QDS PRN.`,
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
        content: `CONSULTATION HISTORY — 14 February 2026
Summary: Urgent GP referral. 26-year-old with 7-year history of severe, multi-domain endometriosis symptoms. Very high risk profile, multiple treatment failures, haematological compromise. Urgent laparoscopy warranted.

CO — Complains Of
Severe period pain, chronic pelvic pain, pain during sex, and bowel and bladder symptoms. Concerned about fertility. GP referred urgently.

HPC — History of Present Complaint
7-year history of severe dysmenorrhoea scoring 9/10 on VAS, onset aged 12. Symptoms span all domains: chronic pelvic pain (continuous), deep dyspareunia, dyschezia, dysuria, cyclical bowel symptoms (urgency, rectal pain), and cyclical bladder symptoms (frequency, haematuria perimenstrually). Symptoms have a major impact on daily life — missing approximately 3 days of work per month. Heavy menstrual bleeding with clots. Two previous GP-initiated treatments (COCP 24 months — no change; ibuprofen — no change) and co-codamol (mild improvement). Currently taking tramadol with limited efficacy. Fertility concerns significant — nulliparous, hopes to conceive.

PMH — Past Medical History
No previous laparoscopy or MRI. Pelvic USS (GP, January 2026): bulky uterus with heterogeneous myometrium — possible adenomyosis. No discrete endometrioma identified. Iron deficiency anaemia confirmed on bloods (Hb 94 g/L, ferritin 8 mcg/L). Anxiety disorder — under GP care. No surgical history.

FH — Family History
Maternal aunt with confirmed endometriosis. No other relevant family history reported.

Allergies
NKDA — no known drug allergies.

Drugs / Current Medications
Tramadol 50mg QDS PRN. Tranexamic acid 1g QDS (days 1–4 of period). Sertraline 50mg OD (anxiety). Ferrous sulfate 200mg BD (iron deficiency anaemia — GP prescribed).`,
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
  // ── Emma Clarke (PT1) ──────────────────────────────────────────────────────
  // GP & hospital bloods over 18 months — rising CA-125, CRP, declining iron stores
  // Tumour markers (rising trend — escalating disease activity)
  bm("dbm-001a", PT1, "ca125", 22, "2024-07-12"),
  bm("dbm-001b", PT1, "ca125", 31, "2025-01-08"),
  bm("dbm-001c", PT1, "ca125", 44, "2025-07-14"),
  bm("dbm-001d", PT1, "ca125", 62, "2026-01-10"),  // referral bloods
  bm("dbm-001e", PT1, "he4",   72, "2025-01-08"),
  bm("dbm-001f", PT1, "he4",   81, "2025-07-14"),
  bm("dbm-001g", PT1, "he4",   88, "2026-01-10"),
  // Inflammatory markers (worsening)
  bm("dbm-002a", PT1, "crp",   3.1, "2024-07-12"),
  bm("dbm-002b", PT1, "crp",   5.8, "2025-01-08"),
  bm("dbm-002c", PT1, "crp",   7.2, "2025-07-14"),
  bm("dbm-002d", PT1, "crp",   9.2, "2026-01-10"),
  // Hormonal (AMH declining — ovarian reserve concern)
  bm("dbm-003a", PT1, "amh",   28, "2024-07-12"),
  bm("dbm-003b", PT1, "amh",   25, "2025-07-14"),
  bm("dbm-003c", PT1, "amh",   22, "2026-01-10"),
  bm("dbm-003d", PT1, "vitamin_d", 62, "2024-07-12"),
  bm("dbm-003e", PT1, "vitamin_d", 44, "2025-07-14"),
  bm("dbm-003f", PT1, "vitamin_d", 34, "2026-01-10"),
  // Haematology (slow iron depletion from heavy periods)
  bm("dbm-004a", PT1, "fbc_haemoglobin", 128, "2024-07-12"),
  bm("dbm-004b", PT1, "fbc_haemoglobin", 124, "2025-01-08"),
  bm("dbm-004c", PT1, "fbc_haemoglobin", 119, "2026-01-10"),
  bm("dbm-004d", PT1, "ferritin", 32, "2024-07-12"),
  bm("dbm-004e", PT1, "ferritin", 21, "2025-01-08"),
  bm("dbm-004f", PT1, "ferritin", 13, "2026-01-10"),

  // ── Sarah Okafor (PT2) ─────────────────────────────────────────────────────
  // Pre-laparoscopy → post-lap → norethisterone → dienogest (clear treatment response)
  // Tumour markers
  bm("dbm-010a", PT2, "ca125",  94, "2023-01-15"),  // pre-laparoscopy
  bm("dbm-010b", PT2, "ca125",  71, "2023-06-20"),  // post-lap improvement
  bm("dbm-010c", PT2, "ca125",  82, "2024-01-10"),  // mild relapse
  bm("dbm-010d", PT2, "ca125",  68, "2025-04-18"),  // norethisterone — partial response
  bm("dbm-010e", PT2, "ca125",  48, "2025-10-25"),  // dienogest — good response
  bm("dbm-010f", PT2, "he4",    98, "2023-01-15"),
  bm("dbm-010g", PT2, "he4",    88, "2023-06-20"),
  bm("dbm-010h", PT2, "he4",    82, "2025-04-18"),
  bm("dbm-010i", PT2, "he4",    74, "2025-10-25"),
  // Inflammatory
  bm("dbm-011a", PT2, "crp",  12.4, "2023-01-15"),
  bm("dbm-011b", PT2, "crp",   7.8, "2023-06-20"),
  bm("dbm-011c", PT2, "crp",   9.1, "2024-01-10"),
  bm("dbm-011d", PT2, "crp",   6.1, "2025-04-18"),
  bm("dbm-011e", PT2, "crp",   4.8, "2025-10-25"),
  bm("dbm-011f", PT2, "esr",    28, "2023-01-15"),
  bm("dbm-011g", PT2, "esr",    18, "2023-06-20"),
  bm("dbm-011h", PT2, "esr",    14, "2025-10-25"),
  // Hormonal
  bm("dbm-012a", PT2, "amh",    22, "2023-01-15"),
  bm("dbm-012b", PT2, "amh",    20, "2024-01-10"),
  bm("dbm-012c", PT2, "amh",    14, "2025-10-25"),   // declining — ovarian reserve concern
  bm("dbm-012d", PT2, "tsh",   2.1, "2023-01-15"),
  bm("dbm-012e", PT2, "tsh",   1.9, "2024-01-10"),
  bm("dbm-012f", PT2, "tsh",   1.8, "2025-10-25"),
  // Haematology
  bm("dbm-013a", PT2, "fbc_haemoglobin", 118, "2023-01-15"),
  bm("dbm-013b", PT2, "fbc_haemoglobin", 124, "2023-06-20"),
  bm("dbm-013c", PT2, "fbc_haemoglobin", 121, "2025-04-18"),
  bm("dbm-013d", PT2, "fbc_haemoglobin", 128, "2025-10-25"),
  bm("dbm-013e", PT2, "ferritin", 18, "2023-01-15"),
  bm("dbm-013f", PT2, "ferritin", 26, "2023-06-20"),
  bm("dbm-013g", PT2, "ferritin", 24, "2025-04-18"),
  bm("dbm-013h", PT2, "ferritin", 31, "2025-10-25"),

  // ── Jess Whitfield (PT3) ──────────────────────────────────────────────────
  // Pre-diagnosis → laparoscopy → Mirena IUS → full normalisation
  // Tumour markers (excellent treatment response arc)
  bm("dbm-020a", PT3, "ca125", 42, "2022-06-08"),  // symptoms worsening
  bm("dbm-020b", PT3, "ca125", 36, "2023-01-20"),
  bm("dbm-020c", PT3, "ca125", 31, "2023-09-14"),
  bm("dbm-020d", PT3, "ca125", 28, "2024-03-01"),  // pre-laparoscopy
  bm("dbm-020e", PT3, "ca125", 12, "2024-09-05"),  // 6mo post-op — normalised
  bm("dbm-020f", PT3, "ca125", 10, "2025-03-12"),  // annual review — sustained
  // Inflammatory (resolving)
  bm("dbm-021a", PT3, "crp",  8.2, "2022-06-08"),
  bm("dbm-021b", PT3, "crp",  6.4, "2023-01-20"),
  bm("dbm-021c", PT3, "crp",  4.8, "2023-09-14"),
  bm("dbm-021d", PT3, "crp",  3.1, "2024-03-01"),
  bm("dbm-021e", PT3, "crp",  2.1, "2024-09-05"),
  bm("dbm-021f", PT3, "crp",  1.4, "2025-03-12"),
  // Hormonal (AMH stable — reassuring)
  bm("dbm-022a", PT3, "amh",  38, "2022-06-08"),
  bm("dbm-022b", PT3, "amh",  36, "2023-09-14"),
  bm("dbm-022c", PT3, "amh",  34, "2024-03-01"),
  bm("dbm-022d", PT3, "amh",  37, "2025-03-12"),  // recovering
  // Haematology (improving with Mirena)
  bm("dbm-023a", PT3, "fbc_haemoglobin", 132, "2022-06-08"),
  bm("dbm-023b", PT3, "fbc_haemoglobin", 134, "2023-09-14"),
  bm("dbm-023c", PT3, "fbc_haemoglobin", 138, "2024-03-01"),
  bm("dbm-023d", PT3, "fbc_haemoglobin", 144, "2025-03-12"),
  bm("dbm-024a", PT3, "ferritin", 45, "2022-06-08"),
  bm("dbm-024b", PT3, "ferritin", 52, "2023-09-14"),
  bm("dbm-024c", PT3, "ferritin", 64, "2024-09-05"),
  bm("dbm-024d", PT3, "ferritin", 72, "2025-03-12"),

  // ── Priya Mehta (PT4) ─────────────────────────────────────────────────────
  // 4-year progressive deterioration — every marker worsening — urgent picture
  // Tumour markers (alarming sustained rise)
  bm("dbm-030a", PT4, "ca125",  48, "2022-01-18"),
  bm("dbm-030b", PT4, "ca125",  62, "2022-07-06"),
  bm("dbm-030c", PT4, "ca125",  74, "2023-01-24"),
  bm("dbm-030d", PT4, "ca125",  83, "2023-07-11"),
  bm("dbm-030e", PT4, "ca125",  96, "2024-01-30"),
  bm("dbm-030f", PT4, "ca125", 104, "2024-07-22"),
  bm("dbm-030g", PT4, "ca125", 108, "2025-01-15"),
  bm("dbm-030h", PT4, "ca125", 112, "2026-02-01"),  // referral — urgent
  bm("dbm-031a", PT4, "he4",    74, "2022-07-06"),
  bm("dbm-031b", PT4, "he4",    92, "2023-07-11"),
  bm("dbm-031c", PT4, "he4",   110, "2024-07-22"),
  bm("dbm-031d", PT4, "he4",   124, "2026-02-01"),
  // Inflammatory (progressively worsening)
  bm("dbm-032a", PT4, "crp",   4.2, "2022-01-18"),
  bm("dbm-032b", PT4, "crp",   6.8, "2022-07-06"),
  bm("dbm-032c", PT4, "crp",   8.4, "2023-01-24"),
  bm("dbm-032d", PT4, "crp",   9.2, "2023-07-11"),
  bm("dbm-032e", PT4, "crp",  10.8, "2024-01-30"),
  bm("dbm-032f", PT4, "crp",  12.1, "2024-07-22"),
  bm("dbm-032g", PT4, "crp",  13.4, "2025-01-15"),
  bm("dbm-032h", PT4, "crp",  14.0, "2026-02-01"),
  bm("dbm-032i", PT4, "esr",    22, "2022-07-06"),
  bm("dbm-032j", PT4, "esr",    31, "2023-07-11"),
  bm("dbm-032k", PT4, "esr",    38, "2024-07-22"),
  bm("dbm-032l", PT4, "esr",    44, "2026-02-01"),
  // Haematology (critical decline — Hb and ferritin crashing)
  bm("dbm-033a", PT4, "fbc_haemoglobin", 128, "2022-01-18"),
  bm("dbm-033b", PT4, "fbc_haemoglobin", 122, "2022-07-06"),
  bm("dbm-033c", PT4, "fbc_haemoglobin", 116, "2023-01-24"),
  bm("dbm-033d", PT4, "fbc_haemoglobin", 110, "2023-07-11"),
  bm("dbm-033e", PT4, "fbc_haemoglobin", 104, "2024-01-30"),
  bm("dbm-033f", PT4, "fbc_haemoglobin",  98, "2024-07-22"),
  bm("dbm-033g", PT4, "fbc_haemoglobin",  96, "2025-01-15"),
  bm("dbm-033h", PT4, "fbc_haemoglobin",  94, "2026-02-01"),
  bm("dbm-034a", PT4, "ferritin", 28, "2022-01-18"),
  bm("dbm-034b", PT4, "ferritin", 21, "2022-07-06"),
  bm("dbm-034c", PT4, "ferritin", 16, "2023-01-24"),
  bm("dbm-034d", PT4, "ferritin", 13, "2023-07-11"),
  bm("dbm-034e", PT4, "ferritin", 11, "2024-01-30"),
  bm("dbm-034f", PT4, "ferritin",  9, "2025-01-15"),
  bm("dbm-034g", PT4, "ferritin",  8, "2026-02-01"),
  // Hormonal
  bm("dbm-035a", PT4, "amh",    42, "2022-01-18"),
  bm("dbm-035b", PT4, "amh",    38, "2023-01-24"),
  bm("dbm-035c", PT4, "amh",    34, "2024-01-30"),
  bm("dbm-035d", PT4, "amh",    31, "2026-02-01"),
  bm("dbm-035e", PT4, "vitamin_d", 38, "2022-07-06"),
  bm("dbm-035f", PT4, "vitamin_d", 28, "2023-07-11"),
  bm("dbm-035g", PT4, "vitamin_d", 22, "2024-07-22"),
  bm("dbm-035h", PT4, "vitamin_d", 18, "2026-02-01"),
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
