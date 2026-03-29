"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Mic,
  MicOff,
  Loader2,
  CheckCircle2,
  X,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VoiceExtractedData } from "@/app/api/voice-parse/route";

// Re-export for consumers
export type { VoiceExtractedData };

type Status = "idle" | "recording" | "processing" | "review" | "saved" | "error";

const GUT_LABEL: Record<string, string> = {
  urinary_frequency: "Urinary frequency",
  urinary_urgency: "Urinary urgency",
  painful_urination: "Painful urination",
  constipation: "Constipation",
  diarrhea: "Diarrhea",
  painful_bowel: "Painful bowel",
  bloating_endo_belly: "Endo belly",
  incomplete_evacuation: "Incomplete evacuation",
  rectal_bleeding: "Rectal bleeding",
};

const PHASE_LABEL: Record<string, string> = {
  menstrual: "Menstrual",
  follicular: "Follicular",
  ovulatory: "Ovulatory",
  luteal: "Luteal",
  cycle_agnostic: "Cycle agnostic",
};

interface VoiceInputProps {
  /** Called when the user confirms the log. Save this to the entries store. */
  onLog: (data: VoiceExtractedData) => void;
  className?: string;
}

export function VoiceInput({ onLog, className }: VoiceInputProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [extracted, setExtracted] = useState<VoiceExtractedData | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const processTranscript = useCallback(async (transcript: string) => {
    setStatus("processing");
    try {
      const res = await fetch("/api/voice-parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to process");
      setExtracted(data as VoiceExtractedData);
      setStatus("review");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }, []);

  const startRecording = useCallback(() => {
    if (!isSupported) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new SR() as any;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-GB";

    let accumulated = "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) accumulated += result[0].transcript + " ";
        else interim += result[0].transcript;
      }
      setLiveTranscript(accumulated + interim);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed") {
        setErrorMsg("Microphone permission denied. Please allow mic access and try again.");
        setStatus("error");
      }
    };

    recognition.onend = () => {
      const transcript = accumulated.trim();
      if (transcript) {
        setFinalTranscript(transcript);
        processTranscript(transcript);
      } else {
        setStatus("idle");
        setLiveTranscript("");
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setStatus("recording");
    setLiveTranscript("");
  }, [isSupported, processTranscript]);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const reset = useCallback(() => {
    recognitionRef.current?.abort();
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    setStatus("idle");
    setLiveTranscript("");
    setFinalTranscript("");
    setExtracted(null);
    setErrorMsg("");
  }, []);

  const handleLog = useCallback(() => {
    if (!extracted) return;
    onLog(extracted);
    setStatus("saved");
    // Auto-reset after 3 s so the component is ready for next entry
    savedTimerRef.current = setTimeout(reset, 3000);
  }, [extracted, onLog, reset]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  const extractedCount = extracted
    ? Object.entries(extracted).filter(([k, v]) => {
        if (k === "gut_bladder_symptoms") return Array.isArray(v) && v.length > 0;
        return v !== null && v !== undefined;
      }).length
    : 0;

  if (!isSupported) return null;

  return (
    <div className={cn("w-full", className)}>

      {/* ── Idle ── */}
      {status === "idle" && (
        <button
          onClick={startRecording}
          className="w-full rounded-2xl border border-[#D4DCE6] bg-white p-5 flex items-center gap-4 text-left hover:border-[var(--color-brand-orange)]/40 hover:bg-[var(--color-brand-orange)]/5 transition-all group"
        >
          <div className="h-14 w-14 rounded-full bg-[var(--color-brand-smoke)] flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--color-brand-orange)]/10 transition-colors">
            <Mic className="h-5 w-5 text-[var(--color-brand-midnight)]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--color-brand-midnight)]">
              Speak your symptoms
            </p>
            <p className="text-xs text-[var(--color-brand-muted)] mt-0.5 leading-relaxed">
              Tap and describe how you&apos;re feeling — AI logs it for you instantly.
            </p>
          </div>
        </button>
      )}

      {/* ── Recording ── */}
      {status === "recording" && (
        <div className="rounded-2xl border border-[var(--color-brand-orange)]/40 bg-[var(--color-brand-orange)]/5 p-5">
          <div className="flex items-start gap-4">
            <button
              onClick={stopRecording}
              aria-label="Stop recording"
              className="relative h-14 w-14 rounded-full bg-[var(--color-brand-orange)] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[var(--color-brand-orange)]/30"
            >
              <span className="absolute inset-0 rounded-full bg-[var(--color-brand-orange)] animate-ping opacity-30" />
              <MicOff className="h-5 w-5 text-white relative z-10" />
            </button>
            <div className="flex-1 min-w-0 pt-1">
              <p className="text-sm font-bold text-[var(--color-brand-orange)]">
                Listening&hellip; tap to stop
              </p>
              {liveTranscript ? (
                <p className="text-xs text-[var(--color-brand-midnight)] mt-2 italic leading-relaxed line-clamp-3">
                  &ldquo;{liveTranscript}&rdquo;
                </p>
              ) : (
                <p className="text-xs text-[var(--color-brand-muted)] mt-1">
                  Describe your pain, mood, fatigue, any symptoms&hellip;
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Processing ── */}
      {status === "processing" && (
        <div className="rounded-2xl border border-[#D4DCE6] bg-white p-5 flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-[var(--color-brand-smoke)] flex items-center justify-center flex-shrink-0">
            <Loader2 className="h-5 w-5 text-[var(--color-brand-orange)] animate-spin" />
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--color-brand-midnight)]">
              Understanding your symptoms&hellip;
            </p>
            {finalTranscript && (
              <p className="text-xs text-[var(--color-brand-muted)] mt-1 italic line-clamp-2">
                &ldquo;{finalTranscript}&rdquo;
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Review → Log ── */}
      {status === "review" && extracted && (
        <div className="rounded-2xl border border-[var(--color-brand-blue)]/25 bg-white overflow-hidden card-soft">
          <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-[var(--color-brand-lavender)] flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-4 w-4 text-[var(--color-brand-midnight)]" />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--color-brand-midnight)]">
                  Ready to log
                </p>
                <p className="text-xs text-[var(--color-brand-muted)]">
                  {extractedCount} detail{extractedCount !== 1 ? "s" : ""} captured from your voice
                </p>
              </div>
            </div>
            <button
              onClick={reset}
              aria-label="Dismiss"
              className="h-7 w-7 rounded-full flex items-center justify-center text-[var(--color-brand-muted)] hover:bg-[var(--color-brand-smoke)] transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Extracted summary pills */}
          <div className="px-5 pb-4 flex flex-wrap gap-1.5">
            {extracted.overall_vas !== null && (
              <span className="tag-pill bg-[#E8EDF4] text-[var(--color-brand-midnight)]">
                Pain {extracted.overall_vas}/10
              </span>
            )}
            {extracted.fatigue_vas !== null && (
              <span className="tag-pill bg-[#E8EDF4] text-[var(--color-brand-midnight)]">
                Fatigue {extracted.fatigue_vas}/10
              </span>
            )}
            {extracted.endo_belly_severity !== null && (
              <span className="tag-pill bg-[#E8EDF4] text-[var(--color-brand-midnight)]">
                Endo belly {extracted.endo_belly_severity}/10
              </span>
            )}
            {extracted.mood_score !== null && (
              <span className="tag-pill bg-[var(--color-brand-lavender)]/60 text-[var(--color-brand-midnight)]">
                Mood {extracted.mood_score}/5
              </span>
            )}
            {extracted.sleep_quality !== null && (
              <span className="tag-pill bg-[var(--color-brand-lavender)]/60 text-[var(--color-brand-midnight)]">
                Sleep {extracted.sleep_quality}/5
              </span>
            )}
            {extracted.cycle_phase && (
              <span className="tag-pill bg-[var(--color-brand-blue-light)]/40 text-[var(--color-brand-midnight)]">
                {PHASE_LABEL[extracted.cycle_phase]}
              </span>
            )}
            {extracted.gut_bladder_symptoms?.map((s) => (
              <span key={s} className="tag-pill bg-[var(--color-brand-orange-light)]/40 text-[var(--color-brand-midnight)]">
                {GUT_LABEL[s] ?? s}
              </span>
            ))}
            {extracted.notes && (
              <span className="tag-pill bg-[var(--color-brand-smoke)] text-[var(--color-brand-muted)] max-w-[260px] truncate italic">
                &ldquo;{extracted.notes}&rdquo;
              </span>
            )}
          </div>

          <div className="px-5 pb-5 flex gap-2">
            <Button
              onClick={handleLog}
              className="flex-1 bg-[var(--color-brand-orange)] text-white hover:bg-[#E55A2B] rounded-xl h-11 text-sm font-bold"
            >
              <BookOpen className="mr-1.5 h-4 w-4" />
              Log entry
            </Button>
            <Button
              variant="ghost"
              onClick={reset}
              className="rounded-xl h-11 px-4 text-sm text-[var(--color-brand-muted)] hover:text-[var(--color-brand-midnight)] hover:bg-[var(--color-brand-smoke)]"
            >
              Discard
            </Button>
          </div>
        </div>
      )}

      {/* ── Saved confirmation ── */}
      {status === "saved" && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-800">Entry logged!</p>
            <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
              Your symptoms are saved. View them in your Timeline and Insights.
            </p>
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {status === "error" && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5 flex items-start gap-3">
          <MicOff className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-destructive">
              Couldn&apos;t capture symptoms
            </p>
            <p className="text-xs text-[var(--color-brand-muted)] mt-1 leading-relaxed">
              {errorMsg}
            </p>
          </div>
          <button
            onClick={reset}
            aria-label="Dismiss"
            className="h-6 w-6 rounded-full flex items-center justify-center text-[var(--color-brand-muted)] hover:bg-[var(--color-brand-smoke)]"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
