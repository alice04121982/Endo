"use client";

import { toast } from "sonner";
import { SymptomLogger, type SymptomFormData } from "@/components/symptom-logger/symptom-logger";
import { VoiceInput } from "@/components/symptom-logger/voice-input";
import { useEntries } from "@/lib/entries-store";
import type { VoiceExtractedData } from "@/components/symptom-logger/voice-input";

export default function LogPage() {
  const { addVoiceEntry, addFormEntry } = useEntries();

  function handleVoiceLog(data: VoiceExtractedData) {
    const entry = addVoiceEntry(data);
    const painLabel = entry.overall_vas > 0 ? `Pain ${entry.overall_vas}/10` : null;
    const fatigueLabel = entry.fatigue_vas ? `Fatigue ${entry.fatigue_vas}/10` : null;
    const parts = [painLabel, fatigueLabel].filter(Boolean).join(" · ");
    toast.success("Entry logged", {
      description: parts || "Symptoms saved to your dashboard",
      duration: 4000,
    });
  }

  async function handleFormSave(data: SymptomFormData) {
    const entry = addFormEntry(data);
    const painLabel = entry.overall_vas > 0 ? `Pain ${entry.overall_vas}/10` : null;
    const fatigueLabel = entry.fatigue_vas ? `Fatigue ${entry.fatigue_vas}/10` : null;
    const parts = [painLabel, fatigueLabel].filter(Boolean).join(" · ");
    toast.success("Entry saved", {
      description: parts || "Your symptoms have been recorded",
      duration: 4000,
    });
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <VoiceInput onLog={handleVoiceLog} />
      <SymptomLogger cycleMode="regular" onSave={handleFormSave} />
    </div>
  );
}
