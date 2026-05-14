import { getCurrentUser } from "@/lib/auth/current-user";
import {
  listOwnDocuments,
  type Document,
  type DocumentKind,
  type DocumentExtractionStatus,
} from "@/lib/clinical/documents";
import { documents as MOCK_DOCS } from "@/lib/mock/patient";
import { UploadForm } from "./upload-form";

const KIND_LABEL: Record<DocumentKind, string> = {
  tvs_report: "Ultrasound",
  mri_report: "Pelvic MRI",
  blood_test: "Blood test",
  gp_letter: "GP letter",
  operative_note: "Operative note",
  histology: "Histology",
  biomarker_report: "Biomarker test",
};

const STATUS_LABEL: Record<DocumentExtractionStatus, string> = {
  pending: "Awaiting extraction",
  ai_extracted_pending_review: "AI-extracted, please verify",
  clinician_confirmed: "Reviewed by clinician",
  extraction_failed: "Couldn't extract — stored as-is",
};

export default async function UploadsPage() {
  const user = await getCurrentUser();
  const isAuthedPatient = user?.role === "patient";

  const liveDocs = isAuthedPatient ? await listOwnDocuments(60) : [];

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-10 py-12 lg:py-16">
      <div className="mb-8">
        <p className="text-sm uppercase tracking-[0.18em] text-[var(--color-brand-stone)] mb-2">
          Documents
        </p>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--color-brand-aubergine)] mb-3">
          Your documents
        </h1>
        <p className="text-[var(--color-brand-stone)] max-w-2xl">
          {isAuthedPatient
            ? "Paste your imaging reports, blood tests, or GP letters. Endo extracts the structure into your record and feeds your dossier."
            : "Demo documents from the synthetic patient. Sign in to upload your own."}
        </p>
      </div>

      {isAuthedPatient && <UploadForm />}

      {isAuthedPatient ? (
        <LiveDocumentList docs={liveDocs} />
      ) : (
        <MockDocumentList />
      )}

      <p className="text-xs text-[var(--color-brand-stone)] mt-6 max-w-2xl">
        Anything Endo extracts is labelled <em>AI-extracted, please verify</em>{" "}
        until a clinician reviews it. The original text is always kept alongside.
      </p>
    </div>
  );
}

function LiveDocumentList({ docs }: { docs: Document[] }) {
  if (docs.length === 0) {
    return (
      <div className="bg-white border border-dashed border-[var(--color-brand-sand)] rounded-[14px] p-8 text-center">
        <p className="text-sm text-[var(--color-brand-stone)]">
          No documents in your record yet. Paste an imaging report above to get
          started.
        </p>
      </div>
    );
  }
  return (
    <ul className="space-y-3">
      {docs.map((d) => (
        <li
          key={d.id}
          className="bg-white border border-[var(--color-brand-sand)] rounded-[14px] p-5"
        >
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <p className="font-display font-bold text-[var(--color-brand-aubergine)]">
                {KIND_LABEL[d.kind]}
                {d.performedAt && ` — ${formatDate(d.performedAt)}`}
              </p>
              {d.source && (
                <p className="text-sm text-[var(--color-brand-stone)]">
                  {d.source}
                </p>
              )}
            </div>
            <StatusPill status={d.extractionStatus} />
          </div>
          {d.extractionStatus === "ai_extracted_pending_review" &&
            d.extractedSummary && (
              <div className="mt-3">
                <span className="ai-label mb-2">AI-extracted</span>
                <p className="text-sm leading-relaxed text-[var(--color-brand-aubergine)] mt-2">
                  {d.extractedSummary}
                </p>
                {d.rulePackVersion && (
                  <p className="text-xs text-[var(--color-brand-stone)] mt-2">
                    Extracted by {d.rulePackVersion}
                  </p>
                )}
              </div>
            )}
          {d.extractionStatus === "clinician_confirmed" && d.extractedSummary && (
            <p className="text-sm leading-relaxed text-[var(--color-brand-aubergine)] mt-3">
              {d.extractedSummary}
            </p>
          )}
          {d.extractionStatus === "extraction_failed" && (
            <p className="text-sm leading-relaxed text-[var(--color-brand-stone)] mt-3">
              {d.extractionError ??
                "Extraction failed. The original text is stored on the document."}
            </p>
          )}
          <p className="text-xs text-[var(--color-brand-stone)] mt-3">
            {d.filename} · uploaded {formatDate(d.createdAt.slice(0, 10))}
          </p>
        </li>
      ))}
    </ul>
  );
}

function MockDocumentList() {
  return (
    <ul className="space-y-3">
      {MOCK_DOCS.map((d) => (
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
            <StatusPill status={d.extractionStatus} />
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
  );
}

function StatusPill({ status }: { status: DocumentExtractionStatus }) {
  const cls =
    status === "clinician_confirmed"
      ? "bg-[var(--color-brand-cream)] text-[var(--color-brand-sage)]"
      : status === "ai_extracted_pending_review"
        ? "bg-[var(--color-brand-blush)] text-[var(--color-brand-aubergine)]"
        : status === "extraction_failed"
          ? "bg-[var(--color-brand-cream)] text-[var(--color-brand-red)]"
          : "bg-[var(--color-brand-cream)] text-[var(--color-brand-stone)]";
  return (
    <span
      className={
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 " +
        cls
      }
    >
      {STATUS_LABEL[status]}
    </span>
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
