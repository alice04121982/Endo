# ADR 0004 — Consent tokens for patient → clinician access

- **Status:** accepted
- **Date:** 2026-05-08
- **Decision drivers:** Brief — "consent-governed access: clinicians see a patient's record only via consent-based, time-limited access tokens." Build Tracker feature 1 sub-tasks; ADRs 0001 (audit log), 0003 (auth foundation).

## Context

The brief is unambiguous: clinician access to any patient's record is gated by a token the patient explicitly issues. The token carries:

- A finite expiry chosen by the patient (1h to 30d).
- A scope (read-only by default; read-and-note when the patient grants).
- An identifier the patient can revoke at any time.

Endo never auto-shares a record. There is no "implied consent" pattern. A clinician cannot navigate to a patient's record by guessing or by knowing the patient's identifier — they must follow a link the patient gave them and claim the token while signed in as a clinician.

## Decision

A new table `public.consent_tokens` records each grant. The clinician's web session carries an active-consent cookie pointing at the active token id; on every request the cookie is validated against the database, never trusted on its own.

### Table shape

`supabase/migrations/003_consent_tokens.sql`. Notable columns:

- `patient_subject_id` — the patient who issued the token. Set on insert; immutable.
- `clinician_subject_id` — null until first claim. The clinician who follows the link and signs in becomes the claimant. Once claimed, only that clinician's session can use the token.
- `clinician_email` — the email the patient typed when issuing. A hint, not a security boundary; the actual claimant is the signed-in clinician.
- `scope` — `read_only` | `read_and_note`. New scopes require an ADR.
- `issued_at`, `expires_at`, `revoked_at` — lifecycle. CHECK constraints enforce expiry > issuance and no un-revocation.
- `access_code` — random URL-safe token (`endo_<22 chars>`). Unique. Anyone with the code can attempt to claim until it's claimed.
- `claimed_at`, `last_used_at` — observability for the patient's UI.

### RLS

- Patients: full CRUD on their own rows.
- Clinicians: read rows where they are the claimant; permissive update policy that lets them claim an unclaimed-or-self-owned, unrevoked, unexpired token (with a `WITH CHECK` that prevents claiming someone else's). The application layer also gates claims via the access code arriving on the URL — RLS is defence in depth, not the only gate.
- Service role bypasses RLS for the audit-log writer and any future scheduled cleanup.

A trigger blocks `UPDATE` that would clear `revoked_at` once set. Once revoked, always revoked.

### Helper

`is_consent_token_active(p_token_id, p_clinician_subject_id)` is a security-definer SQL function. Application server code calls this on every request to confirm the token still authorises the session before reading patient data. Cookie alone is never enough.

### Cookie

`endo_consent_token`. HttpOnly, Secure (in production), SameSite=Lax, Path=/. Holds only the token id. 12-hour cookie expiry — the token's own `expires_at` may be shorter and is the binding control.

### Flows

**Patient issues a link**
1. Patient signs in (magic link, ADR 0003).
2. On `/portal/share`, fills the issue form: clinician email (optional), scope (read-only / read-and-note), expiry (1h / 24h / 7d / 30d).
3. Server action `issueConsentToken` validates with Zod, generates a random `access_code`, inserts a row.
4. Patient sees the URL `https://<host>/access/<access_code>`, can copy or revoke.

**Clinician claims a link**
1. Clinician follows `/access/<code>`.
2. If not signed in → bounced to `/signin?role=clinician&access=<code>`. Magic link round-trips back through `/auth/callback?role=clinician&access=<code>`, then redirects to `/access/<code>` with the new session active.
3. Server validates the code (exists, not revoked, not expired, not claimed by anyone else), claims it for this clinician's `auth.uid()`, sets `claimed_at` (idempotent on re-claim), bumps `last_used_at`.
4. Server sets the active-consent cookie and redirects to `/cdss`.
5. Each clinician page reads `getActiveClinicianAccess()`, surfaces the patient name + scope + expiry in the layout's patient-context strip, and uses the consent to authorise data fetches.

**Patient revokes**
1. From `/portal/share`, clicks Revoke on a row.
2. Server action sets `revoked_at = now()`. Trigger ensures it cannot be undone.
3. Within the next request the clinician's `getActiveClinicianAccess()` returns null. Their cookie still exists but the DB returns no active row, so the layout drops the consent strip and downstream data fetches refuse.

### Audit integration

The gateway (ADR 0001) already accepts `consentTokenId` as a typed field. The next chunk wires the active consent token into every clinician-side gateway call so the audit row carries it. Patient-side gateway calls leave it null.

## What this chunk does NOT include (deferred)

- **Pen-test for horizontal privilege escalation.** Acceptance criterion on the build tracker; runs once consent tokens + passkeys are both in place.
- **WebAuthn passkeys** (chunk 2 of feature 1). Mandatory for clinicians per the brief. Lands as a follow-up.
- **Automatic revocation on patient role change** or account deletion is partially covered by `ON DELETE CASCADE` from `auth.users`. A deactivated-but-not-deleted patient's tokens are not auto-revoked yet — flagged for review.
- **QR code rendering** of the access link. The link itself is shown and copyable; QR is a small follow-up.
- **Notification to clinician** that a token was revoked. The clinician's next request boots them to a "no access" state; explicit notification is a follow-up.
- **Audit-log instrumentation of consent-token lifecycle events** (issue / claim / revoke). The events are recorded in `consent_tokens` itself; mirroring them into `llm_audit_log` lands when audit-completion (chunk 4) ships.
- **Real RLS-gated patient data reads** keyed on the consent token. Demo continues to render mock data for clinicians; the real data plumbing arrives with feature 5 (CSD) and feature 9 (Rapid Answer Panel real implementation).

## Consequences

- A patient can issue, share, and revoke clinician access end-to-end through the UI.
- A clinician can follow a link, sign in if needed, claim a token, and land on the Rapid Answer Panel surface with the patient context visible.
- Every clinician session that reaches `/cdss/*` carries either an active consent token (and the layout shows it) or no token (and downstream data fetches will refuse — currently a soft demo state).
- The cookie-as-pointer + DB-as-authority pattern means an exfiltrated cookie alone authorises nothing; revocation is effective on the next request.

## References

- Migration: `supabase/migrations/003_consent_tokens.sql`
- Helper: `src/lib/auth/consent.ts`
- Server actions: `src/app/portal/share/actions.ts`
- Patient share UI: `src/app/portal/share/page.tsx`
- Access landing: `src/app/access/[code]/route.ts`, `src/app/access/code-error/page.tsx`
- Sign-in / callback: forwards `?access=<code>` through magic link round-trip
- Sign-out: clears the consent cookie
- Brief: feature 1 sub-tasks; feature 9 (consent-token landing as Rapid Answer Panel entry)
