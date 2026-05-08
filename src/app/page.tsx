import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-6 lg:px-10 py-16">
      <div className="w-full max-w-3xl">
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-brand-stone)] mb-3">
          Endo · pelvic-health intelligence
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--color-brand-aubergine)] mb-4 leading-tight">
          A longitudinal record for endometriosis and adenomyosis.
        </h1>
        <p className="text-base text-[var(--color-brand-stone)] leading-relaxed mb-8 max-w-xl">
          Voice-first pain journalling. Clinician-grade summaries aligned to
          NICE NG73. A thirty-second answer panel for the consult window.
          Decision support — never a diagnosis.
        </p>

        <div className="flex flex-wrap gap-3 items-center mb-12">
          <Link
            href="/signin?role=patient"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-[8px] bg-[var(--color-brand-clay)] text-white text-sm font-semibold hover:bg-[var(--color-brand-clay-deep)] transition-colors"
          >
            I&apos;m a patient
          </Link>
          <Link
            href="/signin?role=clinician"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-[8px] bg-[var(--color-brand-aubergine)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            I&apos;m a clinician
          </Link>
          <Link
            href="/portal"
            className="text-sm font-medium text-[var(--color-brand-stone)] hover:text-[var(--color-brand-aubergine)] underline-offset-4 hover:underline ml-1"
          >
            Browse the demo →
          </Link>
        </div>

        <div className="grid sm:grid-cols-3 gap-6 pt-8 border-t border-[var(--color-brand-sand)] text-sm">
          <Pillar
            label="Audited"
            body="Every AI call hash-chained to a tamper-evident regulatory log."
          />
          <Pillar
            label="Cited"
            body="Clinical claims trace back to source data or a NICE / ESHRE reference."
          />
          <Pillar
            label="Reviewable"
            body="Outputs flagged for clinician review. Nothing is final without a human signature."
          />
        </div>

        <p className="mt-10 text-xs uppercase tracking-[0.18em] text-[var(--color-brand-stone)]">
          Pre-launch · Class IIa SaMD under UK MDR 2002
        </p>
      </div>
    </div>
  );
}

function Pillar({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-brand-clay)] font-semibold mb-1">
        {label}
      </p>
      <p className="text-[var(--color-brand-stone)] leading-relaxed">{body}</p>
    </div>
  );
}
