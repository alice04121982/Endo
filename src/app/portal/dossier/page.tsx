import {
  buildCSDPayloadForCurrentPatient,
  readLatestRender,
} from "@/lib/clinical/csd";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  dossierPatientView as MOCK_VIEW,
  adenomyosisFlag,
  nicePrompts,
} from "@/lib/mock/patient";
import { RegenerateButton } from "./regenerate-button";

export default async function DossierPage() {
  const user = await getCurrentUser();
  const isAuthedPatient = user?.role === "patient";
  const niceGaps = nicePrompts.filter((p) => p.status !== "satisfied");

  // Live render path
  let body = MOCK_VIEW.body;
  let citations: { kind: string; label: string; sourceId?: string }[] = MOCK_VIEW.citations.map(
    (c) => ({ kind: "source_data", label: c.label, sourceId: c.sourceId }),
  );
  let generatedAt = MOCK_VIEW.generatedAt;
  let live = false;
  let empty = false;

  if (isAuthedPatient) {
    const payload = await buildCSDPayloadForCurrentPatient();
    if (!payload || payload.recentEntries.length === 0) {
      empty = true;
    } else {
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
  }

  const generated = new Date(generatedAt);

  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-10 py-12 lg:py-16">
      <p className="text-sm uppercase tracking-[0.18em] text-[var(--color-brand-stone)] mb-2">
        Your dossier
      </p>
      <h1
        className="font-display font-extrabold text-[var(--color-brand-aubergine)] tracking-[-0.02em] leading-[1.05] mb-4"
        style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)" }}
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

          {/* Adenomyosis consideration — mock-only for now until feature 7 lands */}
          {!live && adenomyosisFlag.triggered && (
            <section className="bg-[var(--color-brand-blush)] border border-[var(--color-brand-sand)] rounded-[14px] p-6 mb-6">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-brand-stone)] mb-2">
                Worth discussing
              </p>
              <h2 className="font-display text-lg font-bold text-[var(--color-brand-aubergine)] mb-3">
                Adenomyosis — a clinical consideration
              </h2>
              <p className="text-sm text-[var(--color-brand-aubergine)] leading-relaxed whitespace-pre-line">
                {adenomyosisFlag.patientText}
              </p>
            </section>
          )}

          {/* NICE gaps — mock-only for now until feature 6 lands */}
          {!live && niceGaps.length > 0 && (
            <section className="bg-white border border-[var(--color-brand-sand)] rounded-[14px] p-6">
              <h2 className="font-display text-lg font-bold text-[var(--color-brand-aubergine)] mb-3">
                What you might want to ask your clinician
              </h2>
              <ul className="space-y-3">
                {niceGaps.map((p) => (
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
