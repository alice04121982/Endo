-- Endo: pain journal entries (FHIR-shaped, persisted patient-side).
--
-- Each entry captures the structured payload that Endo holds about a
-- single self-report. Voice and quick-tap paths produce identical
-- shapes; the `source` column records which path was used.
--
-- Voice entries also retain the transcript and an `audit_entry_id` link
-- back to the gateway audit row that produced the extraction. Audit
-- linkage is required by the Class IIa logging story (ADR 0001).
--
-- Cycle context (LMP, average cycle length) lives on the profile so
-- cycle-day computation is deterministic and patient-revisable.

-- ─────────────────────────────────────────────────────────────────────────────
-- Profile cycle context
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists last_menstrual_period_start date,
  add column if not exists average_cycle_length_days int;

alter table public.profiles
  add constraint profiles_cycle_length_sane
  check (
    average_cycle_length_days is null
    or (average_cycle_length_days between 14 and 60)
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────────────────────────────────────
create type public.cycle_phase as enum (
  'menstrual', 'follicular', 'ovulatory', 'luteal', 'cycle_agnostic'
);

create type public.bleeding_heaviness as enum (
  'none', 'spotting', 'light', 'moderate', 'heavy', 'very_heavy'
);

create type public.journal_source as enum ('voice', 'quick_tap');

-- ─────────────────────────────────────────────────────────────────────────────
-- journal_entries
-- ─────────────────────────────────────────────────────────────────────────────
create table public.journal_entries (
  id uuid primary key default uuid_generate_v4(),
  patient_subject_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  recorded_at timestamptz not null default now(),
  entry_date date not null,

  -- Cycle context at the time of entry. Stored alongside the entry so
  -- changing LMP later doesn't retroactively rewrite history.
  cycle_day int check (cycle_day is null or (cycle_day between 1 and 60)),
  cycle_phase public.cycle_phase not null default 'cycle_agnostic',

  -- Pain
  pain_vas int check (pain_vas is null or (pain_vas between 0 and 10)),
  pain_locations text[] not null default '{}',

  -- Organ involvement
  bowel_symptoms text[] not null default '{}',
  bladder_symptoms text[] not null default '{}',
  dyspareunia boolean,

  -- Bleeding
  bleeding_heaviness public.bleeding_heaviness not null default 'none',

  -- Constitutional
  fatigue_vas int check (fatigue_vas is null or (fatigue_vas between 0 and 10)),
  mood_score int check (mood_score is null or (mood_score between 1 and 5)),

  -- Free text
  notes text,

  -- Provenance
  source public.journal_source not null,
  transcript text,                                  -- voice path only
  patient_plain_summary text not null,              -- read back to patient
  ai_extracted boolean not null default false,
  model_id text,                                    -- voice path only
  prompt_template_version text,                     -- voice path only
  audit_entry_id uuid references public.llm_audit_log(id) on delete set null
);

create index idx_journal_patient_date on public.journal_entries(patient_subject_id, entry_date desc);
create index idx_journal_patient_recorded on public.journal_entries(patient_subject_id, recorded_at desc);

alter table public.journal_entries enable row level security;

create policy "Patients read own journal"
  on public.journal_entries for select
  using (auth.uid() = patient_subject_id);

create policy "Patients insert own journal"
  on public.journal_entries for insert
  with check (auth.uid() = patient_subject_id);

create policy "Patients update own journal"
  on public.journal_entries for update
  using (auth.uid() = patient_subject_id);

create policy "Patients delete own journal"
  on public.journal_entries for delete
  using (auth.uid() = patient_subject_id);

-- Clinicians read entries on patients they hold an active consent token
-- for. Implemented as an EXISTS subquery against consent_tokens; the
-- fast path is the existing patient index since consent_tokens is small.
create policy "Clinicians read consented patients' journal"
  on public.journal_entries for select
  using (
    exists (
      select 1 from public.consent_tokens c
      where c.patient_subject_id = public.journal_entries.patient_subject_id
        and c.clinician_subject_id = auth.uid()
        and c.revoked_at is null
        and c.expires_at > now()
    )
  );
