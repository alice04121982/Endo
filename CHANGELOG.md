# Changelog

All notable changes to Endo are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) loosely. Regulatory
decisions are captured as ADRs in `docs/adr/`.

## [Unreleased]

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
