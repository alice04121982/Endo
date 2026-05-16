import Link from "next/link";
import {
  TODAY,
  patient,
  journalEntries,
  pbacThisCycle,
  consentTokens,
  ehpScores,
} from "@/lib/mock/patient";

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
    <div className="max-w-5xl mx-auto px-6 lg:px-10 py-10">
      <header className="border-b border-[var(--color-brand-sand)] pb-5 mb-8">
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-brand-stone)] mb-2">
          Hello, {patient.givenName}
        </p>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--color-brand-aubergine)] mb-2">
          How are you feeling today?
        </h1>
        <p className="text-sm text-[var(--color-brand-stone)]">
          Cycle day {today?.cycleDay ?? "—"} ·{" "}
          {today ? PHASE_LABEL[today.cyclePhase] : "—"} phase
        </p>
        <div className="flex flex-wrap gap-2 mt-5">
          <Link
            href="/portal/journal/new"
            className="inline-flex items-center px-4 py-2 rounded-[8px] bg-[var(--color-brand-clay)] text-white text-sm font-semibold hover:bg-[var(--color-brand-clay-deep)] transition-colors"
          >
            Voice entry
          </Link>
          <Link
            href="/portal/journal/quick"
            className="inline-flex items-center px-4 py-2 rounded-[8px] border border-[var(--color-brand-sand)] bg-white text-[var(--color-brand-aubergine)] text-sm font-semibold hover:border-[var(--color-brand-clay)] transition-colors"
          >
            Quick form
          </Link>
        </div>
      </header>

      {/* At-a-glance row */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-5 mb-10 pb-8 border-b border-[var(--color-brand-sand)]">
        <Stat
          label="Today's pain"
          value={today ? `${today.painVas}` : "—"}
          unit="/10"
        />
        <Stat
          label="Cycle"
          value={today ? `Day ${today.cycleDay}` : "—"}
          sub={today ? PHASE_LABEL[today.cyclePhase] : ""}
        />
        <Stat
          label="This cycle's bleeding"
          value={`${pbacThisCycle}`}
          unit=" PBAC"
          sub={pbacThisCycle > 100 ? "Heavy — discuss with your clinician" : "Within typical range"}
          attention={pbacThisCycle > 100}
        />
        <Stat
          label="EHP-30 (May)"
          value={`${lastEhp.pain}`}
          sub="Pain scale · higher = harder day"
        />
      </section>

      {/* Recent entries + sharing */}
      <section className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7">
          <div className="flex items-end justify-between mb-3">
            <h2 className="text-base font-semibold text-[var(--color-brand-aubergine)]">
              Recent entries
            </h2>
            <Link
              href="/portal/journal"
              className="text-sm font-medium text-[var(--color-brand-clay)] hover:underline"
            >
              See all →
            </Link>
          </div>
          <ul className="divide-y divide-[var(--color-brand-sand)] border-y border-[var(--color-brand-sand)]">
            {recent.map((e) => (
              <li
                key={e.id}
                className="py-3 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--color-brand-aubergine)]">
                    {formatDate(e.date)} · pain {e.painVas}/10
                  </p>
                  <p className="text-xs text-[var(--color-brand-stone)] truncate">
                    {e.patientPlainSummary}
                  </p>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-[var(--color-brand-stone)] shrink-0">
                  {e.source === "voice" ? "Voice" : "Tap"}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <aside className="lg:col-span-5 space-y-4">
          <Link
            href="/portal/dossier"
            className="block bg-white border border-[var(--color-brand-sand)] rounded-[10px] p-5 hover:border-[var(--color-brand-clay)] transition-colors"
          >
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-brand-stone)] mb-1">
              Your dossier
            </p>
            <p className="text-sm font-semibold text-[var(--color-brand-aubergine)] mb-1">
              One-page summary, ready to share
            </p>
            <p className="text-xs text-[var(--color-brand-stone)] leading-relaxed">
              Generated from your entries and documents. Updated this morning.
            </p>
          </Link>
          <Link
            href="/portal/share"
            className="block bg-white border border-[var(--color-brand-sand)] rounded-[10px] p-5 hover:border-[var(--color-brand-clay)] transition-colors"
          >
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-brand-stone)] mb-1">
              Sharing
            </p>
            <p className="text-sm font-semibold text-[var(--color-brand-aubergine)] mb-1">
              {activeShares} active access{activeShares === 1 ? "" : "es"}
            </p>
            <p className="text-xs text-[var(--color-brand-stone)] leading-relaxed">
              Manage who can see your record and for how long.
            </p>
          </Link>
        </aside>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  unit,
  sub,
  attention,
}: {
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  attention?: boolean;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-brand-stone)] mb-1">
        {label}
      </p>
      <p className="font-display text-xl font-semibold text-[var(--color-brand-aubergine)] tracking-tight tabular-nums">
        {value}
        {unit && (
          <span className="text-sm font-medium text-[var(--color-brand-stone)] ml-0.5">
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
