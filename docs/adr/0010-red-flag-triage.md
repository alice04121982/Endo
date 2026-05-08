# ADR 0010 — Red-flag triage rule engine

- **Status:** accepted
- **Date:** 2026-05-08
- **Decision drivers:** Brief — feature 8: "Highest-stakes output in the platform. Never softened, never AI-rewritten." Build Tracker feature 8.

## Context

Red-flag triage is the hardest constraint in Endo's surface area. The brief is unambiguous:

- Detection is rule-based. LLM is not permitted in the trigger or action path.
- The "seek urgent care now" message is unsoftenable. No AI rewriting, no chirpy variation, no auto-dismiss timer.
- Audit log captures every fire and every patient response.
- The visual treatment is distinct from any other callout (consideration, NICE, AI-extracted) and cannot be themed away.

## Decision

### Engine

`src/lib/clinical/red-flags.ts` exports `evaluateRedFlags(inputs)` returning `RedFlag[]`. Each rule is a pure function. Five rules in `red-flags@2026-05-08.r1`:

1. **Heavy acute bleeding** — fires on (a) the active symptom-check answer "soaking through more than one pad per hour for two hours" or (b) two consecutive very-heavy bleeding entries on the journal.
2. **Ovarian torsion suspect** — fires on the symptom-check "sudden severe one-sided pelvic pain".
3. **Bowel obstruction suspect** — fires on the symptom-check "severe abdominal swelling".
4. **Severe ureteric involvement** — fires on the symptom-check "severe flank pain".
5. **Ectopic / pregnancy complication** — fires on bleeding-while-pregnant (with or without fainting).

Each rule's `clinicianDescription`, `patientHeadline`, `patientAction`, and `resources` are constants in the rule pack. The engine never produces this copy at runtime; clinical leadership writes it once and the audit log captures the rule-pack version on every fire.

### Active symptom check

The brief calls for journal-derived flags but realistically most red-flag conditions need an explicit "right now" report. `/portal/check` is a focused page: six yes / no questions; one click to evaluate; result is either "no urgent flags" (with the qualifier that absence of flags is not an all-clear) or one or more red-flag banners with the rule-pack copy plus region-aware urgent-care actions.

### Persistence

Migration `007_red_flag_events.sql` adds an append-only event table. Structural columns (`rule_id`, `rule_pack_version`, `inputs`, `severity`, `created_at`, `patient_subject_id`) are immutable after insert — a `BEFORE UPDATE` trigger raises if any structural field changes. Only `patient_response` and `patient_response_at` are mutable, and only by the patient.

RLS:
- Patients read and update their own events.
- Clinicians read events on patients they hold an active consent token for.
- No insert policy — fires write through the service-role client only.
- No delete policy — events are append-only.

### Patient response

Allowed values for `patient_response`:
- `unread` — default on insert
- `opened` — banner has been viewed
- `cta_followed` — patient tapped the urgent-care action
- `no_longer_relevant` — patient explicitly marked it no longer relevant

`no_longer_relevant` is the only state that removes the event from active surfaces. The brief is clear that the rule itself can never be silenced, but the patient can mark a fire as no longer current after their care episode. Banners do not auto-dismiss.

### Visual surface

The `.red-flag-banner` utility class declared in `globals.css` (ADR 0002) is the single visual treatment. Same shape on patient and clinician layouts. Same urgent-100 background, urgent-700 left border, urgent-800 type. The banner cannot be styled away by audience-theme overrides — it lives in the always-present root token set.

`src/components/red-flag-banner.tsx` renders the stack. Patient banner shows Call 111 and Manage flags actions; clinician banner shows the rule's headline + action and a small "Patient-active" tag. Same data, audience-appropriate actions — the rule copy itself is identical.

Patient layout (`/portal/layout.tsx`) and clinician layout (`/cdss/layout.tsx`) both fetch active events and render the stack above their respective context strips.

## What this chunk does NOT include (deferred)

- **Region detection.** Resources are hard-coded UK (NHS 111, A&E). Multi-region support lands when international expansion does.
- **LLM-rendered patient rationale.** The brief permits LLM in the patient-explanation only. Currently the engine's static rationale text covers this; a future chunk could render a richer explanation through the gateway, with the AI-extracted pill applied. Static text is the safer default for the MVP.
- **Mirroring red-flag fires into `llm_audit_log`.** Each fire writes to `red_flag_events` directly. A unified view spanning both tables is part of the audit-completion chunk.
- **Background scan on journal save.** Currently the journal-derived rule (heavy acute bleeding) only evaluates when the patient runs the symptom check. A `journal_save_check` server action that re-runs the engine on each save lands as a follow-up.
- **Patient SMS / email notification on fire.** Banner shows on next page load.
- **Clinician notification when a patient's flag fires while their consent is active.** Push lands later.

## Consequences

- The patient on `/portal/*` always sees red-flag fires above any other content — the banner cannot be pushed below the fold by any other layout decision.
- A clinician with active consent sees the same banner above their context strip — the moment they land they know something is acute.
- Adding a sixth rule is one function in `red-flags.ts` plus one entry in `RULE_HEADLINES` for the banner copy. The pack version bumps in the same PR.
- Audit chain: every fire is a row, every response is a row, the rule-pack version is on every row.

## References

- Engine: `src/lib/clinical/red-flags.ts`
- Symptom check: `src/app/portal/check/page.tsx`, `src/app/portal/check/actions.ts`
- Banner: `src/components/red-flag-banner.tsx`
- Patient layout: `src/app/portal/layout.tsx`
- Clinician layout: `src/app/cdss/layout.tsx`
- Migration: `supabase/migrations/007_red_flag_events.sql`
- Brief: feature 8 sub-tasks and acceptance criteria
- Build Tracker: feature 8
