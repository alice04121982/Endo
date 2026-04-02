"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Mic,
  RotateCcw,
  Sparkles,
  Square,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useCdss } from "@/lib/cdss-store";
import type { BleedingHeaviness, CyclePhase } from "@/lib/types/cdss";
import type { VoiceExtractedData } from "@/app/api/voice-parse/route";
import { ConnectedApps } from "./connected-apps";
import { EducationSection } from "./education-section";

// ── Web Speech API hook ──────────────────────────────────────────────────────

type VoiceStatus = "idle" | "recording" | "processing" | "done" | "error" | "unsupported";

function useVoiceInput() {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const interimRef = useRef("");

  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const start = useCallback(() => {
    if (!isSupported) { setStatus("unsupported"); return; }

    const SR = window.SpeechRecognition ?? (window as typeof window & { webkitSpeechRecognition: typeof SpeechRecognition }).webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = "en-GB";
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    let finalText = "";

    rec.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript + " ";
        } else {
          interim = result[0].transcript;
        }
      }
      interimRef.current = interim;
      setTranscript(finalText + interim);
    };

    rec.onerror = (event) => {
      setError(event.error === "not-allowed"
        ? "Microphone access denied. Please allow microphone access and try again."
        : `Recording error: ${event.error}`);
      setStatus("error");
    };

    rec.onend = () => {
      const final = finalText.trim();
      if (final) {
        setTranscript(final);
      }
    };

    recognitionRef.current = rec;
    rec.start();
    setStatus("recording");
    setTranscript("");
    setError(null);
  }, [isSupported]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setStatus("processing");
  }, []);

  return { status, setStatus, transcript, setTranscript, error, start, stop, isSupported };
}

// ── Score slider ─────────────────────────────────────────────────────────────

