-- Endo: regulatory audit log for AI-generated clinical outputs.
--
-- Rationale: UK MDR 2002 Class IIa SaMD requires that every AI-generated
-- clinical output is logged with input, model, prompt template version,
-- output, and citations, and that the log is tamper-evident.
--
-- Design:
--   - Append-only: no UPDATE or DELETE policy; trigger blocks both.
--   - Hash-chained: each row carries hash(prev_hash || canonical_payload),
--     so any retroactive edit invalidates the chain from the edit forward.
--   - RLS: subjects can read rows about themselves; service role writes;
--     no general-read policy. Clinician access via consent token is added
--     in a later migration when the consent model lands.
--
-- This file is intentionally minimal. It establishes the choke point.
-- Schema extensions (consent tokens, redaction reasons, retention windows)
-- live in subsequent migrations so each addition is auditable on its own.

create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────────────────
-- llm_audit_log
-- ─────────────────────────────────────────────────────────────────────────────
create table public.llm_audit_log (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),

  -- Who initiated the call. Null only for system-initiated jobs (none yet).
  caller_subject_id uuid references auth.users(id) on delete set null,

  -- Whose record the call concerns. May equal caller_subject_id (patient
  -- acting on own record) or differ (clinician acting under consent).
  patient_subject_id uuid references auth.users(id) on delete set null,

  -- Consent token id if this call was authorised by a clinician access grant.
  -- Null for self-service calls. Foreign key added when consent table lands.
  consent_token_id uuid,

  -- Audience the prompt was framed for.
  audience text not null check (audience in ('patient', 'clinician')),

  -- Registered task name (e.g. 'extract-symptom-from-voice'). Free-text so
  -- new tasks don't need a migration; gateway enforces the registry.
  task_name text not null,

  -- Versioned prompt template — semver-style, e.g. 'extract-symptom@1.0.0'.
  prompt_template_version text not null,

  -- Anthropic model id, e.g. 'claude-haiku-4-5-20251001'.
  model_id text not null,

  -- Inputs and output stored as JSONB for replay. PHI is retained per the
  -- patient's data lifecycle; redaction is handled by a separate process.
  inputs jsonb not null,
  output jsonb,

  -- Citations: array of { source_kind, source_id, label } objects.
  citations jsonb not null default '[]'::jsonb,

  -- Outcome of the call.
  outcome text not null check (outcome in (
    'success',
    'refused_diagnostic_conclusion',
    'refused_red_flag_routing',
    'validation_failed',
    'model_error',
    'rate_limited'
  )),

  -- Free-text reason if outcome != 'success'.
  refusal_reason text,

  -- Latency for ops monitoring.
  latency_ms int,

  -- Hash chain for tamper evidence.
  -- prev_hash references the immediately preceding row's row_hash.
  -- row_hash = sha256(prev_hash || canonical_json(this row excluding row_hash)).
  prev_hash text,
  row_hash text not null
);

