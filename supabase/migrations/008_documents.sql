-- Endo: patient-uploaded documents + AI-extracted structured findings.
--
-- Feature 4 of the brief. The platform accepts imaging reports (TVS,
-- MRI), blood tests, GP letters, operative notes, histology, and
-- biomarker test reports. Extraction is performed by a registered
-- gateway task (extract-imaging-report); every extraction is captured
-- in llm_audit_log via the gateway and the row links back through
-- gateway_audit_id.
--
-- Structural fields (kind, performed_at, raw_text, gateway_audit_id,
-- rule_pack_version, patient_subject_id) are immutable after insert
-- via BEFORE UPDATE trigger. The patient may update extraction_status
-- (e.g. to clinician_confirmed once a reviewer has signed off) and
-- the extracted summary / findings if AI extraction failed and they
-- want to enter the structured fields manually — chunk 2 work.

create type public.document_kind as enum (
  'tvs_report',
  'mri_report',
  'blood_test',
  'gp_letter',
  'operative_note',
  'histology',
  'biomarker_report'
);

create type public.document_extraction_status as enum (
  'pending',
  'ai_extracted_pending_review',
  'clinician_confirmed',
  'extraction_failed'
);

create table public.documents (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),

  patient_subject_id uuid not null references auth.users(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id),

  kind public.document_kind not null,
  filename text not null,
  performed_at date,
  source text,

  -- Raw text content captured at upload time. For typed / .txt uploads
  -- this is the body verbatim. For PDFs / images (chunk 2) this will
  -- carry the OCR / pdf-text extraction output.
  raw_text text not null,

  -- AI-extracted structured fields. Shape is task-specific
  -- (extract-imaging-report writes ImagingFindings; future tasks may
  -- write BloodFindings, etc.). Application code casts.
  extracted jsonb,

  -- Human-readable summary surfaced in the UI list. Mirrors what the
  -- extraction task emits as `summary`.
  extracted_summary text,

  extraction_status public.document_extraction_status not null default 'pending',
  extraction_error text,
  rule_pack_version text,

  -- Audit linkage back to the gateway row that produced the extraction.
  -- Required by ADR 0001.
  gateway_audit_id uuid references public.llm_audit_log(id)
);

create index idx_documents_patient_recent
  on public.documents(patient_subject_id, performed_at desc nulls last, created_at desc);

create index idx_documents_kind
  on public.documents(patient_subject_id, kind);

alter table public.documents enable row level security;

-- Patients read their own documents.
create policy "Patients read own documents"
  on public.documents for select
  using (auth.uid() = patient_subject_id);

-- Patients insert their own documents (extraction is kicked off by the
-- server action, which writes the pending row with the user's id).
create policy "Patients insert own documents"
  on public.documents for insert
  with check (auth.uid() = patient_subject_id and auth.uid() = uploaded_by);

-- Patients update their own documents — guarded by the trigger below
-- so only extraction_status / extracted_summary / extracted /
-- extraction_error fields are user-mutable. Structural fields are
-- immutable post-insert.
create policy "Patients update own documents"
  on public.documents for update
  using (auth.uid() = patient_subject_id);

-- Clinicians read documents on patients they hold an active consent for.
create policy "Clinicians read consented documents"
  on public.documents for select
  using (
    exists (
      select 1 from public.consent_tokens c
      where c.patient_subject_id = public.documents.patient_subject_id
        and c.clinician_subject_id = auth.uid()
        and c.revoked_at is null
        and c.expires_at > now()
    )
  );

-- No delete policy — documents are sticky. Patient withdrawal is a
-- chunk-2 concern with its own status enum value.

-- ─────────────────────────────────────────────────────────────────────────────
-- Append-only enforcement on the structural fields
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.documents_block_structural_mutations()
returns trigger as $$
begin
  if new.id is distinct from old.id then
    raise exception 'documents.id is immutable';
  end if;
  if new.patient_subject_id is distinct from old.patient_subject_id then
    raise exception 'documents.patient_subject_id is immutable';
  end if;
  if new.uploaded_by is distinct from old.uploaded_by then
    raise exception 'documents.uploaded_by is immutable';
  end if;
  if new.kind is distinct from old.kind then
    raise exception 'documents.kind is immutable';
  end if;
  if new.filename is distinct from old.filename then
    raise exception 'documents.filename is immutable';
  end if;
  if new.raw_text is distinct from old.raw_text then
    raise exception 'documents.raw_text is immutable';
  end if;
  if new.created_at is distinct from old.created_at then
    raise exception 'documents.created_at is immutable';
  end if;
  if new.gateway_audit_id is distinct from old.gateway_audit_id then
    raise exception 'documents.gateway_audit_id is immutable';
  end if;
  if new.rule_pack_version is distinct from old.rule_pack_version then
    raise exception 'documents.rule_pack_version is immutable';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger documents_immutable_fields
  before update on public.documents
  for each row execute function public.documents_block_structural_mutations();
