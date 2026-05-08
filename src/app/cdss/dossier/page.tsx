import { getCurrentUser } from "@/lib/auth/current-user";
import { getActiveClinicianAccess } from "@/lib/auth/consent";
import { readLatestRender } from "@/lib/clinical/csd";
import { dossierClinicianView as MOCK_VIEW, patient as MOCK_PATIENT } from "@/lib/mock/patient";
import type { Citation } from "@/lib/llm/types";

export default async function ClinicianDossierPage() {
  const user = await getCurrentUser();
  const isClinician = user?.role === "clinician";
  const access = isClinician ? await getActiveClinicianAccess() : null;

  let body = MOCK_VIEW.body;
  let citations: Citation[] = MOCK_VIEW.citations.map((c) => ({
    kind: "source_data",
    sourceId: c.sourceId,
    label: c.label,
  }));
  let generatedAt = MOCK_VIEW.generatedAt;
  let patientLabel = `${MOCK_PATIENT.familyName}, ${MOCK_PATIENT.givenName} · ${MOCK_PATIENT.age}`;
  let live = false;
  let waiting = false;

  if (isClinician && access) {
    patientLabel = access.patientDisplayName;
    const cached = await readLatestRender(access.token.patientSubjectId, "clinician");
    if (cached) {
      body = cached.body;
      citations = cached.citations;
      generatedAt = cached.generatedAt;
      live = true;
    } else {
      waiting = true;
    }
  }

  const generated = new Date(generatedAt);

  return (
    <div className="max-w-5xl mx-auto px-6 lg:px-10 py-12">
      <header className="border-b border-border pb-3 mb-6">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-1">
          Cumulative Symptom Dossier · Clinician
        </p>
        <div className="flex flex-wrap items-baseline justify-between gap-x-6">
          <h1 className="font-display text-2xl font-bold tracking-tight">
            {patientLabel}
          </h1>
          <p className="text-xs text-muted-foreground">
            {live ? "Generated" : "Demo"}{" "}
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

      {waiting ? (
        <article className="bg-card border border-dashed border-border rounded-[10px] p-8 text-sm text-muted-foreground">
          The patient hasn&apos;t generated a current dossier. Ask them to
          regenerate from their portal, or check back later.
        </article>
      ) : (
        <>
          <article>
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
              {body}
            </pre>
          </article>

          <section className="mt-8 pt-4 border-t border-border">
            <h2 className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">
              Citations
            </h2>
            <ul className="text-xs space-y-0.5">
              {citations.map((c, i) => (
                <li key={i} className="text-muted-foreground">
                  <code className="font-mono">
                    {c.kind === "guideline" ? c.reference : c.sourceId}
                  </code>{" "}
                  — {c.label}
                </li>
              ))}
            </ul>
          </section>

          <div className="flex gap-2 mt-8">
            <button
              disabled
              className="px-3 py-1.5 rounded-[6px] bg-muted text-muted-foreground text-sm font-semibold cursor-not-allowed"
              title="FHIR export — coming next"
            >
              Export FHIR bundle
            </button>
            <button
              disabled
              className="px-3 py-1.5 rounded-[6px] border border-border bg-card text-sm font-semibold text-muted-foreground cursor-not-allowed"
              title="Print PDF — coming next"
            >
              Print PDF
            </button>
          </div>
        </>
      )}
    </div>
  );
}
