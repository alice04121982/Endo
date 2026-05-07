"use client";

import Link from "next/link";
import { useState } from "react";

// Demo: voice entry walkthrough. The mock simulates the four states the
// real flow will move through:
//   1. Idle (Tap to start)
//   2. Recording (live transcript)
//   3. Processing (gateway extraction)
//   4. Confirm (plain-English readback for patient sign-off)

const DEMO_TRANSCRIPT =
  "Pain is back today, around the right side of my pelvis, like a 7 out of 10. " +
  "Started this morning. I'm on day 2 of my period. Bowel feels crampy too.";

const DEMO_EXTRACTION = {
  plainSummary:
    "Pain 7 out of 10 in your right pelvis, started this morning. Cramping bowel symptoms. You're on day 2 of your period.",
  observations: [
    { kind: "Pain severity", value: "7/10" },
    { kind: "Pain location", value: "Right pelvis" },
    { kind: "Onset", value: "This morning" },
    { kind: "Bowel", value: "Cramping" },
    { kind: "Cycle day", value: "2 (period)" },
  ],
};

type State = "idle" | "recording" | "processing" | "confirm";

export default function NewVoiceEntry() {
  const [state, setState] = useState<State>("idle");
  const [transcript, setTranscript] = useState("");

  function start() {
    setState("recording");
    setTranscript("");
    let i = 0;
    const id = setInterval(() => {
      i += 4;
      setTranscript(DEMO_TRANSCRIPT.slice(0, i));
      if (i >= DEMO_TRANSCRIPT.length) {
        clearInterval(id);
        setState("processing");
        setTimeout(() => setState("confirm"), 900);
      }
    }, 60);
  }

  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-10 py-12 lg:py-16">
      <p className="text-sm uppercase tracking-[0.18em] text-[var(--color-brand-stone)] mb-2">
        New entry
      </p>
      <h1 className="font-display font-extrabold text-[var(--color-brand-aubergine)] tracking-[-0.02em] leading-[1.05] mb-4" style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)" }}>
        Tell me how you feel
      </h1>
      <p className="text-[var(--color-brand-stone)] mb-8 max-w-xl">
        Speak in your own words. I&apos;ll show you what I heard before I save
        anything.
      </p>

      {state === "idle" && (
        <button
          type="button"
          onClick={start}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-[12px] bg-[var(--color-brand-clay)] text-white font-semibold hover:bg-[var(--color-brand-clay-deep)] transition-colors"
        >
          Tap to start speaking
        </button>
      )}

      {state === "recording" && (
        <div className="bg-white border border-[var(--color-brand-clay)] rounded-[14px] p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-brand-clay)] animate-pulse" />
            <span className="text-sm font-semibold text-[var(--color-brand-clay)]">
              Listening…
            </span>
          </div>
          <p className="text-lg text-[var(--color-brand-aubergine)] leading-relaxed">
            {transcript}
            <span className="inline-block w-2 h-5 align-middle bg-[var(--color-brand-aubergine)] ml-0.5 animate-pulse" />
          </p>
        </div>
      )}

      {state === "processing" && (
        <div className="bg-white border border-[var(--color-brand-sand)] rounded-[14px] p-6">
          <p className="text-sm text-[var(--color-brand-stone)]">
            Working out what you said…
          </p>
        </div>
      )}

      {state === "confirm" && (
        <div className="space-y-4">
          <div className="bg-white border border-[var(--color-brand-sand)] rounded-[14px] p-6">
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-brand-stone)] mb-2">
              What you said
            </p>
            <blockquote className="text-sm italic text-[var(--color-brand-aubergine)] border-l-2 border-[var(--color-brand-sand)] pl-3">
              &ldquo;{DEMO_TRANSCRIPT}&rdquo;
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
              {DEMO_EXTRACTION.plainSummary}
            </p>
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-brand-stone)] mb-2">
              What we&apos;ll save
            </p>
            <ul className="text-sm space-y-1 mb-5">
              {DEMO_EXTRACTION.observations.map((o) => (
                <li key={o.kind}>
                  <span className="font-semibold text-[var(--color-brand-aubergine)]">
                    {o.kind}:
                  </span>{" "}
                  <span className="text-[var(--color-brand-stone)]">
                    {o.value}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex gap-3">
              <Link
                href="/portal/journal"
                className="px-4 py-2 rounded-[10px] bg-[var(--color-brand-clay)] text-white font-semibold hover:bg-[var(--color-brand-clay-deep)] transition-colors"
              >
                Save entry
              </Link>
              <button
                type="button"
                onClick={() => setState("idle")}
                className="px-4 py-2 rounded-[10px] border border-[var(--color-brand-sand)] bg-white font-semibold hover:border-[var(--color-brand-clay)] transition-colors"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
