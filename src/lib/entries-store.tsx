"use client";

/**
 * Lightweight client-side entries store backed by localStorage.
 * Merges live voice-logged entries with the static mock dataset.
 * Replaces with Supabase once backend is connected.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { format } from "date-fns";
import { analyzeSymptomProfile, detectRedFlags } from "@/lib/engine/research-mapper";
import { MOCK_ENTRIES, type MockSymptomEntry } from "@/lib/mock/data";
import type { VoiceExtractedData } from "@/components/symptom-logger/voice-input";
import type { CyclePhase, GutBladderSymptom } from "@/lib/types/database";

const STORAGE_KEY = "endo_logged_entries";

interface EntriesContextValue {
  entries: MockSymptomEntry[];
  addVoiceEntry: (data: VoiceExtractedData) => MockSymptomEntry;
  todayEntry: MockSymptomEntry | null;
}

const EntriesContext = createContext<EntriesContextValue | null>(null);

function loadFromStorage(): MockSymptomEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as MockSymptomEntry[]) : [];
  } catch {
    return [];
  }
}

function saveToStorage(entries: MockSymptomEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* storage full — silently ignore */
  }
}

export function EntriesProvider({ children }: { children: ReactNode }) {
  const [localEntries, setLocalEntries] = useState<MockSymptomEntry[]>([]);

  // Hydrate from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    setLocalEntries(loadFromStorage());
  }, []);

  const addVoiceEntry = useCallback((data: VoiceExtractedData): MockSymptomEntry => {
    const today = format(new Date(), "yyyy-MM-dd");
    const profile = {
      painZones: [],
      overallVas: data.overall_vas ?? 0,
      dyspareuniaVas: null,
      gutBladderSymptoms: (data.gut_bladder_symptoms ?? []) as GutBladderSymptom[],
      endoBellySeverity: data.endo_belly_severity ?? null,
      fatigueVas: data.fatigue_vas ?? null,
      cyclePhase: (data.cycle_phase as CyclePhase) ?? "menstrual",
    };

    const entry: MockSymptomEntry = {
      id: `voice-${Date.now()}`,
      entry_date: today,
      cycle_day: null,
      cycle_phase: (data.cycle_phase as CyclePhase) ?? "menstrual",
      overall_vas: data.overall_vas ?? 0,
      pain_zones: [],
      dyspareunia_vas: null,
      gut_bladder_symptoms: (data.gut_bladder_symptoms ?? []) as GutBladderSymptom[],
      endo_belly_severity: data.endo_belly_severity ?? null,
      fatigue_vas: data.fatigue_vas ?? null,
      mood_score: data.mood_score ?? null,
      sleep_quality: data.sleep_quality ?? null,
      notes: data.notes ?? null,
      lifestyle_triggers: [],
      red_flags_detected: detectRedFlags(profile),
      research_correlations: analyzeSymptomProfile(profile),
    };

    setLocalEntries((prev) => {
      // Replace today's entry if it already exists; otherwise prepend
      const without = prev.filter((e) => e.entry_date !== today);
      const updated = [entry, ...without];
      saveToStorage(updated);
      return updated;
    });

    return entry;
  }, []);

  // Merge: local entries (newest first) + mock entries, deduped by date
  // Local entries take priority over mock entries for the same date
  const localDates = new Set(localEntries.map((e) => e.entry_date));
  const filteredMock = MOCK_ENTRIES.filter((e) => !localDates.has(e.entry_date));
  const entries: MockSymptomEntry[] = [...localEntries, ...filteredMock].sort(
    (a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime()
  );

  const today = format(new Date(), "yyyy-MM-dd");
  const todayEntry = entries.find((e) => e.entry_date === today) ?? null;

  return (
    <EntriesContext.Provider value={{ entries, addVoiceEntry, todayEntry }}>
      {children}
    </EntriesContext.Provider>
  );
}

export function useEntries() {
  const ctx = useContext(EntriesContext);
  if (!ctx) throw new Error("useEntries must be used inside EntriesProvider");
  return ctx;
}
