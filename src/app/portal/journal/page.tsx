import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listOwnJournalEntries, type JournalEntry } from "@/lib/clinical/journal";
import { describeCyclePhase } from "@/lib/clinical/cycle";
import { journalEntries as MOCK_ENTRIES } from "@/lib/mock/patient";

const PHASE_DOT: Record<string, string> = {
  menstrual: "bg-[var(--color-brand-red)]",
  follicular: "bg-[var(--color-brand-sand)]",
  ovulatory: "bg-[var(--color-brand-sage)]",
  luteal: "bg-[var(--color-brand-plum)]",
  cycle_agnostic: "bg-[var(--color-brand-stone)]",
};

function painBg(vas: number | null) {
  if (vas == null) return "bg-[#F4ECE3]";
  if (vas <= 2) return "bg-[#F4ECE3]";
  if (vas <= 4) return "bg-[#F4DDD0]";
  if (vas <= 6) return "bg-[#E7B59B]";
  if (vas <= 8) return "bg-[#C9892C]";
  return "bg-[var(--color-brand-clay)]";
}

interface DisplayEntry {
  id: string;
  entryDate: string;
  cycleDay: number | null;
  cyclePhase: string;
  painVas: number | null;
  painLocations: string[];
  bowelSymptoms: string[];
  bladderSymptoms: string[];
  dyspareunia: boolean | null;
  bleedingHeaviness: string;
  fatigueVas: number | null;
  notes: string | null;
  source: "voice" | "quick_tap";
  transcript: string | null;
  patientPlainSummary: string;
}

function fromLive(e: JournalEntry): DisplayEntry {
  return {
    id: e.id,
    entryDate: e.entryDate,
    cycleDay: e.cycleDay,
    cyclePhase: e.cyclePhase,
    painVas: e.painVas,
    painLocations: e.painLocations,
    bowelSymptoms: e.bowelSymptoms,
    bladderSymptoms: e.bladderSymptoms,
    dyspareunia: e.dyspareunia,
    bleedingHeaviness: e.bleedingHeaviness,
    fatigueVas: e.fatigueVas,
    notes: e.notes,
    source: e.source,
    transcript: e.transcript,
    patientPlainSummary: e.patientPlainSummary,
  };
}

