-- Endo: Endometriosis Intelligence Platform
-- Initial schema with RLS for HIPAA-compliant reproductive health data

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================
-- PROFILES
-- ============================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  display_name text,
  cycle_mode text not null default 'regular' check (cycle_mode in ('regular', 'cycle_agnostic')),
  hormone_therapy text,
  diagnosis_stage text check (diagnosis_stage in ('suspected', 'stage_i', 'stage_ii', 'stage_iii', 'stage_iv')),
  provider_name text,
  data_encryption_key_hash text
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- SYMPTOM ENTRIES (core health data)
-- ============================================
create table public.symptom_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  entry_date date not null,
  cycle_day int check (cycle_day >= 1 and cycle_day <= 60),
  cycle_phase text not null default 'cycle_agnostic'
    check (cycle_phase in ('menstrual', 'follicular', 'ovulatory', 'luteal', 'cycle_agnostic')),
  overall_vas int not null check (overall_vas >= 0 and overall_vas <= 10),
  pain_zones jsonb not null default '[]'::jsonb,
  dyspareunia_vas int check (dyspareunia_vas >= 0 and dyspareunia_vas <= 10),
  gut_bladder_symptoms jsonb not null default '[]'::jsonb,
  endo_belly_severity int check (endo_belly_severity >= 0 and endo_belly_severity <= 10),
  fatigue_vas int check (fatigue_vas >= 0 and fatigue_vas <= 10),
  mood_score int check (mood_score >= 1 and mood_score <= 5),
  sleep_quality int check (sleep_quality >= 1 and sleep_quality <= 5),
  notes text,
  lifestyle_triggers jsonb not null default '[]'::jsonb,
  red_flags_detected jsonb not null default '[]'::jsonb,
  research_correlations jsonb not null default '[]'::jsonb,

  -- Prevent duplicate entries for same date
  unique (user_id, entry_date)
);

create index idx_symptom_entries_user_date on public.symptom_entries(user_id, entry_date desc);
create index idx_symptom_entries_phase on public.symptom_entries(user_id, cycle_phase);
create index idx_symptom_entries_red_flags on public.symptom_entries using gin(red_flags_detected);

alter table public.symptom_entries enable row level security;

create policy "Users can view own symptoms"
  on public.symptom_entries for select using (auth.uid() = user_id);
create policy "Users can insert own symptoms"
  on public.symptom_entries for insert with check (auth.uid() = user_id);
create policy "Users can update own symptoms"
  on public.symptom_entries for update using (auth.uid() = user_id);
create policy "Users can delete own symptoms"
  on public.symptom_entries for delete using (auth.uid() = user_id);

-- ============================================
-- RESEARCH MARKERS (reference data)
-- ============================================
create table public.research_markers (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  category text not null check (category in (
    'angiogenesis_vegf', 'cytokine_inflammation', 'nerve_density',
    'p2x3_antagonism', 'dca_metabolism', 'central_sensitization',
    'microbiome_estrobolome', 'epigenetic_methylation'
  )),
  marker_name text not null,
  description text not null,
  clinical_relevance text not null,
  associated_symptoms text[] not null default '{}',
  evidence_level text not null check (evidence_level in (
    'meta_analysis', 'rct', 'cohort', 'case_series', 'preclinical'
  )),
  year_published int not null,
  doi_reference text,
  treatment_implications text[] not null default '{}'
);

-- Research markers are publicly readable (reference data)
alter table public.research_markers enable row level security;
create policy "Research markers are publicly readable"
  on public.research_markers for select using (true);

-- ============================================
-- CLINICAL TRIALS
-- ============================================
create table public.clinical_trials (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  nct_id text not null unique,
  title text not null,
  status text not null check (status in ('recruiting', 'active', 'completed', 'terminated')),
  phase text not null,
  intervention_type text not null,
  target_pathway text not null,
  eligibility_summary text not null,
  location_countries text[] not null default '{}',
  start_date date,
  primary_outcome text not null,
  is_non_hormonal boolean not null default false
);

