-- Endo: passkeys (WebAuthn) — second factor for clinicians (mandatory),
-- optional for patients.
--
-- Per the brief: passwordless magic-link is the primary auth method;
-- passkeys are layered on top as a strong factor. Mandatory enrolment
-- for clinicians before they can access /cdss; patients may enrol but
-- are not blocked from /portal if they don't.
--
-- Storage:
--   - credential_id is the unique passkey identifier (Base64URL string).
--   - public_key is the stored COSE public key, Base64URL-encoded.
--   - counter is the WebAuthn signature counter for replay protection.
--   - transports records how the authenticator was reached
--     (e.g. ['internal'], ['hybrid', 'usb']).
--   - device_name is a user-supplied label for management UI.
--
-- This chunk wires enrolment + management. Using the passkey as a sign-in
-- 2nd factor lands as a follow-up. Sign-in still goes through magic link
-- in the meantime.

create table public.passkeys (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  credential_id text not null unique,
  public_key text not null,
  counter bigint not null default 0,
  transports text[] not null default '{}',
  device_name text,
  backed_up boolean not null default false,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create index idx_passkeys_user on public.passkeys(user_id);

alter table public.passkeys enable row level security;

create policy "Users read own passkeys"
  on public.passkeys for select using (auth.uid() = user_id);

create policy "Users insert own passkeys"
  on public.passkeys for insert with check (auth.uid() = user_id);

create policy "Users delete own passkeys"
  on public.passkeys for delete using (auth.uid() = user_id);

create policy "Users update own passkeys"
  on public.passkeys for update using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper: count active passkeys per user.
-- Used by application code to gate clinician access to /cdss.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.count_user_passkeys(p_user_id uuid)
returns int as $$
  select count(*)::int from public.passkeys where user_id = p_user_id;
$$ language sql stable security definer set search_path = public;
