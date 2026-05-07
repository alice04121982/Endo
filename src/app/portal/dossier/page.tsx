import {
  dossierPatientView,
  adenomyosisFlag,
  nicePrompts,
} from "@/lib/mock/patient";

export default function DossierPage() {
  const generated = new Date(dossierPatientView.generatedAt);
  const niceGaps = nicePrompts.filter((p) => p.status !== "satisfied");

  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-10 py-12 lg:py-16">
      <p className="text-sm uppercase tracking-[0.18em] text-[var(--color-brand-stone)] mb-2">
        Your dossier
      </p>
      <h1 className="font-display font-extrabold text-[var(--color-brand-aubergine)] tracking-[-0.02em] leading-[1.05] mb-4" style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)" }}>
        A one-page summary of your record
      </h1>
      <p className="text-[var(--color-brand-stone)] mb-2 max-w-2xl">
        Generated this morning at{" "}
        {generated.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        })}
        . Your clinician sees a structured clinical version of the same data —
        never two different stories.
      </p>
      <div className="flex items-center gap-2 mb-8">
        <span className="ai-label">AI-generated</span>
        <span className="text-xs text-[var(--color-brand-stone)]">
          Decision support, not medical advice. Reviewable by a qualified
          clinician.
        </span>
      </div>

      {/* Main narrative */}
      <article className="bg-white border border-[var(--color-brand-sand)] rounded-[14px] p-6 mb-6">
        <p className="whitespace-pre-line text-[var(--color-brand-aubergine)] leading-relaxed">
          {dossierPatientView.body}
        </p>
        <div className="mt-5 pt-5 border-t border-[var(--color-brand-sand)]">
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-brand-stone)] mb-2">
            What this is based on
          </p>
          <ul className="text-sm space-y-1">
            {dossierPatientView.citations.map((c) => (
              <li
                key={c.sourceId}
                className="flex items-start gap-2 text-[var(--color-brand-stone)]"
              >
                <span className="text-[var(--color-brand-clay)]">·</span>
                {c.label}
              </li>
            ))}
          </ul>
        </div>
      </article>

      {/* Adenomyosis consideration */}
      {adenomyosisFlag.triggered && (
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

      {/* NICE gaps */}
      {niceGaps.length > 0 && (
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
          className="px-4 py-2 rounded-[10px] bg-[var(--color-brand-clay)] text-white font-semibold hover:bg-[var(--color-brand-clay-deep)] transition-colors"
        >
          Download as PDF
        </button>
        <button
          type="button"
          className="px-4 py-2 rounded-[10px] border border-[var(--color-brand-sand)] bg-white font-semibold hover:border-[var(--color-brand-clay)] transition-colors"
        >
          Share with a clinician
        </button>
      </div>
    </div>
  );
}