function ScoreSlider({
  label, value, onChange, low, high, color = "blue",
}: {
  label: string; value: number; onChange: (v: number) => void;
  low: string; high: string; color?: "blue" | "rose" | "amber";
}) {
  const accent = color === "rose" ? "accent-rose-500" : color === "amber" ? "accent-amber-500" : "accent-[var(--color-brand-primary)]";
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-semibold text-[#374151]">{label}</label>
        <span className="text-xl font-display font-bold text-[var(--color-brand-midnight)] w-6 text-right">
          {value}
        </span>
      </div>
      <input type="range" min={0} max={10} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full h-2 bg-[#E8E8E8] rounded-full appearance-none cursor-pointer ${accent}`}
      />
      <div className="flex justify-between mt-1">
        <span className="text-xs text-[var(--color-brand-muted)]">{low}</span>
        <span className="text-xs text-[var(--color-brand-muted)]">{high}</span>
      </div>
    </div>
  );
}

// ── Symptom checkbox ──────────────────────────────────────────────────────────

function SymptomChip({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle}
      className={cn(
        "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors text-left",
        checked
          ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/5 text-[var(--color-brand-primary)]"
          : "border-[#E8E8E8] bg-white text-[#374151] hover:bg-[#F8F9FA]"
      )}
    >
      <span className={cn(
        "h-4 w-4 rounded-sm border-2 flex items-center justify-center shrink-0",
        checked ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]" : "border-[#D1D5DB]"
      )}>
        {checked && (
          <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 12 10" fill="none">
            <path d="M1 5l3.5 4L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {label}
    </button>
  );
}

// ── Default form state ────────────────────────────────────────────────────────

const defaultForm = {
  painScore: 0, fatigueScore: 0, moodScore: 5,
  periodPainScore: 0, hasPeriodPain: false,
  periodDurationHours: 0,
  bleedingHeaviness: null as BleedingHeaviness | null,
  cyclePhase: null as CyclePhase | null,
  pelvicPain: false, bloating: false, nausea: false,
  painfulPeriods: false, painfulIntercourse: false,
  bowelSymptoms: false, bladderSymptoms: false,
  notes: "",
};

const SYMPTOM_FIELDS = [
  { key: "pelvicPain" as const, label: "Pelvic pain" },
  { key: "painfulPeriods" as const, label: "Painful periods" },
  { key: "painfulIntercourse" as const, label: "Pain during sex" },
  { key: "bowelSymptoms" as const, label: "Bowel symptoms" },
  { key: "bladderSymptoms" as const, label: "Bladder symptoms" },
  { key: "bloating" as const, label: "Bloating" },
  { key: "nausea" as const, label: "Nausea" },
];

const BLEEDING_OPTIONS: { value: BleedingHeaviness; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "moderate", label: "Moderate" },
  { value: "heavy", label: "Heavy" },
  { value: "very_heavy", label: "Very heavy" },
];

const DURATION_OPTIONS = [
  { value: 4, label: "A few hours" },
  { value: 12, label: "Half a day" },
  { value: 24, label: "One day" },
  { value: 48, label: "Two days" },
  { value: 72, label: "Three days" },
  { value: 120, label: "All week" },
];

// ── Voice section ─────────────────────────────────────────────────────────────

function moodFromScale(mood: number | null): number {
  if (mood === null) return 5;
  // API returns 1-5; portal uses 0-10
  return Math.round(((mood - 1) / 4) * 10);
}

function applyExtracted(
  extracted: VoiceExtractedData,
  prev: typeof defaultForm
): typeof defaultForm {
  return {
    ...prev,
    painScore: extracted.overall_vas ?? prev.painScore,
    fatigueScore: extracted.fatigue_vas ?? prev.fatigueScore,
    moodScore: extracted.mood_score !== null ? moodFromScale(extracted.mood_score) : prev.moodScore,
    periodPainScore: extracted.period_pain_vas ?? prev.periodPainScore,
    hasPeriodPain: extracted.period_pain_vas !== null ? true : prev.hasPeriodPain,
    periodDurationHours: extracted.period_duration_hours ?? prev.periodDurationHours,
    bleedingHeaviness: extracted.bleeding_heaviness ?? prev.bleedingHeaviness,
    cyclePhase: extracted.cycle_phase ?? prev.cyclePhase,
    pelvicPain: extracted.has_pelvic_pain || prev.pelvicPain,
    bloating: extracted.has_bloating || extracted.gut_bladder_symptoms.includes("bloating_endo_belly") || prev.bloating,
    nausea: extracted.has_nausea || prev.nausea,
    painfulPeriods: extracted.has_pelvic_pain || prev.painfulPeriods,
    painfulIntercourse: extracted.has_painful_intercourse || prev.painfulIntercourse,
    bowelSymptoms: extracted.has_bowel_symptoms ||
      extracted.gut_bladder_symptoms.some(s => ["constipation","diarrhea","painful_bowel","rectal_bleeding","incomplete_evacuation"].includes(s)) ||
      prev.bowelSymptoms,
    bladderSymptoms: extracted.has_bladder_symptoms ||
      extracted.gut_bladder_symptoms.some(s => ["urinary_frequency","urinary_urgency","painful_urination"].includes(s)) ||
      prev.bladderSymptoms,
    notes: extracted.notes ?? prev.notes,
  };
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PatientPortalPage() {
  const { patients, addSymptomLog } = useCdss();
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [form, setForm] = useState({ ...defaultForm });
  const [submitted, setSubmitted] = useState(false);
  const [voiceTranscriptFinal, setVoiceTranscriptFinal] = useState<string | null>(null);
  const [extractError, setExtractError] = useState<string | null>(null);

  const voice = useVoiceInput();

  // After recording stops → call AI
  useEffect(() => {
    if (voice.status !== "processing" || !voice.transcript.trim()) {
      if (voice.status === "processing") voice.setStatus("idle");
      return;
    }

    const transcript = voice.transcript.trim();
    setVoiceTranscriptFinal(transcript);
    setExtractError(null);

    fetch("/api/voice-parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Failed to parse symptoms");
        }
        return res.json() as Promise<VoiceExtractedData>;
      })
      .then((data) => {
        setForm((prev) => applyExtracted(data, prev));
        voice.setStatus("done");
      })
      .catch((err: Error) => {
        setExtractError(err.message);
        voice.setStatus("error");
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.status]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (patients.length > 0 && !selectedPatientId) return;
    const patientId = selectedPatientId || patients[0]?.id;
    if (!patientId) return;

    addSymptomLog(patientId, {
      pain_score: form.painScore,
      fatigue_score: form.fatigueScore,
      mood_score: form.moodScore,
      period_pain_score: form.hasPeriodPain ? form.periodPainScore : null,
      period_duration_hours: form.hasPeriodPain && form.periodDurationHours ? form.periodDurationHours : null,
      bleeding_heaviness: form.bleedingHeaviness,
      cycle_phase: form.cyclePhase,
      symptoms: {
        pelvic_pain: form.pelvicPain,
        bloating: form.bloating,
        nausea: form.nausea,
        painful_periods: form.painfulPeriods,
        painful_intercourse: form.painfulIntercourse,
        bowel_symptoms: form.bowelSymptoms,
        bladder_symptoms: form.bladderSymptoms,
      },
      notes: form.notes,
      transcript: voiceTranscriptFinal,
    });

    setSubmitted(true);
  }

  function reset() {
    setForm({ ...defaultForm });
    setSubmitted(false);
    setVoiceTranscriptFinal(null);
    setExtractError(null);
    voice.setStatus("idle");
    voice.setTranscript("");
  }

  // ── Submitted ──
  if (submitted) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-6 py-12">
        <Card className="bg-white border-[#E8E8E8] max-w-md w-full text-center">
          <CardContent className="py-12 px-8">
            <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="font-display text-xl font-bold text-[var(--color-brand-midnight)] mb-2">Log saved</h2>
            <p className="text-sm text-[var(--color-brand-muted)] mb-6 leading-relaxed">
              Your symptom log has been recorded and will be visible to your clinical team.
            </p>
            <Button onClick={reset}
              className="bg-[var(--color-brand-primary)] text-white hover:bg-[var(--color-brand-primary-hover)] font-semibold w-full">
              Log another entry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isRecording = voice.status === "recording";
  const isProcessing = voice.status === "processing";
  const aiDone = voice.status === "done";

  return (
    <div className="px-5 py-8 max-w-xl mx-auto">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="font-display text-2xl font-bold text-[var(--color-brand-midnight)]">
          How are you feeling today?
        </h1>
        <p className="mt-2 text-sm text-[var(--color-brand-muted)] max-w-sm mx-auto">
          Speak your symptoms or fill in the form below.
        </p>
      </div>

      {/* Patient selector */}
      {patients.length > 1 && (
        <Card className="bg-white border-[#E8E8E8] mb-4">
          <CardContent className="py-4 px-5">
            <label className="text-sm font-semibold text-[#374151] block mb-2">Your name</label>
            <select value={selectedPatientId} onChange={(e) => setSelectedPatientId(e.target.value)} required
              className="w-full h-10 rounded border border-[#E8E8E8] bg-white px-3 text-sm text-[var(--color-brand-midnight)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/30">
              <option value="">Select your name…</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </CardContent>
        </Card>
      )}

      {/* Connected apps */}
      <div className="mb-4">
        <ConnectedApps patientId={selectedPatientId || patients[0]?.id || ""} />
      </div>

      {/* ── Voice section ── */}
      <Card className="bg-white border-[#E8E8E8] mb-4 overflow-hidden">
        <CardContent className="py-6 px-5">
          <div className="flex flex-col items-center gap-4">
            {/* Mic button */}
            <div className="relative">
              {isRecording && (
                <span className="absolute inset-0 rounded-full bg-rose-400 animate-ping opacity-30" />
              )}
              <button
                type="button"
                onClick={isRecording ? voice.stop : voice.start}
                disabled={isProcessing}
                className={cn(
                  "relative h-20 w-20 rounded-full flex items-center justify-center transition-all shadow-md",
                  isRecording
                    ? "bg-rose-500 hover:bg-rose-600 text-white"
                    : isProcessing
                    ? "bg-[#F3F4F6] text-[var(--color-brand-muted)] cursor-not-allowed"
                    : "bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-hover)] text-white"
                )}
              >
                {isRecording
                  ? <Square className="h-7 w-7" />
                  : isProcessing
                  ? <span className="h-5 w-5 rounded-full border-2 border-[var(--color-brand-muted)] border-t-transparent animate-spin" />
                  : <Mic className="h-7 w-7" />
                }
              </button>
            </div>

            {/* Status text */}
            <p className="text-sm font-semibold text-center text-[var(--color-brand-muted)]">
              {isRecording && "Listening… tap to stop"}
              {isProcessing && "Analysing with AI…"}
              {aiDone && (
                <span className="flex items-center justify-center gap-1.5 text-emerald-700">
                  <Sparkles className="h-3.5 w-3.5" /> Symptoms captured — review below
                </span>
              )}
              {voice.status === "idle" && !aiDone && "Tap to speak your symptoms"}
              {voice.status === "unsupported" && "Voice input not supported in this browser (try Chrome)"}
              {voice.status === "error" && (
                <span className="text-rose-600">{voice.error ?? extractError ?? "Something went wrong"}</span>
              )}
            </p>

            {/* Live transcript */}
            {(isRecording || aiDone || voice.status === "error") && voice.transcript && (
              <div className="w-full rounded-lg bg-[var(--color-brand-smoke)] border border-[#E8E8E8] px-4 py-3">
                <p className="text-xs font-semibold text-[var(--color-brand-muted)] mb-1 uppercase tracking-wide">
                  {isRecording ? "Hearing…" : "You said"}
                </p>
                <p className="text-sm text-[var(--color-brand-midnight)] leading-relaxed italic">
                  &ldquo;{voice.transcript}&rdquo;
                </p>
              </div>
            )}

            {/* AI extraction badges */}
            {aiDone && (
              <div className="w-full space-y-2">
                <p className="text-xs font-semibold text-[var(--color-brand-muted)] uppercase tracking-wide">
                  AI extracted
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {form.painScore > 0 && (
                    <Badge variant="secondary" className="bg-rose-50 text-rose-700 border-rose-100 text-xs">
                      Pain {form.painScore}/10
                    </Badge>
                  )}
                  {form.hasPeriodPain && form.periodPainScore > 0 && (
                    <Badge variant="secondary" className="bg-rose-50 text-rose-700 border-rose-100 text-xs">
                      Period pain {form.periodPainScore}/10
                    </Badge>
                  )}
                  {form.bleedingHeaviness && (
                    <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-100 text-xs capitalize">
                      {form.bleedingHeaviness.replace("_", " ")} bleeding
                    </Badge>
                  )}
                  {form.periodDurationHours > 0 && (
                    <Badge variant="secondary" className="bg-blue-50 text-[var(--color-brand-primary)] border-blue-100 text-xs">
                      Pain lasts {form.periodDurationHours}h
                    </Badge>
                  )}
                  {form.fatigueScore > 0 && (
                    <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-100 text-xs">
                      Fatigue {form.fatigueScore}/10
                    </Badge>
                  )}
                  {SYMPTOM_FIELDS.filter(f => form[f.key]).map(f => (
                    <Badge key={f.key} variant="secondary" className="bg-[var(--color-brand-smoke)] text-[var(--color-brand-muted)] border-[#E8E8E8] text-xs">
                      {f.label}
                    </Badge>
                  ))}
                </div>
                <button type="button" onClick={() => { voice.setStatus("idle"); voice.setTranscript(""); }}
                  className="flex items-center gap-1 text-xs text-[var(--color-brand-muted)] hover:text-[var(--color-brand-midnight)] transition-colors mt-1">
                  <RotateCcw className="h-3 w-3" /> Re-record
                </button>
              </div>
            )}

            {/* Privacy note */}
            {!isRecording && voice.status === "idle" && (
              <p className="text-xs text-[var(--color-brand-muted)] text-center leading-relaxed max-w-xs">
                Speech is processed by your browser. Transcripts are sent to AI for symptom extraction only.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* General scores */}
        <Card className="bg-white border-[#E8E8E8]">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base font-bold text-[var(--color-brand-midnight)]">
              How you&rsquo;re feeling
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <ScoreSlider label="Pain level (overall)" value={form.painScore}
              onChange={(v) => setForm(f => ({ ...f, painScore: v }))}
              low="No pain" high="Worst pain" color="rose" />
            <ScoreSlider label="Fatigue" value={form.fatigueScore}
              onChange={(v) => setForm(f => ({ ...f, fatigueScore: v }))}
              low="No fatigue" high="Exhausted" color="amber" />
            <ScoreSlider label="Mood" value={form.moodScore}
              onChange={(v) => setForm(f => ({ ...f, moodScore: v }))}
              low="Very low" high="Great" />
          </CardContent>
        </Card>

        {/* Period-specific questions */}
        <Card className="bg-white border-[#E8E8E8]">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base font-bold text-[var(--color-brand-midnight)]">
              Period symptoms
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Toggle: currently on period */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-[#374151]">
                Are you on your period or experiencing period pain?
              </label>
              <button type="button"
                onClick={() => setForm(f => ({ ...f, hasPeriodPain: !f.hasPeriodPain }))}
                className={cn(
                  "h-6 w-11 rounded-full transition-colors relative shrink-0",
                  form.hasPeriodPain ? "bg-[var(--color-brand-primary)]" : "bg-[#D1D5DB]"
                )}>
                <span className={cn(
                  "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                  form.hasPeriodPain ? "translate-x-5" : "translate-x-0.5"
                )} />
              </button>
            </div>

            {form.hasPeriodPain && (
              <div className="space-y-5 pt-1">
                <ScoreSlider label="Period pain specifically" value={form.periodPainScore}
                  onChange={(v) => setForm(f => ({ ...f, periodPainScore: v }))}
                  low="No pain" high="Worst pain" color="rose" />

                {/* Pain duration */}
                <div>
                  <label className="text-sm font-semibold text-[#374151] block mb-2">
                    How long does the pain go on for?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {DURATION_OPTIONS.map(opt => (
                      <button key={opt.value} type="button"
                        onClick={() => setForm(f => ({ ...f, periodDurationHours: opt.value }))}
                        className={cn(
                          "rounded-lg border px-2 py-2 text-xs font-semibold transition-colors text-center",
                          form.periodDurationHours === opt.value
                            ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/5 text-[var(--color-brand-primary)]"
                            : "border-[#E8E8E8] text-[#374151] hover:bg-[#F8F9FA]"
                        )}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bleeding heaviness */}
                <div>
                  <label className="text-sm font-semibold text-[#374151] block mb-2">
                    How heavy is the bleeding?
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {BLEEDING_OPTIONS.map(opt => (
                      <button key={opt.value} type="button"
                        onClick={() => setForm(f => ({ ...f, bleedingHeaviness: opt.value }))}
                        className={cn(
                          "rounded-lg border px-2 py-2 text-xs font-semibold transition-colors text-center",
                          form.bleedingHeaviness === opt.value
                            ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/5 text-[var(--color-brand-primary)]"
                            : "border-[#E8E8E8] text-[#374151] hover:bg-[#F8F9FA]"
                        )}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Symptom checkboxes */}
        <Card className="bg-white border-[#E8E8E8]">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base font-bold text-[var(--color-brand-midnight)]">
              Symptoms today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2.5">
              {SYMPTOM_FIELDS.map(({ key, label }) => (
                <SymptomChip key={key} label={label} checked={form[key] as boolean}
                  onToggle={() => setForm(f => ({ ...f, [key]: !f[key] }))} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="bg-white border-[#E8E8E8]">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base font-bold text-[var(--color-brand-midnight)]">
              Anything else to note?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Describe how you're feeling, any changes, questions for your doctor…"
              className="min-h-[90px] text-sm border-[#E8E8E8] resize-none" />
          </CardContent>
        </Card>

        <Button type="submit"
          disabled={patients.length > 1 && !selectedPatientId}
          className="w-full bg-[var(--color-brand-primary)] text-white hover:bg-[var(--color-brand-primary-hover)] font-semibold h-11 text-base disabled:opacity-50">
          Save today&rsquo;s log
        </Button>
      </form>

      <p className="mt-6 mb-2 text-xs text-[var(--color-brand-muted)] text-center leading-relaxed">
        Your responses are stored securely and shared only with your clinical team.
      </p>

      {/* Education section */}
      <div className="mt-8">
        <EducationSection />
      </div>
    </div>
  );
}
