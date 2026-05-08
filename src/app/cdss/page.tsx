"use client";

import { useState } from "react";
import Link from "next/link";
import {
  patient,
  rapidAnswers,
  pbacThisCycle,
  adenomyosisFlag,
  nicePrompts,
  type RapidAnswer,
} from "@/lib/mock/patient";

// Clinical Rapid Answer Panel — grouped definition list, no decorative
// cards. Optimised for the thirty-second consult window. Information
// density first; visual decoration second.
//
// Question grouping mirrors how a registrar / GP works through an
// endometriosis history.

const GROUPS: { title: string; questions: string[] }[] = [
  {
    title: "Symptom pattern",
    questions: [
      "Age of pelvic pain onset",
      "Cyclicity",
      "Severity trend",
      "Anatomical pattern",
    ],
  },
  {
    title: "Organ involvement",
    questions: [
      "Bowel involvement",
      "Bladder involvement",
      "Sexual function",
    ],
  },
  {
    title: "Bleeding & family",
    questions: ["Heavy menstrual bleeding", "Family history"],
  },
  {
    title: "Investigations, treatment, fertility",
    questions: [
      "Prior imaging",
      "Treatment trial history",
      "Prior surgery",
      "Fertility status and intent",
    ],
  },
];

const FLAG_INLINE: Record<string, string> = {
  adenomyosis_consideration: "Adenomyosis consideration",
  imaging_gap: "MRI gap (NICE NG73 §1.5.3)",
  treatment_escalation: "Escalation point",
};

const FREETEXT_DEMO: { q: string; a: string; cite: string }[] = [
  {
    q: "How often does she report dyspareunia?",
    a: "Once per cycle on average over the last 14 days. Most recent: 2 May 2026 (deep, post-coital).",
    cite: "j-2026-05-02 · 14-day journal",
  },
  {
    q: "Has she ever had an MRI?",
    a: "No. TVS performed 5/1/2026 — inconclusive (possible adenomyosis features). NICE NG73 §1.5.3 supports MRI when TVS inconclusive.",
    cite: "doc-tvs-jan · NICE NG73 §1.5.3",
  },
  {
    q: "PBAC trend across last two cycles?",
    a: "Current ≈142, prior ≈128 (estimate from journal). Both >100; consider adenomyosis concurrent with suspected endometriosis.",
    cite: "j-emma-summary · adenomyosis flag",
  },
];

export default function RapidAnswerPanel() {
  const [activeQ, setActiveQ] = useState<typeof FREETEXT_DEMO[number] | null>(null);
  const niceGaps = nicePrompts.filter((p) => p.status === "gap");
  const answersByQ = Object.fromEntries(
    rapidAnswers.map((a) => [a.question, a]),
  );

  return (
    <div className="max-w-5xl mx-auto px-6 lg:px-10 py-8">
      {/* Patient header strip — compact, tabular */}
      <header className="border-b border-border pb-4 mb-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h1 className="font-display text-2xl font-bold tracking-tight">
            {patient.familyName}, {patient.givenName}
            <span className="ml-3 font-normal text-base text-muted-foreground">
              {patient.age} · {patient.pronouns}
            </span>
          </h1>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <Link href="/cdss/dossier" className="hover:text-foreground underline-offset-2 hover:underline">
              CSD
            </Link>
            <span aria-hidden="true">·</span>
            <Link href="/cdss/timeline" className="hover:text-foreground underline-offset-2 hover:underline">
              Timeline
            </Link>
            <span aria-hidden="true">·</span>
            <span>Read-only · expires 12 May 2026</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Suspected endometriosis with adenomyosis co-consideration · PBAC{" "}
          {pbacThisCycle} this cycle · access via patient consent (Ms R Patel,
          Cambridge).
        </p>
      </header>

      {/* Flags row */}
      <section className="mb-8 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {adenomyosisFlag.triggered && (
          <Flag>
            Adenomyosis co-consideration · score {adenomyosisFlag.score}/6
          </Flag>
        )}
        {niceGaps.map((g) => (
          <Flag key={g.recommendationId}>{g.recommendationLabel}</Flag>
        ))}
      </section>

      {/* Grouped definition list */}
      {GROUPS.map((group) => (
        <section key={group.title} className="mb-8">
          <h2 className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-3 pb-2 border-b border-border">
            {group.title}
          </h2>
          <dl className="divide-y divide-border">
            {group.questions.map((q) => {
              const ans = answersByQ[q] as RapidAnswer | undefined;
              if (!ans) return null;
              return (
                <div
                  key={q}
                  className="grid grid-cols-12 gap-4 py-3 items-baseline"
                >
                  <dt className="col-span-12 sm:col-span-4 text-sm text-muted-foreground">
                    {q}
                  </dt>
                  <dd className="col-span-12 sm:col-span-8">
                    <p className="text-sm leading-snug">{ans.answer}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {ans.flag && (
                        <span className="text-[var(--color-brand-red)] font-semibold mr-2">
                          → {FLAG_INLINE[ans.flag]}
                        </span>
                      )}
                      <span>
                        Source: {ans.sources.map((s) => s.label).join("; ")}
                      </span>
                    </p>
                  </dd>
                </div>
              );
            })}
          </dl>
        </section>
      ))}

      {/* Free-text query — clean, no decorative card */}
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
          {FREETEXT_DEMO.map((q) => (
            <button
              key={q.q}
              type="button"
              onClick={() => setActiveQ(q)}
              className={`text-left text-sm px-3 py-2 rounded-[6px] border transition-colors ${
                activeQ?.q === q.q
                  ? "border-primary bg-secondary"
                  : "border-border bg-card hover:border-primary"
              }`}
            >
              {q.q}
            </button>
          ))}
        </div>

        {activeQ && (
          <div className="border-l-2 border-primary pl-4 py-1">
            <p className="text-sm font-medium mb-1">{activeQ.q}</p>
            <p className="text-sm leading-snug mb-2">{activeQ.a}</p>
            <p className="text-xs text-muted-foreground">
              Source: {activeQ.cite}
            </p>
          </div>
        )}
      </section>

      <p className="mt-12 text-xs text-muted-foreground border-t border-border pt-4">
        Read-only access. Every call captured in the audit trail. Decision
        support, not a diagnosis.
      </p>
    </div>
  );
}

function Flag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[var(--color-brand-red)] font-semibold">
      <span
        aria-hidden="true"
        className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-brand-red)]"
      />
      {children}
    </span>
  );
}
