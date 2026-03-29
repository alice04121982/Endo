import type {
  PainZoneEntry,
  CyclePhase,
  GutBladderSymptom,
  LifestyleTrigger,
  ResearchCorrelation,
  RedFlagMarker,
} from "@/lib/types/database";
import { analyzeSymptomProfile, detectRedFlags } from "@/lib/engine/research-mapper";

export interface MockSymptomEntry {
  id: string;
  entry_date: string;
  cycle_day: number | null;
  cycle_phase: CyclePhase;
  overall_vas: number;
  pain_zones: PainZoneEntry[];
  dyspareunia_vas: number | null;
  gut_bladder_symptoms: GutBladderSymptom[];
  endo_belly_severity: number | null;
  fatigue_vas: number | null;
  mood_score: number | null;
  sleep_quality: number | null;
  notes: string | null;
  lifestyle_triggers: LifestyleTrigger[];
  red_flags_detected: RedFlagMarker[];
  research_correlations: ResearchCorrelation[];
}

function makeEntry(
  daysAgo: number,
  overrides: Partial<Omit<MockSymptomEntry, "id" | "entry_date" | "red_flags_detected" | "research_correlations">>
): MockSymptomEntry {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const entry_date = date.toISOString().split("T")[0];

  const base = {
    cycle_day: overrides.cycle_day ?? null,
    cycle_phase: overrides.cycle_phase ?? "luteal" as CyclePhase,
    overall_vas: overrides.overall_vas ?? 3,
    pain_zones: overrides.pain_zones ?? [],
    dyspareunia_vas: overrides.dyspareunia_vas ?? null,
    gut_bladder_symptoms: overrides.gut_bladder_symptoms ?? [],
    endo_belly_severity: overrides.endo_belly_severity ?? null,
    fatigue_vas: overrides.fatigue_vas ?? null,
    mood_score: overrides.mood_score ?? 3,
    sleep_quality: overrides.sleep_quality ?? 3,
    notes: overrides.notes ?? null,
    lifestyle_triggers: overrides.lifestyle_triggers ?? [],
  };

  const profile = {
    painZones: base.pain_zones,
    overallVas: base.overall_vas,
    dyspareuniaVas: base.dyspareunia_vas,
    gutBladderSymptoms: base.gut_bladder_symptoms,
    endoBellySeverity: base.endo_belly_severity,
    fatigueVas: base.fatigue_vas,
    cyclePhase: base.cycle_phase,
  };

  return {
    id: `mock-${daysAgo}`,
    entry_date,
    ...base,
    red_flags_detected: detectRedFlags(profile),
    research_correlations: analyzeSymptomProfile(profile),
  };
}

