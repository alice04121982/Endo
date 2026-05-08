# Changelog

All notable changes to Endo are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) loosely. Regulatory
decisions are captured as ADRs in `docs/adr/`.

## [Unreleased]

### Added — 2026-05-08 — NICE NG73 compliance prompter (Build Tracker feature 6, chunk 1)

- `src/lib/clinical/nice-rules.ts` — versioned rule pack
  (`NICE_RULE_PACK_VERSION = "nice-ng73@2024-11-01.r1"`). Pure
  functions over the patient's record. Five initial rules: §1.5.2
  (TVS), §1.5.3 (MRI when TVS inconclusive), §1.4.6 (hormonal
  escalation), §1.6.1 (specialist referral), §1.7.1 (fertility
  specialist input).
- Each prompt carries: `recommendationId`, dated label,
  `rulePackVersion`, status (`satisfied` | `gap` | `partial` |
  `not_applicable` | `awaiting_data`), and BOTH `patientText` and
  `clinicianText` from a single rule fire.
- Symptom-counting helper derives the brief's six endo-suggestive
  symptoms from journal entries; ≥3 triggers the TVS rule.
- Severity-trend helper shared with `rapid-answer.ts` so trend
  calls are deterministic and reused.
- `/portal/dossier` NICE side-panel rebuilt to read live rule
  output when authed; falls back to mock prompts for anonymous
  demo.
- Rapid Answer Panel (live branch) adds NICE-blue inline flag
  chips above the rows alongside the red journal flags.
- CSD payload (`buildCSDPayloadForCurrentPatient`) populates
  `niceGaps` so the LLM-rendered narrative can reference rule
  fires as discussion points without inventing them.
- ADR 0009 captures the decision.

### Deferred (still open on Build Tracker feature 6)

- Acknowledged-by-clinician state with reason capture.
- TVS / MRI inconclusive parsing from uploaded documents (lands
  with feature 4).
- Treatment trial history table for §1.4.6 inputs.
- Fertility intent capture UI for §1.7.1 inputs.
- Mirroring rule-only fires (no LLM call) into `llm_audit_log`.
- Rule-pack config UI for clinical leadership.

### Added — 2026-05-08 — Rapid Answer Panel real implementation (Build Tracker feature 9, chunk 1)

- `src/lib/clinical/rapid-answer.ts` — rule-based derivation engine
  for the brief's 13 standard endometriosis history questions. Pure
  functions over journal entries + CSDPayload; no LLM in the trigger
  path. Inline flags for adenomyosis consideration / MRI gap /
  treatment escalation.
- `/cdss/page.tsx` rewritten: branches on consent. With active
  consent → live panel (fetches journal via service-role, runs
  derivation, surfaces rows + flags + consent-token meta). Without
  → demo panel (existing mock-data layout) so the public preview
  stays reviewable.
- Free-text query block (`freetext-query.tsx`) — real input wired
  through the Opus-tier `clinician-freetext-qa` gateway task.
  Server action builds the record snapshot via service-role from
  the consent-active patient's profile + last 60 entries. Surfaces
  answer + citations + audit row id under every result.
- ADR 0008 captures the decision.

### Deferred (still open on Build Tracker feature 9)

- Clinician notes capture (requires `read_and_note` consent scope
  and a notes surface).
- Audit-log mirroring of panel loads (free-text queries are
  already audited via the gateway).
- Print stylesheet / "print this panel" action.
- 2-second SLA instrumentation.
- Per-citation source resolution UI (`/cdss/source/<id>`).
- Live adenomyosis + NICE flag rows (still mock until features 6, 7).

### Added — 2026-05-08 — Cumulative Symptom Dossier (Build Tracker feature 5, chunk 1)

- Migration `006_csd_renders.sql` — cache table keyed on
  (patient, audience, payload_hash) for byte-stable narrative
  reuse. Service-role-only inserts; patient self-read; clinician
  read joined through active `consent_tokens`. No UPDATE / DELETE
  policies — append-only by convention.
- Typed `CSDPayload` (Zod) gathered from DB: cycle context,
  recent journal entries, slots for documents / NICE gaps /
  adenomyosis flag (populated when features 4, 6, 7 land).
- New gateway task `generate-csd-view@0.1.0` — Sonnet tier, accepts
  `(payload, audience)`, audience parameter governs voice, payload
  is identical between calls so the brief's "never re-prompted
  independently" rule holds.
- Banned-term lint extension on CSD bodies — refuses
  &ldquo;diagnose&rdquo;, &ldquo;definitive&rdquo;, &ldquo;you have
  endometriosis/adenomyosis&rdquo;, &ldquo;confirms
  endometriosis/adenomyosis&rdquo;. Lint matches log a row with
  outcome `banned_term_lint`; the body never surfaces.
