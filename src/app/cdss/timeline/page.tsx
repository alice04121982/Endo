import { journalEntries, patient, type JournalEntry } from "@/lib/mock/patient";

const PHASE_LABEL: Record<string, string> = {
  menstrual: "Menstrual",
  follicular: "Follicular",
  ovulatory: "Ovulatory",
  luteal: "Luteal",
};

export default function ClinicianTimeline() {
  return (
    <div className="max-w-5xl mx-auto px-6 lg:px-10 py-8">
      <header className="border-b border-border pb-3 mb-4 flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-1">
            Timeline · {patient.familyName}, {patient.givenName}
          </p>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            14-day journal
          </h1>
        </div>
        <p className="text-xs text-muted-foreground">
          Source data behind Rapid Answer Panel
        </p>
      </header>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-[0.14em] text-muted-foreground border-b border-border">
            <th className="font-semibold pb-2 pr-4">Date</th>
            <th className="font-semibold pb-2 pr-4">Cycle</th>
            <th className="font-semibold pb-2 pr-4">VAS</th>
            <th className="font-semibold pb-2 pr-4">Bleeding</th>
            <th className="font-semibold pb-2 pr-4">Notes</th>
            <th className="font-semibold pb-2">Source</th>
          </tr>
        </thead>
        <tbody>
          {journalEntries.map((e) => (
            <Row key={e.id} entry={e} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Row({ entry }: { entry: JournalEntry }) {
  const symptomBits: string[] = [];
  if (entry.painLocations.length) symptomBits.push(`Loc: ${entry.painLocations.join(", ")}`);
  if (entry.bowelSymptoms.length) symptomBits.push(`Bowel: ${entry.bowelSymptoms.join(", ")}`);
  if (entry.bladderSymptoms.length) symptomBits.push(`Bladder: ${entry.bladderSymptoms.join(", ")}`);
  if (entry.dyspareunia) symptomBits.push("Dyspareunia");

  return (
    <tr className="border-b border-border align-top">
      <td className="py-2 pr-4 font-mono text-xs text-muted-foreground whitespace-nowrap">
        {formatDate(entry.date)}
      </td>
      <td className="py-2 pr-4 text-xs text-muted-foreground whitespace-nowrap">
        D{entry.cycleDay} · {PHASE_LABEL[entry.cyclePhase]}
      </td>
      <td className="py-2 pr-4 font-mono">
        {entry.painVas}/10
      </td>
      <td className="py-2 pr-4 text-xs text-muted-foreground whitespace-nowrap">
        {entry.bleedingHeaviness === "none" ? "—" : entry.bleedingHeaviness.replace("_", " ")}
      </td>
      <td className="py-2 pr-4 text-xs text-muted-foreground">
        {symptomBits.join(" · ") || "—"}
      </td>
      <td className="py-2 text-xs text-muted-foreground">
        {entry.source === "voice" ? "Voice" : "Tap"}
      </td>
    </tr>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}
