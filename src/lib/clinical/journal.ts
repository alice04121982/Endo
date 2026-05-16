import { getSupabaseServer } from "@/lib/supabase/server";
import type { CyclePhase } from "./cycle";

// Patient-side journal data access. Server-only.

export type BleedingHeaviness =
  | "none"
  | "spotting"
  | "light"
  | "moderate"
  | "heavy"
  | "very_heavy";

export type JournalSource = "voice" | "quick_tap";

export interface JournalEntry {
  id: string;
  recordedAt: string;
  entryDate: string;
  cycleDay: number | null;
  cyclePhase: CyclePhase;
  painVas: number | null;
  painLocations: string[];
  bowelSymptoms: string[];
  bladderSymptoms: string[];
  dyspareunia: boolean | null;
  bleedingHeaviness: BleedingHeaviness;
  fatigueVas: number | null;
  moodScore: number | null;
  notes: string | null;
  source: JournalSource;
  transcript: string | null;
  patientPlainSummary: string;
  aiExtracted: boolean;
}

interface DbJournalEntry {
  id: string;
  recorded_at: string;
  entry_date: string;
  cycle_day: number | null;
  cycle_phase: CyclePhase;
  pain_vas: number | null;
  pain_locations: string[];
  bowel_symptoms: string[];
  bladder_symptoms: string[];
  dyspareunia: boolean | null;
  bleeding_heaviness: BleedingHeaviness;
  fatigue_vas: number | null;
  mood_score: number | null;
  notes: string | null;
  source: JournalSource;
  transcript: string | null;
  patient_plain_summary: string;
  ai_extracted: boolean;
}

function fromDb(row: DbJournalEntry): JournalEntry {
  return {
    id: row.id,
    recordedAt: row.recorded_at,
    entryDate: row.entry_date,
    cycleDay: row.cycle_day,
    cyclePhase: row.cycle_phase,
    painVas: row.pain_vas,
    painLocations: row.pain_locations ?? [],
    bowelSymptoms: row.bowel_symptoms ?? [],
    bladderSymptoms: row.bladder_symptoms ?? [],
    dyspareunia: row.dyspareunia,
    bleedingHeaviness: row.bleeding_heaviness,
    fatigueVas: row.fatigue_vas,
    moodScore: row.mood_score,
    notes: row.notes,
    source: row.source,
    transcript: row.transcript,
    patientPlainSummary: row.patient_plain_summary,
    aiExtracted: row.ai_extracted,
  };
}

const SELECT =
  "id, recorded_at, entry_date, cycle_day, cycle_phase, pain_vas, pain_locations, bowel_symptoms, bladder_symptoms, dyspareunia, bleeding_heaviness, fatigue_vas, mood_score, notes, source, transcript, patient_plain_summary, ai_extracted";

export async function listOwnJournalEntries(limit = 30): Promise<JournalEntry[]> {
  const supabase = await getSupabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return [];
  const { data } = await supabase
    .from("journal_entries")
    .select(SELECT)
    .eq("patient_subject_id", user.id)
    .order("entry_date", { ascending: false })
    .order("recorded_at", { ascending: false })
    .limit(limit)
    .returns<DbJournalEntry[]>();
  return (data ?? []).map(fromDb);
}

export async function getTodaysJournalEntry(): Promise<JournalEntry | null> {
  const supabase = await getSupabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return null;
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("journal_entries")
    .select(SELECT)
    .eq("patient_subject_id", user.id)
    .eq("entry_date", today)
    .order("recorded_at", { ascending: false })
    .limit(1)
    .returns<DbJournalEntry[]>();
  return data && data.length > 0 ? fromDb(data[0]) : null;
}

export async function getPatientCycleContext(): Promise<{
  lastMenstrualPeriodStart: string | null;
  averageCycleLengthDays: number | null;
}> {
  const supabase = await getSupabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) {
    return { lastMenstrualPeriodStart: null, averageCycleLengthDays: null };
  }
  const { data } = await supabase
    .from("profiles")
    .select("last_menstrual_period_start, average_cycle_length_days")
    .eq("id", user.id)
    .single<{
      last_menstrual_period_start: string | null;
      average_cycle_length_days: number | null;
    }>();
  return {
    lastMenstrualPeriodStart: data?.last_menstrual_period_start ?? null,
    averageCycleLengthDays: data?.average_cycle_length_days ?? null,
  };
}
