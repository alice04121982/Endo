"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  ClipboardList,
  Minus,
  Plus,
  Search,
  UserPlus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCdss } from "@/lib/cdss-store";
import type { ConsultationNote, FailedTreatment, PatientHistory } from "@/lib/types/cdss";

const COMORBIDITY_OPTIONS = [
  "IBS",
  "Fibromyalgia",
  "Adenomyosis",
  "PCOS",
  "Interstitial cystitis",
  "Chronic fatigue syndrome",
  "Migraine",
  "Depression/Anxiety",
  "Autoimmune condition",
];

const TREATMENT_OPTIONS = [
  "Combined oral contraceptive",
  "Progesterone-only pill",
  "Mirena IUS",
  "GnRH agonist",
  "GnRH antagonist",
  "Depo-Provera",
  "Mefenamic acid",
  "Tranexamic acid",
  "Naproxen/Ibuprofen",
  "Paracetamol",
  "Amitriptyline",
  "Gabapentin",
  "Pelvic floor physiotherapy",
  "Laparoscopic excision",
  "Laparoscopic ablation",
];

type FormState = Omit<PatientHistory, "id" | "created_at">;

const initialForm: FormState = {
  name: "",
  age: 30,
  bmi: null,
  menarche_age: null,
  cycle_length_days: 28,
  cycle_regularity: "regular",
  dysmenorrhoea_severity: 5,
  dysmenorrhoea_onset_age: null,
  gravidity: 0,
  parity: 0,
  fertility_concerns: false,
  symptom_duration_months: 12,
  chronic_pelvic_pain: false,
  dyspareunia: false,
  dyschezia: false,
  dysuria: false,
  cyclical_bowel_symptoms: false,
  cyclical_bladder_symptoms: false,
  non_cyclical_pain: false,
  previous_ultrasound: false,
  previous_laparoscopy: false,
  previous_mri: false,
  known_endometriosis_stage: null,
  current_treatments: [],
  failed_treatments: [],
  comorbidities: [],
  family_history_endo: false,
  consultation_notes: [],
};

function CheckboxField({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <label className="flex items-start gap-3 py-2 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-[#D4DCE6] text-[var(--color-brand-primary)] focus:ring-[var(--color-brand-orange)]/30 accent-[var(--color-brand-orange)]"
      />
      <div>
        <span className="text-sm font-medium text-[var(--color-brand-midnight)] group-hover:text-[var(--color-brand-primary)] transition-colors">
          {label}
        </span>
        {hint && (
          <p className="text-xs text-[var(--color-brand-muted)] mt-0.5">{hint}</p>
        )}
      </div>
    </label>
  );
}

