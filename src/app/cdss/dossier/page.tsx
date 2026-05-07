import { dossierClinicianView, patient } from "@/lib/mock/patient";

export default function ClinicianDossierPage() {
  const generated = new Date(dossierClinicianView.generatedAt);
  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-10 py-8">
      <header className="border-b border-border pb-3 mb-6">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-1">
          Cumulative Symptom Dossier · Clinician
        </p>
        <div className="flex flex-wrap items-baseline justify-between gap-x-6">
          <h1 className="font-display text-2xl font-bold tracking-tight">
            {patient.familyName}, {patient.givenName}
            <span className="ml-2 font-normal text-base text-muted-foreground">
              {patient.age}
            </span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Generated{" "}
            {generated.toLocaleString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            · same data as patient view
            <span className="ai-label ml-2">AI-generated</span>
          </p>
        </div>
      </header>

      <article>
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
          {dossierClinicianView.body}
        </pre>
      </article>

      <section className="mt-8 pt-4 border-t border-border">
        <h2 className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">
          Citations
        </h2>
        <ul className="text-xs space-y-0.5">
          {dossierClinicianView.citations.map((c) => (
            <li key={c.sourceId} className="text-muted-foreground">
              <code className="font-mono">{c.sourceId}</code> — {c.label}
            </li>
          ))}
        </ul>
      </section>

      <div className="flex gap-2 mt-8">
        <button className="px-3 py-1.5 rounded-[6px] bg-primary text-primary-foreground text-sm font-semibold">
          Export FHIR bundle
        </button>
        <button className="px-3 py-1.5 rounded-[6px] border border-border bg-card text-sm font-semibold hover:border-primary transition-colors">
          Print PDF
        </button>
      </div>
    </div>
  );
}