- Canonical-JSON SHA-256 hash of the payload is the cache key.
  Same payload twice → same cached body → byte-stable PDF when
  export lands.
- Real `/portal/dossier` (live cached read + Regenerate button
  that rebuilds payload, calls gateway for both audiences, caches
  both); falls back to mock for anonymous demo.
- Real `/cdss/dossier` (live cached read for the consent-active
  patient); surfaces "patient hasn't generated a current dossier"
  state when nothing's cached.
- ADR 0007 captures the decision and what's deferred.

### Deferred (still open on Build Tracker feature 5)

- PDF export (button present, disabled — narrative is byte-stable
  so PDF generation is mechanical).
- FHIR Bundle (UK Core) export.
- Per-claim source resolution UI (citations are listed; clicking
  through lands when features 4 and 9 produce source pages).
- Auto-regenerate on meaningful data update (manual button only
  for now).
- Live adeno flag + NICE gaps side-panels — these still render
  from mock until features 6 and 7 land.

### Added — 2026-05-08 — Voice-first pain journal (Build Tracker feature 2, chunk 1)

- Migration `005_journal_entries.sql` — `cycle_phase`,
  `bleeding_heaviness`, `journal_source` enums, `journal_entries`
  table with FHIR-shaped fields, RLS for patient self-CRUD plus a
  consent-token-gated read policy for clinicians; profile gets
  `last_menstrual_period_start` and `average_cycle_length_days`.
- Clinical helpers (rule-based, no LLM): `src/lib/clinical/cycle.ts`
  computes cycle day + phase, scaling to the patient's average cycle
  length. `src/lib/clinical/pbac.ts` implements Higham PBAC scoring
  with published weights and the >100 HMB threshold.
- Voice path: `extractFromTranscript` server action posts the
  patient's transcript to the LLM gateway (Haiku tier,
  `extract-symptom-from-voice` task), returns plain-English summary
  + observations + audit-row id for the confirmation surface.
- `/portal/journal/new` rebuilt as a real Web Speech API capture —
  idle / recording (live transcript) / processing / confirm
  (transcript + AI summary + observations + Save) / saving / saved /
  error states. Cancels are explicit; nothing is saved without
  patient confirmation; raw audio never leaves the device.
- `/portal/journal/quick` quick-tap fallback — VAS slider, location
  toggles, bowel/bladder toggles, dyspareunia tri-state, bleeding-
  heaviness select, fatigue VAS, mood, notes. Same `journal_entries`
  shape as voice; deterministic plain-English summary composed
  client-side and saved to `patient_plain_summary`.
- `/portal/journal` reads live entries when signed in (most recent
  30); falls back to mock when anonymous so the demo keeps working.
- `saveJournalEntry` server action computes cycle day + phase at
  save time, persists with full provenance (audit id, model id,
  prompt template version) when the source is voice.
- ADR 0006 captures the decision and what's deferred.

### Deferred (still open on Build Tracker feature 2)

- Server-side Whisper-class fallback transcription when Web Speech
  isn't available.
- Auto-population of typed columns (`pain_vas`, `pain_locations`,
  etc.) from the LLM's structured observations.
- Bleeding heatmap evolution and per-cycle PBAC capture.
- Cycle-context capture UI (LMP date, average length).
- Mirroring journal save events into `llm_audit_log`.
- Home dashboard live-data integration.

### Added — 2026-05-08 — WebAuthn passkeys (Build Tracker feature 1, chunk 2)

- Migration `004_passkeys.sql` — `passkeys` table (credential id,
  public key, counter, transports, device name, backed-up flag,
  timestamps), RLS for own-row CRUD, `count_user_passkeys` helper.
- `@simplewebauthn/server` + `@simplewebauthn/browser` deps.
- Server-side ceremony helper `src/lib/auth/passkeys.ts` — RP config
  from env (`WEBAUTHN_RP_ID`, `WEBAUTHN_RP_NAME`), challenge-cookie
  I/O (HttpOnly, 5-minute TTL, SameSite=strict), registration option
  builder, attestation verifier, listing helpers.
- Server actions: `startPasskeyEnrollment`, `finishPasskeyEnrollment`,
  `deletePasskey`. Two-step ceremony with the challenge stashed in
  the cookie between calls.
- `/account/security` page — list of enrolled passkeys with device
  name, transport, backed-up flag, timestamps; remove action;
  enrolment via the client component which drives the OS passkey UI.
- Clinician hard gate — `/cdss/*` layout checks for at least one
  passkey on the signed-in clinician. None → redirects to
  `/account/security?required=1` with a labelled alert. Anonymous
  demo users still see the mock data on `/cdss/*`.
- ADR 0005 captures the decision.

### Deferred (still open on Build Tracker feature 1)

- Sign-in second factor (re-prompt on each session) — enrolment is in
  but using the passkey to authenticate at sign-in time is the next
  chunk.
