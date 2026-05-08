import { auditRows } from "@/lib/mock/patient";

const TASK_LABEL: Record<string, string> = {
  "extract-symptom-from-voice": "Voice → structured symptom",
  "synth-csd-section": "CSD section",
  "clinician-freetext-qa": "Free-text query",
};

const OUTCOME_LABEL: Record<string, string> = {
  success: "Success",
  refused_diagnostic_conclusion: "Refused — diagnostic",
  validation_failed: "Validation failed",
};

export default function AuditPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-10 py-8">
      <header className="border-b border-border pb-3 mb-4 flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-1">
            Audit
          </p>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            AI call log
          </h1>
        </div>
        <p className="text-xs text-muted-foreground">
          Append-only · hash-chained · tamper-evident
        </p>
      </header>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-[0.14em] text-muted-foreground border-b border-border">
            <th className="font-semibold pb-2 pr-4">When</th>
            <th className="font-semibold pb-2 pr-4">Task</th>
            <th className="font-semibold pb-2 pr-4">Audience</th>
            <th className="font-semibold pb-2 pr-4">Model</th>
            <th className="font-semibold pb-2 pr-4">Outcome</th>
            <th className="font-semibold pb-2">Hash</th>
          </tr>
        </thead>
        <tbody>
          {auditRows.map((r) => (
            <tr key={r.id} className="border-b border-border align-top">
              <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground whitespace-nowrap">
                {formatDateTime(r.createdAt)}
              </td>
              <td className="py-2.5 pr-4 text-sm">
                {TASK_LABEL[r.taskName] ?? r.taskName}
              </td>
              <td className="py-2.5 pr-4 text-sm capitalize text-muted-foreground">
                {r.audience}
              </td>
              <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground">
                {r.modelId}
              </td>
              <td className="py-2.5 pr-4">
                <span
                  className={
                    r.outcome === "success"
                      ? "text-muted-foreground"
                      : r.outcome === "refused_diagnostic_conclusion"
                      ? "text-[var(--color-brand-red)] font-semibold"
                      : "text-[var(--color-clinician-amber)] font-semibold"
                  }
                >
                  {OUTCOME_LABEL[r.outcome]}
                </span>
                {r.refusalReason && (
                  <p className="text-xs text-muted-foreground mt-0.5 max-w-md italic">
                    {r.refusalReason}
                  </p>
                )}
              </td>
              <td className="py-2.5 font-mono text-xs text-muted-foreground">
                {r.rowHashTrunc}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="text-xs text-muted-foreground mt-6 font-mono">
        select public.llm_audit_log_verify_chain();
      </p>
    </div>
  );
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
