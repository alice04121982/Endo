"use client";

import { useActionState } from "react";
import { addImagingReportText, type AddImagingState } from "./actions";

const INITIAL_STATE: AddImagingState = { kind: "idle" };

export function UploadForm() {
  const [state, formAction, pending] = useActionState(
    addImagingReportText,
    INITIAL_STATE,
  );

  return (
    <form
      action={formAction}
      className="bg-white border border-[var(--color-brand-sand)] rounded-[14px] p-5 mb-8"
    >
      <p className="font-display font-bold text-[var(--color-brand-aubergine)] mb-1">
        Add an imaging report
      </p>
      <p className="text-sm text-[var(--color-brand-stone)] mb-4">
        Paste the body of a transvaginal ultrasound or pelvic MRI report below.
        Endo extracts the findings and surfaces them in your record. PDF and
        photo upload coming soon.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <label className="text-sm">
          <span className="block text-[var(--color-brand-stone)] mb-1">
            Modality
          </span>
          <select
            name="kind"
            required
            defaultValue="tvs_report"
            className="w-full border border-[var(--color-brand-sand)] rounded-[10px] px-3 py-2 bg-white"
          >
            <option value="tvs_report">Transvaginal ultrasound (TVS)</option>
            <option value="mri_report">Pelvic MRI</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="block text-[var(--color-brand-stone)] mb-1">
            Study date (optional)
          </span>
          <input
            type="date"
            name="performedAt"
            className="w-full border border-[var(--color-brand-sand)] rounded-[10px] px-3 py-2 bg-white"
          />
        </label>
      </div>

      <label className="text-sm block mb-3">
        <span className="block text-[var(--color-brand-stone)] mb-1">
          Hospital or radiologist (optional)
        </span>
        <input
          type="text"
          name="source"
          maxLength={200}
          className="w-full border border-[var(--color-brand-sand)] rounded-[10px] px-3 py-2 bg-white"
          placeholder="e.g. Cambridge University Hospitals"
        />
      </label>

      <label className="text-sm block mb-3">
        <span className="block text-[var(--color-brand-stone)] mb-1">
          Report text
        </span>
        <textarea
          name="rawText"
          required
          minLength={50}
          maxLength={40_000}
          rows={10}
          className="w-full border border-[var(--color-brand-sand)] rounded-[10px] px-3 py-2 bg-white font-mono text-xs leading-relaxed"
          placeholder="Paste the findings and conclusion sections from your imaging report here."
        />
      </label>

      <input type="hidden" name="filename" value="Pasted imaging report" />

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-[var(--color-brand-clay)] text-white font-semibold hover:bg-[var(--color-brand-clay-deep)] transition-colors disabled:opacity-50"
        >
          {pending ? "Extracting…" : "Upload and extract"}
        </button>
        {state.kind === "error" && (
          <p className="text-sm text-[var(--color-brand-red)]">{state.message}</p>
        )}
        {state.kind === "success" &&
          state.extractionStatus === "ai_extracted_pending_review" && (
            <p className="text-sm text-[var(--color-brand-sage)]">
              Report extracted. Review it in the list below.
            </p>
          )}
        {state.kind === "success" &&
          state.extractionStatus === "extraction_failed" && (
            <p className="text-sm text-[var(--color-brand-red)]">
              Extraction failed — the report is stored but couldn&apos;t be
              parsed. Your clinician can read the raw text.
            </p>
          )}
      </div>
    </form>
  );
}
