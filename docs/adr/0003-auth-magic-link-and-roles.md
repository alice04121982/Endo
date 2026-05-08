# ADR 0003 — Magic-link auth and patient/clinician role split

- **Status:** accepted
- **Date:** 2026-05-07
- **Decision drivers:** Brief (no password-based auth for MVP; passwordless magic-link + WebAuthn passkeys; patient and clinician roles from day one). Build Tracker feature 1.

## Context

Every feature on the Build Tracker is blocked by feature 1. The brief is explicit: passwordless authentication, no third-party social sign-in, role-aware sign-up flows, role-aware UI, consent-governed clinician access via time-limited tokens. WebAuthn passkeys are mandated for clinicians and optional for patients.

Auth is also the regulatory backbone — IEC 62304 software safety classification, DSP Toolkit DSS 1, and UK GDPR all sit on top of "who is this person and what are they allowed to see".

## Decision

This chunk delivers the foundational auth flow. Subsequent chunks layer on passkeys (chunk 2) and consent tokens (chunk 3).

### Identity and role

- **Single source of truth:** Supabase `auth.users` for credentials, `public.profiles` for application-level identity.
- **Role enum:** `public.user_role` is `('patient', 'clinician')`. The role lives on the profile row, not on `auth.users`. Set at sign-up via `signInWithOtp({ data: { role } })` and persisted by an INSERT trigger on `auth.users` (see migration `002_profiles_and_roles.sql`).
- **No insert policy** on `public.profiles`. The trigger is the only writer. Application code never inserts profile rows. RLS only allows a user to read or update their own row.

### Sign-in flow

- **Magic link only.** No password fields anywhere in the application. Per the brief.
- **One sign-in surface (`/signin`)** with a role radio. Same form does both audiences; the role goes in `data` payload and is captured by the trigger on first sign-in. Returning users keep their existing role.
- **Server action (`sendMagicLink`)** validates input with Zod, calls `supabase.auth.signInWithOtp`, redirects to a "check your email" success state.
- **Callback (`/auth/callback`)** exchanges the code for a session, reads the profile's role, and redirects to `/portal` (patient) or `/cdss` (clinician).
- **Sign-out (`/auth/signout`)** is a POST route. Layout sign-out controls submit a form to it so logout is a server-side action.

### Demo behaviour

- The brief expects a working demo. Real auth is now wired, but `/portal/*` and `/cdss/*` remain accessible to anonymous users for demonstration purposes. The layouts show "Demo · Emma Clarke" / "Demo · Ms R Patel" when no session exists, and the user's actual `display_name` once signed in.
- This is a deliberate, time-bound exception. Middleware-level route gating lands when the consent-token chunk arrives, by which point the demo can move to a seeded demo account.

### What this chunk does NOT include (deferred)

- **WebAuthn / passkeys.** Mandatory for clinicians per the brief. Lands in chunk 2.
- **Consent tokens.** Time-limited, scope-limited, patient × clinician × scope × expires. RLS keyed on token. Lands in chunk 3.
- **Idle timeout, session expiry, token revocation flows.** Chunk 3.
- **Middleware route gating.** Held back deliberately so the demo continues to work; turns on with chunk 3.
- **Pen-test / horizontal privilege escalation review.** Mandatory acceptance criterion; happens after chunk 3.

## Consequences

- A real account can now sign up via magic link and reach its role-appropriate home. The audit log infrastructure (ADR 0001) starts capturing real `caller_subject_id` values once the audit migration is applied alongside.
- The trigger-based profile creation means a brand-new sign-up always has a profile row before any application code reads it. No race.
- Display name defaults to the local-part of the email; users can update it once a profile-edit surface exists.
- The role enum is closed (`patient | clinician`). Adding a third role (e.g. researcher, regulator) is a migration plus an enum value.

## References

- Migration: `supabase/migrations/002_profiles_and_roles.sql`
- Sign-in: `src/app/signin/page.tsx`, `src/app/signin/actions.ts`
- Callback: `src/app/auth/callback/route.ts`
- Sign-out: `src/app/auth/signout/route.ts`
- Helper: `src/lib/auth/current-user.ts`
- Brief sections: "1. Auth and user model", "What you should NOT do" (no passwords)
- Build Tracker: feature 1
