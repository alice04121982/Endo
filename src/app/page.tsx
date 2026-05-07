import Link from "next/link";
import { PetalBloom, RibbonLoop, Arches } from "@/components/illustrations";

export default function LandingPage() {
  return (
    <>
      {/* ────────── Hero ────────── */}
      <section className="relative overflow-hidden bg-[var(--color-brand-cream)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-20 pb-28 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 relative z-10">
            <p className="text-sm uppercase tracking-[0.22em] text-[var(--color-brand-stone)] mb-6">
              Endo · pelvic-health intelligence
            </p>
            <h1
              className="font-display font-extrabold text-[var(--color-brand-aubergine)] leading-[1.04] tracking-[-0.025em] mb-8"
              style={{ fontSize: "clamp(2.75rem, 6vw, 5rem)" }}
            >
              Your record, in your{" "}
              <span className="text-[var(--color-brand-clay)]">words</span>.
              <br />
              Their consult, in <span className="text-[var(--color-brand-plum)]">thirty seconds</span>.
            </h1>
            <p className="text-lg sm:text-xl text-[var(--color-brand-stone)] leading-relaxed max-w-2xl mb-10">
              A longitudinal record for endometriosis and adenomyosis. Speak
              to it about how you feel; share a clinician-grade summary when
              you need to. Decision support — never a diagnosis.
            </p>
            <div className="flex flex-wrap gap-3 items-center">
              <Link
                href="/signin?role=patient"
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-[12px] bg-[var(--color-brand-clay)] text-white font-semibold hover:bg-[var(--color-brand-clay-deep)] transition-colors"
              >
                I&apos;m a patient
              </Link>
              <Link
                href="/signin?role=clinician"
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-[12px] bg-[var(--color-brand-aubergine)] text-white font-semibold hover:opacity-90 transition-opacity"
              >
                I&apos;m a clinician
              </Link>
              <Link
                href="/portal"
                className="text-sm font-semibold text-[var(--color-brand-stone)] hover:text-[var(--color-brand-aubergine)] underline-offset-4 hover:underline ml-1"
              >
                or browse the demo →
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <PetalBloom
              ariaLabel="Endo brand bloom"
              className="w-full max-w-[480px] mx-auto"
            />
          </div>
        </div>

        {/* Decorative ribbon at the bottom edge */}
        <div className="absolute -bottom-12 left-0 right-0 pointer-events-none opacity-60">
          <RibbonLoop className="w-full h-32" />
        </div>
      </section>

      {/* ────────── Three pillars ────────── */}
      <section className="bg-white py-20 lg:py-28 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm uppercase tracking-[0.22em] text-[var(--color-brand-stone)] mb-3">
            How Endo earns trust
          </p>
          <h2
            className="font-display font-extrabold text-[var(--color-brand-aubergine)] leading-[1.1] tracking-[-0.02em] mb-12 max-w-3xl"
            style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
          >
            Built to a regulated standard, written for the people who&apos;ll use it.
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <Pillar
              eyebrow="Audited"
              title="Every AI call, on the record"
              body="Hash-chained, append-only. Tamper-evident. Patients can read their own audit trail; clinicians read the rows on records they hold consent for."
            />
            <Pillar
              eyebrow="Cited"
              title="Every claim, sourced"
              body="Clinical claims trace back to the entry, the document, or the NICE NG73 recommendation that produced them. Nothing is invented."
            />
            <Pillar
              eyebrow="Reviewable"
              title="Nothing is final without a human"
              body="Outputs are flagged for clinician review. Endo never produces a diagnosis. Red-flag triage is unambiguous and never softened."
            />
          </div>
        </div>
      </section>

      {/* ────────── Two paths ────────── */}
      <section className="bg-[var(--color-brand-cream)] py-20 lg:py-28 px-6 lg:px-10">
        <div className="max-w-7xl mx-auto">
          <h2
            className="font-display font-extrabold text-[var(--color-brand-aubergine)] leading-[1.1] tracking-[-0.02em] mb-3 max-w-3xl"
            style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
          >
            One record. Two ways to read it.
          </h2>
          <p className="text-lg text-[var(--color-brand-stone)] max-w-2xl mb-12">
            The patient view and the clinician view are generated from the
            same underlying data — never two different stories.
          </p>

          <div className="grid lg:grid-cols-2 gap-8">
            <PathCard
              eyebrow="For patients"
              title="The Patient Portal"
              body="Speak about how you feel. Track your cycle. Build a record you can share with a clinician on your terms."
              ctaLabel="Open patient portal"
              href="/portal"
              accentClass="bg-[var(--color-brand-clay)]"
              hoverClass="hover:border-[var(--color-brand-clay)]"
              illustration={
                <Arches className="w-40 h-40 absolute -right-6 -bottom-6 opacity-90" />
              }
            />
            <PathCard
              eyebrow="For clinicians"
              title="The Rapid Answer Panel"
              body="The salient history at a glance. Pre-extracted answers to the standard endometriosis questions, each with a source link. Designed for a thirty-second consult window."
              ctaLabel="Open clinician view"
              href="/cdss"
              accentClass="bg-[var(--color-brand-aubergine)]"
              hoverClass="hover:border-[var(--color-brand-aubergine)]"
              illustration={null}
              dark
            />
          </div>
        </div>
      </section>
    </>
  );
}

function Pillar({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="bg-[var(--color-brand-cream)] rounded-[18px] p-8">
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-brand-clay)] font-semibold mb-3">
        {eyebrow}
      </p>
      <h3 className="font-display text-2xl font-bold text-[var(--color-brand-aubergine)] leading-tight mb-3">
        {title}
      </h3>
      <p className="text-[var(--color-brand-stone)] leading-relaxed">{body}</p>
    </div>
  );
}

function PathCard({
  eyebrow,
  title,
  body,
  ctaLabel,
  href,
  accentClass,
  hoverClass,
  illustration,
  dark,
}: {
  eyebrow: string;
  title: string;
  body: string;
  ctaLabel: string;
  href: string;
  accentClass: string;
  hoverClass: string;
  illustration: React.ReactNode;
  dark?: boolean;
}) {
  const bg = dark ? "bg-[var(--color-brand-aubergine)]" : "bg-white";
  const fg = dark ? "text-white" : "text-[var(--color-brand-aubergine)]";
  const subtle = dark ? "text-white/75" : "text-[var(--color-brand-stone)]";
  return (
    <Link
      href={href}
      className={`group relative overflow-hidden ${bg} ${fg} border border-[var(--color-brand-sand)] ${hoverClass} rounded-[24px] p-10 transition-colors min-h-[320px] flex flex-col justify-between`}
    >
      <div className="relative z-10">
        <p className={`text-xs uppercase tracking-[0.22em] font-semibold mb-3 ${dark ? "text-white/70" : "text-[var(--color-brand-clay)]"}`}>
          {eyebrow}
        </p>
        <h3 className="font-display text-3xl font-extrabold leading-tight mb-4 max-w-md">
          {title}
        </h3>
        <p className={`${subtle} leading-relaxed max-w-md`}>{body}</p>
      </div>
      <div className="relative z-10 mt-8">
        <span
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] font-semibold ${accentClass} text-white group-hover:gap-3 transition-all`}
        >
          {ctaLabel} →
        </span>
      </div>
      {illustration}
    </Link>
  );
}
