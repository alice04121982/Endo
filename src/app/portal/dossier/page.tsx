import {
  buildCSDPayloadForCurrentPatient,
  readLatestRender,
} from "@/lib/clinical/csd";
import type { AdenomyosisResult } from "@/lib/clinical/adenomyosis";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listOwnJournalEntries } from "@/lib/clinical/journal";
import {
  defaultEmptyInputs,
  evaluateNiceRules,
  visibleNicePrompts,
} from "@/lib/clinical/nice-rules";
import {
  dossierPatientView as MOCK_VIEW,
  adenomyosisFlag as MOCK_ADENO,
  nicePrompts,
} from "@/lib/mock/patient";
import { RegenerateButton } from "./regenerate-button";

export default async function DossierPage() {
  const user = await getCurrentUser();
  const isAuthedPatient = user?.role === "patient";

  // Live render path
  let body = MOCK_VIEW.body;
  let citations: { kind: string; label: string; sourceId?: string }[] = MOCK_VIEW.citations.map(
    (c) => ({ kind: "source_data", label: c.label, sourceId: c.sourceId }),
  );
  let generatedAt = MOCK_VIEW.generatedAt;
  let live = false;
  let empty = false;

  // NICE prompts surface live when authed; otherwise the mock prompts
  // demonstrate the visual.
  let liveNiceGapItems: {
    recommendationId: string;
    recommendationLabel: string;
    patientText: string;
  }[] = [];

  // Adenomyosis section is fed by the engine when authed, by the mock
  // otherwise. Either way the render code is the same.
  let adenoForRender: AdenomyosisResult | null = null;

  if (isAuthedPatient) {
    const entries = await listOwnJournalEntries(60);
    const prompts = evaluateNiceRules(defaultEmptyInputs(entries));
    liveNiceGapItems = visibleNicePrompts(prompts).map((p) => ({
      recommendationId: p.recommendationId,
      recommendationLabel: p.recommendationLabel,
      patientText: p.patientText ?? "",
    }));

    const payload = await buildCSDPayloadForCurrentPatient();
    if (!payload || payload.recentEntries.length === 0) {
      empty = true;
    } else {
      adenoForRender = payload.adenomyosisFlag;
      const cached = await readLatestRender(user.id, "patient");
      if (cached) {
        body = cached.body;
        citations = cached.citations.map((c) => {
          if (c.kind === "guideline") {
            return { kind: c.kind, label: c.label, sourceId: c.reference };
          }
          return { kind: c.kind, label: c.label, sourceId: c.sourceId };
        });
        generatedAt = cached.generatedAt;
        live = true;
      }
    }
  } else {
    adenoForRender = MOCK_ADENO;
  }

  // What renders as the NICE panel: live results when authed, mock when not.
  const mockNiceGaps = nicePrompts.filter((p) => p.status !== "satisfied");

  const generated = new Date(generatedAt);

  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-10 py-12 lg:py-16">
      <p className="text-sm uppercase tracking-[0.18em] text-[var(--color-brand-stone)] mb-2">
        Your dossier
      </p>
      <h1
        className="font-display text-2xl font-semibold tracking-tight text-[var(--color-brand-aubergine)] mb-3"
      >
        A one-page summary of your record
      </h1>
      <p className="text-[var(--color-brand-stone)] mb-2 max-w-2xl">
        {isAuthedPatient
          ? live
            ? `Generated ${generated.toLocaleString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}. Your clinician sees a structured clinical version of the same data — never two different stories.`
            : "Your dossier is generated from your journal entries and documents. Once you have a few entries, regenerate to see your live narrative."
          : "Demo dossier rendered against the synthetic patient. Sign in and add a few journal entries to see your real one."}
      </p>
      <div className="flex items-center gap-2 mb-6">
        <span className="ai-label">AI-generated</span>
        <span className="text-xs text-[var(--color-brand-stone)]">
          Decision support, not medical advice. Reviewable by a qualified
          clinician.
        </span>
      </div>

      {isAuthedPatient && <RegenerateButton />}

      {empty ? (
        <article className="bg-white border border-dashed border-[var(--color-brand-sand)] rounded-[14px] p-10 text-center mt-8">
          <p className="font-display text-lg font-bold text-[var(--color-brand-aubergine)] mb-2">
            Not enough yet
          </p>
          <p className="text-sm text-[var(--color-brand-stone)] mb-4 max-w-md mx-auto">
            Endo needs a few journal entries before it can write a meaningful
            dossier. Speak about how you feel today, and we&apos;ll start
            building it.
          </p>
        </article>
      ) : (
        <>
          {/* Main narrative */}
          <article className="bg-white border border-[var(--color-brand-sand)] rounded-[14px] p-6 mt-8 mb-6">
            <p className="whitespace-pre-line text-[var(--color-brand-aubergine)] leading-relaxed">
              {body}
            </p>
            <div className="mt-5 pt-5 border-t border-[var(--color-brand-sand)]">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-brand-stone)] mb-2">
                What this is based on
              </p>
              <ul className="text-sm space-y-1">
                {citations.map((c, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-[var(--color-brand-stone)]"
                  >
                    <span className="text-[var(--color-brand-clay)]">·</span>
                    {c.label}
                  </li>
                ))}
              </ul>
            </div>
          </article>

          {/* Adenomyosis consideration — live engine output when authed,
              static mock copy otherwise. Identical patient-facing voice. */}
          {adenoForRender?.status === "triggered" && (
            <section className="bg-[var(--color-brand-blush)] border border-[var(--color-brand-sand)] rounded-[14px] p-6 mb-6">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-brand-stone)] mb-2">
                Worth discussing
              </p>
              <h2 className="font-display text-lg font-bold text-[var(--color-brand-aubergine)] mb-3">
                Adenomyosis — a clinical consideration
              </h2>
              <p className="text-sm text-[var(--color-brand-aubergine)] leading-relaxed whitespace-pre-line">
                {adenoForRender.patientText}
              </p>
              <p className="text-xs text-[var(--color-brand-stone)] mt-3">
                Rule pack {adenoForRender.rulePackVersion} · score{" "}
                {adenoForRender.score}/{adenoForRender.evaluableMaxScore}{" "}
                (threshold {adenoForRender.thresholdScore}). Decision support,
                not a diagnosis.
              </p>
            </section>
          )}

          {/* NICE gaps — live when authed, mock-style for anonymous demo */}
          {(live ? liveNiceGapItems.length > 0 : mockNiceGaps.length > 0) && (
            <section className="bg-white border border-[var(--color-brand-sand)] rounded-[14px] p-6">
              <h2 className="font-display text-lg font-bold text-[var(--color-brand-aubergine)] mb-3">
                What you might want to ask your clinician
              </h2>
              <ul className="space-y-3">
                {(live ? liveNiceGapItems : mockNiceGaps.map((p) => ({
                  recommendationId: p.recommendationId,
                  recommendationLabel: p.recommendationLabel,
                  patientText: p.patientText,
                }))).map((p) => (
                  <li
                    key={p.recommendationId}
                    className="border-l-2 border-[var(--color-brand-clay)] pl-3"
                  >
                    <p className="text-sm text-[var(--color-brand-aubergine)]">
                      {p.patientText}
                    </p>
                    <p className="text-xs text-[var(--color-brand-stone)] mt-1">
                      Reference: NICE NG73 §
                      {p.recommendationId.replace("NG73:", "")}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="flex gap-3 mt-8">
            <button
              type="button"
              disabled
              className="px-4 py-2 rounded-[10px] bg-[var(--color-brand-cream)] text-[var(--color-brand-stone)] font-semibold cursor-not-allowed"
              title="PDF export — coming next"
            >
              Download as PDF
            </button>
            <a
              href="/portal/share"
              className="px-4 py-2 rounded-[10px] border border-[var(--color-brand-sand)] bg-white font-semibold hover:border-[var(--color-brand-clay)] transition-colors"
            >
              Share with a clinician
            </a>
          </div>
        </>
      )}
    </div>
  );
}