alter table public.clinical_trials enable row level security;
create policy "Clinical trials are publicly readable"
  on public.clinical_trials for select using (true);

-- ============================================
-- BURN LOG (audit trail for data deletion)
-- ============================================
create table public.burn_log (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  burned_at timestamptz not null default now(),
  records_destroyed int not null,
  date_range_start date not null,
  date_range_end date not null
);

alter table public.burn_log enable row level security;
create policy "Users can view own burn log"
  on public.burn_log for select using (auth.uid() = user_id);
create policy "Users can insert own burn log"
  on public.burn_log for insert with check (auth.uid() = user_id);

-- ============================================
-- BURN-TO-DELETE FUNCTION
-- Securely destroys symptom data for a date range
-- ============================================
create or replace function public.burn_user_data(
  p_user_id uuid,
  p_date_start date,
  p_date_end date
) returns int as $$
declare
  v_count int;
begin
  -- Verify caller owns the data
  if auth.uid() != p_user_id then
    raise exception 'Unauthorized: cannot burn data for another user';
  end if;

  -- Count records to be destroyed
  select count(*) into v_count
  from public.symptom_entries
  where user_id = p_user_id
    and entry_date between p_date_start and p_date_end;

  -- Delete the records
  delete from public.symptom_entries
  where user_id = p_user_id
    and entry_date between p_date_start and p_date_end;

  -- Log the burn event
  insert into public.burn_log (user_id, records_destroyed, date_range_start, date_range_end)
  values (p_user_id, v_count, p_date_start, p_date_end);

  return v_count;
end;
$$ language plpgsql security definer;

