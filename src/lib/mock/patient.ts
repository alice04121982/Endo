// Synthetic patient — Emma Clarke. All data is fictional and used to
// demonstrate the platform shape. Synthetic-only is a brief constraint.
//
// Today is fixed at 2026-05-07 to make the data deterministic across
// sessions. Cycle days reference Emma's last menstrual period of
// 2026-04-22 (day 1 = first day of menses), so today is cycle day 16.

export const TODAY = "2026-05-07";

export const patient = {
  id: "demo-pt-emma",
  givenName: "Emma",
  familyName: "Clarke",
  age: 28,
  pronouns: "she/her",
  cycleLengthDays: 26,
  lastMenstrualPeriodStart: "2026-04-22",
  diagnosisStatus: "suspected" as const,
  fertilityIntent: "wishes to conceive in the next 2 years",
  // Family history
  familyHistory: {
    motherEndometriosisStage: "stage III, diagnosed aged 32",
    sisterEndometriosis: false,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Journal entries — 14 days, fluctuating with cycle phase
// ─────────────────────────────────────────────────────────────────────────────

export interface JournalEntry {
  id: string;
  date: string; // ISO date
  cycleDay: number;
  cyclePhase: "menstrual" | "follicular" | "ovulatory" | "luteal";
  painVas: number; // 0–10
  painLocations: string[];
  bowelSymptoms: string[];
  bladderSymptoms: string[];
  dyspareunia: boolean;
  bleedingHeaviness: "none" | "spotting" | "light" | "moderate" | "heavy" | "very_heavy";
  fatigueVas: number;
  moodScore: number; // 1–5
  source: "voice" | "quick_tap";
  transcript?: string; // present when voice entry
  patientPlainSummary: string;
  notes?: string;
}

export const journalEntries: JournalEntry[] = [
  // Today (luteal, cycle day 16)
  {
    id: "j-2026-05-07",
    date: "2026-05-07",
    cycleDay: 16,
    cyclePhase: "luteal",
    painVas: 4,
    painLocations: ["lower abdomen", "lower back"],
    bowelSymptoms: ["bloating"],
    bladderSymptoms: [],
    dyspareunia: false,
    bleedingHeaviness: "none",
    fatigueVas: 5,
    moodScore: 3,
    source: "voice",
    transcript:
      "Pain is low today, around a 4. Mostly lower abdomen and a bit of back ache. Some bloating but no bleeding. Tired.",
    patientPlainSummary:
      "Pain around 4 out of 10 in the lower abdomen and lower back. Some bloating. No bleeding. Feeling tired.",
  },
  {
    id: "j-2026-05-06",
    date: "2026-05-06",
    cycleDay: 15,
    cyclePhase: "ovulatory",
    painVas: 5,
    painLocations: ["right pelvis"],
    bowelSymptoms: [],
    bladderSymptoms: [],
    dyspareunia: false,
    bleedingHeaviness: "none",
    fatigueVas: 4,
    moodScore: 3,
    source: "voice",
    transcript:
      "Sharp pain on the right side, like a 5. Comes and goes. No bleeding.",
    patientPlainSummary:
      "Sharp pain on the right side of your pelvis, around 5 out of 10, coming and going.",
  },
  {
    id: "j-2026-05-05",
    date: "2026-05-05",
    cycleDay: 14,
    cyclePhase: "ovulatory",
    painVas: 3,
    painLocations: ["right pelvis"],
    bowelSymptoms: [],
    bladderSymptoms: [],
    dyspareunia: false,
    bleedingHeaviness: "none",
    fatigueVas: 3,
    moodScore: 4,
    source: "quick_tap",
    patientPlainSummary:
      "Mild pain on the right, 3 out of 10. No other symptoms.",
  },
  {
    id: "j-2026-05-04",
    date: "2026-05-04",
    cycleDay: 13,
    cyclePhase: "follicular",
    painVas: 2,
    painLocations: [],
    bowelSymptoms: [],
    bladderSymptoms: [],
    dyspareunia: false,
    bleedingHeaviness: "none",
    fatigueVas: 2,
    moodScore: 4,
    source: "quick_tap",
    patientPlainSummary: "Background ache, 2 out of 10. Otherwise fine.",
  },
  {
    id: "j-2026-05-03",
    date: "2026-05-03",
    cycleDay: 12,
    cyclePhase: "follicular",
    painVas: 2,
    painLocations: [],
    bowelSymptoms: [],
    bladderSymptoms: [],
    dyspareunia: false,
    bleedingHeaviness: "none",
    fatigueVas: 2,
    moodScore: 5,
    source: "quick_tap",
    patientPlainSummary: "Felt good today. Pain only 2.",
  },
  {
    id: "j-2026-05-02",
    date: "2026-05-02",
    cycleDay: 11,
    cyclePhase: "follicular",
    painVas: 3,
    painLocations: ["lower abdomen"],
    bowelSymptoms: [],
    bladderSymptoms: [],
    dyspareunia: true,
    bleedingHeaviness: "none",
    fatigueVas: 3,
    moodScore: 3,
    source: "voice",
    transcript:
      "Mild pain. Sex was painful last night, deep pain. Period gone now.",
    patientPlainSummary:
      "Pain around 3 out of 10. Pain during sex (deep) last night. Period has finished.",
  },
  {
    id: "j-2026-05-01",
    date: "2026-05-01",
    cycleDay: 10,
    cyclePhase: "follicular",
    painVas: 4,
    painLocations: ["lower abdomen"],
    bowelSymptoms: ["urgency"],
    bladderSymptoms: [],
    dyspareunia: false,
    bleedingHeaviness: "spotting",
    fatigueVas: 4,
    moodScore: 3,
    source: "quick_tap",
    patientPlainSummary:
      "Pain 4 out of 10. Light spotting still. Bowel urgency in the morning.",
  },
  // Cycle day 5 — late menstrual phase
  {
    id: "j-2026-04-30",
    date: "2026-04-30",
    cycleDay: 9,
    cyclePhase: "follicular",
    painVas: 5,
    painLocations: ["lower abdomen"],
    bowelSymptoms: [],
    bladderSymptoms: [],
    dyspareunia: false,
    bleedingHeaviness: "light",
    fatigueVas: 5,
    moodScore: 3,
    source: "quick_tap",
    patientPlainSummary: "Pain 5. Light bleeding tailing off.",
  },
  {
    id: "j-2026-04-29",
    date: "2026-04-29",
    cycleDay: 8,
    cyclePhase: "menstrual",
    painVas: 6,
    painLocations: ["lower abdomen", "lower back"],
    bowelSymptoms: ["loose stool"],
    bladderSymptoms: [],
    dyspareunia: false,
    bleedingHeaviness: "moderate",
    fatigueVas: 6,
    moodScore: 2,
    source: "voice",
    transcript:
      "Pain still bad, 6 out of 10. Cramping. Some loose stool. Bleeding moderate.",
    patientPlainSummary:
      "Pain 6 out of 10, cramping in the lower abdomen and back. Loose stool. Moderate bleeding.",
  },
  {
    id: "j-2026-04-28",
    date: "2026-04-28",
    cycleDay: 7,
    cyclePhase: "menstrual",
    painVas: 8,
    painLocations: ["lower abdomen", "lower back", "thighs"],
    bowelSymptoms: ["loose stool", "urgency"],
    bladderSymptoms: ["frequency"],
    dyspareunia: false,
    bleedingHeaviness: "heavy",
    fatigueVas: 8,
    moodScore: 1,
    source: "voice",
    transcript:
      "Pain is back today, around the right side of my pelvis, like an 8 out of 10. Started this morning. Bowel feels crampy too. I've been to the loo more than usual.",
    patientPlainSummary:
      "Pain 8 out of 10 in your right pelvis, started this morning. Cramping bowel symptoms with loose stool and urgency. Going to the loo more than usual. Heavy bleeding.",
    notes: "Took naproxen. Stayed home from work.",
  },
  {
    id: "j-2026-04-27",
    date: "2026-04-27",
    cycleDay: 6,
    cyclePhase: "menstrual",
    painVas: 8,
    painLocations: ["lower abdomen", "lower back"],
    bowelSymptoms: ["loose stool"],
    bladderSymptoms: [],
    dyspareunia: false,
    bleedingHeaviness: "heavy",
    fatigueVas: 7,
    moodScore: 2,
    source: "quick_tap",
    patientPlainSummary:
      "Pain 8. Heavy bleeding. Loose stool. Took ibuprofen, didn't help much.",
  },
  {
    id: "j-2026-04-26",
    date: "2026-04-26",
    cycleDay: 5,
    cyclePhase: "menstrual",
    painVas: 9,
    painLocations: ["lower abdomen", "lower back", "thighs"],
    bowelSymptoms: ["loose stool"],
    bladderSymptoms: [],
    dyspareunia: false,
    bleedingHeaviness: "very_heavy",
    fatigueVas: 8,
    moodScore: 1,
    source: "voice",
    transcript:
      "Pain is awful. Nine out of ten. Worst day of the period. Soaking through pads. Took naproxen and codeine, only mild relief.",
    patientPlainSummary:
      "Pain 9 out of 10 across your lower abdomen, back, and down into your thighs. Very heavy bleeding. Naproxen and codeine giving only mild relief.",
    notes: "Off work. Couldn't get out of bed for most of the day.",
  },
  {
    id: "j-2026-04-25",
    date: "2026-04-25",
    cycleDay: 4,
    cyclePhase: "menstrual",
    painVas: 8,
    painLocations: ["lower abdomen", "lower back"],
    bowelSymptoms: ["loose stool"],
    bladderSymptoms: [],
    dyspareunia: false,
    bleedingHeaviness: "very_heavy",
    fatigueVas: 8,
    moodScore: 1,
    source: "quick_tap",
    patientPlainSummary: "Pain 8. Very heavy bleeding. Off work.",
  },
  {
    id: "j-2026-04-24",
    date: "2026-04-24",
    cycleDay: 3,
    cyclePhase: "menstrual",
    painVas: 7,
    painLocations: ["lower abdomen"],
    bowelSymptoms: [],
    bladderSymptoms: [],
    dyspareunia: false,
    bleedingHeaviness: "heavy",
    fatigueVas: 6,
    moodScore: 2,
    source: "quick_tap",
    patientPlainSummary: "Pain 7. Heavy bleeding. Stayed home.",
  },
];

// PBAC score (Pictorial Blood-loss Assessment Chart) — heuristic from this
// month's bleeding pattern. >100 flags heavy menstrual bleeding for adeno
// consideration. Deliberately above threshold here.
export const pbacThisCycle = 142;

// ─────────────────────────────────────────────────────────────────────────────
// EHP-30 — last six months
// ─────────────────────────────────────────────────────────────────────────────
// Each scale 0–100, higher = worse. Five core scales.
export interface EhpScore {
  monthLabel: string;
  pain: number;
  control: number;
  emotional: number;
  social: number;
  selfImage: number;
}

export const ehpScores: EhpScore[] = [
  { monthLabel: "Dec", pain: 78, control: 72, emotional: 65, social: 58, selfImage: 60 },
  { monthLabel: "Jan", pain: 81, control: 74, emotional: 68, social: 60, selfImage: 62 },
  { monthLabel: "Feb", pain: 76, control: 70, emotional: 64, social: 56, selfImage: 58 },
  { monthLabel: "Mar", pain: 79, control: 73, emotional: 66, social: 60, selfImage: 60 },
  { monthLabel: "Apr", pain: 84, control: 78, emotional: 72, social: 64, selfImage: 65 },
  { monthLabel: "May", pain: 80, control: 75, emotional: 68, social: 60, selfImage: 62 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Documents
// ─────────────────────────────────────────────────────────────────────────────
export interface UploadedDocument {
  id: string;
  filename: string;
  kind: "tvs_report" | "blood_test" | "gp_letter" | "operative_note" | "histology" | "biomarker_report";
  uploadedAt: string;
  performedAt: string;
  source: string;
  extractionStatus: "pending" | "ai_extracted_pending_review" | "clinician_confirmed";
  extractedSummary: string;
}

export const documents: UploadedDocument[] = [
  {
    id: "doc-tvs-jan",
    filename: "TVS_report_2026-01-05.pdf",
    kind: "tvs_report",
    uploadedAt: "2026-01-08",
    performedAt: "2026-01-05",
    source: "Cambridge University Hospitals NHS Foundation Trust",
    extractionStatus: "ai_extracted_pending_review",
    extractedSummary:
      "Transvaginal ultrasound. No obvious endometrioma. Possible adenomyosis features noted: globular uterus, junctional zone irregularity. Endometrial thickness 8 mm, appropriate for cycle phase. No free fluid in the pouch of Douglas.",
  },
  {
    id: "doc-bloods-jan",
    filename: "Bloods_2026-01-05.pdf",
    kind: "blood_test",
    uploadedAt: "2026-01-08",
    performedAt: "2026-01-05",
    source: "GP — Riverside Surgery",
    extractionStatus: "clinician_confirmed",
    extractedSummary:
      "FBC: Hb 11.2 g/dL (low), MCV 82 fL. Ferritin 18 µg/L (low). CRP 4 mg/L (normal). CA-125 42 U/mL (mildly raised, consistent with cyclical change). TSH 1.8 mIU/L (normal).",
  },
  {
    id: "doc-gp-jan",
    filename: "GP_referral_letter_2026-01-08.pdf",
    kind: "gp_letter",
    uploadedAt: "2026-01-08",
    performedAt: "2026-01-08",
    source: "Dr Sarah Johnson, Riverside Surgery",
    extractionStatus: "clinician_confirmed",
    extractedSummary:
      "Referral to gynaecology. Three-year history of severe dysmenorrhoea (VAS 8), chronic pelvic pain, deep dyspareunia, cyclical bowel symptoms. Family history positive (mother stage III endometriosis). Trial of mefenamic acid and combined oral contraceptive partially effective. NICE NG73 referral criteria met.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Treatment trial history
// ─────────────────────────────────────────────────────────────────────────────
export interface Treatment {
  name: string;
  category: "analgesic" | "hormonal" | "surgical" | "other";
  startedAt: string;
  endedAt: string | null; // null = current
  response: "good" | "partial" | "none" | "side_effects_stopped";
  notes: string;
}

export const treatments: Treatment[] = [
  {
    name: "Ibuprofen 400 mg PRN",
    category: "analgesic",
    startedAt: "2023-04-01",
    endedAt: "2024-01-15",
    response: "partial",
    notes: "Mild improvement. Persistent breakthrough pain.",
  },
  {
    name: "Mefenamic acid 500 mg TDS (days 1–5 of cycle)",
    category: "analgesic",
    startedAt: "2024-01-15",
    endedAt: null,
    response: "partial",
    notes: "Some reduction in dysmenorrhoea, takes the edge off.",
  },
  {
    name: "Combined oral contraceptive (Microgynon)",
    category: "hormonal",
    startedAt: "2024-06-01",
    endedAt: null,
    response: "partial",
    notes:
      "Helpful for first few months, returning pain since February 2026. Currently on continuous regimen.",
  },
  {
    name: "Naproxen 500 mg BD",
    category: "analgesic",
    startedAt: "2026-04-01",
    endedAt: null,
    response: "partial",
    notes: "Added for breakthrough pain on heaviest days. Modest help.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Cumulative Symptom Dossier — patient view
// ─────────────────────────────────────────────────────────────────────────────
export const dossierPatientView = {
  generatedAt: "2026-05-07T08:00:00Z",
  body: `\
Your record so far covers three years of period-related pain. Most months,
the pain reaches 8 out of 10 on the worst day, and it tends to spread from
your lower abdomen into your back and the tops of your thighs. You also
report pain during sex (deep pain) most months, and your bowel feels
unsettled around your period — looser, more urgent.

Your most recent ultrasound (5 January 2026) didn't show a clear
endometrioma, but the report mentioned features that can be seen with
adenomyosis (changes in the uterine muscle). That, together with your
heavy periods, is something Endo flags as a clinical consideration worth
discussing with your clinician — alongside the suspicion of endometriosis.

Your iron level was low on the same day, which is consistent with the
heavy bleeding you've been describing.

Treatments so far: ibuprofen and mefenamic acid take the edge off; the
combined pill helped for several months but has felt less effective
since February.

What's not yet in your record: an MRI. NICE guidance recommends
considering an MRI when ultrasound doesn't fully explain the symptoms.
You may want to ask your clinician about this on your next visit.`,
  citations: [
    { sourceId: "j-2026-04-26", label: "Pain 9/10 on day 5 of last period" },
    { sourceId: "doc-tvs-jan", label: "TVS report 5 January 2026" },
    { sourceId: "doc-bloods-jan", label: "Ferritin 18 µg/L" },
    { sourceId: "guideline:NICE_NG73:1.5.3", label: "NICE NG73 §1.5.3 — MRI when TVS inconclusive" },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Cumulative Symptom Dossier — clinician view (denser, NICE/ESHRE language)
// ─────────────────────────────────────────────────────────────────────────────
export const dossierClinicianView = {
  generatedAt: "2026-05-07T08:00:00Z",
  body: `\
28y nulliparous female. 3-year history of cyclical pelvic pain with
dysmenorrhoea VAS 8–9 on heaviest day, deep dyspareunia, cyclical bowel
symptoms (loose stool, urgency, no dyschezia reported), and HMB
(PBAC ≈142 this cycle).

Family history: mother — stage III endometriosis (laparoscopy aged 32).

Imaging: TVS 5/1/2026 — no endometrioma; possible adenomyosis features
(globular uterus, junctional-zone irregularity). MRI not yet performed.

Bloods 5/1/2026: Hb 11.2, ferritin 18, CA-125 42, CRP normal.

Treatment trial:
  – NSAIDs (ibuprofen, mefenamic, naproxen) — partial response
  – COCP (Microgynon, continuous regimen) — initial response, waning
    since Feb 2026
  – Hormonal escalation not yet trialled (e.g. progestin, GnRH-analogue)
  – No surgical history

Clinical considerations: presentation is consistent with suspected
endometriosis with concurrent adenomyosis features; meets NICE NG73
referral criteria. PBAC >100 supports adenomyosis consideration. MRI
recommended (NICE NG73 §1.5.3) given inconclusive TVS and treatment-
refractory pattern.`,
  citations: [
    { sourceId: "j-emma-summary", label: "14-day journal — VAS 8–9 dysmenorrhoea" },
    { sourceId: "doc-tvs-jan", label: "TVS report 5/1/2026" },
    { sourceId: "doc-bloods-jan", label: "Ferritin 18 µg/L; Hb 11.2; CA-125 42" },
    { sourceId: "fh-mother", label: "Family history — mother stage III endometriosis" },
    { sourceId: "guideline:NICE_NG73:1.5.3", label: "NICE NG73 §1.5.3" },
    { sourceId: "guideline:NICE_NG73:1.6.1", label: "NICE NG73 §1.6.1 — referral criteria" },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Rapid Answer Panel — pre-extracted answers to standard endometriosis Hx
// ─────────────────────────────────────────────────────────────────────────────
export interface RapidAnswer {
  question: string;
  answer: string;
  flag?: "adenomyosis_consideration" | "imaging_gap" | "treatment_escalation";
  sources: { id: string; label: string }[];
}

export const rapidAnswers: RapidAnswer[] = [
  {
    question: "Age of pelvic pain onset",
    answer: "Age 14 (menarche +2 years).",
    sources: [{ id: "doc-gp-jan", label: "GP referral letter, 8 Jan 2026" }],
  },
  {
    question: "Cyclicity",
    answer: "Strongly cyclical. Worst on cycle days 4–7. Background ache mid-cycle.",
    sources: [{ id: "j-emma-summary", label: "14-day journal — cyclical pattern" }],
  },
  {
    question: "Severity trend",
    answer: "Worsening over the last 3 months despite continuous COCP.",
    flag: "treatment_escalation",
    sources: [
      { id: "ehp-trend", label: "EHP-30 pain scale 76 → 84 (Feb–Apr)" },
      { id: "tx-cocp", label: "Microgynon — waning response since Feb 2026" },
    ],
  },
  {
    question: "Anatomical pattern",
    answer:
      "Lower abdomen → lower back → upper thighs. Right-sided pain mid-cycle.",
    sources: [{ id: "j-emma-summary", label: "14-day journal — pain locations" }],
  },
  {
    question: "Bowel involvement",
    answer:
      "Cyclical: loose stool and urgency on cycle days 5–8. No dyschezia reported.",
    sources: [{ id: "j-2026-04-28", label: "Day 7 entry — loose stool, urgency" }],
  },
  {
    question: "Bladder involvement",
    answer: "Mild urinary frequency on heaviest bleeding days. No dysuria.",
    sources: [{ id: "j-2026-04-28", label: "Day 7 entry — frequency" }],
  },
  {
    question: "Sexual function",
    answer:
      "Deep dyspareunia, monthly. Most recent: 2 May 2026.",
    sources: [{ id: "j-2026-05-02", label: "2 May 2026 entry — deep dyspareunia" }],
  },
  {
    question: "Heavy menstrual bleeding",
    answer:
      "PBAC ≈142 this cycle. Soaking through pads on days 4–6. Iron-deficient (ferritin 18).",
    flag: "adenomyosis_consideration",
    sources: [
      { id: "j-2026-04-26", label: "Day 5 — very heavy bleeding" },
      { id: "doc-bloods-jan", label: "Ferritin 18 µg/L" },
    ],
  },
  {
    question: "Family history",
    answer:
      "Mother — stage III endometriosis, diagnosed aged 32. No other relevant FH.",
    sources: [{ id: "fh-mother", label: "GP referral — family history" }],
  },
  {
    question: "Treatment trial history",
    answer:
      "NSAIDs partial. COCP (Microgynon, continuous) good initial response, waning since Feb 2026. No progestin / GnRH trialled.",
    sources: [
      { id: "tx-nsaids", label: "Ibuprofen, mefenamic, naproxen" },
      { id: "tx-cocp", label: "Microgynon since June 2024" },
    ],
  },
  {
    question: "Prior imaging",
    answer:
      "TVS 5/1/2026: no endometrioma; possible adenomyosis features. MRI not performed.",
    flag: "imaging_gap",
    sources: [
      { id: "doc-tvs-jan", label: "TVS report 5/1/2026" },
      { id: "guideline:NICE_NG73:1.5.3", label: "NICE NG73 §1.5.3 — MRI" },
    ],
  },
  {
    question: "Prior surgery",
    answer: "None. No prior laparoscopy.",
    sources: [{ id: "doc-gp-jan", label: "GP referral letter" }],
  },
  {
    question: "Fertility status and intent",
    answer: "Nulliparous. Wishes to conceive in the next 2 years.",
    sources: [{ id: "doc-gp-jan", label: "GP referral letter" }],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// NICE NG73 compliance prompts — rule-based, not LLM
// ─────────────────────────────────────────────────────────────────────────────
export interface NicePrompt {
  recommendationId: string;
  recommendationLabel: string;
  status: "satisfied" | "gap" | "partial";
  patientText: string;
  clinicianText: string;
}

export const nicePrompts: NicePrompt[] = [
  {
    recommendationId: "NG73:1.5.2",
    recommendationLabel: "TVS for suspected endometriosis (Nov 2024)",
    status: "satisfied",
    patientText: "You've had a transvaginal ultrasound — that's recommended for everyone with suspected endometriosis.",
    clinicianText: "TVS performed 5/1/2026 — recommendation §1.5.2 satisfied.",
  },
  {
    recommendationId: "NG73:1.5.3",
    recommendationLabel: "MRI when TVS inconclusive",
    status: "gap",
    patientText:
      "Your ultrasound didn't fully explain your symptoms. NICE recommends considering an MRI in this case. You may want to ask your clinician.",
    clinicianText:
      "MRI not performed. TVS inconclusive (possible adenomyosis features). NICE NG73 §1.5.3 — consider pelvic MRI.",
  },
  {
    recommendationId: "NG73:1.4.6",
    recommendationLabel: "Hormonal escalation when first-line ineffective",
    status: "partial",
    patientText:
      "The combined pill has been less effective for you in recent months. There are other hormonal options to discuss with your clinician.",
    clinicianText:
      "First-line COCP response waning. Recommendation §1.4.6 — consider alternative hormonal management (progestin, LNG-IUS, or GnRH-analogue).",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Adenomyosis co-detection
// ─────────────────────────────────────────────────────────────────────────────
import type { AdenomyosisResult } from "@/lib/clinical/adenomyosis";

export const adenomyosisFlag: AdenomyosisResult = {
  rulePackVersion: "adenomyosis@2026-05-08.r1",
  status: "triggered",
  score: 5,
  thresholdScore: 3,
  evaluableMaxScore: 6,
  triggers: [
    {
      id: "pbac_over_100",
      label: "PBAC > 100 (heavy menstrual bleeding)",
      evidence: "PBAC 142 estimated from journal (>100 threshold)",
    },
    {
      id: "jz_irregularity",
      label: "Junctional-zone irregularity on imaging",
      evidence: "TVS report notes junctional-zone irregularity",
    },
    {
      id: "bulky_uterus",
      label: "Bulky / globular uterus on imaging",
      evidence: "TVS report describes globular uterus",
    },
    {
      id: "hormonal_non_response",
      label: "Hormonal therapy non-response",
      evidence: "Treatment-trial record indicates hormonal non-response",
    },
  ],
  awaitingInputs: [
    { id: "prior_pregnancy_losses", label: "Prior pregnancy losses" },
  ],
  patientText: `\
Your record suggests we should also consider adenomyosis alongside endometriosis. Adenomyosis is when the lining of the womb grows into the muscle wall — it can cause heavy, painful periods. It's separate from endometriosis but the two often happen together. This isn't a diagnosis; it's a clinical consideration to discuss with your clinician.`,
  clinicianText: `\
Adenomyosis co-consideration. Score 5/6. Triggers: PBAC 142 (HMB), junctional-zone irregularity and globular uterus on TVS, hormonal-therapy attenuation since cycle 18 of COCP. 2025 systematic review (Vannuccini et al.) reports 17% focal / 15% diffuse prevalence in general gynaecology cohorts, 41–49% in symptomatic populations, with 10× under-diagnosis vs histological confirmation. Suggest pelvic MRI with junctional-zone protocol where not yet performed.`,
};

// ─────────────────────────────────────────────────────────────────────────────
// Red-flag triage — rule-based, no AI rewriting
// ─────────────────────────────────────────────────────────────────────────────
// Emma is not currently in red-flag territory. Rules are evaluated on every
// new entry; here we surface that the engine has scanned and found none.
export const redFlagsCurrent: { triggered: false } = { triggered: false };

// ─────────────────────────────────────────────────────────────────────────────
// Consent tokens (clinician access grants)
// ─────────────────────────────────────────────────────────────────────────────
export interface ConsentToken {
  id: string;
  clinicianHandle: string;
  clinicianRole: string;
  organisation: string;
  grantedAt: string;
  expiresAt: string;
  scope: "read_only" | "read_and_note";
  status: "active" | "expired" | "revoked";
}

export const consentTokens: ConsentToken[] = [
  {
    id: "ct-johnson",
    clinicianHandle: "dr.sarah.johnson@riverside.nhs.uk",
    clinicianRole: "GP",
    organisation: "Riverside Surgery",
    grantedAt: "2026-01-08",
    expiresAt: "2026-07-08",
    scope: "read_and_note",
    status: "active",
  },
  {
    id: "ct-patel",
    clinicianHandle: "ms.r.patel@cuh.nhs.uk",
    clinicianRole: "Specialist Registrar, Gynaecology",
    organisation: "Cambridge University Hospitals NHS Foundation Trust",
    grantedAt: "2026-04-12",
    expiresAt: "2026-05-12",
    scope: "read_only",
    status: "active",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Audit log — last 8 LLM calls, hash-chained
// ─────────────────────────────────────────────────────────────────────────────
export interface AuditRow {
  id: string;
  createdAt: string;
  taskName: string;
  audience: "patient" | "clinician";
  modelId: string;
  outcome: "success" | "refused_diagnostic_conclusion" | "validation_failed";
  rowHashTrunc: string;
  refusalReason?: string;
}

export const auditRows: AuditRow[] = [
  {
    id: "a-008",
    createdAt: "2026-05-07T08:00:14Z",
    taskName: "synth-csd-section",
    audience: "patient",
    modelId: "claude-sonnet-4.6",
    outcome: "success",
    rowHashTrunc: "8f3a…91ce",
  },
  {
    id: "a-007",
    createdAt: "2026-05-07T08:00:11Z",
    taskName: "synth-csd-section",
    audience: "clinician",
    modelId: "claude-sonnet-4.6",
    outcome: "success",
    rowHashTrunc: "2b41…ae07",
  },
  {
    id: "a-006",
    createdAt: "2026-05-07T07:42:02Z",
    taskName: "extract-symptom-from-voice",
    audience: "patient",
    modelId: "claude-haiku-4.5",
    outcome: "success",
    rowHashTrunc: "f9d2…c815",
  },
  {
    id: "a-005",
    createdAt: "2026-05-06T19:15:34Z",
    taskName: "extract-symptom-from-voice",
    audience: "patient",
    modelId: "claude-haiku-4.5",
    outcome: "success",
    rowHashTrunc: "5c08…3a92",
  },
  {
    id: "a-004",
    createdAt: "2026-05-06T16:08:11Z",
    taskName: "clinician-freetext-qa",
    audience: "clinician",
    modelId: "claude-opus-4.6",
    outcome: "success",
    rowHashTrunc: "1e7d…b240",
  },
  {
    id: "a-003",
    createdAt: "2026-05-04T10:55:09Z",
    taskName: "clinician-freetext-qa",
    audience: "clinician",
    modelId: "claude-opus-4.6",
    outcome: "refused_diagnostic_conclusion",
    rowHashTrunc: "a3b6…7f88",
    refusalReason:
      "Clinician asked for confirmation of endometriosis diagnosis. Endo never produces a diagnosis; reframed as clinical consideration.",
  },
  {
    id: "a-002",
    createdAt: "2026-04-29T08:32:21Z",
    taskName: "extract-symptom-from-voice",
    audience: "patient",
    modelId: "claude-haiku-4.5",
    outcome: "success",
    rowHashTrunc: "44e1…2d09",
  },
  {
    id: "a-001",
    createdAt: "2026-04-28T09:01:55Z",
    taskName: "extract-symptom-from-voice",
    audience: "patient",
    modelId: "claude-haiku-4.5",
    outcome: "success",
    rowHashTrunc: "0c20…f57a",
  },
];
