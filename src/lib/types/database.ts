export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/** Pain location zones for the anatomical pain mapper */
export type PainZone =
  | "lower_abdomen_left"
  | "lower_abdomen_right"
  | "upper_abdomen_left"
  | "upper_abdomen_right"
  | "pelvic_left"
  | "pelvic_right"
  | "pelvic_center"
  | "lower_back_left"
  | "lower_back_right"
  | "sacral"
  | "perineal"
  | "bladder"
  | "rectum"
  | "vaginal";

/** Pain quality descriptors mapped to clinical research pathways */
export type PainQuality =
  | "sharp"        // Nerve fiber involvement — C/A-delta fiber activation
  | "dull"         // Visceral referral pattern
  | "burning"      // Neuropathic — central sensitization
  | "cramping"     // Myometrial/smooth muscle — prostaglandin-mediated
  | "throbbing"    // Vascular — VEGF/angiogenesis correlation (Smith pathway)
  | "stabbing"     // Deep infiltrating endometriosis indicator
  | "pressure"     // Mass effect / adhesion-related
  | "radiating";   // Neural pathway involvement

/** Cycle phase or agnostic mode */
export type CyclePhase =
  | "menstrual"
  | "follicular"
  | "ovulatory"
  | "luteal"
  | "cycle_agnostic"; // For GnRH agonist / continuous BC users

/** Bowel/bladder dysfunction types */
export type GutBladderSymptom =
  | "urinary_frequency"
  | "urinary_urgency"
  | "painful_urination"
  | "constipation"
  | "diarrhea"
  | "painful_bowel"
  | "bloating_endo_belly"
  | "incomplete_evacuation"
  | "rectal_bleeding";

/** Research marker categories based on 2024-2026 literature */
export type ResearchCategory =
  | "angiogenesis_vegf"         // Smith foundation — VEGF pathway
  | "cytokine_inflammation"     // IL-6, TNF-alpha, IL-1beta (2025 research)
  | "nerve_density"             // PGP9.5+ nerve fiber studies
  | "p2x3_antagonism"          // Non-hormonal P2X3 receptor targeting
  | "dca_metabolism"            // Dichloroacetate metabolic pathway
  | "central_sensitization"     // Nociplastic pain mechanisms
  | "microbiome_estrobolome"    // Gut-estrogen axis (2024-2025)
  | "epigenetic_methylation";   // DNA methylation patterns

/** Red flag patterns indicating deep infiltrating endometriosis */
export type RedFlagMarker =
  | "persistent_deep_dyspareunia"
  | "dyschezia_cyclical"
  | "ureteral_pain_pattern"
  | "sciatic_endo_pattern"
  | "bowel_nodularity_pattern"
  | "bilateral_pelvic_high_vas";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          display_name: string | null;
          cycle_mode: "regular" | "cycle_agnostic";
          hormone_therapy: string | null;
          diagnosis_stage: "suspected" | "stage_i" | "stage_ii" | "stage_iii" | "stage_iv" | null;
          provider_name: string | null;
          data_encryption_key_hash: string | null;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          cycle_mode?: "regular" | "cycle_agnostic";
          hormone_therapy?: string | null;
          diagnosis_stage?: "suspected" | "stage_i" | "stage_ii" | "stage_iii" | "stage_iv" | null;
          provider_name?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      symptom_entries: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          entry_date: string;
          cycle_day: number | null;
          cycle_phase: CyclePhase;
          overall_vas: number;           // 0-10 Visual Analog Scale
          pain_zones: PainZoneEntry[];
          dyspareunia_vas: number | null;
          gut_bladder_symptoms: GutBladderSymptom[];
          endo_belly_severity: number | null;  // 0-10
          fatigue_vas: number | null;          // 0-10
          mood_score: number | null;           // 1-5
          sleep_quality: number | null;        // 1-5
          notes: string | null;
          lifestyle_triggers: LifestyleTrigger[];
          red_flags_detected: RedFlagMarker[];
          research_correlations: ResearchCorrelation[];
        };
        Insert: Omit<
          Database["public"]["Tables"]["symptom_entries"]["Row"],
          "id" | "created_at" | "red_flags_detected" | "research_correlations"
        >;
        Update: Partial<Database["public"]["Tables"]["symptom_entries"]["Insert"]>;
      };
      research_markers: {
        Row: {
          id: string;
          created_at: string;
          category: ResearchCategory;
          marker_name: string;
          description: string;
          clinical_relevance: string;
          associated_symptoms: string[];
          evidence_level: "meta_analysis" | "rct" | "cohort" | "case_series" | "preclinical";
          year_published: number;
          doi_reference: string | null;
          treatment_implications: string[];
        };
        Insert: Omit<Database["public"]["Tables"]["research_markers"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["research_markers"]["Insert"]>;
      };
      clinical_trials: {
        Row: {
          id: string;
          created_at: string;
          nct_id: string;
          title: string;
          status: "recruiting" | "active" | "completed" | "terminated";
          phase: string;
          intervention_type: string;
          target_pathway: ResearchCategory;
          eligibility_summary: string;
          location_countries: string[];
          start_date: string | null;
          primary_outcome: string;
          is_non_hormonal: boolean;
        };
        Insert: Omit<Database["public"]["Tables"]["clinical_trials"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["clinical_trials"]["Insert"]>;
      };
      burn_log: {
        Row: {
          id: string;
          user_id: string;
          burned_at: string;
          records_destroyed: number;
          date_range_start: string;
          date_range_end: string;
        };
        Insert: Omit<Database["public"]["Tables"]["burn_log"]["Row"], "id" | "burned_at">;
        Update: never;
      };
    };
    Functions: {
      burn_user_data: {
        Args: {
          p_user_id: string;
          p_date_start: string;
          p_date_end: string;
        };
        Returns: number;
      };
    };
  };
}

/** Composite types used in JSONB columns */
export interface PainZoneEntry {
  zone: PainZone;
  intensity: number;    // 0-10 VAS
  quality: PainQuality;
}

export interface LifestyleTrigger {
  category: "diet" | "sleep" | "exercise" | "stress" | "weather" | "medication";
  detail: string;
  severity_impact: number; // -5 to +5 (negative = helpful, positive = worsened)
}

export interface ResearchCorrelation {
  marker_category: ResearchCategory;
  confidence: number;  // 0-1
  explanation: string;
}