- Idle timeout / session expiry policy.
- Audit-log instrumentation of passkey enrol / remove events.
- Account recovery flow for a clinician who loses their only passkey.
- Pen-test for horizontal privilege escalation.

### Added — 2026-05-08 — Consent tokens (Build Tracker feature 1, chunk 3)

- Migration `003_consent_tokens.sql` — `consent_scope` enum (read_only,
  read_and_note), `consent_tokens` table, RLS policies (patient full
  CRUD on own; clinician read of claimed; permissive update for
  claim flow), `BEFORE UPDATE` trigger blocking un-revoke,
  `is_consent_token_active(token_id, clinician_id)` helper.
- Patient-side: real `/portal/share` page replaces the mock — issue
  form (clinician email, scope, expiry), live list of active tokens
  with copyable URL, revoke action. Server actions
  `issueConsentToken` / `revokeConsentToken` Zod-validated.
- Clinician-side: `/access/<code>` route handler validates the code,
  signs in or claims, sets a server-only `endo_consent_token` cookie,
  redirects to `/cdss`. Failure modes (invalid / expired / revoked /
  claimed-by-another / wrong-role / not-signed-in) each surface a
  named reason on `/access/code-error`.
- Sign-in / callback honour `?access=<code>` so a clinician following
  an access link before signing in completes the claim after the
  magic-link round-trip.
- Sign-out clears the consent cookie alongside the Supabase session.
- Clinician layout shows a patient-context strip when a consent token
  is active: patient display name, scope (Read & note / Read only),
  expiry countdown, truncated consent-token id.
- Helper `getActiveClinicianAccess()` in `src/lib/auth/consent.ts` —
  validates cookie against DB on every read; cookie alone is never
  authority.
- ADR 0004 — consent tokens for patient → clinician access.

### Deferred (still open on Build Tracker feature 1)

- WebAuthn / passkey enrolment (chunk 2; mandatory for clinicians).
- Audit-log instrumentation of consent lifecycle events
  (issue / claim / revoke) — captured in the table itself; mirroring
  to `llm_audit_log` lands with audit-completion (chunk 4).
- Real RLS-gated patient data reads keyed on the consent token —
  demo still renders mock data for clinicians until features 2–5
  produce real data.
- QR code rendering of the access link (link itself is copyable now).
- Pen-test for horizontal privilege escalation.

### Added — 2026-05-07 — Auth foundation (Build Tracker feature 1, chunk 1)

- Magic-link sign-in (`/signin`) with patient / clinician role radio.
  Single form, single server action (`sendMagicLink`), Zod-validated.
- Auth callback (`/auth/callback`) exchanges the code for a session, reads
  the profile's role, redirects to `/portal` or `/cdss`.
- Sign-out (`/auth/signout`) — POST route used by both layouts.
- Migration `002_profiles_and_roles.sql` — `user_role` enum, `profiles`
  table, security-definer trigger on `auth.users` insert that creates a
  profile row with the role from `raw_user_meta_data`. RLS allows subjects
  to read and update their own row only; no insert policy (trigger-only).
- `getCurrentUser()` helper resolves the signed-in user + profile from any
  server component or route.
- Layouts show real `display_name` when signed in; "Demo · Emma Clarke" /
  "Demo · Ms R Patel" when anonymous so the demo continues to work.
- Landing CTAs now route through `/signin?role=…`. A quiet "browse the
  demo" link goes straight to the portals for unauthenticated review.
- ADR 0003 — magic-link auth and patient/clinician role split.

### Deferred (still open on Build Tracker feature 1)

- WebAuthn / passkey enrolment (mandatory for clinicians).
- Consent tokens (patient × clinician × scope × expires).
- Access link + QR generation, token revocation flow.
- Middleware-level route gating (held back so demo keeps working).
- Idle timeout, session expiry policy.
- Pen-test for horizontal privilege escalation.

### Added — 2026-05-07 — Clinical density redesign (clinician side)

- Rapid Answer Panel rebuilt as a grouped definition list (no card grid),
  organised: Symptom pattern · Organ involvement · Bleeding & family ·
  Investigations / treatment / fertility.
- Inline flag rendering — red text + dot, no decorative chips.
- Clinician layout shell: 48px sticky header (down from 64), compact mark,
  smaller nav. Pages widened to `max-w-6xl`–`max-w-7xl`.
- Patients list, Audit log, Timeline all rebuilt as proper tables.
- CSD (clinician view) is plain prose — no card decoration.

### Added — 2026-05-07 — Maven/Hers patient direction

- Excon (Fontshare) replaces Outfit across the platform.
- Custom illustration vocabulary (PetalBloom, Arches, RibbonLoop,
  CycleWave, LinkedCircles, DotField) used as decorative SVG.
