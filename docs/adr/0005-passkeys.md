# ADR 0005 — WebAuthn passkeys (mandatory for clinicians)

- **Status:** accepted
- **Date:** 2026-05-08
- **Decision drivers:** Brief — "WebAuthn / passkey enrolment (mandatory clinician, optional patient)". Build Tracker feature 1, chunk 2. ADR 0003 (auth foundation), ADR 0004 (consent tokens).

## Context

The brief mandates WebAuthn passkeys as a strong factor on clinician accounts. Passwords are explicitly out of scope; the magic-link foundation (ADR 0003) is the only primary auth method. Passkeys layer on top — they prove the device, not the email.

For patients, passkeys are optional. For clinicians, they're mandatory before any clinical surface (`/cdss/*`) can be accessed.

## Decision

This chunk implements **enrolment and management** of passkeys, plus a **hard gate** for clinician access. Using passkeys as a sign-in second factor (re-prompting on each session) lands as a follow-up.

### Library

`@simplewebauthn/server` for the server-side ceremony helpers (challenge generation, attestation verification, signature verification). `@simplewebauthn/browser` for the client-side `startRegistration` flow that invokes the OS passkey UI.

### Storage

Migration `004_passkeys.sql` adds `public.passkeys` keyed on `user_id`:

- `credential_id` (text, unique) — the WebAuthn credential id.
- `public_key` (text) — Base64URL-encoded COSE public key.
- `counter` (bigint) — replay-protection signature counter.
- `transports` (text[]) — how the authenticator was reached.
- `device_name` (text, nullable) — user-supplied label.
- `backed_up` (boolean) — whether the authenticator syncs across devices.
- `created_at`, `last_used_at`.

RLS lets users read / insert / update / delete their own rows only.

### Relying-party config

Environment-driven so previews and production can differ:

- `WEBAUTHN_RP_ID` — RP id; falls back to the request host's bare name.
- `WEBAUTHN_RP_NAME` — human-readable name; defaults to "Endo".

The expected origin is computed from request headers at ceremony time.

For Vercel preview deploys (each gets a unique URL), enrolling a passkey on one preview won't authenticate on another — RP IDs differ. This is acceptable for the demo. Production locks `WEBAUTHN_RP_ID` to the canonical domain.

### Enrolment flow

1. User signs in (magic link, ADR 0003).
2. Visits `/account/security`.
3. Clicks "Enrol a passkey".
4. Client calls `startPasskeyEnrollment` (server action) which returns options + sets a short-lived `endo_passkey_challenge` cookie (HttpOnly, SameSite=strict, 5-minute TTL).
5. `@simplewebauthn/browser`'s `startRegistration` opens the OS passkey UI.
6. The credential response is posted to `finishPasskeyEnrollment`. Server reads the challenge cookie, verifies attestation, inserts a passkey row, clears the challenge.

Removal is a single server action that deletes by id, scoped to the user.

### Clinician hard gate

`src/app/cdss/layout.tsx` reads `countOwnPasskeys()` for the signed-in clinician. If zero, the layout `redirect("/account/security?required=1")` before rendering anything else. The security page surfaces a labelled "Passkey required" alert.

Anonymous demo users (no session) keep seeing `/cdss/*` mock content. The gate only fires for signed-in clinicians.

## What this chunk does NOT include (deferred)

- **Sign-in second factor.** Passkeys are enrolled and managed; on subsequent sign-ins users are not yet re-prompted to verify. Magic-link is still the only step. Layering an authentication ceremony on the magic-link callback is the next chunk.
- **Idle timeout.** Cookie-based session keeps the user signed in until magic-link expiry / explicit sign-out. Idle timeout lands with the security-hardening chunk.
- **Audit-log instrumentation.** Enrolment / removal events are recorded in `passkeys` itself; mirroring to `llm_audit_log` lands with audit-completion (chunk 4).
- **Account recovery.** A user with no devices and no passkeys can still re-enrol via magic link. Recovery flows for clinicians who lose their only passkey land later.
- **Multi-device "this is a new device" detection.** Out of scope for MVP.

## Consequences

- A clinician arriving on `/cdss` for the first time after sign-in is redirected to `/account/security?required=1` until they enrol. Once enrolled, the gate lifts.
- Patients see the same security page voluntarily; the page reads less urgently for them ("optional — your magic link is enough on its own").
- The challenge cookie pattern is the same shape as the consent-token cookie (HttpOnly, narrow TTL, server-only). DB is always the authority on whether a passkey exists.
- RP-ID drift across previews is a known limitation — enrolments on preview deploys won't carry over to production. Documented for the engineer applying the migration.

## References

- Migration: `supabase/migrations/004_passkeys.sql`
- Server-side ceremony: `src/lib/auth/passkeys.ts`
- Server actions: `src/app/account/security/actions.ts`
- Security page: `src/app/account/security/page.tsx`
- Client enrolment: `src/app/account/security/enroll-button.tsx`
- Clinician hard gate: `src/app/cdss/layout.tsx`
- Brief: feature 1, "WebAuthn/passkey enrolment (mandatory clinician, optional patient)"
- Build Tracker: feature 1, chunk 2
