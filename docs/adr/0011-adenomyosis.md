# ADR 0011 — Adenomyosis co-detection

- **Status:** accepted
- **Date:** 2026-05-08
- **Decision drivers:** Brief — feature 7: "Adenomyosis is consistently underdiagnosed; it must surface as a parallel, never subordinate, clinical consideration to endometriosis." Build Tracker feature 7.

## Context

Adenomyosis sits beside endometriosis in the platform's clinical model — never below it. The brief draws on the 2025 systematic review (Vannuccini et al.) reporting 17% focal / 15% diffuse prevalence in general gynaecology cohorts, 41–49% in symptomatic populations, with 10× under-diagnosis vs histological confirmation. Endo's job is to make the consideration visible, not to claim diagnosis.

The engine itself (`src/lib/clinical/adenomyosis.ts`) landed in `b45004c` alongside the medical visual pass. This chunk wires that engine into the live surfaces — the patient dossier, the clinician Rapid Answer Panel, and the CSD payload that drives both — so the consideration appears whenever the rule pack fires, not just in the mock.

## Decision

### Engine surface contract

`evaluateAdenomyosis(inputs)` returns the full `AdenomyosisResult`:

- `rulePackVersion` — stamped on every fire, captured in audit when the result flows through the gateway via the CSD payload.
- `status` — `triggered | below_threshold | awaiting_data`. Surfaces render only on `triggered`.
- `score`, `thresholdScore`, `evaluableMaxScore` — the chip label is `score/evaluableMaxScore` so the denominator reflects what the rule pack could actually evaluate against the record (a still-incomplete record cannot be scored against the full six-criterion maximum).
- `triggers` — structured `{ id, label, evidence }`. The CSD payload carries these so the dossier narrative can reference rule fires as discussion points without inventing them.
- `awaitingInputs` — the criteria the rule pack can't yet score because their dependent feature hasn't shipped (treatment-trial table, profile-edit pregnancy history, document extraction for JZ irregularity / bulky uterus).
- `patientText`, `clinicianText` — static copy from the rule pack. The patient sentence is plain-English, non-alarmist, non-subordinate. The clinician sentence carries the cited prevalence and the suggested investigation (pelvic MRI with junctional-zone protocol). Neither sentence is ever AI-rewritten.

### Wiring

1. **CSD payload** (`src/lib/clinical/csd.ts`) — `buildCSDPayloadForCurrentPatient` calls `evaluateAdenomyosis(defaultAdenomyosisInputs(entries))` and sets `adenomyosisFlag` to the full result. The `CSDPayloadSchema` is extended to match. This changes the canonical-JSON payload hash, so previously cached renders no longer hit; the next regenerate writes new ones. No DB migration is required — `csd_renders.payload` is `jsonb`.
2. **Rapid Answer Panel** (`src/lib/clinical/rapid-answer.ts`) — `rowBleeding` previously set its inline flag based on a local `heavy.length >= 2` heuristic. It now reads `payload.adenomyosisFlag.status === "triggered"` instead. One source of truth; the row flag can never drift from the strip chip.
3. **`/cdss/page.tsx` LivePanel** — computes the engine result once, threads it into `deriveRapidAnswers` through a narrowed `RapidAnswerContext` slice of the payload, and renders a dedicated `AdenoChip` in the flag strip showing `score/evaluableMaxScore`. The clinician sentence renders directly below the strip; the rule-pack version is on the line.
4. **`/cdss/page.tsx` DemoPanel** — reads the same `MOCK_ADENO` shape (now an `AdenomyosisResult`), so the demo and live panels share the chip component.
5. **`/portal/dossier/page.tsx`** — drops the `!live` guard. The adenomyosis section renders whenever `adenoForRender.status === "triggered"`, fed by the engine when authed and by the mock for anonymous demo viewers. Footer line stamps the rule-pack version, score, and threshold.

### Parallel-not-subordinate is structural

The CSD prompt template already instructs the gateway to "surface a NICE gap or an adenomyosis flag" rather than treat adenomyosis as a corollary of endometriosis. The payload now feeds that prompt with real engine output; the surfaces above render the flag as its own callout rather than as a parenthetical inside an endo-only narrative.

### No LLM in the trigger path

`evaluateAdenomyosis` is a pure function of inputs. `patientText` and `clinicianText` come from the rule pack as static copy. The engine is invoked server-side; no fetch, no network. This matches the constraint shared with red-flag triage and the NICE prompter.

## Consequences

### Now

- Whenever the engine fires (score ≥ 3 out of an evaluable max), both the patient dossier and the clinician panel surface the consideration with identical underlying data and audience-appropriate voice.
- Inline bleeding-row flag and chip-strip flag share the same truth value; no second threshold to drift.
- The CSD payload's `adenomyosisFlag` carries `awaitingInputs`, so when feature 4 (document extraction) or treatment-trial capture lands the engine's evaluable max grows and the score becomes more meaningful without further wiring changes here.

### Deferred (still open on Build Tracker feature 7)

- Treatment-trial history table feeding `hormonalNonResponse`.
- Profile-edit page capturing `priorPregnancyLosses`.
- Imaging extraction (feature 4) feeding `jzIrregularityOnImaging` and `bulkyUterusOnImaging`.
- Mirroring engine fires into `llm_audit_log` for the unified audit view (the engine is rule-only, so there's no gateway audit row today; an event-type row is needed).
- Per-criterion drill-down UI on the clinician panel (currently only the summary score appears; the structured `triggers` are in the payload but not rendered as a per-trigger list).
- Patient-facing FAQ explaining the difference between endometriosis and adenomyosis (planned in the education module).