export default function PatientHistoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editPatientId = searchParams.get("edit");
  const { addPatient, updatePatient, patients, getRiskAssessment } = useCdss();

  const existingPatient = useMemo(
    () => (editPatientId ? patients.find((p) => p.id === editPatientId) ?? null : null),
    [editPatientId, patients]
  );

  // Search step state — only used when there's no ?edit param
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return patients;
    const q = searchQuery.toLowerCase();
    return patients.filter((p) => p.name.toLowerCase().includes(q));
  }, [searchQuery, patients]);

  // Whether to show the form (edit mode or clinician chose "New Patient")
  const showForm = !!editPatientId || showNewForm;

  const [form, setForm] = useState<FormState>(initialForm);
  const [newTreatment, setNewTreatment] = useState<FailedTreatment>({
    name: "",
    type: "hormonal",
    duration_months: 3,
    outcome: "no_change",
  });
  const [newNoteContent, setNewNoteContent] = useState("");

  // Load existing patient data when editing
  useEffect(() => {
    if (existingPatient) {
      const { id, created_at, ...rest } = existingPatient;
      setForm({
        ...rest,
        consultation_notes: rest.consultation_notes ?? [],
        failed_treatments: rest.failed_treatments ?? [],
        current_treatments: rest.current_treatments ?? [],
        comorbidities: rest.comorbidities ?? [],
      });
    }
  }, [existingPatient]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleComorbidity(c: string) {
    setForm((prev) => ({
      ...prev,
      comorbidities: prev.comorbidities.includes(c)
        ? prev.comorbidities.filter((x) => x !== c)
        : [...prev.comorbidities, c],
    }));
  }

  function addTreatment() {
    if (!newTreatment.name) return;
    setForm((prev) => ({
      ...prev,
      failed_treatments: [...prev.failed_treatments, { ...newTreatment }],
    }));
    setNewTreatment({ name: "", type: "hormonal", duration_months: 3, outcome: "no_change" });
  }

  function removeTreatment(index: number) {
    setForm((prev) => ({
      ...prev,
      failed_treatments: prev.failed_treatments.filter((_, i) => i !== index),
    }));
  }

  function addConsultationNote() {
    if (!newNoteContent.trim()) return;
    const note: ConsultationNote = {
      id: `note-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      clinician: "",
      content: newNoteContent.trim(),
    };
    setForm((prev) => ({
      ...prev,
      consultation_notes: [note, ...prev.consultation_notes],
    }));
    setNewNoteContent("");
  }

  function removeNote(noteId: string) {
    setForm((prev) => ({
      ...prev,
      consultation_notes: prev.consultation_notes.filter((n) => n.id !== noteId),
    }));
  }

  function handleSubmit() {
    if (!form.name.trim() || form.age < 1) return;
    if (editPatientId && existingPatient) {
      updatePatient(editPatientId, form);
      router.push(`/cdss/biomarkers?patient=${editPatientId}`);
    } else {
      const patient = addPatient(form);
      router.push(`/cdss/biomarkers?patient=${patient.id}`);
    }
  }

  // Search screen — shown when no ?edit param and clinician hasn't chosen "New Patient"
  if (!showForm) {
    return (
      <div className="max-w-2xl px-6 lg:px-8 py-6 lg:py-8 space-y-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <ClipboardList className="h-5 w-5 text-[var(--color-brand-blue)]" />
            <p className="text-xs font-semibold tracking-wide uppercase text-[var(--color-brand-muted)]">
              Patient History
            </p>
          </div>
          <h1 className="heading-display text-display-xs sm:text-display-sm text-[var(--color-brand-midnight)]">
            Find or Add Patient
          </h1>
          <p className="mt-1 text-sm text-[var(--color-brand-muted)]">
            Search for an existing patient record or create a new assessment.
          </p>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-brand-muted)]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or patient ID…"
            className="pl-10 h-11"
            autoFocus
          />
        </div>

        {/* Results */}
        <div className="space-y-2">
          {searchResults.length > 0 ? (
            searchResults.map((p) => {
              const risk = getRiskAssessment(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => router.push(`/cdss/patient?edit=${p.id}`)}
                  className="w-full text-left rounded-xl bg-white border border-[#E8E8E8] hover:border-[var(--color-brand-blue)]/30 px-5 py-4 transition-colors group"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-display text-base font-bold text-[var(--color-brand-midnight)] truncate">
                        {p.name}
                      </p>
                      <p className="text-xs text-[var(--color-brand-muted)] mt-0.5">
                        Age {p.age} · {p.symptom_duration_months}mo symptoms
                        {risk && (
                          <span
                            className={`ml-2 font-semibold ${
                              risk.overall_risk === "very_high" || risk.overall_risk === "high"
                                ? "text-red-500"
                                : risk.overall_risk === "moderate"
                                  ? "text-amber-600"
                                  : "text-emerald-600"
                            }`}
                          >
                            · Risk {risk.score}/100
                          </span>
                        )}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-[var(--color-brand-muted)] group-hover:text-[var(--color-brand-blue)] shrink-0 transition-colors" />
                  </div>
                </button>
              );
            })
          ) : (
            <div className="rounded-xl bg-white border border-[#E8E8E8] px-5 py-8 text-center">
              <p className="text-sm text-[var(--color-brand-muted)]">
                No patients found{searchQuery ? ` matching "${searchQuery}"` : ""}.
              </p>
            </div>
          )}
        </div>

        {/* New patient CTA */}
        <div className="flex items-center gap-4 pt-2">
          <div className="flex-1 h-px bg-[#D4DCE6]" />
          <span className="text-xs font-semibold text-[var(--color-brand-muted)] uppercase tracking-wide">
            or
          </span>
          <div className="flex-1 h-px bg-[#D4DCE6]" />
        </div>
        <Button
          onClick={() => setShowNewForm(true)}
          className="w-full rounded bg-[var(--color-brand-primary)] text-white font-semibold h-10 hover:bg-[var(--color-brand-primary-hover)]"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          New Patient Assessment
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl px-6 lg:px-8 py-6 lg:py-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <ClipboardList className="h-5 w-5 text-[var(--color-brand-blue)]" />
          <p className="text-xs font-semibold tracking-wide uppercase text-[var(--color-brand-muted)]">
            {editPatientId ? "Update Assessment" : "New Assessment"}
          </p>
        </div>
        <h1 className="heading-display text-display-xs sm:text-display-sm text-[var(--color-brand-midnight)]">
          {editPatientId ? `Edit — ${existingPatient?.name ?? "Patient"}` : "Clinical History"}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-brand-muted)]">
          {editPatientId
            ? "Update clinical history, add consultation notes, and reassess risk."
            : "Enter patient clinical history for risk stratification."}
        </p>
        {!editPatientId && (
          <button
            onClick={() => setShowNewForm(false)}
            className="mt-2 text-xs font-semibold text-[var(--color-brand-blue)] hover:text-[var(--color-brand-midnight)] transition-colors"
          >
            ← Back to search
          </button>
        )}
      </div>

      {/* Demographics */}
      <Card className="bg-white border-[#E8E8E8]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-[var(--color-brand-midnight)]">
            Demographics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs font-semibold text-[var(--color-brand-muted)]">
                Patient Name / ID
              </Label>
              <Input
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="e.g. Patient 001"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-[var(--color-brand-muted)]">
                Age
              </Label>
              <Input
                type="number"
                value={form.age}
                onChange={(e) => update("age", Number(e.target.value))}
                min={10}
                max={60}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-[var(--color-brand-muted)]">
                BMI (optional)
              </Label>
              <Input
                type="number"
                value={form.bmi ?? ""}
                onChange={(e) =>
                  update("bmi", e.target.value ? Number(e.target.value) : null)
                }
                step={0.1}
                placeholder="—"
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Menstrual History */}
      <Card className="bg-white border-[#E8E8E8]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-[var(--color-brand-midnight)]">
            Menstrual History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs font-semibold text-[var(--color-brand-muted)]">
                Age at Menarche
              </Label>
              <Input
                type="number"
                value={form.menarche_age ?? ""}
                onChange={(e) =>
                  update("menarche_age", e.target.value ? Number(e.target.value) : null)
                }
                placeholder="—"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-[var(--color-brand-muted)]">
                Cycle Length (days)
              </Label>
              <Input
                type="number"
                value={form.cycle_length_days ?? ""}
                onChange={(e) =>
                  update("cycle_length_days", e.target.value ? Number(e.target.value) : null)
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-[var(--color-brand-muted)]">
                Cycle Regularity
              </Label>
              <select
                value={form.cycle_regularity}
                onChange={(e) =>
                  update("cycle_regularity", e.target.value as FormState["cycle_regularity"])
                }
                className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="regular">Regular</option>
                <option value="irregular">Irregular</option>
                <option value="absent">Absent (amenorrhoea)</option>
              </select>
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-[var(--color-brand-muted)]">
              Dysmenorrhoea Severity (VAS 0-10)
            </Label>
            <div className="flex items-center gap-4 mt-2">
              <input
                type="range"
                min={0}
                max={10}
                value={form.dysmenorrhoea_severity}
                onChange={(e) => update("dysmenorrhoea_severity", Number(e.target.value))}
                className="flex-1 accent-[var(--color-brand-orange)]"
              />
              <span className="font-mono text-lg font-bold text-[var(--color-brand-midnight)] w-8 text-right">
                {form.dysmenorrhoea_severity}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-[var(--color-brand-muted)]">
                Symptom Duration (months)
              </Label>
              <Input
                type="number"
                value={form.symptom_duration_months}
                onChange={(e) => update("symptom_duration_months", Number(e.target.value))}
                min={0}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-[var(--color-brand-muted)]">
                Dysmenorrhoea Onset Age
              </Label>
              <Input
                type="number"
                value={form.dysmenorrhoea_onset_age ?? ""}
                onChange={(e) =>
                  update("dysmenorrhoea_onset_age", e.target.value ? Number(e.target.value) : null)
                }
                placeholder="—"
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pain Profile */}
      <Card className="bg-white border-[#E8E8E8]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-[var(--color-brand-midnight)]">
            Pain Profile
          </CardTitle>
          <p className="text-xs text-[var(--color-brand-muted)]">
            Symptoms relevant to NICE NG73 referral criteria
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
            <CheckboxField
              label="Chronic pelvic pain"
              checked={form.chronic_pelvic_pain}
              onChange={(v) => update("chronic_pelvic_pain", v)}
              hint="Pain persisting >6 months"
            />
            <CheckboxField
              label="Deep dyspareunia"
              checked={form.dyspareunia}
              onChange={(v) => update("dyspareunia", v)}
              hint="Pain during/after intercourse"
            />
            <CheckboxField
              label="Dyschezia"
              checked={form.dyschezia}
              onChange={(v) => update("dyschezia", v)}
              hint="Painful defecation, cyclical"
            />
            <CheckboxField
              label="Dysuria"
              checked={form.dysuria}
              onChange={(v) => update("dysuria", v)}
              hint="Painful urination"
            />
            <CheckboxField
              label="Cyclical bowel symptoms"
              checked={form.cyclical_bowel_symptoms}
              onChange={(v) => update("cyclical_bowel_symptoms", v)}
              hint="Bloating, diarrhoea, constipation with menses"
            />
            <CheckboxField
              label="Cyclical bladder symptoms"
              checked={form.cyclical_bladder_symptoms}
              onChange={(v) => update("cyclical_bladder_symptoms", v)}
              hint="Frequency, urgency, haematuria with menses"
            />
            <CheckboxField
              label="Non-cyclical pelvic pain"
              checked={form.non_cyclical_pain}
              onChange={(v) => update("non_cyclical_pain", v)}
              hint="Pain unrelated to menstrual cycle"
            />
            <CheckboxField
              label="Family history of endometriosis"
              checked={form.family_history_endo}
              onChange={(v) => update("family_history_endo", v)}
              hint="First-degree relative"
            />
          </div>
        </CardContent>
      </Card>

      {/* Reproductive History */}
      <Card className="bg-white border-[#E8E8E8]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-[var(--color-brand-midnight)]">
            Reproductive History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs font-semibold text-[var(--color-brand-muted)]">
                Gravidity
              </Label>
              <Input
                type="number"
                value={form.gravidity}
                onChange={(e) => update("gravidity", Number(e.target.value))}
                min={0}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-[var(--color-brand-muted)]">
                Parity
              </Label>
              <Input
                type="number"
                value={form.parity}
                onChange={(e) => update("parity", Number(e.target.value))}
                min={0}
                className="mt-1"
              />
            </div>
          </div>
          <CheckboxField
            label="Fertility concerns"
            checked={form.fertility_concerns}
            onChange={(v) => update("fertility_concerns", v)}
            hint="Patient actively trying to conceive or concerned about future fertility"
          />
        </CardContent>
      </Card>

      {/* Previous Investigations */}
      <Card className="bg-white border-[#E8E8E8]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-[var(--color-brand-midnight)]">
            Previous Investigations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
            <CheckboxField
              label="Transvaginal ultrasound"
              checked={form.previous_ultrasound}
              onChange={(v) => update("previous_ultrasound", v)}
            />
            <CheckboxField
              label="Diagnostic laparoscopy"
              checked={form.previous_laparoscopy}
              onChange={(v) => update("previous_laparoscopy", v)}
            />
            <CheckboxField
              label="MRI pelvis"
              checked={form.previous_mri}
              onChange={(v) => update("previous_mri", v)}
            />
          </div>
          <div className="mt-3">
            <Label className="text-xs font-semibold text-[var(--color-brand-muted)]">
              Known Endometriosis Stage
            </Label>
            <select
              value={form.known_endometriosis_stage ?? "none"}
              onChange={(e) =>
                update(
                  "known_endometriosis_stage",
                  e.target.value === "none" ? null : (e.target.value as PatientHistory["known_endometriosis_stage"])
                )
              }
              className="mt-1 w-full sm:w-64 h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="none">Not diagnosed / Unknown</option>
              <option value="stage_i">Stage I (Minimal)</option>
              <option value="stage_ii">Stage II (Mild)</option>
              <option value="stage_iii">Stage III (Moderate)</option>
              <option value="stage_iv">Stage IV (Severe)</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Treatment History */}
      <Card className="bg-white border-[#E8E8E8]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-[var(--color-brand-midnight)]">
            Treatment History
          </CardTitle>
          <p className="text-xs text-[var(--color-brand-muted)]">
            Record treatments tried and their outcomes. Failed treatments contribute to referral criteria.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {form.failed_treatments.length > 0 && (
            <div className="space-y-2">
              {form.failed_treatments.map((t, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 rounded bg-[var(--color-brand-smoke)] px-4 py-3"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-[var(--color-brand-midnight)]">
                      {t.name}
                    </span>
                    <span className="text-xs text-[var(--color-brand-muted)] ml-2">
                      {t.duration_months}mo
                    </span>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`text-xs shrink-0 ${
                      t.outcome === "worsened"
                        ? "bg-red-100 text-red-700"
                        : t.outcome === "no_change"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {t.outcome.replace("_", " ")}
                  </Badge>
                  <button
                    onClick={() => removeTreatment(i)}
                    className="text-[var(--color-brand-muted)] hover:text-red-500 shrink-0"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div className="sm:col-span-1">
              <Label className="text-xs font-semibold text-[var(--color-brand-muted)]">
                Treatment
              </Label>
              <select
                value={newTreatment.name}
                onChange={(e) =>
                  setNewTreatment((prev) => ({ ...prev, name: e.target.value }))
                }
                className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Select...</option>
                {TREATMENT_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-[var(--color-brand-muted)]">
                Duration (months)
              </Label>
              <Input
                type="number"
                value={newTreatment.duration_months}
                onChange={(e) =>
                  setNewTreatment((prev) => ({
                    ...prev,
                    duration_months: Number(e.target.value),
                  }))
                }
                min={1}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-[var(--color-brand-muted)]">
                Outcome
              </Label>
              <select
                value={newTreatment.outcome}
                onChange={(e) =>
                  setNewTreatment((prev) => ({
                    ...prev,
                    outcome: e.target.value as FailedTreatment["outcome"],
                  }))
                }
                className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="no_change">No change</option>
                <option value="worsened">Worsened</option>
                <option value="mild_improvement">Mild improvement</option>
              </select>
            </div>
            <Button
              onClick={addTreatment}
              variant="outline"
              className="h-9 rounded-lg"
              disabled={!newTreatment.name}
            >
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Comorbidities */}
      <Card className="bg-white border-[#E8E8E8]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-[var(--color-brand-midnight)]">
            Comorbidities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {COMORBIDITY_OPTIONS.map((c) => (
              <button
                key={c}
                onClick={() => toggleComorbidity(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  form.comorbidities.includes(c)
                    ? "bg-[var(--color-brand-blue)]/10 text-[var(--color-brand-blue)] border-[var(--color-brand-blue)]/30"
                    : "bg-white text-[var(--color-brand-muted)] border-[#D4DCE6] hover:border-[var(--color-brand-blue)]/30"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Consultation Notes */}
      <Card className="bg-white border-[#E8E8E8]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-[var(--color-brand-midnight)]">
            Consultation Notes
          </CardTitle>
          <p className="text-xs text-[var(--color-brand-muted)]">
            Record observations from patient consultations. Notes are saved with the patient record.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing notes */}
          {form.consultation_notes.length > 0 && (
            <div className="space-y-2">
              {form.consultation_notes.map((note) => (
                <div
                  key={note.id}
                  className="rounded bg-[var(--color-brand-smoke)] px-4 py-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-[var(--color-brand-muted)]">
                      {new Date(note.date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <button
                      onClick={() => removeNote(note.id)}
                      className="text-[var(--color-brand-muted)] hover:text-red-500"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-sm text-[var(--color-brand-midnight)] whitespace-pre-wrap">
                    {note.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          <Separator />

          {/* Add new note */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-[var(--color-brand-muted)]">
              New Consultation Note
            </Label>
            <Textarea
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="Record symptoms reported, clinical observations, examination findings, patient concerns..."
              rows={4}
              className="resize-none"
            />
            <Button
              onClick={addConsultationNote}
              variant="outline"
              className="h-9 rounded-lg"
              disabled={!newNoteContent.trim()}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Note
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-3 pt-2">
        <Button
          onClick={handleSubmit}
          disabled={!form.name.trim()}
          className="rounded bg-[var(--color-brand-primary)] text-white font-semibold h-10 px-6 hover:bg-[var(--color-brand-primary-hover)]"
        >
          {editPatientId ? "Update & View Results" : "Save & Enter Biomarkers"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
