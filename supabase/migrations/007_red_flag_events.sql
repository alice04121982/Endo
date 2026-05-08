-- Endo: red-flag triage events.
--
-- The brief lists red-flag triage as the highest-stakes output in the
-- platform. Every fire is captured in `red_flag_events` for audit. Once
-- a row is written it is never modified — patient acknowledgements
-- write a follow-up row. Append-only by trigger.
--
-- The engine is rule-based; the rule_id, rule_pack_version, and the
-- inputs that drove the fire are recorded in full. No LLM in the
-- trigger or the action path.

create type public.red_flag_severity as enum ('urgent');

create table public.red_flag_events (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),

  patient_subject_id uuid not null references auth.users(id) on delete cascade,

  rule_id text not null,
  rule_pack_version text not null,
  severity public.red_flag_severity not null default 'urgent',

  -- The inputs the engine was evaluating at fire time. Stored verbatim
  -- for replay and audit. Includes the journal entry ids and any
  -- symptom-check responses the patient submitted.
  inputs jsonb not null,

  -- Patient response: opened the banner, tapped the urgent-care CTA,
  -- dismissed (only permitted for "no longer relevant" — never to
  -- silence the rule).
  patient_response text check (patient_response in (
    'unread',
    'opened',
    'cta_followed',
    'no_longer_relevant'
  )) not null default 'unread',
  patient_response_at timestamptz
);

create index idx_red_flag_patient_recent on public.red_flag_events(patient_subject_id, created_at desc);
create index idx_red_flag_active on public.red_flag_events(patient_subject_id, patient_response, created_at desc);

alter table public.red_flag_events enable row level security;

-- Patients read their own events (so the audit trail surface can show them).
create policy "Patients read own red flag events"
  on public.red_flag_events for select
  using (auth.uid() = patient_subject_id);

-- Patients update their own events to record their response. The trigger
-- below blocks any change other than to patient_response / patient_response_at.
create policy "Patients update own red flag events"
  on public.red_flag_events for update
  using (auth.uid() = patient_subject_id);

-- Clinicians read events on patients they hold an active consent for.
create policy "Clinicians read consented red flag events"
  on public.red_flag_events for select
  using (
    exists (
      select 1 from public.consent_tokens c
      where c.patient_subject_id = public.red_flag_events.patient_subject_id
        and c.clinician_subject_id = auth.uid()
        and c.revoked_at is null
        and c.expires_at > now()
    )
  );

-- No insert policy — fires write through the service-role client.
-- No delete policy — events are append-only.

-- ─────────────────────────────────────────────────────────────────────────────
-- Append-only enforcement on the structural fields
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.red_flag_events_block_mutations()
returns trigger as $$
begin
  -- Patient may only update patient_response and patient_response_at.
  if new.id is distinct from old.id then
    raise exception 'red_flag_events.id is immutable';
  end if;
  if new.patient_subject_id is distinct from old.patient_subject_id then
    raise exception 'red_flag_events.patient_subject_id is immutable';
  end if;
  if new.rule_id is distinct from old.rule_id then
    raise exception 'red_flag_events.rule_id is immutable';
  end if;
  if new.rule_pack_version is distinct from old.rule_pack_version then
    raise exception 'red_flag_events.rule_pack_version is immutable';
  end if;
  if new.severity is distinct from old.severity then
    raise exception 'red_flag_events.severity is immutable';
  end if;
  if new.inputs::text is distinct from old.inputs::text then
    raise exception 'red_flag_events.inputs is immutable';
  end if;
  if new.created_at is distinct from old.created_at then
    raise exception 'red_flag_events.created_at is immutable';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger red_flag_events_immutable_fields
  before update on public.red_flag_events
  for each row execute function public.red_flag_events_block_mutations();