/** 30 days of realistic symptom data showing cyclical patterns */
export const MOCK_ENTRIES: MockSymptomEntry[] = [
  // Menstrual phase (days 1-5) — typically worst symptoms
  makeEntry(28, {
    cycle_day: 1, cycle_phase: "menstrual", overall_vas: 8,
    pain_zones: [
      { zone: "pelvic_center", intensity: 8, quality: "cramping" },
      { zone: "lower_abdomen_left", intensity: 7, quality: "throbbing" },
      { zone: "sacral", intensity: 6, quality: "dull" },
    ],
    gut_bladder_symptoms: ["bloating_endo_belly", "diarrhea"],
    endo_belly_severity: 7, fatigue_vas: 8, mood_score: 2, sleep_quality: 2,
    lifestyle_triggers: [{ category: "diet", detail: "Gluten-heavy meal", severity_impact: 3 }],
    notes: "Worst day this cycle. Had to call in sick.",
  }),
  makeEntry(27, {
    cycle_day: 2, cycle_phase: "menstrual", overall_vas: 7,
    pain_zones: [
      { zone: "pelvic_center", intensity: 7, quality: "cramping" },
      { zone: "pelvic_left", intensity: 6, quality: "stabbing" },
      { zone: "lower_back_left", intensity: 5, quality: "dull" },
    ],
    gut_bladder_symptoms: ["bloating_endo_belly", "painful_bowel"],
    endo_belly_severity: 6, fatigue_vas: 7, mood_score: 2, sleep_quality: 2,
  }),
  makeEntry(26, {
    cycle_day: 3, cycle_phase: "menstrual", overall_vas: 6,
    pain_zones: [
      { zone: "pelvic_center", intensity: 6, quality: "cramping" },
      { zone: "pelvic_right", intensity: 4, quality: "dull" },
    ],
    gut_bladder_symptoms: ["bloating_endo_belly"],
    endo_belly_severity: 5, fatigue_vas: 6, mood_score: 3, sleep_quality: 3,
  }),
  makeEntry(25, {
    cycle_day: 4, cycle_phase: "menstrual", overall_vas: 5,
    pain_zones: [{ zone: "pelvic_center", intensity: 5, quality: "dull" }],
    endo_belly_severity: 4, fatigue_vas: 5, mood_score: 3, sleep_quality: 3,
  }),
  makeEntry(24, {
    cycle_day: 5, cycle_phase: "menstrual", overall_vas: 4,
    pain_zones: [{ zone: "lower_abdomen_left", intensity: 3, quality: "dull" }],
    fatigue_vas: 4, mood_score: 3, sleep_quality: 3,
  }),
  // Follicular phase (days 6-13) — improving
  makeEntry(23, { cycle_day: 6, cycle_phase: "follicular", overall_vas: 3, fatigue_vas: 3, mood_score: 4, sleep_quality: 4 }),
  makeEntry(22, { cycle_day: 7, cycle_phase: "follicular", overall_vas: 2, fatigue_vas: 2, mood_score: 4, sleep_quality: 4 }),
  makeEntry(21, {
    cycle_day: 8, cycle_phase: "follicular", overall_vas: 2,
    fatigue_vas: 2, mood_score: 4, sleep_quality: 5,
    lifestyle_triggers: [{ category: "exercise", detail: "Yoga class", severity_impact: -2 }],
  }),
  makeEntry(20, { cycle_day: 9, cycle_phase: "follicular", overall_vas: 1, fatigue_vas: 1, mood_score: 5, sleep_quality: 5 }),
  makeEntry(19, { cycle_day: 10, cycle_phase: "follicular", overall_vas: 1, fatigue_vas: 1, mood_score: 5, sleep_quality: 5 }),
  makeEntry(18, { cycle_day: 11, cycle_phase: "follicular", overall_vas: 2, fatigue_vas: 2, mood_score: 4, sleep_quality: 4 }),
  makeEntry(17, { cycle_day: 12, cycle_phase: "follicular", overall_vas: 2, fatigue_vas: 2, mood_score: 4, sleep_quality: 4 }),
  makeEntry(16, { cycle_day: 13, cycle_phase: "follicular", overall_vas: 2, fatigue_vas: 3, mood_score: 4, sleep_quality: 4 }),
  // Ovulatory (days 14-16) — mild flare common
  makeEntry(15, {
    cycle_day: 14, cycle_phase: "ovulatory", overall_vas: 4,
    pain_zones: [{ zone: "pelvic_left", intensity: 4, quality: "sharp" }],
    fatigue_vas: 3, mood_score: 3, sleep_quality: 4,
    notes: "Mittelschmerz — sharp left-sided ovulation pain",
  }),
  makeEntry(14, {
    cycle_day: 15, cycle_phase: "ovulatory", overall_vas: 3,
    pain_zones: [{ zone: "pelvic_left", intensity: 3, quality: "dull" }],
    fatigue_vas: 3, mood_score: 4, sleep_quality: 4,
  }),
  makeEntry(13, { cycle_day: 16, cycle_phase: "ovulatory", overall_vas: 2, fatigue_vas: 2, mood_score: 4, sleep_quality: 4 }),
  // Luteal phase (days 17-28) — gradual build
  makeEntry(12, { cycle_day: 17, cycle_phase: "luteal", overall_vas: 2, fatigue_vas: 3, mood_score: 4, sleep_quality: 4 }),
  makeEntry(11, { cycle_day: 18, cycle_phase: "luteal", overall_vas: 3, fatigue_vas: 3, mood_score: 3, sleep_quality: 3 }),
  makeEntry(10, {
    cycle_day: 19, cycle_phase: "luteal", overall_vas: 3,
    gut_bladder_symptoms: ["constipation"],
    fatigue_vas: 4, mood_score: 3, sleep_quality: 3,
    lifestyle_triggers: [{ category: "stress", detail: "Work deadline", severity_impact: 2 }],
  }),
  makeEntry(9, {
    cycle_day: 20, cycle_phase: "luteal", overall_vas: 4,
    pain_zones: [{ zone: "lower_abdomen_left", intensity: 4, quality: "dull" }],
    gut_bladder_symptoms: ["constipation", "bloating_endo_belly"],
    endo_belly_severity: 4, fatigue_vas: 5, mood_score: 3, sleep_quality: 3,
  }),
  makeEntry(8, {
    cycle_day: 21, cycle_phase: "luteal", overall_vas: 4,
    pain_zones: [
      { zone: "lower_abdomen_left", intensity: 4, quality: "dull" },
      { zone: "pelvic_center", intensity: 3, quality: "pressure" },
    ],
    gut_bladder_symptoms: ["bloating_endo_belly"],
    endo_belly_severity: 5, fatigue_vas: 5, mood_score: 2, sleep_quality: 3,
  }),
  makeEntry(7, {
    cycle_day: 22, cycle_phase: "luteal", overall_vas: 5,
    pain_zones: [
      { zone: "pelvic_center", intensity: 5, quality: "cramping" },
      { zone: "lower_back_right", intensity: 3, quality: "dull" },
    ],
    gut_bladder_symptoms: ["bloating_endo_belly", "constipation"],
    endo_belly_severity: 6, fatigue_vas: 6, mood_score: 2, sleep_quality: 2,
    lifestyle_triggers: [
      { category: "diet", detail: "Dairy products", severity_impact: 2 },
      { category: "sleep", detail: "Only 5 hours", severity_impact: 3 },
    ],
  }),
  makeEntry(6, {
    cycle_day: 23, cycle_phase: "luteal", overall_vas: 5,
    pain_zones: [{ zone: "pelvic_center", intensity: 5, quality: "cramping" }],
    endo_belly_severity: 5, fatigue_vas: 6, mood_score: 2, sleep_quality: 2,
  }),
  makeEntry(5, {
    cycle_day: 24, cycle_phase: "luteal", overall_vas: 6,
    pain_zones: [
      { zone: "pelvic_center", intensity: 6, quality: "cramping" },
      { zone: "pelvic_left", intensity: 5, quality: "throbbing" },
    ],
    dyspareunia_vas: 5,
    gut_bladder_symptoms: ["bloating_endo_belly", "urinary_frequency"],
    endo_belly_severity: 6, fatigue_vas: 7, mood_score: 2, sleep_quality: 2,
  }),
  makeEntry(4, {
    cycle_day: 25, cycle_phase: "luteal", overall_vas: 6,
    pain_zones: [
      { zone: "pelvic_center", intensity: 6, quality: "cramping" },
      { zone: "lower_abdomen_left", intensity: 5, quality: "throbbing" },
      { zone: "sacral", intensity: 4, quality: "radiating" },
    ],
    dyspareunia_vas: 6,
    gut_bladder_symptoms: ["bloating_endo_belly", "painful_bowel"],
    endo_belly_severity: 7, fatigue_vas: 7, mood_score: 1, sleep_quality: 2,
    lifestyle_triggers: [{ category: "stress", detail: "Argument with partner about pain", severity_impact: 4 }],
    notes: "Sacral pain radiating down left leg — new pattern?",
  }),
  makeEntry(3, {
    cycle_day: 26, cycle_phase: "luteal", overall_vas: 7,
    pain_zones: [
      { zone: "pelvic_center", intensity: 7, quality: "cramping" },
      { zone: "pelvic_left", intensity: 7, quality: "throbbing" },
      { zone: "sacral", intensity: 5, quality: "radiating" },
    ],
    gut_bladder_symptoms: ["bloating_endo_belly", "painful_bowel", "diarrhea"],
    endo_belly_severity: 8, fatigue_vas: 8, mood_score: 1, sleep_quality: 1,
  }),
  makeEntry(2, {
    cycle_day: 27, cycle_phase: "luteal", overall_vas: 7,
    pain_zones: [
      { zone: "pelvic_center", intensity: 7, quality: "cramping" },
      { zone: "pelvic_left", intensity: 6, quality: "stabbing" },
      { zone: "lower_back_left", intensity: 5, quality: "dull" },
    ],
    gut_bladder_symptoms: ["bloating_endo_belly", "diarrhea"],
    endo_belly_severity: 7, fatigue_vas: 8, mood_score: 1, sleep_quality: 1,
    notes: "Period should start tomorrow. Dreading it.",
  }),
  makeEntry(1, {
    cycle_day: 28, cycle_phase: "luteal", overall_vas: 8,
    pain_zones: [
      { zone: "pelvic_center", intensity: 8, quality: "cramping" },
      { zone: "pelvic_left", intensity: 7, quality: "throbbing" },
      { zone: "pelvic_right", intensity: 6, quality: "throbbing" },
      { zone: "sacral", intensity: 5, quality: "radiating" },
    ],
    dyspareunia_vas: 7,
    gut_bladder_symptoms: ["bloating_endo_belly", "painful_bowel", "diarrhea", "urinary_urgency"],
    endo_belly_severity: 9, fatigue_vas: 9, mood_score: 1, sleep_quality: 1,
  }),
  makeEntry(0, {
    cycle_day: 1, cycle_phase: "menstrual", overall_vas: 9,
    pain_zones: [
      { zone: "pelvic_center", intensity: 9, quality: "cramping" },
      { zone: "pelvic_left", intensity: 8, quality: "stabbing" },
      { zone: "pelvic_right", intensity: 7, quality: "throbbing" },
      { zone: "sacral", intensity: 6, quality: "radiating" },
      { zone: "lower_back_left", intensity: 5, quality: "dull" },
    ],
    dyspareunia_vas: 8,
    gut_bladder_symptoms: ["bloating_endo_belly", "painful_bowel", "diarrhea", "urinary_urgency", "rectal_bleeding"],
    endo_belly_severity: 9, fatigue_vas: 9, mood_score: 1, sleep_quality: 1,
    notes: "Day 1. Worst pain in months. Considering going to ER.",
  }),
];

