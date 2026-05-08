import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getActiveClinicianAccess } from "@/lib/auth/consent";
import { deriveRapidAnswers, type DerivedAnswer } from "@/lib/clinical/rapid-answer";
import {
  defaultEmptyInputs,
  evaluateNiceRules,
  visibleNicePrompts,
} from "@/lib/clinical/nice-rules";
import { getSupabaseServiceRole } from "@/lib/supabase/server";
import { FreeTextQuery } from "./freetext-query";
import {
  patient as MOCK_PATIENT,
  rapidAnswers as MOCK_ANSWERS,
  pbacThisCycle,
  adenomyosisFlag,
  nicePrompts,
  type RapidAnswer,
} from "@/lib/mock/patient";

const FLAG_INLINE: Record<string, string> = {
  adenomyosis_consideration: "Adenomyosis consideration",
  imaging_gap: "MRI gap (NICE NG73 §1.5.3)",
  treatment_escalation: "Escalation point",
};

const GROUP_TITLES: Record<string, string> = {
  symptom_pattern: "Symptom pattern",
  organ_involvement: "Organ involvement",
  bleeding_family: "Bleeding & family",
  investigations_treatment_fertility: "Investigations, treatment, fertility",
};

const DEMO_QA = [
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

export default async function RapidAnswerPanel() {
  const user = await getCurrentUser();
  const isClinician = user?.role === "clinician";
  const access = isClinician ? await getActiveClinicianAccess() : null;

  if (isClinician && access) {
    return <LivePanel access={access} />;
  }
  return <DemoPanel />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Live panel — derives answers from the patient's actual record
// ─────────────────────────────────────────────────────────────────────────────
async function LivePanel({
  access,
}: {
  access: NonNullable<Awaited<ReturnType<typeof getActiveClinicianAccess>>>;
}) {
  const patientName = access.patientDisplayName;
  const tokenId = access.token.id;
  const expires = access.token.expiresAt;

  // Fetch journal entries via service-role since the clinician's RLS path
  // requires the join through consent_tokens; that works at the SQL level
  // but the @supabase/supabase-js type-narrowing needs the explicit query.
  const service = getSupabaseServiceRole();
  let entries: import("@/lib/clinical/journal").JournalEntry[] = [];
  if (service) {
    const { data } = await service
      .from("journal_entries")
      .select(
        "id, recorded_at, entry_date, cycle_day, cycle_phase, pain_vas, pain_locations, bowel_symptoms, bladder_symptoms, dyspareunia, bleeding_heaviness, fatigue_vas, mood_score, notes, source, transcript, patient_plain_summary, ai_extracted",
      )
      .eq("patient_subject_id", access.token.patientSubjectId)
      .order("entry_date", { ascending: false })
      .limit(60);
    entries = (data ?? []).map((e) => ({
      id: e.id,
      recordedAt: e.recorded_at,
      entryDate: e.entry_date,
      cycleDay: e.cycle_day,
      cyclePhase: e.cycle_phase,
      painVas: e.pain_vas,
      painLocations: e.pain_locations ?? [],
      bowelSymptoms: e.bowel_symptoms ?? [],
      bladderSymptoms: e.bladder_symptoms ?? [],
      dyspareunia: e.dyspareunia,
      bleedingHeaviness: e.bleeding_heaviness,
      fatigueVas: e.fatigue_vas,
      moodScore: e.mood_score,
      notes: e.notes,
      source: e.source,
      transcript: e.transcript,
      patientPlainSummary: e.patient_plain_summary,
      aiExtracted: e.ai_extracted,
    }));
  }

  const answers = deriveRapidAnswers(entries, null);
  const grouped = groupByGroup(answers);
  const flags = collectFlags(answers);

  // Live NICE NG73 prompts — gap / partial only — surface above the rows
  // alongside the journal-derived flags. Each prompt carries the rule pack
  // version (NICE_RULE_PACK_VERSION) for audit purposes.
  const niceVisible = visibleNicePrompts(
    evaluateNiceRules(defaultEmptyInputs(entries)),
  );

  return (
    <div className="max-w-5xl mx-auto px-6 lg:px-10 py-8">
      <header className="border-b border-border pb-4 mb-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h1 className="font-display text-2xl font-bold tracking-tight">
            {patientName}
          </h1>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <Link
              href="/cdss/dossier"
              className="hover:text-foreground underline-offset-2 hover:underline"
            >
              CSD
            </Link>
            <span aria-hidden="true">·</span>
            <Link
              href="/cdss/timeline"
              className="hover:text-foreground underline-offset-2 hover:underline"
            >
              Timeline
            </Link>
            <span aria-hidden="true">·</span>
            <span>Read-only · expires {new Date(expires).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          {entries.length === 0
            ? "Patient has not yet logged journal entries. Awaiting data."
            : `Derived from ${entries.length} journal entr${entries.length === 1 ? "y" : "ies"}. Consent ${tokenId.slice(0, 8)}…`}
        </p>
      </header>

      {(flags.length > 0 || niceVisible.length > 0) && (
        <section className="mb-8 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {flags.map((f) => (
            <FlagInline key={f}>{FLAG_INLINE[f]}</FlagInline>
          ))}
          {niceVisible.map((p) => (
            <FlagInline key={p.recommendationId} variant="nice">
              {p.recommendationLabel}
            </FlagInline>
          ))}
        </section>
      )}

      {(["symptom_pattern", "organ_involvement", "bleeding_family", "investigations_treatment_fertility"] as const).map((g) => (
        <Group key={g} title={GROUP_TITLES[g]} answers={grouped[g] ?? []} />
      ))}

      <FreeTextQuery isLive={true} />

      <p className="mt-12 text-xs text-muted-foreground border-t border-border pt-4">
        Read-only access. Every call captured in the audit trail. Decision
        support, not a diagnosis.
      </p>
    </div>
  );
}

