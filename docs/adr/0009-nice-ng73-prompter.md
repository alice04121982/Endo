# ADR 0009 — NICE NG73 compliance prompter

- **Status:** accepted
- **Date:** 2026-05-08
- **Decision drivers:** Brief — feature 6: "Active compliance prompt — not passive reference. Rule-based, not LLM." Build Tracker feature 6.

## Context

Endo's value to a clinician compounds when it tells them what NICE NG73 expects but isn't yet on the record. The brief is explicit: this is a rule-based engine, not an LLM. The reasons matter:

- Reduces regulatory surface — rule-based clinical logic is far easier to evidence under IEC 62304 than a prompted LLM.
- Deterministic — same record always produces the same prompts; no temperature, no drift.
- Auditable — the rule pack is a versioned constant in source control. Bumping it is a PR.

The prompter must surface in two places:

- **Patient view** — plain English, never alarmist. "You may want to ask your clinician about an MRI."
- **Clinician view** — NICE recommendation language, with id and dated update. "NICE NG73 §1.5.3 — consider pelvic MRI."

Both views are generated from the **same rule fire**. There's no second prompt for the patient version — a `patientText` and a `clinicianText` come back together.

## Decision

### Engine

`src/lib/clinical/nice-rules.ts` exports `evaluateNiceRules(inputs)` returning `NicePrompt[]`. Inputs are a typed `NiceRuleInputs` (journal entries + uploaded imaging + treatment trial + fertility intent + referral status). Outputs carry:

- `recommendationId` (e.g. `NG73:1.5.2`)
- `recommendationLabel` (with the dated update, e.g. "TVS for suspected endometriosis (NICE NG73 §1.5.2, Nov 2024)")
- `rulePackVersion` — the constant `NICE_RULE_PACK_VERSION` stamped on every prompt
- `status`: `satisfied` | `gap` | `partial` | `not_applicable` | `awaiting_data`
- `patientText` and `clinicianText` (each null when status is `not_applicable`)

### Initial rule pack — `nice-ng73@2024-11-01.r1`

Five rules in this chunk:

1. **§1.5.2** — TVS for suspected endometriosis. Triggers when the patient has ≥3 endo-suggestive symptoms; gap if no TVS in record.
2. **§1.5.3** — MRI when TVS inconclusive. Triggers when a TVS document is on file and is marked inconclusive; gap if no MRI follows.
3. **§1.4.6** — Hormonal escalation when first-line ineffective. Triggers when patient is on first-line hormonal therapy and journal severity trend is worsening with no GnRH or LNG-IUS trial yet.
4. **§1.6.1** — Specialist endometriosis service referral. Triggers when ≥3 suggestive symptoms plus worsening trend or first-line failure; gap if no referral on file.
5. **§1.7.1** — Fertility specialist input. Triggers when fertility intent = "wishes to conceive"; gap if no fertility specialist input on file.

Rules that depend on data Endo doesn't yet capture (uploaded documents from feature 4, treatment trial history from a future module) resolve to `awaiting_data` and are excluded from the visible UI list until they have evidence to evaluate against.

### Symptom counting

`countEndoSuggestiveSymptoms` derives from the journal:
- Dysmenorrhoea (cyclical menstrual pain VAS ≥ 5)
- Cyclical pelvic pain (luteal pain VAS ≥ 4)
- Deep dyspareunia (any entry with `dyspareunia: true`)
- Cyclical bowel symptoms (menstrual-phase entries with bowel symptoms)
- Cyclical bladder symptoms (menstrual-phase entries with bladder symptoms)
- Heavy menstrual bleeding (any entry `heavy` or `very_heavy`)

Six possible flags; the rule fires at threshold ≥ 3.

### Severity trend

`severityTrend` splits the journal in two halves chronologically and compares mean VAS. ≥1 point increase → `worsening`; ≥1 point decrease → `improving`; otherwise `stable`. Same helper used by `rapid-answer.ts` for the severity-trend row.

### Surfacing

Three surfaces light up in this chunk:

- **Patient dossier** (`/portal/dossier`) — replaces the mock NICE side-panel. When signed in, runs the engine over the patient's journal and renders gap prompts as "What you might want to ask your clinician".
- **Rapid Answer Panel** (`/cdss/page.tsx`, live branch) — adds gap prompts to the flag row above the thirteen rows, as a NICE-blue inline flag distinct from the red journal flags.
- **CSD payload** (`buildCSDPayloadForCurrentPatient`) — populates `niceGaps` so the LLM-rendered narrative can reference the gaps as discussion points without hallucinating them.

Anonymous demo viewers continue to see the mock NICE prompts so the public preview stays reviewable.

## What this chunk does NOT include (deferred)

- **Acknowledged-by-clinician state.** Brief calls for the clinician version to be marked actioned. A small `acknowledged_at` + reason on a future `nice_acknowledgements` table lands once write-scope consent is in place.
- **TVS / MRI inconclusive parsing from uploaded documents.** Lands with feature 4. Until then, the imaging-rules resolve to `awaiting_data` for users who haven't yet had any document parsed.
- **Treatment trial history table.** §1.4.6 is currently gated on a still-empty input. The rule fires correctly once a treatment trial is captured.
- **Fertility intent capture UI.** §1.7.1 is gated on a profile field that lands with the profile-edit chunk.
- **Audit-log mirroring of rule fires.** Each rule fire that drives an LLM call writes a row through the gateway (rule pack version flows in `prompt_template_version` adjacent fields). Mirroring rule-only fires lands with audit-completion.
- **Rule-pack config UI for clinical leadership.** Adding / editing rules remains a code change.

## Consequences

- A patient with a few weeks of journal entries + uploaded imaging will see a real "What to ask your clinician" panel on their dossier, derived from the same evidence the clinician sees.
- A clinician opening the Rapid Answer Panel for a patient sees NICE flag chips above the history rows, distinct from the red urgency flags.
- Rule pack updates ship as a single version bump; the audit log captures which version was active when each fire happened.
- Adding a sixth rule (e.g. for laparoscopy thresholds or for the ESHRE adenomyosis MRI sequence) is one function in `nice-rules.ts`.

## References

- Engine: `src/lib/clinical/nice-rules.ts`
- Patient dossier surface: `src/app/portal/dossier/page.tsx`
- Live RAP surface: `src/app/cdss/page.tsx`
- CSD payload integration: `src/lib/clinical/csd.ts`
- Brief: feature 6 sub-tasks and acceptance criteria
- Build Tracker: feature 6