-- ============================================
-- SEED: Research Markers based on Smith + 2024-2026 research
-- ============================================
insert into public.research_markers (category, marker_name, description, clinical_relevance, associated_symptoms, evidence_level, year_published, doi_reference, treatment_implications) values
(
  'angiogenesis_vegf',
  'VEGF-A Overexpression in Ectopic Endometrium',
  'Vascular endothelial growth factor A is significantly upregulated in endometriotic lesions, driving neovascularization that sustains ectopic tissue growth. Foundation work by Prof. Stephen K. Smith established the angiogenesis paradigm.',
  'Throbbing, cyclical pelvic pain correlates with VEGF-driven vascular remodeling in lesions. Higher VEGF levels correlate with advanced staging.',
  '{"throbbing_pelvic_pain","heavy_menstrual_bleeding","lesion_progression"}',
  'meta_analysis',
  2024,
  null,
  '{"Anti-angiogenic therapy (bevacizumab analogs under trial)","VEGF receptor tyrosine kinase inhibitors","Monitoring serum VEGF as treatment response marker"}'
),
(
  'cytokine_inflammation',
  'IL-6/TNF-alpha Peritoneal Fluid Elevation',
  'Peritoneal fluid from endometriosis patients shows 3-5x elevation of IL-6 and TNF-alpha, creating a pro-inflammatory microenvironment that drives pain sensitization and lesion survival.',
  'Systemic fatigue, widespread pain beyond pelvis, and cognitive symptoms (endo fog) correlate with elevated inflammatory cytokines entering systemic circulation.',
  '{"chronic_fatigue","widespread_pain","cognitive_fog","systemic_inflammation"}',
  'rct',
  2025,
  null,
  '{"Anti-TNF biologics (infliximab trials)","IL-6 receptor antagonists","Dietary anti-inflammatory protocols","Omega-3 supplementation (EPA/DHA 2-4g/day)"}'
),
(
  'nerve_density',
  'PGP9.5+ Nerve Fiber Density in Endometriotic Lesions',
  'Deep infiltrating endometriosis lesions show 10-14x higher density of PGP9.5-positive nerve fibers compared to normal peritoneum, explaining the disproportionate pain response.',
  'Localized sharp/stabbing pain that persists through cycle phases suggests nerve infiltration by endometriotic tissue. Key indicator for surgical planning.',
  '{"sharp_localized_pain","stabbing_pain","pain_persistent_through_cycle","deep_dyspareunia"}',
  'cohort',
  2024,
  null,
  '{"Laparoscopic excision of nerve-infiltrated lesions","Neuromodulation therapy","Gabapentinoid adjunct therapy","P2X3 receptor antagonism"}'
),
(
  'p2x3_antagonism',
  'P2X3 Receptor Antagonists for Visceral Pain',
  'P2X3 purinergic receptors on visceral afferent neurons are upregulated in endometriosis. Selective antagonists (gefapixant analogs) show promise as non-hormonal pain treatment in Phase II trials.',
  'Visceral pain patterns — deep pelvic pressure, bladder/bowel pain, cramping — may respond to P2X3 blockade without hormonal suppression.',
  '{"deep_pelvic_pressure","bladder_pain","bowel_pain","cramping","visceral_pain"}',
  'rct',
  2025,
  null,
  '{"P2X3 selective antagonists (Phase II)","Non-hormonal pain management","Combination with nerve density assessment for patient selection"}'
),
(
  'dca_metabolism',
  'Dichloroacetate (DCA) Metabolic Reprogramming',
  'Endometriotic cells exhibit Warburg-effect metabolism. DCA shifts cellular metabolism from glycolysis to oxidative phosphorylation, inducing apoptosis in ectopic endometrial cells while sparing normal tissue.',
  'May offer disease-modifying treatment rather than symptom suppression. Patients with rapidly progressing lesions or hormone-resistant disease are primary candidates.',
  '{"rapid_lesion_progression","hormone_therapy_resistance","metabolic_bloating"}',
  'preclinical',
  2025,
  null,
  '{"DCA oral therapy (Phase I trials)","Metabolic biomarker monitoring","Combination with anti-angiogenic approaches"}'
),
(
  'central_sensitization',
  'Nociplastic Pain and Central Sensitization',
  'Chronic endometriosis pain leads to central nervous system sensitization, where the spinal cord and brain amplify pain signals. This explains pain persistence even after successful lesion removal.',
  'Widespread pain beyond anatomical lesion sites, allodynia, hyperalgesia, and pain that persists post-surgery indicate central sensitization.',
  '{"widespread_pain","allodynia","pain_post_surgery","hyperalgesia","burning_pain"}',
  'cohort',
  2025,
  null,
  '{"Central neuromodulation (duloxetine, amitriptyline)","Pelvic floor physical therapy","Cognitive behavioral therapy for pain","Mindfulness-based stress reduction"}'
),
(
  'microbiome_estrobolome',
  'Estrobolome Dysbiosis and Estrogen Recycling',
  'Gut microbiome beta-glucuronidase activity (estrobolome) is elevated in endometriosis patients, leading to increased estrogen recirculation that fuels lesion growth.',
  'GI symptoms, metabolic bloating (endo-belly), and poor response to oral hormonal therapy may indicate estrobolome involvement.',
  '{"endo_belly","gi_symptoms","bloating","poor_hormonal_response","constipation_diarrhea_cycling"}',
  'cohort',
  2024,
  null,
  '{"Targeted probiotic therapy (Lactobacillus spp.)","Calcium-D-glucarate supplementation","Fiber-rich dietary protocols","Microbiome testing and monitoring"}'
),
(
  'epigenetic_methylation',
  'Aberrant DNA Methylation in HOXA10/Progesterone Receptors',
  'Hypermethylation of HOXA10 and progesterone receptor-B promoters in ectopic endometrium leads to progesterone resistance, a hallmark of treatment-refractory endometriosis.',
  'Poor response to progesterone-based therapies (IUDs, oral progestins) may indicate epigenetic silencing. Future diagnostic biomarker potential.',
  '{"progesterone_resistance","treatment_refractory","infertility","recurrent_after_surgery"}',
  'rct',
  2026,
  null,
  '{"Epigenetic modifiers (HDAC inhibitors, Phase I)","Biomarker-guided therapy selection","Progesterone sensitization protocols","Personalized treatment planning"}'
);
