# ADR 0006 — Voice-first pain journal

- **Status:** accepted
- **Date:** 2026-05-08
- **Decision drivers:** Brief — "Pain journal — voice-first" (feature 2). Build Tracker feature 2. The largest patient-side adoption lever.

## Context

Pain journalling fails today because it is friction-heavy in the moment of pain. The brief's response is voice-first: the patient speaks freely on their phone, an LLM extracts a structured entry, and the patient confirms it in plain English before save. A quick-tap form is the fallback for moments where speaking isn't practical.

Both paths must produce the same FHIR-shaped record. Audio is not stored beyond the transcription window unless the patient explicitly opts in.

## Decision

This chunk delivers the **end-to-end voice path plus a quick-tap fallback that produces the same record shape**. Server-side Whisper-class fallback transcription, the bleeding heatmap evolution, and structured-extraction → typed-fields auto-population are deferred.

### Capture: Web Speech API

The browser's `SpeechRecognition` API runs entirely on-device. Endo never receives raw audio — only the transcript the patient confirms. This is the brief's privacy posture: "transcribe and discard" is the default.

When the API is unavailable (some browsers, some environments), the page surfaces a "voice not available" state and links straight to the quick-tap form. No silent failures.

### Extraction: gateway, Haiku tier

The transcript is posted to a server action `extractFromTranscript` which calls the LLM gateway (ADR 0001) with task `extract-symptom-from-voice` (already registered). The Haiku model produces:

- A `plainSummary` — the patient sees this verbatim before saving.
- An array of structured `observations` (kind, value, cycle day).

The gateway writes an audit row regardless of outcome and returns its id. The patient's confirm-and-save call passes the audit id forward so the persisted journal row links to the audit chain.

### Confirmation

The patient sees three things on the confirmation surface:
1. The transcript ("what you said") — so they can verify Endo heard them correctly.
2. The plain summary — labelled `AI summary · please verify`.
3. A typed observations preview — what gets saved alongside the prose.

Save is explicit. There is no auto-save on transcribe completion. This is the primary safety control per the Class IIa risk file.

### Persistence

Migration `005_journal_entries.sql` adds `public.journal_entries` with:

- Cycle context (day + phase) computed at the time of entry, not at read time. Stored alongside the entry so a later LMP edit doesn't retroactively rewrite history.
- Pain (VAS + locations), bowel, bladder, dyspareunia, bleeding heaviness, fatigue VAS, mood (1–5).
- Provenance (source, transcript, model id, prompt template version, audit row id).
- RLS for own-record CRUD plus a clinician-read policy keyed on an active consent token (ties to ADR 0004).

Cycle context lives on `profiles` (`last_menstrual_period_start`, `average_cycle_length_days`); cycle-day computation is deterministic in `src/lib/clinical/cycle.ts`.

PBAC scoring lives in `src/lib/clinical/pbac.ts` with the published Higham weights and the `>100 = HMB` threshold. Used by future bleeding-pattern features and the adenomyosis flag (feature 7).

### Quick-tap fallback (`/portal/journal/quick`)

Identical record shape, no transcript. Pain VAS, location toggles, bowel and bladder toggles, dyspareunia tri-state, bleeding-heaviness select, fatigue VAS, 1–5 mood, free-text notes. The plain-English summary is composed deterministically from the structured fields and stored in `patient_plain_summary` so reads have a consistent narrative regardless of source.

### List view

`/portal/journal` reads live entries when signed in as a patient, falls back to mock when anonymous (demo continuity). The cycle-overlay heatmap and per-entry detail are unchanged in shape from the design system reference.

## What this chunk does NOT include (deferred)

- **Server-side Whisper-class fallback transcription.** When the browser doesn't support Web Speech, the user is sent to the quick-tap form. A real fallback that uploads short audio clips and transcribes on the server is a follow-up.
- **Auto-population of typed fields from extraction.** The current voice path stores the prose summary and the transcript; it does not yet thread the LLM's structured `observations` into `pain_vas`, `pain_locations`, etc. The next chunk maps observation kinds onto the typed columns and shows the patient an editable preview before save.
- **Bleeding heatmap evolution.** PBAC inputs are not yet collected per-cycle; the journal accepts a `bleeding_heaviness` enum only. A dedicated bleeding-pattern surface arrives with the adenomyosis co-detection feature.
- **Cycle context capture.** `last_menstrual_period_start` and `average_cycle_length_days` are storable on the profile but no UI captures them yet — entries log with `cycle_phase = 'cycle_agnostic'` until the patient sets their cycle context. A small profile edit page lands in the next chunk.
- **Audit instrumentation of journal save events.** Saves write a `journal_entries` row but do not currently mirror to `llm_audit_log`. This lands with the audit-completion chunk.

## Consequences

- A signed-in patient can speak about how they feel on their phone, see what Endo heard, confirm, and save — all in the time it takes them to read the summary back.
- Quick-tap is one click away from the voice surface, never gated behind voice.
- The audit chain is preserved end-to-end: patient utterance → gateway extraction → audit row → journal entry → audit linkage.
- The clinician timeline (which already reads from mock data) will surface live entries automatically once feature 9 (Rapid Answer Panel real implementation) wires it up — the RLS policy is in place.
- The home dashboard (`/portal/page.tsx`) still renders the synthetic patient's mock data for demo continuity. Replacing it with live data is its own focused chunk.

## References

- Migration: `supabase/migrations/005_journal_entries.sql`
- Helpers: `src/lib/clinical/cycle.ts`, `src/lib/clinical/pbac.ts`, `src/lib/clinical/journal.ts`
- Server actions: `src/app/portal/journal/new/actions.ts`
- Voice page: `src/app/portal/journal/new/page.tsx`
- Quick-tap page: `src/app/portal/journal/quick/page.tsx`
- List page: `src/app/portal/journal/page.tsx`
- Brief: feature 2 sub-tasks and acceptance criteria
- Build Tracker: feature 2
