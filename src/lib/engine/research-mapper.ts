/**
 * Research-to-Logic Engine
 *
 * Maps user symptoms to specific pathological pathways based on:
 * - Prof. Stephen K. Smith's foundational VEGF/angiogenesis research
 * - 2024-2026 clinical research on nerve density, cytokines, P2X3, DCA
 *
 * This engine processes symptom entries and returns:
 * 1. Research correlations (which pathways are implicated)
 * 2. Red flag markers (indicators for deep infiltrating endometriosis)
 * 3. Treatment pathway suggestions (non-hormonal options)
 */

import type {
  PainZoneEntry,
  PainQuality,
  GutBladderSymptom,
  ResearchCorrelation,
  RedFlagMarker,
  ResearchCategory,
} from "@/lib/types/database";

interface SymptomProfile {
  painZones: PainZoneEntry[];
  overallVas: number;
  dyspareuniaVas: number | null;
  gutBladderSymptoms: GutBladderSymptom[];
  endoBellySeverity: number | null;
  fatigueVas: number | null;
  cyclePhase: string;
}

/** Pain quality → research pathway mapping (Smith + 2024-2026 literature) */
const QUALITY_PATHWAY_MAP: Record<PainQuality, ResearchCategory[]> = {
  throbbing: ["angiogenesis_vegf"],
  sharp: ["nerve_density"],
  stabbing: ["nerve_density"],
  burning: ["central_sensitization"],
  cramping: ["cytokine_inflammation", "p2x3_antagonism"],
  dull: ["cytokine_inflammation"],
  pressure: ["nerve_density", "p2x3_antagonism"],
  radiating: ["central_sensitization", "nerve_density"],
};

/** Gut/bladder symptom → pathway mapping */
const GUT_BLADDER_PATHWAY_MAP: Partial<
  Record<GutBladderSymptom, ResearchCategory[]>
> = {
  bloating_endo_belly: ["microbiome_estrobolome", "cytokine_inflammation"],
  constipation: ["microbiome_estrobolome"],
  diarrhea: ["microbiome_estrobolome"],
  painful_bowel: ["nerve_density", "p2x3_antagonism"],
  urinary_frequency: ["p2x3_antagonism"],
  urinary_urgency: ["p2x3_antagonism"],
  painful_urination: ["nerve_density", "p2x3_antagonism"],
  rectal_bleeding: ["angiogenesis_vegf", "nerve_density"],
  incomplete_evacuation: ["nerve_density"],
};

/**
 * Analyze a symptom profile and return research correlations
 * with confidence scores based on pathway evidence strength
 */
