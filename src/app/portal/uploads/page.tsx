import { documents } from "@/lib/mock/patient";

const KIND_LABEL: Record<string, string> = {
  tvs_report: "Ultrasound",
  blood_test: "Blood test",
  gp_letter: "GP letter",
  operative_note: "Operative note",
  histology: "Histology",
  biomarker_report: "Biomarker test",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Awaiting extraction",
  ai_extracted_pending_review: "AI-extracted, please verify",
  clinician_confirmed: "Reviewed by clinician",
};

export default function UploadsPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-10 py-12 lg:py-16">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-[var(--color-brand-stone)] mb-2">
            Documents
          </p>
          <h1 className="font-display font-extrabold text-[var(--color-brand-aubergine)] tracking-[-0.02em] leading-[1.05] mb-3" style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)" }}>
            Your documents
          </h1>
          <p className="text-[var(--color-brand-stone)] max-w-2xl">
            Upload imaging reports, blood tests, operative notes, or private
            biomarker test reports. Endo extracts the structure into your
            record and keeps the original alongside.
          </p>
        </div>
        <button
          type="button"
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-[var(--color-brand-clay)] text-white font-semibold hover:bg-[var(--color-brand-clay-deep)] transition-colors"
        >
          Upload
        </button>
      </div>

      <ul className="space-y-3">
        {documents.map((d) => (
          <li
            key={d.id}
            className="bg-white border border-[var(--color-brand-sand)] rounded-[14px] p-5"
          >
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <p className="font-display font-bold text-[var(--color-brand-aubergine)]">
                  {KIND_LABEL[d.kind]} — {formatDate(d.performedAt)}
                </p>
                <p className="text-sm text-[var(--color-brand-stone)]">
                  {d.source}
                </p>
              </div>
              <span
                className={
                  "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 " +
                  (d.extractionStatus === "clinician_confirmed"
                    ? "bg-[var(--color-brand-cream)] text-[var(--color-brand-sage)]"
                    : d.extractionStatus === "ai_extracted_pending_review"
                    ? "bg-[var(--color-brand-blush)] text-[var(--color-brand-aubergine)]"
                    : "bg-[var(--color-brand-cream)] text-[var(--color-brand-stone)]")
                }
              >
                {STATUS_LABEL[d.extractionStatus]}
              </span>
            </div>
            {d.extractionStatus !== "pending" && (
              <div className="mt-3">
                {d.extractionStatus === "ai_extracted_pending_review" && (
                  <span className="ai-label mb-2">AI-extracted</span>
                )}
                <p className="text-sm leading-relaxed text-[var(--color-brand-aubergine)] mt-2">
                  {d.extractedSummary}
                </p>
              </div>
            )}
            <p className="text-xs text-[var(--color-brand-stone)] mt-3">
              {d.filename} · uploaded {formatDate(d.uploadedAt)}
            </p>
          </li>
        ))}
      </ul>

      <p className="text-xs text-[var(--color-brand-stone)] mt-6 max-w-2xl">
        Anything Endo extracts is labelled <em>AI-extracted, please verify</em>{" "}
        until a clinician reviews it. The original document is always kept
        alongside.
      </p>
    </div>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
