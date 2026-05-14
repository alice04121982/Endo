# ADR 0013 — Rule-engine audit mirroring and save-time red-flag scan

- **Status:** accepted
- **Date:** 2026-05-14
- **Decision drivers:** Brief — feature 8: "Red-flag triage is the highest-stakes output; every fire must be captured in the audit trail." Build Tracker feature 8 deferred items: (a) background scan on journal save (currently fires only via the symptom-check page); (b) mirroring red-flag fires into `llm_audit_log` for the unified audit view. Same mirroring-gap exists on features 6 (NICE NG73) and 7 (adenomyosis); the helper introduced here is reusable for those follow-ups.

## Context

Rule engines (red-flag triage, NICE NG73 prompter, adenomyosis co-detection) are deterministic by design — no LLM in the trigger or action path. That's how we keep the highest-stakes outputs unsoftenable and replayable. But the regulatory reviewer wants **one** audit timeline per patient: model calls and rule fires interleaved in chronological order so an investigation doesn't have to consult two log tables.

`llm_audit_log` is the existing audit table. Its schema was designed around model calls — `model_id`, `prompt_template_version`, `inputs`, `output`, `citations`, `outcome`. Rule fires fit naturally into that shape with two sentinel values:

- `model_id = "rule-engine-only"` — explicit signal that no model ran.
- `task_name = "rule:<rule_id>"` — namespace so reviewers can filter to/from rule fires.

The hash-chain semantics of the audit log give us tamper evidence for rule fires for free.

Separately, red-flag triage was only firing in one path: the symptom-check page. The brief assumes a continuous scan — "every new entry the patient writes is checked against the rule pack." That's the second concern this chunk addresses.

## Decision

### `mirrorRuleEngineFire` helper

In `src/lib/llm/audit.ts`, a new function takes structured rule-engine output and writes an `llm_audit_log` row via the same `appendAuditRow` path used by the gateway. Sentinel values (`RULE_ENGINE_MODEL_ID`, `RULE_ENGINE_TASK_PREFIX`) are exported alongside so reviewers can filter or join queries. The helper takes:

- `patientSubjectId` — the patient the fire concerns.
- `callerSubjectId` — the actor whose save / submission ran the engine. Equal to patient for self-service flows.
- `ruleId` — stable identifier, e.g. `red-flag/heavy_acute_bleeding`. Reviewers grep by this.
- `rulePackVersion` — versioned rule pack id, stamped on every fire (ADR 0010, 0009, 0011 already require this).
- `inputs` — the structured inputs the engine evaluated. For red-flag fires we pass a compact view (`activeCheck` plus the bleeding-heaviness column of recent entries) rather than the full journal payload to keep audit rows readable.
- `output` — the structured fire (rule id, severity, headline, action, rationale, clinician description).
- `citations` — source-data citations identifying what triggered the fire (journal entry ids or `symptom-check:<submittedAt>`).

`outcome` is always `success` (the rule engine doesn't "refuse"; it either fires or doesn't). `audience` is `patient` (the fire affects patient surfaces; the clinician view derives from the same fire via consent).

### Red-flag dual-write

`persistRedFlagFire` now writes to **both** `red_flag_events` (the operational table the banner reads) AND `llm_audit_log` (the regulatory timeline). The audit mirror is wrapped in `try/catch`; if the mirror fails, the red-flag event is still visible to the patient — patient safety beats audit completeness in the rare failure case, and the mirror failure is logged for ops follow-up.

This means **both** existing call sites — the `/portal/check` symptom-check action AND the new journal-save scan — automatically get audit mirroring. No further wiring needed.

### `scanRedFlagsOnJournalSave`

New orchestrator in `src/lib/clinical/red-flags.ts`:

1. Evaluates the rule pack with `activeCheck: null` (journal-only inputs) over the last 14 journal entries.
2. Reads the patient's currently unresolved fires via `listActiveRedFlagEventsForPatient`.
3. Deduplicates: a rule that's already fired and is still unresolved (`patient_response` ≠ `no_longer_relevant`) does NOT fire again. A single ongoing condition shouldn't produce a fresh urgent banner on every entry the patient writes.
4. Persists new fires via `persistRedFlagFire` (which now dual-writes).

### Journal-save hook

`saveJournalEntry` (`src/app/portal/journal/new/actions.ts`) calls `scanRedFlagsOnJournalSave` **after** the entry has been inserted successfully. Any scan failure is caught and logged — it must not roll back the patient's save. The page revalidation now includes `/portal/check` so the banner refreshes.

### What we deliberately did NOT do

- **Mirror NICE / adeno fires.** The helper exists and the design pattern is identical, but those engines fire on **read** (every page load that renders the dossier or CDSS). Mirroring per-read would explode the audit log. The right design is to mirror only **state transitions** — when a NICE prompt first appears, when an adeno score crosses the threshold. That requires keeping engine state in a table (analogous to `red_flag_events`). It's a separate sub-chunk; the helper here is what it'll call.
- **Document-save scan.** Imaging extraction produces findings that the adeno engine consumes, but the red-flag rule pack doesn't currently have a rule that fires on imaging input. Document-save scan is a no-op for chunk 2; it'd matter once the rule pack grows imaging-driven rules (e.g. "ruptured endometrioma on imaging report → urgent").
- **Background re-scan on existing entries.** The new scan looks at the latest journal state at save time. A clinician who imports historical entries doesn't currently trigger retrospective red-flag fires. A `?rescan=1` admin path can ship in a future chunk; this chunk is about the live save flow only.

## Consequences

### Now

- Every new journal entry runs the red-flag rule pack; any newly-fired flag persists to `red_flag_events` AND mirrors into `llm_audit_log`.
- The audit log now shows rule fires alongside model calls in chronological order. The audit page (`/cdss/audit`) renders both kinds (the table reads `llm_audit_log` directly).
- Reviewers can filter audit rows to rule fires with `task_name LIKE 'rule:%'` or `model_id = 'rule-engine-only'`.
- A patient with a still-unresolved fire on a given rule won't be re-fired on subsequent entries until they acknowledge it as `no_longer_relevant`.

### Deferred (still open on Build Tracker features 6, 7, 8)

- Mirror NICE NG73 prompter fires — needs a `nice_rule_fires` operational table to track state transitions before mirroring (see "What we deliberately did NOT do" above).
- Mirror adenomyosis engine fires — same shape as NICE.
- Patient SMS / email / push notification when a red flag fires from a save (not just from an active symptom check). The fire is now in the database; the notifier needs to subscribe to the insert.
- Multi-region urgent-care resources (UK hard-coded today).
- Retrospective rescan command for historical entries.
- Document-save scan once the rule pack grows imaging-driven rules.
