# ADR 0008 — Rapid Answer Panel (real implementation)

- **Status:** accepted
- **Date:** 2026-05-08
- **Decision drivers:** Brief — feature 9: "the surface that decides adoption. 30-second consult window." Build Tracker feature 9. Anchored on ADR 0001 (gateway), ADR 0004 (consent tokens), ADR 0006 (journal), ADR 0007 (CSD).

## Context

The Rapid Answer Panel is what makes the platform actually used. The brief is unambiguous:

- Clinician lands directly on this view from a patient consent link (ADR 0004 covers the link flow).
- Thirteen pre-extracted answers to the standard endometriosis history questions, each one line, each citation-anchored.
- A free-text query field for anything else, with cited source data.
- Read-only by default; the timeline is one click away but not the default view.

The chunk replaces the mock-data version with a real implementation: deterministic derivation of the thirteen rows from the patient's record, plus the free-text query wired to the gateway's `clinician-freetext-qa` task (Opus tier).

## Decision

### Rule-based derivation (no LLM in the trigger path)

`src/lib/clinical/rapid-answer.ts` implements `deriveRapidAnswers(entries, payload)`. Each row is a pure function over the inputs:

- **Cyclicity** — averages VAS by cycle phase; classifies as strongly cyclical / moderately cyclical / largely non-cyclical based on the swing.
- **Severity trend** — splits the journal in two halves chronologically; compares mean VAS; classifies as improving / stable / worsening; flags `treatment_escalation` when worsening by ≥1 VAS point.
- **Anatomical pattern** — top-3 most-reported pain locations.
- **Bowel / bladder involvement** — top-3 reported symptoms each.
- **Sexual function** — counts dyspareunia entries; surfaces frequency + most recent date.
- **Heavy menstrual bleeding** — counts heavy / very-heavy entries; flags `adenomyosis_consideration` when ≥2.
- **Prior imaging** — reads `payload.uploadedDocuments` (lights up when feature 4 ships).
- **Age of onset, family history, treatment trial history, prior surgery, fertility intent** — currently `Awaiting data` until the dependent features land. They render in the panel with italic muted text so the absence is visible at a glance.

LLMs are explicitly not invoked to produce these rows. The brief calls out that the rule-based path reduces regulatory surface; the audit log captures rule outputs as data not as model output.

### Live panel vs demo panel

The clinician page branches at the top:

- **Signed in with active consent** → live panel: fetches the patient's journal entries via service-role (the consent-keyed RLS read works at SQL level but the service-role path is cleaner for cross-table joins), runs the derivation engine, renders the thirteen rows with the patient's display name and consent-token meta in the header.
- **Anonymous / not consent-active** → demo panel: keeps the existing mock-data version so the demo remains reviewable. Demo three-question pre-cached free-text answers stay surfaced.

The free-text query input is disabled in demo mode and clearly labelled.

### Free-text query

`src/app/cdss/freetext/actions.ts` posts the clinician's question through the gateway's `clinician-freetext-qa` task (Opus tier, already registered, already requires citations). The record snapshot is built server-side from the consent-active patient's profile + last 60 journal entries via the service-role client. The gateway returns the answer + citations + audit row id; all three are surfaced.

The gateway's diagnostic-conclusion sweep runs as before (ADR 0001). The component shows the audit row id under each answer so a clinician can paste it into clinical notes for traceability.

## What this chunk does NOT include (deferred)

- **Clinician notes capture.** The brief calls for write-scope consent + clinician notes back to the patient's record. Feature blocks until consent_tokens grows a second scope (`read_and_note`) and the notes surface itself. Read-only only for now.
- **Audit-log mirroring of panel loads.** Each free-text query writes an audit row through the gateway. The panel render itself doesn't yet write a "panel viewed" row; that lands with the audit-completion chunk.
- **Print-friendly stylesheet.** The panel reads cleanly on screen but doesn't yet have a `@media print` rule or a "print this panel" affordance.
- **2-second SLA** on panel render is not yet measured — derivation is fast but the service-role query adds a round trip; instrumentation arrives with the audit chunk.
- **Mobile-first responsiveness on the live panel.** The grid degrades to a single column at narrow widths but the consent-token meta strip needs polish on small screens.
- **Live adenomyosis flag and NICE gaps in the live panel.** Currently surfaced only via the journal-derived flags; the rule-pack flags from features 6 and 7 will join the flag row when those land.
- **Per-citation source resolution UI.** Clicking a source label still does nothing — `/cdss/source/<id>` lands later.

## Consequences

- A clinician with active patient consent now reaches the panel and sees rule-derived answers from real journal entries, with citations. The rows that depend on features 4 / 6 / 7 say `Awaiting data` and degrade gracefully.
- The free-text query is real: the Opus-tier task answers from the patient's actual snapshot, with citations, and refuses diagnostic phrasing (ADR 0001 sweep).
- The demo panel still works for unauthenticated viewers — the brief's "30-second consult window" exemplar is reviewable on the public Vercel preview without a sign-in.
- Adding rules (e.g. PBAC > 100 once the bleeding feature carries it explicitly) is a one-line change in `rapid-answer.ts`; the rest of the panel adapts.

## References

- Engine: `src/lib/clinical/rapid-answer.ts`
- Page: `src/app/cdss/page.tsx`
- Free-text query: `src/app/cdss/freetext-query.tsx`, `src/app/cdss/freetext/actions.ts`
- Brief: feature 9 (Rapid Answer Panel) sub-tasks and acceptance criteria
- Build Tracker: feature 9
