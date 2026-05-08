import Link from "next/link";
import { journalEntries, type JournalEntry } from "@/lib/mock/patient";

const PHASE_LABEL: Record<string, string> = {
  menstrual: "Period",
  follicular: "Follicular",
  ovulatory: "Ovulatory",
  luteal: "Luteal",
};

const PHASE_DOT: Record<string, string> = {
  menstrual: "bg-[var(--color-brand-red)]",
  follicular: "bg-[var(--color-brand-sand)]",
  ovulatory: "bg-[var(--color-brand-sage)]",
  luteal: "bg-[var(--color-brand-plum)]",
};

function painBg(vas: number) {
  if (vas <= 2) return "bg-[#F4ECE3]";
  if (vas <= 4) return "bg-[#F4DDD0]";
  if (vas <= 6) return "bg-[#E7B59B]";
  if (vas <= 8) return "bg-[#C9892C]";
  return "bg-[var(--color-brand-clay)]";
}

export default function JournalPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12 lg:py-16">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-[var(--color-brand-stone)] mb-2">
            Journal
          </p>
          <h1 className="font-display font-extrabold text-[var(--color-brand-aubergine)] tracking-[-0.02em] leading-[1.05] mb-3" style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)" }}>
            Last 14 days
          </h1>
          <p className="text-[var(--color-brand-stone)] max-w-xl">
            Speak in your own words — Endo turns it into a structured entry
            you can review. You can also tap through a quick form when
            speaking isn&apos;t practical.
          </p>
        </div>
        <Link
          href="/portal/journal/new"
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-[var(--color-brand-clay)] text-white font-semibold hover:bg-[var(--color-brand-clay-deep)] transition-colors"
        >
          New entry
        </Link>
      </div>

      {/* Cycle-overlay heatmap */}
      <section className="bg-white border border-[var(--color-brand-sand)] rounded-[14px] p-5 mb-6">
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-brand-stone)] mb-3">
          Pain by day (darker = worse)
        </p>
        <div className="flex gap-1 flex-wrap">
          {[...journalEntries].reverse().map((e) => (
            <div
              key={e.id}
              title={`${e.date} · cycle day ${e.cycleDay} · pain ${e.painVas}/10`}
              className={`relative h-12 w-12 rounded-md ${painBg(e.painVas)} flex flex-col items-center justify-center`}
            >
              <span className="text-xs font-mono text-[var(--color-brand-aubergine)]">
                {e.cycleDay}
              </span>
              <span className="text-[10px] text-[var(--color-brand-aubergine)]">
                {e.painVas}
              </span>
              <span
                className={`absolute -top-1 -right-1 h-2 w-2 rounded-full ${PHASE_DOT[e.cyclePhase]}`}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-4 text-xs text-[var(--color-brand-stone)] mt-3">
          <Legend label="Period" colorClass="bg-[var(--color-brand-red)]" />
          <Legend label="Follicular" colorClass="bg-[var(--color-brand-sand)]" />
          <Legend label="Ovulatory" colorClass="bg-[var(--color-brand-sage)]" />
          <Legend label="Luteal" colorClass="bg-[var(--color-brand-plum)]" />
        </div>
      </section>

      {/* Entry list */}
      <section className="space-y-3">
        {journalEntries.map((e) => (
          <EntryCard key={e.id} entry={e} />
        ))}
      </section>
    </div>
  );
}

function EntryCard({ entry }: { entry: JournalEntry }) {
  return (
    <article className="bg-white border border-[var(--color-brand-sand)] rounded-[14px] p-5">
      <header className="flex items-start justify-between gap-4 mb-2">
        <div>
          <p className="font-display text-base font-bold text-[var(--color-brand-aubergine)]">
            {formatDate(entry.date)} · {PHASE_LABEL[entry.cyclePhase]}, day{" "}
            {entry.cycleDay}
          </p>
          <p className="text-sm text-[var(--color-brand-stone)]">
            Pain {entry.painVas}/10 · Fatigue {entry.fatigueVas}/10
          </p>
        </div>
        <span className="text-xs uppercase tracking-wider text-[var(--color-brand-stone)] shrink-0">
          {entry.source === "voice" ? "Voice entry" : "Quick tap"}
        </span>
      </header>

      {entry.source === "voice" && entry.transcript && (
        <blockquote className="text-sm text-[var(--color-brand-aubergine)] italic border-l-2 border-[var(--color-brand-sand)] pl-3 mb-3">
          &ldquo;{entry.transcript}&rdquo;
        </blockquote>
      )}

      <div className="flex items-center gap-2 mb-2">
        <span className="ai-label">AI summary</span>
        <span className="text-xs text-[var(--color-brand-stone)]">
          You confirmed this on {formatDate(entry.date)}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-[var(--color-brand-aubergine)] mb-3">
        {entry.patientPlainSummary}
      </p>

      {(entry.painLocations.length > 0 ||
        entry.bowelSymptoms.length > 0 ||
        entry.bladderSymptoms.length > 0 ||
        entry.dyspareunia ||
        entry.bleedingHeaviness !== "none") && (
        <div className="flex flex-wrap gap-1.5">
          {entry.painLocations.map((loc) => (
            <Tag key={loc}>Pain · {loc}</Tag>
          ))}
          {entry.bowelSymptoms.map((s) => (
            <Tag key={`bw-${s}`}>Bowel · {s}</Tag>
          ))}
          {entry.bladderSymptoms.map((s) => (
            <Tag key={`bl-${s}`}>Bladder · {s}</Tag>
          ))}
          {entry.dyspareunia && <Tag>Pain during sex</Tag>}
          {entry.bleedingHeaviness !== "none" && (
            <Tag>Bleeding · {entry.bleedingHeaviness.replace("_", " ")}</Tag>
          )}
        </div>
      )}

      {entry.notes && (
        <p className="text-xs text-[var(--color-brand-stone)] mt-3">
          Note: {entry.notes}
        </p>
      )}
    </article>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[var(--color-brand-blush)] text-[var(--color-brand-aubergine)] text-xs font-medium">
      {children}
    </span>
  );
}

function Legend({ label, colorClass }: { label: string; colorClass: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${colorClass}`} />
      {label}
    </span>
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
