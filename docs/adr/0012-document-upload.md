# ADR 0012 — Patient document upload and imaging extraction

- **Status:** accepted
- **Date:** 2026-05-14
- **Decision drivers:** Brief — feature 4: "Patient should be able to upload imaging reports, blood tests, and other documents; the platform extracts structure into the record." Build Tracker feature 4. Unblocks feature 6 deferred items (TVS / MRI inconclusive inputs to NICE rules §1.5.2 and §1.5.3) and feature 7 deferred items (JZ irregularity, bulky uterus to the adenomyosis engine).

## Context

Documents are the bridge between the patient's own evidence (journal) and the clinical evidence collected outside the platform (radiology, GP, surgery). The engines downstream — NICE NG73 rules and the adenomyosis co-detection — both reach a ceiling without imaging inputs: TVS / MRI presence and inconclusivity drive §1.5.2 / §1.5.3 directly, and JZ irregularity / bulky uterus drive two of the six adenomyosis criteria. Without document inputs both engines hover near "awaiting_data" for any real patient.

The patient's UX context matters too. Patients receive radiology reports as PDFs from NHS portals or paper copies via post. Asking them to paste the body of the report is a step they can do today; making them re-key it is not. The realistic chunk-1 surface is **typed-text input** (paste from PDF, or upload a .txt extracted by the NHS app). PDF and image OCR upload is a chunk-2 problem that requires either bringing multimodal input through the gateway or running an OCR stage server-side; both are meaningful engineering bites.

## Decision

### Storage shape (migration `008_documents.sql`)

- New table `public.documents` with `kind` enum covering the seven document categories already in the mock (TVS report, MRI report, blood test, GP letter, operative note, histology, biomarker report).
- Structural columns immutable post-insert via `BEFORE UPDATE` trigger (`id`, `patient_subject_id`, `uploaded_by`, `kind`, `filename`, `raw_text`, `created_at`, `gateway_audit_id`, `rule_pack_version`). Mirrors the journal / red-flag / consent pattern.
- `extracted jsonb` carries task-specific structured findings. For TVS / MRI documents the shape is `ImagingFindings` (typed in `documents.ts`). Future tasks (blood-test extraction, operative-note extraction) will write differently shaped JSONB into the same column.
- RLS: patient own-read / own-insert / own-update; clinician read joined through active `consent_tokens` (same pattern as `journal_entries` and `red_flag_events`). No DELETE policy — documents are sticky; patient withdrawal is a chunk-2 status-enum concern.

### Extraction (gateway task `extract-imaging-report@0.1.0`)

- Haiku tier — speed-of-extraction matters; the user is waiting for a result on the upload form.
- Input shape: `{ documentId, kind: "tvs_report" | "mri_report", rawText }`.
- Output shape: `{ summary, performedAt?, source?, findings: ImagingFindings }`. `ImagingFindings` is tri-state on the boolean fields (`true | false | null`) so the engines can distinguish "report says absent" from "report doesn't address it" — the adenomyosis engine and NICE rules each handle the three states correctly.
- The task block instructs the model to return `null` rather than guess. The diagnostic-conclusion refusal sweep applies as usual; an imaging-report extractor isn't supposed to produce diagnostic conclusions and would refuse if it tried.

### Upload flow

- `/portal/uploads` is now a server component that branches on auth.
  - Authed patient: live list from `listOwnDocuments(60)`, with the new `<UploadForm/>` client component above it.
  - Anonymous viewer: the existing mock list, unchanged.
- `<UploadForm/>` uses `useActionState` to drive `addImagingReportText`. The server action:
  1. Validates input (`zod` schema; min 50 chars / max 40k chars).
  2. Inserts a `pending` document row owned by the current user (RLS-enforced).
  3. Calls `callGateway({ task: "extract-imaging-report", ... })`. Gateway audit row is written regardless of outcome (ADR 0001).
  4. Updates the document row via the service-role client to `ai_extracted_pending_review` with the extracted findings and the gateway audit id, OR to `extraction_failed` with the failure reason. Structural columns are blocked by the trigger; only the extraction-related fields move.
  5. `revalidatePath` for `/portal/uploads`, `/portal/dossier`, `/cdss` so the new findings flow through immediately.
