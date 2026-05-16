"use client";

import { useState, useTransition } from "react";
import { askPatientRecord, type QueryResult } from "./freetext/actions";

interface Props {
  isLive: boolean;
  demoSamples?: { q: string; a: string; cite: string }[];
}

export function FreeTextQuery({ isLive, demoSamples = [] }: Props) {
  const [busy, startTransition] = useTransition();
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [demoActive, setDemoActive] = useState<typeof demoSamples[number] | null>(null);

  async function ask() {
    setError(null);
    setResult(null);
    setDemoActive(null);
    const r = await askPatientRecord(question);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setResult(r);
  }

  return (
    <section className="border-t border-border pt-6 mt-10">
      <h2 className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-3">
        Ask the record
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        Synthesised answer with source citations. Diagnostic conclusions
        refused; framings limited to &ldquo;suggestive of&rdquo; and
        &ldquo;consistent with&rdquo;.
        <span className="ai-label ml-2">AI-synthesised</span>
      </p>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={isLive ? "How often does she report dyspareunia?" : "Sign in with active patient consent to ask the live record."}
          disabled={busy || !isLive}
          className="flex-1 px-3 py-2 rounded-[6px] border border-border bg-card text-sm focus:outline-none focus:border-primary disabled:opacity-60"
          onKeyDown={(e) => {
            if (e.key === "Enter" && question.trim() && isLive) {
              startTransition(ask);
            }
          }}
        />
        <button
          type="button"
          onClick={() => startTransition(ask)}
          disabled={!isLive || !question.trim() || busy}
          className="px-4 py-2 rounded-[6px] bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
        >
          {busy ? "Asking…" : "Ask"}
        </button>
      </div>

      {!isLive && demoSamples.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          {demoSamples.map((d) => (
            <button
              key={d.q}
              type="button"
              onClick={() => setDemoActive(d)}
              className={`text-left text-sm px-3 py-2 rounded-[6px] border transition-colors ${
                demoActive?.q === d.q
                  ? "border-primary bg-secondary"
                  : "border-border bg-card hover:border-primary"
              }`}
            >
              {d.q}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="border-l-2 border-[var(--color-brand-red)] pl-4 py-1 text-sm text-[var(--color-brand-red)] mb-3"
        >
          {error}
        </div>
      )}

      {result && (
        <div className="border-l-2 border-primary pl-4 py-1 mb-3">
          <p className="text-sm font-medium mb-1">{result.question}</p>
          <p className="text-sm leading-snug mb-2">{result.answer}</p>
          {result.citations.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Source: {result.citations.map((c) => c.label).join("; ")}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Audit row {result.auditEntryId.slice(0, 8)}… · {result.modelId}
          </p>
        </div>
      )}

      {!isLive && demoActive && (
        <div className="border-l-2 border-primary pl-4 py-1">
          <p className="text-sm font-medium mb-1">{demoActive.q}</p>
          <p className="text-sm leading-snug mb-2">{demoActive.a}</p>
          <p className="text-xs text-muted-foreground">Source: {demoActive.cite}</p>
        </div>
      )}
    </section>
  );
}