/** Summary stats computed from mock data */
export function getMockStats() {
  const last7 = MOCK_ENTRIES.filter((_, i) => i >= MOCK_ENTRIES.length - 7);
  const avgVas = Math.round(
    (last7.reduce((sum, e) => sum + e.overall_vas, 0) / last7.length) * 10
  ) / 10;
  const totalRedFlags = new Set(
    MOCK_ENTRIES.flatMap((e) => e.red_flags_detected)
  ).size;

  return {
    totalEntries: MOCK_ENTRIES.length,
    avgVas7d: avgVas,
    redFlagCount: totalRedFlags,
    pathwayCount: 8,
  };
}

/** Mock clinical trials */
export const MOCK_TRIALS = [
  {
    nct_id: "NCT05734210",
    title: "P2X3 Receptor Antagonist for Endometriosis-Associated Pelvic Pain",
    status: "recruiting" as const,
    phase: "Phase II",
    intervention_type: "P2X3 selective antagonist (oral)",
    target_pathway: "p2x3_antagonism" as const,
    eligibility_summary: "Women 18-45 with surgically confirmed endometriosis, VAS >= 4, non-hormonal washout 3 months",
    location_countries: ["United States", "United Kingdom", "Germany"],
    primary_outcome: "Change in NRS pelvic pain score at 12 weeks",
    is_non_hormonal: true,
  },
  {
    nct_id: "NCT06128934",
    title: "Dichloroacetate (DCA) Metabolic Therapy in Treatment-Refractory Endometriosis",
    status: "recruiting" as const,
    phase: "Phase I",
    intervention_type: "Dichloroacetate oral therapy",
    target_pathway: "dca_metabolism" as const,
    eligibility_summary: "Women 21-50 with hormone-therapy-resistant endometriosis, confirmed by imaging or surgery",
    location_countries: ["United States", "Canada"],
    primary_outcome: "Safety profile + lesion volume change at 24 weeks",
    is_non_hormonal: true,
  },
  {
    nct_id: "NCT05891456",
    title: "Anti-VEGF Antibody Fragment for Peritoneal Endometriosis",
    status: "active" as const,
    phase: "Phase I/II",
    intervention_type: "Anti-VEGF antibody fragment (IP injection)",
    target_pathway: "angiogenesis_vegf" as const,
    eligibility_summary: "Women 18-42 with peritoneal endometriosis confirmed by laparoscopy within 12 months",
    location_countries: ["United Kingdom", "Australia"],
    primary_outcome: "Lesion regression at 16 weeks by MRI",
    is_non_hormonal: true,
  },
  {
    nct_id: "NCT06234567",
    title: "Low-Dose Naltrexone for Endometriosis Pain and Fatigue",
    status: "recruiting" as const,
    phase: "Phase II",
    intervention_type: "Low-dose naltrexone (4.5mg oral, nightly)",
    target_pathway: "cytokine_inflammation" as const,
    eligibility_summary: "Women 18-55 with endometriosis diagnosis, chronic pelvic pain >= 6 months",
    location_countries: ["United States", "Netherlands", "Sweden"],
    primary_outcome: "Patient-reported pain and fatigue scores at 12 weeks",
    is_non_hormonal: true,
  },
  {
    nct_id: "NCT06345678",
    title: "Targeted Probiotic Therapy for Estrobolome Modulation in Endometriosis",
    status: "recruiting" as const,
    phase: "Phase II",
    intervention_type: "Multi-strain Lactobacillus probiotic",
    target_pathway: "microbiome_estrobolome" as const,
    eligibility_summary: "Women 18-45 with endometriosis, elevated urinary estrogen metabolites",
    location_countries: ["Italy", "Spain", "United States"],
    primary_outcome: "Urinary estrogen metabolite ratio change at 16 weeks",
    is_non_hormonal: true,
  },
];
