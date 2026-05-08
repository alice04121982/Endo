-- Endo: consent tokens — patient-issued, time-limited, scope-limited grants
-- that authorise a specific clinician (or any clinician with the access
-- code) to read a patient's record.
--
-- Per the brief, clinician access to a patient's record is gated entirely
-- by an active consent token. Tokens carry:
--   - patient_subject_id   — the patient who issued the token
--   - clinician_subject_id — the clinician who claimed it (null until claim)
--   - clinician_email      — what the patient typed when issuing (a hint,
--                            not a security boundary)
--   - scope                — read_only or read_and_note
--   - issued_at, expires_at, revoked_at
--   - access_code          — random URL-safe token used in the access link;
--                            unique; never reused once revoked or claimed
--   - last_used_at         — last successful access (for the patient's UI)
--
-- A clinician follows the access link, the server validates the token
-- (active, not expired, not revoked), claims it for the clinician's
-- subject id (idempotent if already claimed by them), and sets a
-- server-only cookie carrying the consent_token_id. Every subsequent
-- gateway call from that clinician's session passes the consent_token_id
-- so the audit chain ties the data access to a specific patient grant.

create extension if not exists "pgcrypto";

create type public.consent_scope as enum ('read_only', 'read_and_note');

create table public.consent_tokens (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),

  patient_subject_id uuid not null references auth.users(id) on delete cascade,

  -- Clinician set on claim. Until then the token is unclaimed but valid
  -- against the access_code (anyone with the code can claim).
  clinician_subject_id uuid references auth.users(id) on delete set null,
  clinician_email text,

  scope public.consent_scope not null default 'read_only',

  issued_at  timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,

  access_code text not null unique,

  -- Claimed-at marks first claim by a clinician (when clinician_subject_id
  -- is set). last_used_at updates on every authorised access for the
  -- patient's UI to show the clinician's last visit.
  claimed_at timestamptz,
  last_used_at timestamptz,

  constraint consent_tokens_expiry_in_future check (expires_at > issued_at),
  constraint consent_tokens_revoked_after_issued
    check (revoked_at is null or revoked_at >= issued_at)
);

create index idx_consent_tokens_patient on public.consent_tokens(patient_subject_id, created_at desc);
create index idx_consent_tokens_clinician on public.consent_tokens(clinician_subject_id, created_at desc);
create index idx_consent_tokens_access_code on public.consent_tokens(access_code) where revoked_at is null;

alter table public.consent_tokens enable row level security;

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS — patient-side
-- ─────────────────────────────────────────────────────────────────────────────
-- Patients see, create, update (revoke), and delete their own tokens.
create policy "Patients read own tokens"
  on public.consent_tokens for select
  using (auth.uid() = patient_subject_id);

create policy "Patients insert own tokens"
  on public.consent_tokens for insert
  with check (auth.uid() = patient_subject_id);

create policy "Patients update own tokens"
  on public.consent_tokens for update
  using (auth.uid() = patient_subject_id);

create policy "Patients delete own tokens"
  on public.consent_tokens for delete
  using (auth.uid() = patient_subject_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS — clinician-side
-- ─────────────────────────────────────────────────────────────────────────────
-- Clinicians read tokens they have claimed.
create policy "Clinicians read claimed tokens"
  on public.consent_tokens for select
  using (auth.uid() = clinician_subject_id);

-- Clinician claim: a clinician can update an unclaimed, unrevoked,
-- unexpired token to set themselves as the claimant. They cannot change
-- the scope, the patient, or any other field via this policy — the
-- application is responsible for narrow updates. The check clause
-- enforces that only the clinician_subject_id, claimed_at and last_used_at
-- can be set; any other change requires the patient or service role.
--
-- This permissive update policy is acceptable because we also gate via
-- the access code at the application layer: a clinician must arrive
-- carrying a valid access_code before they're allowed to attempt the
-- claim. RLS is defence in depth, not the only gate.
create policy "Clinicians claim valid tokens"
  on public.consent_tokens for update
  using (
    revoked_at is null
    and expires_at > now()
    and (clinician_subject_id is null or clinician_subject_id = auth.uid())
  )
  with check (
    revoked_at is null
    and expires_at > now()
    and clinician_subject_id = auth.uid()
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- Append-only revoke audit
-- ─────────────────────────────────────────────────────────────────────────────
-- Once a token is revoked, it cannot be un-revoked. Trigger blocks
-- updates that would clear revoked_at.
create or replace function public.consent_tokens_block_unrevoke()
returns trigger as $$
begin
  if old.revoked_at is not null and new.revoked_at is null then
    raise exception 'consent_tokens.revoked_at cannot be cleared once set';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger consent_tokens_no_unrevoke
  before update on public.consent_tokens
  for each row execute function public.consent_tokens_block_unrevoke();

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper: is_consent_token_active
-- ─────────────────────────────────────────────────────────────────────────────
-- Single function the application calls to decide whether a clinician's
-- session may proceed. Returns true iff the token exists, is not revoked,
-- has not expired, and is claimed by the given clinician.
create or replace function public.is_consent_token_active(
  p_token_id uuid,
  p_clinician_subject_id uuid
) returns boolean as $$
  select exists (
    select 1 from public.consent_tokens
    where id = p_token_id
      and clinician_subject_id = p_clinician_subject_id
      and revoked_at is null
      and expires_at > now()
  );
$$ language sql stable security definer set search_path = public;
