-- Endo: profiles table + role enum.
--
-- Every Supabase auth user gets a row in public.profiles with a role of
-- 'patient' or 'clinician'. Role is captured at sign-up via raw_user_meta_data
-- and persisted by an INSERT trigger on auth.users. Magic-link sign-in is
-- the only auth method (per brief — passwordless, no password-based, no
-- third-party social).
--
-- Patient and clinician records are kept in the same table; the role column
-- is the discriminator. Future per-role data lives in dedicated tables that
-- foreign-key into profiles(id) (e.g. patient_record, clinician_credential).

create type public.user_role as enum ('patient', 'clinician');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profiles_role on public.profiles(role);

alter table public.profiles enable row level security;

-- Subjects can read and update their own profile.
create policy "Users can read own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);
-- No insert policy: profiles are created exclusively by the security-definer
-- trigger below, which fires on auth.users insert. Application code never
-- inserts profile rows directly.

-- ─────────────────────────────────────────────────────────────────────────────
-- Auto-create profile on signup
-- ─────────────────────────────────────────────────────────────────────────────
-- The role is captured at sign-up via signInWithOtp({ data: { role } }).
-- Defaults to 'patient' if absent. display_name defaults to the local-part
-- of the email (e.g. "alice" from "alice@example.com").
create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_role public.user_role;
  v_display_name text;
begin
  begin
    v_role := coalesce(
      (new.raw_user_meta_data->>'role')::public.user_role,
      'patient'
    );
  exception when invalid_text_representation then
    v_role := 'patient';
  end;

  v_display_name := coalesce(
    nullif(new.raw_user_meta_data->>'display_name', ''),
    split_part(new.email, '@', 1)
  );

  insert into public.profiles (id, role, display_name)
    values (new.id, v_role, v_display_name);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- updated_at maintenance
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_touch_updated
  before update on public.profiles
  for each row execute function public.touch_updated_at();