- Landing redesigned: full-bleed cream hero with bloom illustration, white
  pillars section, cream paths section.
- Patient portal home: hero strip + cycle-wave divider + stat row +
  side-by-side recent / sharing layout.
- All patient pages widened to `max-w-7xl`, headlines scaled with
  `clamp()` (32–52px responsive).

### Added — 2026-05-07 — Two-palette design system

- Clinician palette (navy ink, blue crayola primary, lavender web soft
  surface, with mauve / aquamarine / yellow-red supporting colours) added
  alongside the existing warm/feminine patient palette. Scoped via
  `[data-theme="clinician"]` on a layout ancestor.
- Destructive red `#D7263D` introduced as a palette-shared token. Used by
  the new `.red-flag-banner` utility for triage urgency that cannot be
  themed into invisibility.
- ADR 0002 — two-palette design system, scoped by audience.

### Removed — 2026-05-07 — Internal dev sandbox pages

- `/dev/palette` and `/dev/gateway` removed from the build. They were
  internal previews, not part of the brief's MVP, and were diluting the
  user-facing surface. The LLM gateway server code (`/api/llm`,
  `src/lib/llm/*`) and the audit-log infrastructure remain untouched.

### Added — 2026-05-07 — Reset and gateway foundation

The first session of the rebuild. The previous prototype was wiped in place
(see "Removed" below). The foundation for everything regulated lands here:
nothing else in the app is allowed to call a model directly.

- Single server-side LLM gateway (`src/lib/llm/gateway.ts`). Validates input,
  composes the system prompt, calls Anthropic via AI SDK + Vercel AI Gateway,
  validates output, sweeps for diagnostic conclusions, enforces the task's
  citation policy, and writes an audit row before returning. ADR 0001.
- Task registry with three v0 tasks: `extract-symptom-from-voice` (Haiku),
  `synth-csd-section` (Sonnet), `clinician-freetext-qa` (Opus). Adding a
  task is a code change; the audit log captures the semver template version.
- Audience-aware system prompt (`src/lib/llm/audience.ts`). Encodes the
  brief's voice-and-tone rules verbatim, with a hard refusal clause for
  diagnostic conclusions. Tasks cannot suppress the base rules.
- Diagnostic-conclusion refusal filter (`src/lib/llm/refusal.ts`). Defence
  in depth on top of the system prompt.
- Hash-chained, append-only audit log (`supabase/migrations/001_audit_log.sql`).
  Trigger blocks UPDATE/DELETE. Stored procedure `llm_audit_log_append`
  computes the chain hash inside an exclusive-locked transaction so
  concurrent appends cannot share a prev_hash. `llm_audit_log_verify_chain`
  walks the chain and returns the first tampered row id.
- `/api/llm` route — the only client-callable surface that reaches the
  gateway. Server-only Node runtime.
- `/dev/gateway` internal sandbox to exercise the gateway against four
  presets covering the success path, validation failure, and a
  diagnostic-elicitation attempt.
- Persistent regulatory disclaimer in the root layout footer; the same
  disclaimer text is carried on every gateway response.
- Warm/feminine palette in `globals.css`. Aubergine ink on cream, with clay
  primary and plum accent. WCAG 2.1 AA contrast on body and label pairs.
- Vitest set up. First tests cover the audience prompt assembly, the task
  registry shape, and the diagnostic-conclusion filter.
- ADR 0001 — single server-side LLM gateway with hash-chained audit log.

### Removed — 2026-05-07 — Previous prototype wiped

Decision recorded in this session: the previous prototype build was a first
pass and not the foundation. Per agreement, `src/`, `supabase/migrations/`,
and prior store/component code were removed. Preserved: `package.json` and
all tooling configs; brand mark and imagery; the synthetic patient cohort
(moved to `demo-data/patient-cohort.ts` for use as test data when features
land).

### Verification status

- `next dev` boots cleanly (`Ready in 413ms`, Next.js 16.2.1, Turbopack).
- TCP handshake to `localhost:3000` from inside the build sandbox is blocked,
  so the landing and `/dev/gateway` pages were not opened in the preview
  browser this session. Run `npm run dev` outside the sandbox to verify.
- Vitest hangs on first run under Node 24.14 / vitest 4.1.5 in this
  environment; tests are written under `test/llm/` and ready to run.
  Likely fix is downgrading Node or upgrading vitest; revisit next session.

### Deferred

- Auth (passwordless magic-link + WebAuthn passkeys, patient/clinician roles).
- FHIR R4 schema for clinical data.
- Voice-first pain journal end-to-end.
- Cumulative Symptom Dossier surface.
- NICE NG73 rule-based compliance prompter.
- Adenomyosis co-detection module.
- Rule-based red-flag triage.
- Rapid Answer Panel.
- Supabase region lock (operational decision; pending dashboard check).
- Playwright E2E tests.