export default async function JournalPage() {
  const user = await getCurrentUser();
  const isAuthedPatient = user?.role === "patient";
  const live = isAuthedPatient ? await listOwnJournalEntries(30) : [];
  const entries: DisplayEntry[] = isAuthedPatient
    ? live.map(fromLive)
    : MOCK_ENTRIES.map((e) => ({
        id: e.id,
        entryDate: e.date,
        cycleDay: e.cycleDay,
        cyclePhase: e.cyclePhase,
        painVas: e.painVas,
        painLocations: e.painLocations,
        bowelSymptoms: e.bowelSymptoms,
        bladderSymptoms: e.bladderSymptoms,
        dyspareunia: e.dyspareunia,
        bleedingHeaviness: e.bleedingHeaviness,
        fatigueVas: e.fatigueVas,
        notes: e.notes ?? null,
        source: e.source,
        transcript: e.transcript ?? null,
        patientPlainSummary: e.patientPlainSummary,
      }));

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12 lg:py-16">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-[var(--color-brand-stone)] mb-2">
            Journal
          </p>
          <h1
            className="font-display text-2xl font-semibold tracking-tight text-[var(--color-brand-aubergine)] mb-3"
          >
            {isAuthedPatient ? "Your journal" : "Demo journal"}
          </h1>
          <p className="text-[var(--color-brand-stone)] max-w-xl">
            {isAuthedPatient
              ? entries.length === 0
                ? "Nothing logged yet. Start with a voice entry or use the form."
                : `${entries.length} ${entries.length === 1 ? "entry" : "entries"} on file.`
              : "You're viewing the demo journal. Sign in to log your own."}
          </p>
        </div>
        <div className="shrink-0 flex flex-col sm:flex-row gap-2">
          <Link
            href="/portal/journal/new"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[10px] bg-[var(--color-brand-clay)] text-white font-semibold hover:bg-[var(--color-brand-clay-deep)] transition-colors"
          >
            Voice entry
          </Link>
          <Link
            href="/portal/journal/quick"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[10px] border border-[var(--color-brand-sand)] bg-white text-[var(--color-brand-aubergine)] font-semibold hover:border-[var(--color-brand-clay)] transition-colors"
          >
            Quick form
          </Link>
        </div>
      </div>

      {/* Cycle-overlay heatmap */}
      {entries.length > 0 && (
        <section className="bg-white border border-[var(--color-brand-sand)] rounded-[14px] p-5 mb-6">
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-brand-stone)] mb-3">
            Pain by day (darker = worse)
          </p>
          <div className="flex gap-1 flex-wrap">
            {[...entries]
              .reverse()
              .map((e) => (
                <div
                  key={e.id}
                  title={`${e.entryDate} · cycle day ${e.cycleDay ?? "—"} · pain ${e.painVas ?? "—"}/10`}
                  className={`relative h-12 w-12 rounded-md ${painBg(e.painVas)} flex flex-col items-center justify-center`}
                >
                  <span className="text-xs font-mono text-[var(--color-brand-aubergine)]">
                    {e.cycleDay ?? "—"}
                  </span>
                  <span className="text-[10px] text-[var(--color-brand-aubergine)]">
                    {e.painVas ?? "—"}
                  </span>
                  <span
                    className={`absolute -top-1 -right-1 h-2 w-2 rounded-full ${
                      PHASE_DOT[e.cyclePhase] ?? PHASE_DOT.cycle_agnostic
                    }`}
                  />
                </div>
              ))}
          </div>
        </section>
      )}

      {entries.length === 0 ? (
        <div className="bg-white border border-dashed border-[var(--color-brand-sand)] rounded-[14px] p-10 text-center">
          <p className="text-[var(--color-brand-aubergine)] font-semibold mb-2">
            No entries yet
          </p>
          <p className="text-sm text-[var(--color-brand-stone)] mb-4 max-w-md mx-auto">
            Speak about how you feel, or tap through the form. Either way takes
            less than a minute.
          </p>
          <Link
            href="/portal/journal/new"
            className="inline-flex items-center px-5 py-2.5 rounded-[10px] bg-[var(--color-brand-clay)] text-white font-semibold hover:bg-[var(--color-brand-clay-deep)] transition-colors"
          >
            Start a voice entry
          </Link>
        </div>
      ) : (
        <section className="space-y-3">
          {entries.map((e) => (
            <EntryCard key={e.id} entry={e} />
          ))}
        </section>
      )}
    </div>
  );
}

function EntryCard({ entry }: { entry: DisplayEntry }) {
  return (
    <article className="bg-white border border-[var(--color-brand-sand)] rounded-[14px] p-5">
      <header className="flex items-start justify-between gap-4 mb-2">
        <div>
          <p className="font-display text-base font-bold text-[var(--color-brand-aubergine)]">
            {formatDate(entry.entryDate)} ·{" "}
            {describeCyclePhase(entry.cyclePhase as never)}
            {entry.cycleDay != null && `, day ${entry.cycleDay}`}
          </p>
          <p className="text-sm text-[var(--color-brand-stone)]">
            {entry.painVas != null && `Pain ${entry.painVas}/10`}
            {entry.fatigueVas != null && ` · Fatigue ${entry.fatigueVas}/10`}
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
        {entry.source === "voice" && <span className="ai-label">AI summary</span>}
        <span className="text-xs text-[var(--color-brand-stone)]">
          {entry.source === "voice"
            ? `You confirmed this on ${formatDate(entry.entryDate)}`
            : "Saved from the quick form"}
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

function formatDate(iso: string) {
  const d = new Date(iso.includes("T") ? iso : iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}
