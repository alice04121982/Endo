"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  extractFromTranscript,
  saveJournalEntry,
  type ExtractionPreview,
} from "./actions";

// Web Speech API types are not in TS lib by default; declare narrowly.
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult:
    | ((event: { resultIndex: number; results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void)
    | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

type State =
  | { kind: "idle" }
  | { kind: "unsupported" }
  | { kind: "recording"; transcript: string }
  | { kind: "processing" }
  | { kind: "confirm"; preview: ExtractionPreview }
  | { kind: "error"; reason: string }
  | { kind: "saving" }
  | { kind: "saved" };

export default function NewVoiceEntry() {
  const [state, setState] = useState<State>({ kind: "idle" });
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalTranscriptRef = useRef<string>("");
  const router = useRouter();

  // Detect Web Speech API availability on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      setState({ kind: "unsupported" });
    }
  }, []);

  const startRecording = useCallback(() => {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      setState({ kind: "unsupported" });
      return;
    }
    const rec = new Ctor();
    rec.lang = "en-GB";
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    finalTranscriptRef.current = "";
    setState({ kind: "recording", transcript: "" });

    rec.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) {
          finalTranscriptRef.current += r[0].transcript + " ";
        } else {
          interim += r[0].transcript;
        }
      }
      setState({
        kind: "recording",
        transcript: (finalTranscriptRef.current + interim).trim(),
      });
    };
    rec.onerror = (event) => {
      const msg =
        event.error === "not-allowed"
          ? "Microphone access denied. Allow it in your browser, or use the form below."
          : `Recording error: ${event.error}`;
      setState({ kind: "error", reason: msg });
    };
    rec.onend = () => {
      // Triggered by stop() or natural end. We move to processing in stop().
    };

    recognitionRef.current = rec;
    rec.start();
  }, []);

  const stopAndExtract = useCallback(async () => {
    const rec = recognitionRef.current;
    if (rec) rec.stop();
    recognitionRef.current = null;

    const finalText = finalTranscriptRef.current.trim();
    if (!finalText) {
      setState({ kind: "error", reason: "Nothing was recorded. Try again." });
      return;
    }
    setState({ kind: "processing" });
    const result = await extractFromTranscript(finalText);
    if (!result.ok) {
      setState({ kind: "error", reason: result.error });
      return;
    }
    setState({ kind: "confirm", preview: result });
  }, []);

  const cancel = useCallback(() => {
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    finalTranscriptRef.current = "";
    setState({ kind: "idle" });
  }, []);

  const save = useCallback(async () => {
    if (state.kind !== "confirm") return;
    setState({ kind: "saving" });
    const result = await saveJournalEntry({
      source: "voice",
      patientPlainSummary: state.preview.plainSummary,
      transcript: state.preview.transcript,
      modelId: state.preview.modelId,
      promptTemplateVersion: state.preview.promptTemplateVersion,
      auditEntryId: state.preview.auditEntryId,
      // Structured fields are not yet picked from the extraction; the
      // patient confirms the plain summary and the structured payload
      // remains empty until they fill it via quick-tap. A follow-up
      // chunk maps observations onto the typed fields.
    });
    if (!result.ok) {
      setState({ kind: "error", reason: result.error });
      return;
    }
    setState({ kind: "saved" });
    router.push("/portal/journal");
  }, [state, router]);

  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-10 py-12 lg:py-16">
      <p className="text-sm uppercase tracking-[0.18em] text-[var(--color-brand-stone)] mb-2">
        New entry
      </p>
      <h1
        className="font-display font-extrabold text-[var(--color-brand-aubergine)] tracking-[-0.02em] leading-[1.05] mb-4"
        style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)" }}
      >
        Tell me how you feel
      </h1>
      <p className="text-[var(--color-brand-stone)] mb-8 max-w-xl">
        Speak in your own words. I&apos;ll show you what I heard before I save
        anything.
      </p>

      {state.kind === "unsupported" && (
        <Unsupported />
      )}

      {state.kind === "idle" && (
        <button
          type="button"
          onClick={startRecording}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-[12px] bg-[var(--color-brand-clay)] text-white font-semibold hover:bg-[var(--color-brand-clay-deep)] transition-colors"
        >
          Tap to start speaking
        </button>
      )}

      {state.kind === "recording" && (
        <div className="bg-white border border-[var(--color-brand-clay)] rounded-[14px] p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-brand-clay)] animate-pulse" />
              <span className="text-sm font-semibold text-[var(--color-brand-clay)]">
                Listening…
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={cancel}
                className="px-3 py-1.5 rounded-[8px] border border-[var(--color-brand-sand)] bg-white text-sm font-semibold hover:border-[var(--color-brand-clay)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={stopAndExtract}
                className="px-4 py-1.5 rounded-[8px] bg-[var(--color-brand-clay)] text-white text-sm font-semibold hover:bg-[var(--color-brand-clay-deep)] transition-colors"
              >
                Stop &amp; review
              </button>
            </div>
          </div>
          <p className="text-lg text-[var(--color-brand-aubergine)] leading-relaxed min-h-[3em]">
            {state.transcript || (
              <span className="text-[var(--color-brand-stone)]">Start talking…</span>
            )}
            <span className="inline-block w-2 h-5 align-middle bg-[var(--color-brand-aubergine)] ml-0.5 animate-pulse" />
          </p>
        </div>
      )}

      {state.kind === "processing" && (
        <div className="bg-white border border-[var(--color-brand-sand)] rounded-[14px] p-6">
          <p className="text-sm text-[var(--color-brand-stone)]">
            Working out what you said…
          </p>
        </div>
      )}

      {state.kind === "confirm" && (
        <Confirm
          preview={state.preview}
          onSave={save}
          onCancel={cancel}
        />
      )}

      {state.kind === "saving" && (
        <div className="bg-white border border-[var(--color-brand-sand)] rounded-[14px] p-6">
          <p className="text-sm text-[var(--color-brand-stone)]">Saving…</p>
        </div>
      )}

      {state.kind === "saved" && (
        <div className="bg-white border border-[var(--color-brand-sage)] rounded-[14px] p-6">
          <p className="text-sm text-[var(--color-brand-aubergine)]">
            Saved. Taking you to your journal…
          </p>
        </div>
      )}

      {state.kind === "error" && (
        <div className="bg-white border border-[var(--color-brand-red)] rounded-[14px] p-6">
          <p
            className="text-xs uppercase tracking-[0.14em] text-[var(--color-brand-red)] font-semibold mb-1"
            role="alert"
          >
            Something went wrong
          </p>
          <p className="text-sm text-[var(--color-brand-aubergine)] mb-4">
            {state.reason}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setState({ kind: "idle" })}
              className="px-4 py-2 rounded-[10px] bg-[var(--color-brand-clay)] text-white font-semibold hover:bg-[var(--color-brand-clay-deep)] transition-colors"
            >
              Try again
            </button>
            <Link
              href="/portal/journal/quick"
              className="px-4 py-2 rounded-[10px] border border-[var(--color-brand-sand)] bg-white font-semibold hover:border-[var(--color-brand-clay)] transition-colors"
            >
              Use the form
            </Link>
          </div>
        </div>
      )}

      <p className="text-xs text-[var(--color-brand-stone)] mt-8 max-w-xl">
        Your voice is processed on your device. Endo never receives raw
        audio — only the transcript you confirm.
      </p>
    </div>
  );
}