- Extraction runs **synchronously** in the server action. Haiku latency (1-3s) is short enough that the patient sees the result on the next render. Asynchronous extraction needs a job-queue, which we don't have; building one is its own chunk.

### Engine wiring

- `buildCSDPayloadForCurrentPatient`:
  - Loads documents in addition to journal entries.
  - Filters to imaging documents in `ai_extracted_pending_review` or `clinician_confirmed`; `pending` and `extraction_failed` documents don't contribute findings (and would be inconsistent if they did).
  - Folds tri-state findings across all imaging documents — any `true` wins, all-`false` is `false`, all-`null` is `null`. The fold means a later MRI clarifying a TVS finding can push a criterion from `awaiting_data` to `triggered` without re-uploading the TVS.
  - Calls `evaluateNiceRules` with the populated `imaging: UploadedImagingDoc[]` so §1.5.2 (TVS presence) and §1.5.3 (MRI when TVS inconclusive) can fire.
  - Calls `evaluateAdenomyosis` with `jzIrregularityOnImaging` and `bulkyUterusOnImaging` populated from the imaging fold so two more adeno criteria become evaluable.
  - Stamps the document summaries onto `CSDPayload.uploadedDocuments` so the CSD narrative can cite the document by its `sourceId`.

The CSD payload hash changes again with this chunk (because `uploadedDocuments` will now contain real entries for any patient with extracted imaging). Existing cache misses are written fresh on next regenerate.

### Why no LLM in the trigger path of NICE / adeno

The engines still receive purely structured inputs. The LLM runs **once** during extraction; its output is structured JSON that the engines treat as data. The engines themselves remain rule-based, no LLM in their trigger or action paths.

## Consequences

### Now

- Patients can paste a TVS or MRI report and watch their dossier update with adeno fires (when JZ / bulky uterus surface) and NICE prompts (TVS / MRI status).
- The dossier narrative now has document citations (the CSDPayload's `uploadedDocuments` flow into the gateway's `citationsHint`).
- One new gateway task is in the audit chain; replays can re-run an extraction against the saved `rawText`.

### Deferred (still open on Build Tracker feature 4)

- **PDF / image upload + OCR.** The patient's realistic input is a PDF from the NHS app or a photo of a paper report. This needs either: bringing multimodal inputs through the gateway (extending `GatewayRequestSchema.inputs` to allow file references; threading file content through `generateObject` via `messages` content arrays), or running a server-side OCR stage (pdfjs-dist on Node, Tesseract for images) before extraction. Pick one and design the gateway change in chunk 2.
- **Storage bucket for original files.** Chunk 1 stores raw text only. The original PDF / scan needs a private Supabase Storage bucket with patient-scoped RLS, mirrored to `documents.storage_path`.
- **Clinician confirm action.** Patients can upload; clinicians can read; nobody can currently flip `extraction_status` to `clinician_confirmed`. Needs a CDSS-side action.
- **Patient withdraw action.** New `withdrawn_by_patient` status; soft-delete semantics so the audit log still references the row.
- **Blood-test extraction task.** Same shape, different output schema. Lab values → typed fields used by future biomarker rules.
- **Operative-note extraction task.** Surgical findings feeding rASRM / Enzian stage parsing.
- **Background scan trigger** on document save to update the red-flag engine and any cached CSD render.
- **Back-fill `performed_at` / `source`** from the extractor's `performedAt` / `source` outputs when the user left those fields blank. Structural columns are currently immutable; back-fill needs either a relaxed-column policy or an append-mode design (write a "metadata patch" row).
