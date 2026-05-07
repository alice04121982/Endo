import Link from "next/link";
import {
  TODAY,
  patient,
  journalEntries,
  pbacThisCycle,
  consentTokens,
  ehpScores,
} from "@/lib/mock/patient";
import { Arches, CycleWave, LinkedCircles } from "@/components/illustrations";

const PHASE_LABEL: Record<string, string> = {
  menstrual: "Period",
  follicular: "Follicular",
  ovulatory: "Ovulatory",
  luteal: "Luteal",
};

export default function PortalHome() {
  const today = journalEntries.find((e) => e.date === TODAY);
  const recent = journalEntries.slice(0, 4);
  const activeShares = consentTokens.filter((t) => t.status === "active").length;
  const lastEhp = ehpScores[ehpScores.length - 1];

  return (
    <>
      {/* Hero strip */}
      <section className="relative overflow-hidden bg-[var(--color-brand-cream)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-16 pb-12 grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 relative z-10">
            <p className="text-sm uppercase tracking-[0.22em] text-[var(--color-brand-stone)] mb-3">
              Hello, {patient.givenName}
            </p>
            <h1
              className="font-display font-extrabold text-[var(--color-brand-aubergine)] leading-[1.05] tracking-[-0.02em] mb-6"
              style={{ fontSize: "clamp(2.25rem, 5vw, 4rem)" }}
            >
              How are you feeling today?
            </h1>
            <p className="text-lg text-[var(--color-brand-stone)] leading-relaxed mb-8 max-w-xl">
              You&apos;re on cycle day {today?.cycleDay ?? "—"} ·{" "}
              {today ? PHASE_LABEL[today.cyclePhase] : "—"} phase. Tell Endo
              about your day in your own words.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/portal/journal/new"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-[12px] bg-[var(--color-brand-clay)] text-white font-semibold hover:bg-[var(--color-brand-clay-deep)] transition-colors"
              >
                Start a voice entry
              </Link>
              <Link
                href="/portal/journal"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-[12px] border border-[var(--color-brand-sand)] bg-white text-[var(--color-brand-aubergine)] font-semibold hover:border-[var(--color-brand-clay)] transition-colors"
              >
                Open journal
              </Link>
            </div>
          </div>
          <div className="lg:col-span-5 relative">
            <Arches className="w-full max-w-[400px] mx-auto" />
          </div>
        </div>
        <div className="pointer-events-none">
          <CycleWave className="w-full h-12" />
        </div>
      </section>

      {/* At-a-glance stat row */}
      <section className="bg-white border-y border-[var(--color-brand-sand)]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          <Stat
            eyebrow="Today's pain"
            value={today ? `${today.painVas}` : "—"}
            unit="/10"
            sub={today ? PHASE_LABEL[today.cyclePhase] : ""}
          />
          <Stat
            eyebrow="Cycle"
            value={today ? `Day ${today.cycleDay}` : "—"}
            unit=""
            sub={today ? PHASE_LABEL[today.cyclePhase] : ""}
          />
          <Stat
            eyebrow="This cycle's bleeding"
            value={`${pbacThisCycle}`}
            unit=" PBAC"
            sub={pbacThisCycle > 100 ? "Heavy — discuss with your clinician" : "Within typical range"}
            attention={pbacThisCycle > 100}
          />
          <Stat
            eyebrow="EHP-30 (May)"
            value={`${lastEhp.pain}`}
            unit=" pain"
            sub="Higher = harder day"
          />
        </div>
      </section>

      {/* Recent entries + sharing */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-16 grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-[var(--color-brand-stone)] mb-2">
                Recent entries
              </p>
              <h2 className="font-display text-3xl font-extrabold text-[var(--color-brand-aubergine)] tracking-tight">
                Last few days
              </h2>
            </div>
            <Link
              href="/portal/journal"
              className="text-sm font-semibold text-[var(--color-brand-clay)] hover:underline"
            >
              See all →
            </Link>
          </div>
          <ul className="space-y-3">
            {recent.map((e) => (
              <li
                key={e.id}
                className="bg-white border border-[var(--color-brand-sand)] rounded-[16px] p-6 hover:border-[var(--color-brand-clay)] transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-display font-bold text-[var(--color-brand-aubergine)]">
                    {formatDate(e.date)} · pain {e.painVas}/10
                  </p>
                  <span className="text-xs uppercase tracking-wider text-[var(--color-brand-stone)] shrink-0">
                    {e.source === "voice" ? "Voice" : "Tap"}
                  </span>
                </div>
                <p className="text-sm text-[var(--color-brand-stone)] leading-relaxed line-clamp-2">
                  {e.patientPlainSummary}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-5 space-y-4">
          <Link
            href="/portal/dossier"
            className="block bg-[var(--color-brand-aubergine)] text-white rounded-[20px] p-7 hover:opacity-95 transition-opacity"
          >
            <p className="text-xs uppercase tracking-[0.22em] font-semibold text-white/70 mb-3">
              Your dossier
            </p>
            <h3 className="font-display text-2xl font-extrabold leading-tight mb-3">
              A summary your clinician can read in thirty seconds
            </h3>
            <p className="text-white/80 text-sm leading-relaxed mb-4">
              Generated from your entries and documents. Updated this morning.
              Anchored to NICE NG73.
            </p>
            <span className="inline-flex items-center gap-2 text-sm font-semibold">
              Open dossier →
            </span>
          </Link>

          <Link
            href="/portal/share"
            className="block relative overflow-hidden bg-[var(--color-brand-blush)] rounded-[20px] p-7 hover:opacity-95 transition-opacity"
          >
            <p className="text-xs uppercase tracking-[0.22em] font-semibold text-[var(--color-brand-clay)] mb-3">
              Sharing
            </p>
            <h3 className="font-display text-2xl font-extrabold leading-tight mb-3 text-[var(--color-brand-aubergine)]">
              {activeShares} active access{activeShares === 1 ? "" : "es"}
            </h3>
            <p className="text-[var(--color-brand-aubergine)]/80 text-sm leading-relaxed">
              Manage who can see your record and for how long. Endo never
              auto-shares.
            </p>
            <LinkedCircles className="absolute -right-8 -bottom-6 w-44 h-24 opacity-60 pointer-events-none" />
          </Link>
        </div>
      </section>
    </>
  );
}

function Stat({
  eyebrow,
  value,
  unit,
  sub,
  attention,
}: {
  eyebrow: string;
  value: string;
  unit?: string;
  sub?: string;
  attention?: boolean;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-brand-stone)] mb-2">
        {eyebrow}
      </p>
      <p className="font-display text-3xl font-extrabold text-[var(--color-brand-aubergine)] tracking-tight">
        {value}
        {unit && (
          <span className="text-base font-semibold text-[var(--color-brand-stone)] ml-0.5">
            {unit}
          </span>
        )}
      </p>
      {sub && (
        <p
          className={`text-xs mt-1 ${
            attention ? "text-[var(--color-brand-clay)] font-semibold" : "text-[var(--color-brand-stone)]"
          }`}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}