function Confirm({
  preview,
  onSave,
  onCancel,
}: {
  preview: ExtractionPreview;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="bg-white border border-[var(--color-brand-sand)] rounded-[14px] p-6">
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-brand-stone)] mb-2">
          What you said
        </p>
        <blockquote className="text-sm italic text-[var(--color-brand-aubergine)] border-l-2 border-[var(--color-brand-sand)] pl-3">
          &ldquo;{preview.transcript}&rdquo;
        </blockquote>
      </div>

      <div className="bg-white border border-[var(--color-brand-sand)] rounded-[14px] p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="ai-label">AI summary</span>
          <span className="text-xs text-[var(--color-brand-stone)]">
            Please check this is right before saving
          </span>
        </div>
        <p className="text-base text-[var(--color-brand-aubergine)] leading-relaxed mb-4">
          {preview.plainSummary}
        </p>
        {preview.observations.length > 0 && (
          <>
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-brand-stone)] mb-2">
              What we&apos;ll save
            </p>
            <ul className="text-sm space-y-1 mb-5">
              {preview.observations.map((o, i) => (
                <li key={i}>
                  <span className="font-semibold text-[var(--color-brand-aubergine)]">
                    {humanise(o.kind)}:
                  </span>{" "}
                  <span className="text-[var(--color-brand-stone)]">{o.value}</span>
                </li>
              ))}
            </ul>
          </>
        )}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onSave}
            className="px-4 py-2 rounded-[10px] bg-[var(--color-brand-clay)] text-white font-semibold hover:bg-[var(--color-brand-clay-deep)] transition-colors"
          >
            Save entry
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-[10px] border border-[var(--color-brand-sand)] bg-white font-semibold hover:border-[var(--color-brand-clay)] transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}

function Unsupported() {
  return (
    <div className="bg-white border border-[var(--color-brand-amber)] rounded-[14px] p-6">
      <p
        className="text-xs uppercase tracking-[0.14em] font-semibold mb-1"
        style={{ color: "var(--color-brand-amber)" }}
      >
        Voice not available
      </p>
      <p className="text-sm text-[var(--color-brand-aubergine)] mb-4">
        Your browser doesn&apos;t support voice capture (Web Speech API).
        You can still log this entry by tapping through the form.
      </p>
      <Link
        href="/portal/journal/quick"
        className="inline-flex items-center px-4 py-2 rounded-[10px] bg-[var(--color-brand-clay)] text-white font-semibold hover:bg-[var(--color-brand-clay-deep)] transition-colors"
      >
        Use the form
      </Link>
    </div>
  );
}

function humanise(kind: string): string {
  return kind
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
