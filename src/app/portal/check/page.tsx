"use client";

import { useState, useTransition } from "react";
import { submitRedFlagCheck } from "./actions";
import type { RedFlag } from "@/lib/clinical/red-flags";

const QUESTIONS = [
  {
    name: "bleedingThroughPad",
    label:
      "Are you soaking through more than one pad an hour for two hours in a row?",
  },
  {
    name: "severeOneSidedPain",
    label: "Sudden, severe pain on one side that's much worse than your usual?",
  },
  {
    name: "severeAbdominalSwelling",
    label: "Severe abdominal swelling or you can't keep food or drink down?",
  },
  {
    name: "severeFlankPain",
    label: "Severe pain in your side or lower back?",
  },
  {
    name: "pregnancyBleeding",
    label: "Bleeding while pregnant or possibly pregnant?",
  },
  {
    name: "fainting",
    label: "Feeling faint, light-headed, or have you fainted?",
  },
] as const;

export default function CheckPage() {
  const [busy, startTransition] = useTransition();
  const [result, setResult] = useState<RedFlag[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(form: HTMLFormElement) {
    const data = new FormData(form);
    startTransition(async () => {
      setError(null);
      const r = await submitRedFlagCheck(data);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setResult(r.flags);
    });
  }

  return (
    <div className="max-w-3xl mx-auto px-6 lg:px-10 py-12 lg:py-16">
      <p className="text-sm uppercase tracking-[0.18em] text-[var(--color-brand-stone)] mb-2">
        Urgent symptom check
      </p>
      <h1
        className="font-display text-2xl font-semibold tracking-tight text-[var(--color-brand-aubergine)] mb-3"
      >
        Anything urgent right now?
      </h1>
      <p className="text-[var(--color-brand-stone)] mb-8 max-w-xl">
        Quick yes / no for symptoms that need urgent care. If anything below is
        a yes, we&apos;ll tell you to seek urgent care now — that message
        cannot be silenced and we won&apos;t soften it.
      </p>

      {!result && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(e.currentTarget);
          }}
          className="space-y-3"
        >
          {QUESTIONS.map((q) => (
            <label
              key={q.name}
              className="flex items-start gap-3 p-4 bg-white border border-[var(--color-brand-sand)] rounded-[14px] hover:border-[var(--color-brand-clay)] transition-colors cursor-pointer"
            >
              <input
                type="checkbox"
                name={q.name}
                className="mt-1 h-5 w-5 accent-[var(--color-brand-clay)]"
              />
              <span className="text-sm text-[var(--color-brand-aubergine)]">
                {q.label}
              </span>
            </label>
          ))}

          {error && (
            <p
              role="alert"
              className="text-sm text-[var(--color-brand-red)] font-medium"
            >
              {error}
            </p>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={busy}
              className="px-5 py-3 rounded-[10px] bg-[var(--color-brand-clay)] text-white font-semibold hover:bg-[var(--color-brand-clay-deep)] transition-colors disabled:opacity-60"
            >
              {busy ? "Checking…" : "Check"}
            </button>
          </div>
        </form>
      )}

      {result && result.length === 0 && (
        <div className="bg-white border border-[var(--color-brand-sage)] rounded-[14px] p-6">
          <p className="font-display text-lg font-bold text-[var(--color-brand-aubergine)] mb-2">
            No urgent flags from your answers
          </p>
          <p className="text-sm text-[var(--color-brand-stone)]">
            That doesn&apos;t mean nothing is wrong — only that the urgent
            triage rules didn&apos;t fire. If you&apos;re still worried, talk
            to your clinician or call NHS 111.
          </p>
          <button
            type="button"
            onClick={() => setResult(null)}
            className="mt-4 text-sm font-semibold text-[var(--color-brand-clay)] hover:underline"
          >
            Run the check again
          </button>
        </div>
      )}

      {result && result.length > 0 && (
        <div className="space-y-4">
          {result.map((flag) => (
            <div key={flag.id} className="red-flag-banner" role="alert">
              <p className="text-xs uppercase tracking-[0.18em] font-semibold mb-1">
                Red flag
              </p>
              <p className="text-lg font-bold mb-2">{flag.patientHeadline}</p>
              <p className="text-sm font-normal mb-3">{flag.patientAction}</p>
              <p className="text-xs font-normal opacity-90 mb-3">
                Why we&apos;re saying this: {flag.rationale}
              </p>
              <div className="flex gap-2 flex-wrap">
                {flag.resources.map((r) => (
                  <a
                    key={r.href}
                    href={r.href}
                    className="inline-flex items-center px-4 py-2 rounded-[8px] bg-white text-[var(--color-brand-red)] font-semibold text-sm hover:bg-[var(--color-brand-cream)] transition-colors"
                  >
                    {r.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
          <p className="text-xs text-[var(--color-brand-stone)] mt-2">
            This message persists in your record. Endo cannot silence or auto-
            dismiss a red flag.
          </p>
        </div>
      )}
    </div>
  );
}