export function analyzeSymptomProfile(
  profile: SymptomProfile
): ResearchCorrelation[] {
  const pathwayScores = new Map<
    ResearchCategory,
    { score: number; reasons: string[] }
  >();

  function addScore(
    category: ResearchCategory,
    weight: number,
    reason: string
  ) {
    const existing = pathwayScores.get(category) || {
      score: 0,
      reasons: [],
    };
    existing.score += weight;
    existing.reasons.push(reason);
    pathwayScores.set(category, existing);
  }

  // 1. Analyze pain zones and qualities
  for (const zone of profile.painZones) {
    const pathways = QUALITY_PATHWAY_MAP[zone.quality] || [];
    const intensityWeight = zone.intensity / 10;

    for (const pathway of pathways) {
      addScore(
        pathway,
        intensityWeight * 0.3,
        `${zone.quality} pain in ${zone.zone.replace(/_/g, " ")} (VAS ${zone.intensity}/10)`
      );
    }

    // High-intensity bilateral pain → VEGF pathway (Smith)
    if (zone.intensity >= 7) {
      addScore(
        "angiogenesis_vegf",
        0.15,
        `High-intensity pain (VAS ${zone.intensity}) suggests active lesion vascularization`
      );
    }
  }

  // 2. Bilateral pelvic pain pattern → angiogenesis
  const leftPelvic = profile.painZones.find(
    (z) => z.zone === "pelvic_left" && z.intensity >= 5
  );
  const rightPelvic = profile.painZones.find(
    (z) => z.zone === "pelvic_right" && z.intensity >= 5
  );
  if (leftPelvic && rightPelvic) {
    addScore(
      "angiogenesis_vegf",
      0.25,
      "Bilateral pelvic involvement suggests widespread vascularized lesions (Smith pathway)"
    );
  }

  // 3. Gut/bladder symptoms
  for (const symptom of profile.gutBladderSymptoms) {
    const pathways = GUT_BLADDER_PATHWAY_MAP[symptom] || [];
    for (const pathway of pathways) {
      addScore(
        pathway,
        0.2,
        `${symptom.replace(/_/g, " ")} implicates ${pathway.replace(/_/g, " ")} pathway`
      );
    }
  }

  // 4. Endo belly → estrobolome
  if (profile.endoBellySeverity && profile.endoBellySeverity >= 5) {
    addScore(
      "microbiome_estrobolome",
      0.3,
      `Significant endo-belly (${profile.endoBellySeverity}/10) suggests estrobolome dysbiosis`
    );
    addScore(
      "cytokine_inflammation",
      0.15,
      "Metabolic bloating correlates with peritoneal inflammatory load"
    );
  }

  // 5. Fatigue → systemic inflammation
  if (profile.fatigueVas && profile.fatigueVas >= 6) {
    addScore(
      "cytokine_inflammation",
      0.3,
      `Significant fatigue (VAS ${profile.fatigueVas}/10) correlates with systemic IL-6/TNF-alpha elevation`
    );
    addScore(
      "central_sensitization",
      0.15,
      "Chronic fatigue may indicate central sensitization mechanisms"
    );
  }

  // 6. Dyspareunia → nerve density
  if (profile.dyspareuniaVas && profile.dyspareuniaVas >= 4) {
    addScore(
      "nerve_density",
      0.3,
      `Dyspareunia (VAS ${profile.dyspareuniaVas}/10) indicates nerve fiber infiltration in cul-de-sac/uterosacral ligaments`
    );
  }

  // 7. Pain persistent through cycle phases → central sensitization
  if (profile.cyclePhase === "cycle_agnostic" && profile.overallVas >= 5) {
    addScore(
      "central_sensitization",
      0.2,
      "Pain persistence despite hormonal suppression suggests central sensitization"
    );
    addScore(
      "epigenetic_methylation",
      0.15,
      "Hormone-resistant pain may indicate epigenetic progesterone receptor silencing"
    );
  }

  // Normalize and return correlations
  const correlations: ResearchCorrelation[] = [];
  for (const [category, data] of pathwayScores) {
    const confidence = Math.min(data.score, 1);
    if (confidence >= 0.1) {
      correlations.push({
        marker_category: category,
        confidence: Math.round(confidence * 100) / 100,
        explanation: data.reasons.join("; "),
      });
    }
  }

  return correlations.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Detect red flag markers indicating deep infiltrating endometriosis (DIE)
 * These patterns should prompt provider consultation and potential laparoscopy
 */
export function detectRedFlags(
  profile: SymptomProfile
): RedFlagMarker[] {
  const flags: RedFlagMarker[] = [];

  // Persistent deep dyspareunia (VAS >= 6)
  if (profile.dyspareuniaVas && profile.dyspareuniaVas >= 6) {
    flags.push("persistent_deep_dyspareunia");
  }

  // Cyclical dyschezia (painful bowel movements)
  if (
    profile.gutBladderSymptoms.includes("painful_bowel") &&
    profile.cyclePhase === "menstrual"
  ) {
    flags.push("dyschezia_cyclical");
  }

  // Ureteral pain pattern (bladder + flank pain)
  const hasUrinaryPain =
    profile.gutBladderSymptoms.includes("painful_urination") ||
    profile.gutBladderSymptoms.includes("urinary_urgency");
  const hasFlankPain = profile.painZones.some(
    (z) =>
      (z.zone === "lower_back_left" || z.zone === "lower_back_right") &&
      z.intensity >= 5
  );
  if (hasUrinaryPain && hasFlankPain) {
    flags.push("ureteral_pain_pattern");
  }

  // Sciatic endometriosis pattern (sacral + radiating pain)
  const hasSacralPain = profile.painZones.some(
    (z) => z.zone === "sacral" && z.intensity >= 5
  );
  const hasRadiating = profile.painZones.some(
    (z) => z.quality === "radiating"
  );
  if (hasSacralPain && hasRadiating) {
    flags.push("sciatic_endo_pattern");
  }

  // Bowel nodularity pattern (rectal pain + incomplete evacuation + painful bowel)
  const bowelTriad = [
    profile.painZones.some((z) => z.zone === "rectum" && z.intensity >= 4),
    profile.gutBladderSymptoms.includes("incomplete_evacuation"),
    profile.gutBladderSymptoms.includes("painful_bowel"),
  ].filter(Boolean).length;
  if (bowelTriad >= 2) {
    flags.push("bowel_nodularity_pattern");
  }

  // Bilateral pelvic high VAS
  const leftPelvicHigh = profile.painZones.find(
    (z) => z.zone === "pelvic_left" && z.intensity >= 7
  );
  const rightPelvicHigh = profile.painZones.find(
    (z) => z.zone === "pelvic_right" && z.intensity >= 7
  );
  if (leftPelvicHigh && rightPelvicHigh) {
    flags.push("bilateral_pelvic_high_vas");
  }

  return flags;
}

/**
 * Get non-hormonal treatment pathways relevant to detected research correlations
 */
export function getNonHormonalPathways(
  correlations: ResearchCorrelation[]
): { pathway: string; treatments: string[]; evidence: string }[] {
  const pathwayTreatments: Record<
    ResearchCategory,
    { treatments: string[]; evidence: string }
  > = {
    angiogenesis_vegf: {
      treatments: [
        "Anti-angiogenic therapy trials",
        "VEGF monitoring as treatment biomarker",
        "Lifestyle: anti-inflammatory diet rich in cruciferous vegetables",
      ],
      evidence: "Meta-analysis level (Smith foundation + 2024 updates)",
    },
    cytokine_inflammation: {
      treatments: [
        "Omega-3 supplementation (EPA/DHA 2-4g/day)",
        "Anti-inflammatory dietary protocol",
        "TNF-alpha inhibitor trials",
        "Low-dose naltrexone (off-label, growing evidence)",
      ],
      evidence: "RCT level (2025 cytokine studies)",
    },
    nerve_density: {
      treatments: [
        "Pelvic floor physical therapy",
        "Neuromodulation (TENS)",
        "Gabapentinoid therapy (adjunct)",
        "Excision surgery evaluation",
      ],
      evidence: "Cohort level (nerve density studies 2024)",
    },
    p2x3_antagonism: {
      treatments: [
        "P2X3 receptor antagonist trials (Phase II recruiting)",
        "Visceral pain-targeted physical therapy",
        "Pelvic nerve blocks",
      ],
      evidence: "RCT level (2025 P2X3 studies)",
    },
    dca_metabolism: {
      treatments: [
        "DCA metabolic therapy trials (Phase I)",
        "Metabolic monitoring protocols",
        "Ketogenic/low-glycemic dietary approaches",
      ],
      evidence: "Preclinical (2025, moving to Phase I)",
    },
    central_sensitization: {
      treatments: [
        "CBT for chronic pain",
        "Mindfulness-based stress reduction",
        "Duloxetine/amitriptyline (low-dose)",
        "Graded motor imagery",
        "Pelvic floor PT",
      ],
      evidence: "Cohort level (2025 nociplastic pain studies)",
    },
    microbiome_estrobolome: {
      treatments: [
        "Targeted probiotics (Lactobacillus spp.)",
        "Calcium-D-glucarate supplementation",
        "High-fiber dietary protocol",
        "Microbiome testing",
      ],
      evidence: "Cohort level (2024 estrobolome studies)",
    },
    epigenetic_methylation: {
      treatments: [
        "Epigenetic modifier trials (HDAC inhibitors, Phase I)",
        "Biomarker-guided therapy selection",
        "Progesterone sensitivity testing",
      ],
      evidence: "RCT level (2026 methylation studies)",
    },
  };

  return correlations
    .filter((c) => c.confidence >= 0.2)
    .map((c) => ({
      pathway: c.marker_category.replace(/_/g, " "),
      ...pathwayTreatments[c.marker_category],
    }));
}
