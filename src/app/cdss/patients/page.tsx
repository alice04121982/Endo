import Link from "next/link";
import { patient, pbacThisCycle } from "@/lib/mock/patient";

const PATIENTS = [
  {
    id: patient.id,
    name: `${patient.familyName}, ${patient.givenName}`,
    age: patient.age,
    pronouns: patient.pronouns,
    headline: "Suspected endometriosis · adenomyosis co-consideration",
    pbac: pbacThisCycle,
    expires: "12 May 2026",
    flags: ["MRI gap", "PBAC > 100", "Treatment escalation"],
    lastEntry: "2026-05-07",
  },
];

export default function PatientsPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-10 py-8">
      <header className="border-b border-border pb-3 mb-4 flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-1">
            Patients
          </p>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Active access ({PATIENTS.length})
          </h1>
        </div>
        <p className="text-xs text-muted-foreground">
          Read-only by default. Patient revocable.
        </p>
      </header>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-[0.14em] text-muted-foreground border-b border-border">
            <th className="font-semibold pb-2 pr-4">Patient</th>
            <th className="font-semibold pb-2 pr-4">Headline</th>
            <th className="font-semibold pb-2 pr-4">Flags</th>
            <th className="font-semibold pb-2 pr-4">Last entry</th>
            <th className="font-semibold pb-2">Access expires</th>
          </tr>
        </thead>
        <tbody>
          {PATIENTS.map((p) => (
            <tr key={p.id} className="border-b border-border align-top">
              <td className="py-3 pr-4">
                <Link
                  href="/cdss"
                  className="font-medium hover:text-primary"
                >
                  {p.name}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {p.age} · {p.pronouns}
                </p>
              </td>
              <td className="py-3 pr-4 text-muted-foreground">{p.headline}</td>
              <td className="py-3 pr-4">
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-[var(--color-brand-red)] font-semibold">
                  {p.flags.map((f) => (
                    <span key={f} className="inline-flex items-center gap-1">
                      <span className="h-1 w-1 rounded-full bg-[var(--color-brand-red)]" />
                      {f}
                    </span>
                  ))}
                </div>
              </td>
              <td className="py-3 pr-4 font-mono text-xs">{formatDate(p.lastEntry)}</td>
              <td className="py-3 font-mono text-xs">{p.expires}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}
