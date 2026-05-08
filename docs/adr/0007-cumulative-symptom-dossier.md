# ADR 0007 — Cumulative Symptom Dossier (CSD)

- **Status:** accepted
- **Date:** 2026-05-08
- **Decision drivers:** Brief — feature 5: "the artefact every external user sees. The deliverable that justifies the platform." Build Tracker feature 5. Anchors features 6 (NICE prompter), 9 (Rapid Answer Panel), and any future export work.

## Context

The CSD is the platform's load-bearing artefact. Every external clinician — GP, registrar, consultant — meets Endo through it. Two views are required:

- **Patient view** — empathetic British English, jargon-free, plain reading.
- **Clinician view** — NICE / ESHRE / rASRM / Enzian terminology, concise, structured for a thirty-second consult window.

Both views must come from the **same** structured payload. The brief is unambiguous: never re-prompted independently. One payload → two voices.

It must also be byte-stable: a printable PDF generated twice from the same input must come out identical, so a clinician can be sure the printout in their hand is the dossier the patient signed.

## Decision

### Single typed payload, two audience renders, content-hash cache

`src/lib/clinical/csd.ts` defines `CSDPayload` — a Zod-validated typed object built from the patient's record (cycle context, recent journal entries, uploaded documents, NICE gaps, adenomyosis flag). The payload is canonicalised (deterministic JSON, sorted keys) and hashed with SHA-256.

For each audience, the gateway is invoked once with the identical payload. Both calls reach the same `generate-csd-view` task; the audience parameter governs voice. Neither view is generated from the other — they are siblings of the same input.

Renders are cached in `csd_renders` keyed on `(patient_subject_id, audience, payload_hash)`. A repeat render for the same payload returns the cached body — same bytes, no fresh model call. This is the byte-stability guarantee.

### Banned-term lint

The gateway already refuses diagnostic-shaped statements (ADR 0001). The CSD service adds a stricter sweep on its narrative output before persisting:

- `\bdiagnos(e[sd]?|ing|is)\b`
- `\bdefinitiv(e|ely)\b`
- `\byou\s+have\s+(endometriosis|adenomyosis)\b`
- `\b(confirm[s]?|confirmed)\s+(endometriosis|adenomyosis)\b`

A match writes the render row with outcome `banned_term_lint` and refuses to surface the body. The audit log retains the rejected attempt. Lint matches are operationally rare — the system prompt itself disallows the phrasing — but the lint is the last line of defence before the body reaches a clinician's eyes.

### Migration

`006_csd_renders.sql`:

- Append-only by convention (no UPDATE / DELETE policies).
- Patient RLS for read of own renders.
- Clinician read policy joins through `consent_tokens` so a clinician sees only renders for patients they hold an active consent for.
- Inserts go through the service-role client only — application code never inserts directly.

Stored fields: `patient_subject_id`, `audience`, `payload_hash`, `payload` (JSONB), `body`, `citations`, `model_id`, `prompt_template_version`, `audit_entry_id`, `outcome`. Outcome distinguishes `success` from `banned_term_lint`, `refused_diagnostic_conclusion`, `validation_failed`, `model_error`.

### UI

- `/portal/dossier` (patient view) — reads the latest cached patient render; shows a "Regenerate" button that rebuilds the payload, calls the gateway for both audiences (so the next clinician read is byte-stable), and refreshes. Falls back to mock data when anonymous (demo continuity).
- `/cdss/dossier` (clinician view) — when the clinician holds an active consent token, reads the latest cached clinician render for that patient. When no current render exists, surfaces a "patient hasn't generated a current dossier" state.

Both pages are shaped the same — header / narrative / citations footer — and both surface the AI-generated label and the persistent disclaimer (already in the root layout).

### Citation handling

The gateway returns `citations` as a typed `Citation[]` (sourceId or guideline reference). The page renders the labels under "What this is based on". A future chunk threads each citation into a clickable resolver (`/portal/source/<id>` and `/cdss/source/<id>`) so a reader can jump to the underlying journal entry, document extract, or NICE recommendation.

## What this chunk does NOT include (deferred)

- **PDF export.** The narrative is byte-stable; rendering it onto a printable A4 template is mechanical follow-up work. The button exists, disabled, with a "coming next" tooltip.
- **FHIR Bundle (UK Core) export.** The same cached render plus the underlying observations form the Bundle. Validation against UK Core profiles is its own focused chunk.
- **Per-claim source resolution UI.** Citations are listed; clicking through to source lands with feature 4 (uploads) and feature 9 (Rapid Answer Panel).
- **Auto-regeneration on meaningful data update.** Currently the patient triggers regeneration via the button. A trigger that detects "data changed since last render" lands with the audit-completion chunk.
- **Adenomyosis flag and NICE gaps in live mode.** The mock displays them; live-mode currently shows the prose narrative only. Wiring real adeno (feature 7) and NICE gaps (feature 6) lights up those side-panels.
- **Empty-state copy variants.** Currently the patient gets a single empty state; a future chunk produces a more guided experience.

## Consequences

- A patient who logs a few journal entries and clicks "Regenerate" gets a real AI-written one-page dossier in their voice, with citations.
- A clinician with active consent landing on `/cdss/dossier` reads the same data in clinical terminology, byte-identical across reloads of the same payload.
- Audit chain is end-to-end: each render writes a row to `llm_audit_log` (gateway) and a row to `csd_renders` (cache); both reference each other.
- The byte-stable cache makes PDF export trivial — same body in, same PDF out — when that lands.
- Banned-term lint catches the failure mode that no system-prompt regression should produce, but might.

## References

- Migration: `supabase/migrations/006_csd_renders.sql`
- Service: `src/lib/clinical/csd.ts`
- Gateway task: `generate-csd-view` in `src/lib/llm/prompts/index.ts`
- Patient page: `src/app/portal/dossier/page.tsx`, `src/app/portal/dossier/actions.ts`, `src/app/portal/dossier/regenerate-button.tsx`
- Clinician page: `src/app/cdss/dossier/page.tsx`
- Brief: feature 5 sub-tasks and acceptance criteria
- Build Tracker: feature 5