function Group({
  title,
  answers,
}: {
  title: string;
  answers: DerivedAnswer[];
}) {
  if (answers.length === 0) return null;
  return (
    <section className="mb-8">
      <h2 className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-3 pb-2 border-b border-border">
        {title}
      </h2>
      <dl className="divide-y divide-border">
        {answers.map((a) => (
          <div
            key={a.question}
            className="grid grid-cols-12 gap-4 py-3 items-baseline"
          >
            <dt className="col-span-12 sm:col-span-4 text-sm text-muted-foreground">
              {a.question}
            </dt>
            <dd className="col-span-12 sm:col-span-8">
              <p
                className={`text-sm leading-snug ${
                  a.awaiting ? "italic text-muted-foreground" : ""
                }`}
              >
                {a.answer}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {a.flag && (
                  <span className="text-[var(--color-brand-red)] font-semibold mr-2">
                    → {FLAG_INLINE[a.flag]}
                  </span>
                )}
                {a.sources.length > 0 && (
                  <span>
                    Source: {a.sources.map((s) => s.label).join("; ")}
                  </span>
                )}
              </p>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function groupByGroup(answers: DerivedAnswer[]): Record<string, DerivedAnswer[]> {
  const out: Record<string, DerivedAnswer[]> = {};
  for (const a of answers) {
    out[a.group] = out[a.group] ?? [];
    out[a.group].push(a);
  }
  return out;
}

function collectFlags(answers: DerivedAnswer[]): string[] {
  const set = new Set<string>();
  for (const a of answers) if (a.flag) set.add(a.flag);
  return [...set];
}

// ─────────────────────────────────────────────────────────────────────────────
// Demo panel — keeps the existing mock content for anonymous viewers
// ─────────────────────────────────────────────────────────────────────────────
function DemoPanel() {
  const niceGaps = nicePrompts.filter((p) => p.status === "gap");

  return (
    <div className="max-w-5xl mx-auto px-6 lg:px-10 py-8">
      <header className="border-b border-border pb-4 mb-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h1 className="font-display text-2xl font-bold tracking-tight">
            {MOCK_PATIENT.familyName}, {MOCK_PATIENT.givenName}
            <span className="ml-3 font-normal text-base text-muted-foreground">
              {MOCK_PATIENT.age} · {MOCK_PATIENT.pronouns}
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
            <span>Demo · synthetic patient</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Suspected endometriosis with adenomyosis co-consideration · PBAC{" "}
          {pbacThisCycle} this cycle · sign in with patient consent to see your live patient.
        </p>
      </header>

      <section className="mb-8 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {adenomyosisFlag.triggered && (
          <FlagInline>
            Adenomyosis co-consideration · score {adenomyosisFlag.score}/6
          </FlagInline>
        )}
        {niceGaps.map((g) => (
          <FlagInline key={g.recommendationId}>{g.recommendationLabel}</FlagInline>
        ))}
      </section>

      <DemoGrouped answers={MOCK_ANSWERS} />

      <FreeTextQuery isLive={false} demoSamples={DEMO_QA} />

      <p className="mt-12 text-xs text-muted-foreground border-t border-border pt-4">
        Read-only access. Every call captured in the audit trail. Decision
        support, not a diagnosis.
      </p>
    </div>
  );
}

function DemoGrouped({ answers }: { answers: RapidAnswer[] }) {
  // Use the same grouping order; the mock has all 13 questions.
  const groups: { title: string; questions: string[] }[] = [
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
      questions: ["Bowel involvement", "Bladder involvement", "Sexual function"],
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
  const byQ = Object.fromEntries(answers.map((a) => [a.question, a]));

  return (
    <>
      {groups.map((g) => (
        <section key={g.title} className="mb-8">
          <h2 className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-3 pb-2 border-b border-border">
            {g.title}
          </h2>
          <dl className="divide-y divide-border">
            {g.questions.map((q) => {
              const a = byQ[q];
              if (!a) return null;
              return (
                <div
                  key={q}
                  className="grid grid-cols-12 gap-4 py-3 items-baseline"
                >
                  <dt className="col-span-12 sm:col-span-4 text-sm text-muted-foreground">
                    {q}
                  </dt>
                  <dd className="col-span-12 sm:col-span-8">
                    <p className="text-sm leading-snug">{a.answer}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {a.flag && (
                        <span className="text-[var(--color-brand-red)] font-semibold mr-2">
                          → {FLAG_INLINE[a.flag]}
                        </span>
                      )}
                      <span>
                        Source: {a.sources.map((s) => s.label).join("; ")}
                      </span>
                    </p>
                  </dd>
                </div>
              );
            })}
          </dl>
        </section>
      ))}
    </>
  );
}

function FlagInline({
  children,
  variant = "danger",
}: {
  children: React.ReactNode;
  variant?: "danger" | "nice";
}) {
  const colour = variant === "nice"
    ? "var(--color-clinician-blue)"
    : "var(--color-brand-red)";
  return (
    <span
      className="inline-flex items-center gap-1.5 font-semibold"
      style={{ color: colour }}
    >
      <span
        aria-hidden="true"
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ background: colour }}
      />
      {children}
    </span>
  );
}