create index idx_audit_log_caller on public.llm_audit_log(caller_subject_id, created_at desc);
create index idx_audit_log_patient on public.llm_audit_log(patient_subject_id, created_at desc);
create index idx_audit_log_task on public.llm_audit_log(task_name, created_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- Append-only enforcement
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.llm_audit_log_block_mutations()
returns trigger as $$
begin
  raise exception 'llm_audit_log is append-only; UPDATE and DELETE are prohibited';
end;
$$ language plpgsql;

create trigger llm_audit_log_no_update
  before update on public.llm_audit_log
  for each row execute function public.llm_audit_log_block_mutations();

create trigger llm_audit_log_no_delete
  before delete on public.llm_audit_log
  for each row execute function public.llm_audit_log_block_mutations();

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.llm_audit_log enable row level security;

-- Subjects can read rows where they were the caller or the data subject.
-- Clinician-via-consent-token reads land in a later migration.
create policy "Subjects can read own audit rows"
  on public.llm_audit_log for select
  using (
    auth.uid() = caller_subject_id
    or auth.uid() = patient_subject_id
  );

-- No insert policy: writes go through the service role only, so application
-- code cannot bypass the gateway.

-- ─────────────────────────────────────────────────────────────────────────────
-- Hash chain helpers
-- ─────────────────────────────────────────────────────────────────────────────
-- Canonical payload assembled from a row. Hash inputs are concatenated with
-- '|' separators in a fixed field order. Keep this function and
-- llm_audit_log_verify_chain in lockstep.
create or replace function public.llm_audit_log_canonical_payload(
  p_prev_hash text,
  p_id uuid,
  p_created_at timestamptz,
  p_caller_subject_id uuid,
  p_patient_subject_id uuid,
  p_consent_token_id uuid,
  p_audience text,
  p_task_name text,
  p_prompt_template_version text,
  p_model_id text,
  p_inputs jsonb,
  p_output jsonb,
  p_citations jsonb,
  p_outcome text,
  p_refusal_reason text,
  p_latency_ms int
) returns text as $$
  select coalesce(p_prev_hash, '') || '|' ||
    p_id::text || '|' ||
    extract(epoch from p_created_at)::text || '|' ||
    coalesce(p_caller_subject_id::text, '') || '|' ||
    coalesce(p_patient_subject_id::text, '') || '|' ||
    coalesce(p_consent_token_id::text, '') || '|' ||
    p_audience || '|' ||
    p_task_name || '|' ||
    p_prompt_template_version || '|' ||
    p_model_id || '|' ||
    p_inputs::text || '|' ||
    coalesce(p_output::text, '') || '|' ||
    p_citations::text || '|' ||
    p_outcome || '|' ||
    coalesce(p_refusal_reason, '') || '|' ||
    coalesce(p_latency_ms::text, '');
$$ language sql immutable;

-- Atomic append. The gateway calls this rather than inserting directly so
-- the prev-hash read and the row insert happen in one transaction; two
-- concurrent appends cannot both pick up the same prev_hash.
create or replace function public.llm_audit_log_append(
  p_caller_subject_id uuid,
  p_patient_subject_id uuid,
  p_consent_token_id uuid,
  p_audience text,
  p_task_name text,
  p_prompt_template_version text,
  p_model_id text,
  p_inputs jsonb,
  p_output jsonb,
  p_citations jsonb,
  p_outcome text,
  p_refusal_reason text,
  p_latency_ms int
) returns table (id uuid, row_hash text) as $$
declare
  v_prev_hash text;
  v_id uuid := uuid_generate_v4();
  v_created_at timestamptz := now();
  v_payload text;
  v_hash text;
begin
  -- Lock the table briefly so the prev_hash read and the insert are atomic.
  -- This is a write-rate ceiling but acceptable: clinical LLM call volume
  -- is human-scale, not machine-scale.
  lock table public.llm_audit_log in exclusive mode;

  select l.row_hash into v_prev_hash
  from public.llm_audit_log l
  order by l.created_at desc, l.id desc
  limit 1;

  v_payload := public.llm_audit_log_canonical_payload(
    v_prev_hash, v_id, v_created_at,
    p_caller_subject_id, p_patient_subject_id, p_consent_token_id,
    p_audience, p_task_name, p_prompt_template_version, p_model_id,
    p_inputs, p_output, p_citations,
    p_outcome, p_refusal_reason, p_latency_ms
  );
  v_hash := encode(digest(v_payload, 'sha256'), 'hex');

  insert into public.llm_audit_log (
    id, created_at,
    caller_subject_id, patient_subject_id, consent_token_id,
    audience, task_name, prompt_template_version, model_id,
    inputs, output, citations,
    outcome, refusal_reason, latency_ms,
    prev_hash, row_hash
  ) values (
    v_id, v_created_at,
    p_caller_subject_id, p_patient_subject_id, p_consent_token_id,
    p_audience, p_task_name, p_prompt_template_version, p_model_id,
    p_inputs, p_output, p_citations,
    p_outcome, p_refusal_reason, p_latency_ms,
    v_prev_hash, v_hash
  );

  return query select v_id, v_hash;
end;
$$ language plpgsql security definer;

-- Replay verification: recomputes row_hash for every row and returns the
-- first row id whose stored hash disagrees with the recomputed value, or
-- NULL if the chain is intact.
create or replace function public.llm_audit_log_verify_chain()
returns uuid as $$
declare
  r record;
  expected_prev text := null;
  computed text;
  payload text;
begin
  for r in
    select * from public.llm_audit_log order by created_at asc, id asc
  loop
    if r.prev_hash is distinct from expected_prev then
      return r.id;
    end if;
    payload := public.llm_audit_log_canonical_payload(
      expected_prev, r.id, r.created_at,
      r.caller_subject_id, r.patient_subject_id, r.consent_token_id,
      r.audience, r.task_name, r.prompt_template_version, r.model_id,
      r.inputs, r.output, r.citations,
      r.outcome, r.refusal_reason, r.latency_ms
    );
    computed := encode(digest(payload, 'sha256'), 'hex');
    if computed <> r.row_hash then
      return r.id;
    end if;
    expected_prev := r.row_hash;
  end loop;
  return null;
end;
$$ language plpgsql stable;
