"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Database,
  FlaskConical,
  Heart,
  Info,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
  Stethoscope,
  TrendingUp,
  X,
} from "lucide-react";
import { ConsultationRecorder } from "@/components/consultation/consultation-recorder";
import {
  AreaChart,
  Area,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useCdss } from "@/lib/cdss-store";
import { useClinician } from "@/lib/clinician-store";
import { useCompliance } from "@/lib/compliance-store";
import {
  BIOMARKER_META,
  BIOMARKER_SOURCE_LABELS,
  type BiomarkerSource,
  type BiomarkerType,
  type ClinicalAlert,
  type RiskLevel,
  type SymptomLog,
} from "@/lib/types/cdss";
import { getProfileCompleteness } from "@/lib/profile-completeness";
import { cn } from "@/lib/utils";

// ── Constants ─────────────────────────────────────────────────────────────────

type Tab = "history" | "biomarkers" | "trends" | "contributions" | "records";

const TABS: { id: Tab; label: string; icon: typeof ClipboardList }[] = [
  { id: "history", label: "History", icon: ClipboardList },
  { id: "biomarkers", label: "Biomarkers", icon: FlaskConical },
  { id: "trends", label: "Trends", icon: TrendingUp },
  { id: "contributions", label: "Patient Contributions", icon: Heart },
  { id: "records", label: "GP Record", icon: Stethoscope },
];

const BIOMARKER_GROUPS: { title: string; category: string; markers: BiomarkerType[] }[] = [
  { title: "Tumour Markers", category: "tumour_marker", markers: ["ca125", "he4"] },
  { title: "Inflammatory Markers", category: "inflammatory", markers: ["crp", "esr", "neutrophil_lymphocyte_ratio", "il6", "tnf_alpha"] },
  { title: "Hormonal / Metabolic", category: "hormonal", markers: ["amh", "tsh", "vitamin_d"] },
  { title: "Haematology", category: "haematology", markers: ["fbc_haemoglobin", "ferritin"] },
  { title: "Endometriosis Diagnostics", category: "diagnostic", markers: ["promarker_endo", "arelis_endo"] },
];

const TREND_MARKERS: BiomarkerType[] = ["ca125", "crp", "esr", "tnf_alpha", "il6", "promarker_endo", "arelis_endo"];

const riskColors: Record<RiskLevel, { bg: string; text: string; badge: string }> = {
  low:       { bg: "bg-emerald-50", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  moderate:  { bg: "bg-amber-50",   text: "text-amber-700",   badge: "bg-amber-100 text-amber-700 border-amber-200" },
  high:      { bg: "bg-orange-50",  text: "text-orange-700",  badge: "bg-orange-100 text-orange-700 border-orange-200" },
  very_high: { bg: "bg-red-50",     text: "text-red-700",     badge: "bg-red-100 text-red-700 border-red-200" },
};

const riskLabels: Record<RiskLevel, string> = {
  low: "Low Risk", moderate: "Moderate Risk", high: "High Risk", very_high: "Very High Risk",
};

const alertIcons: Record<ClinicalAlert["severity"], typeof Info> = {
  info: Info, warning: AlertTriangle, critical: ShieldAlert,
};

const alertStyles: Record<ClinicalAlert["severity"], string> = {
  info: "bg-blue-50 border-blue-200 text-blue-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
  critical: "bg-red-50 border-red-200 text-red-800",
};

// ── History Tab ────────────────────────────────────────────────────────────────

function HistoryTab({ patientId }: { patientId: string }) {
  const { patients, updatePatient } = useCdss();
  const [showRecorder, setShowRecorder] = useState(false);

  const patient = patients.find((p) => p.id === patientId);
  if (!patient) return null;

  function handleSaveAssessment({ content, transcript, clinicalUpdates }: { content: string; transcript: string; clinicalUpdates: Partial<typeof patient> }) {
    void transcript;
    const note = {
      id: `note-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      clinician: "",
      content: content.trim(),
    };
    updatePatient(patientId, {
      consultation_notes: [note, ...(patient!.consultation_notes ?? [])],
      ...clinicalUpdates,
    });
    setShowRecorder(false);
  }

  const boolField = (v: boolean) => v ? "Yes" : "No";

  const rows: { label: string; value: string }[] = [
    { label: "Age", value: String(patient.age) },
    { label: "BMI", value: patient.bmi != null ? String(patient.bmi) : "—" },
    { label: "Age at Menarche", value: patient.menarche_age != null ? `${patient.menarche_age} yrs` : "—" },
    { label: "Cycle Length", value: `${patient.cycle_length_days} days` },
    { label: "Cycle Regularity", value: patient.cycle_regularity.charAt(0).toUpperCase() + patient.cycle_regularity.slice(1) },
    { label: "Dysmenorrhoea Severity", value: `${patient.dysmenorrhoea_severity}/10` },
    { label: "Symptom Duration", value: `${patient.symptom_duration_months} months` },
    { label: "Gravidity / Parity", value: `${patient.gravidity} / ${patient.parity}` },
    { label: "Fertility Concerns", value: boolField(patient.fertility_concerns) },
    { label: "Family History", value: boolField(patient.family_history_endo) },
  ];

  const symptoms: { label: string; value: boolean }[] = [
    { label: "Chronic Pelvic Pain", value: patient.chronic_pelvic_pain },
    { label: "Dyspareunia", value: patient.dyspareunia },
    { label: "Dyschezia", value: patient.dyschezia },
    { label: "Dysuria", value: patient.dysuria },
    { label: "Cyclical Bowel Symptoms", value: patient.cyclical_bowel_symptoms },
    { label: "Cyclical Bladder Symptoms", value: patient.cyclical_bladder_symptoms },
    { label: "Non-Cyclical Pain", value: patient.non_cyclical_pain },
  ];

  const investigations = [
    { label: "Previous Ultrasound", value: patient.previous_ultrasound },
    { label: "Previous Laparoscopy", value: patient.previous_laparoscopy },
    { label: "Previous MRI", value: patient.previous_mri },
  ];

  const notes = patient.consultation_notes ?? [];

  return (
    <div className="space-y-4">
      {/* New Assessment / Edit bar */}
      <div className="flex items-center justify-between gap-3">
        <Button
          size="sm"
          onClick={() => setShowRecorder((v) => !v)}
          className="gap-1.5 bg-[var(--color-brand-primary)] text-white hover:bg-[var(--color-brand-primary-hover)] text-xs font-semibold"
        >
          <Plus className="h-3.5 w-3.5" />
          {showRecorder ? "Cancel" : "New Assessment"}
        </Button>
        <Link href={`/cdss/patient?edit=${patientId}`}>
          <Button size="sm" variant="outline" className="gap-1.5 border-[#E8E8E8] text-xs font-semibold">
            <Pencil className="h-3 w-3" />
            Edit Clinical Record
          </Button>
        </Link>
      </div>

      {/* Consultation Recorder (inline) */}
      {showRecorder && (
        <ConsultationRecorder patient={patient} onSave={handleSaveAssessment} />
      )}

      {/* Past Assessments timeline */}
      {notes.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wide">
            Consultation History ({notes.length})
          </h3>
          {notes.map((note, idx) => (
            <Card key={note.id} className="bg-white border-[#E8E8E8]">
              <CardHeader className="pb-2 flex flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-[var(--color-brand-primary)]/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-[var(--color-brand-primary)]">
                      {notes.length - idx}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--color-brand-midnight)]">
                      Visit {notes.length - idx}
                    </p>
                    <p className="text-xs text-[var(--color-brand-muted)]">
                      {new Date(note.date).toLocaleDateString("en-GB", {
                        day: "numeric", month: "long", year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                {idx === 0 && (
                  <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-100 shrink-0">
                    Most Recent
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[var(--color-brand-midnight)] leading-relaxed whitespace-pre-wrap">
                  {note.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Separator between assessments and baseline */}
      {notes.length > 0 && <Separator />}

      {/* Baseline clinical record */}
      <h3 className="text-xs font-bold text-[var(--color-brand-muted)] uppercase tracking-wide">
        Baseline Clinical Record
      </h3>

      {/* Demographics & Menstrual */}
      <Card className="bg-white border-[#E8E8E8]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-[var(--color-brand-midnight)]">Demographics &amp; Menstrual History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
            {rows.map((r) => (
              <div key={r.label}>
                <p className="text-xs text-[var(--color-brand-muted)] font-medium">{r.label}</p>
                <p className="text-sm font-semibold text-[var(--color-brand-midnight)]">{r.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Symptom Profile */}
      <Card className="bg-white border-[#E8E8E8]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-[var(--color-brand-midnight)]">Symptom Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {symptoms.map((s) => (
              <div key={s.label} className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold",
                s.value ? "bg-orange-50 text-orange-700" : "bg-[#F8F9FA] text-[var(--color-brand-muted)]"
              )}>
                <span className={cn("h-2 w-2 rounded-full shrink-0", s.value ? "bg-orange-400" : "bg-[#D1D5DB]")} />
                {s.label}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Investigations + Endo stage */}
      <Card className="bg-white border-[#E8E8E8]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-[var(--color-brand-midnight)]">Investigations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {investigations.map((inv) => (
              <div key={inv.label} className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold",
                inv.value ? "bg-blue-50 text-blue-700" : "bg-[#F8F9FA] text-[var(--color-brand-muted)]"
              )}>
                <CheckCircle2 className={cn("h-3.5 w-3.5", inv.value ? "text-blue-500" : "text-[#D1D5DB]")} />
                {inv.label}
              </div>
            ))}
            {patient.known_endometriosis_stage && patient.known_endometriosis_stage !== "none" && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200 px-3 py-2 text-xs font-semibold">
                Endo {patient.known_endometriosis_stage.replace("stage_", "Stage ").replace("_", " ").toUpperCase()}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Treatments & Comorbidities */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {patient.current_treatments.length > 0 && (
          <Card className="bg-white border-[#E8E8E8]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-[var(--color-brand-midnight)]">Current Treatments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {patient.current_treatments.map((t) => (
                  <Badge key={t} variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-100">{t}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        {patient.comorbidities.length > 0 && (
          <Card className="bg-white border-[#E8E8E8]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-[var(--color-brand-midnight)]">Comorbidities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {patient.comorbidities.map((c) => (
                  <Badge key={c} variant="secondary" className="text-xs bg-[#F8F9FA] text-[var(--color-brand-muted)]">{c}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ── Biomarkers Tab ─────────────────────────────────────────────────────────────

const SOURCE_STYLES: Record<BiomarkerSource, string> = {
  nhs_api:      "bg-blue-50 text-blue-700 border-blue-200",
  hospital_lab: "bg-purple-50 text-purple-700 border-purple-200",
  gp_referral:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  private_lab:  "bg-amber-50 text-amber-700 border-amber-200",
  manual:       "bg-[#F8F9FA] text-[var(--color-brand-muted)] border-[#E8E8E8]",
};

const FLAG_STYLES: Record<string, string> = {
  normal:   "bg-emerald-100 text-emerald-700",
  elevated: "bg-amber-100 text-amber-700",
  low:      "bg-blue-100 text-blue-700",
  critical: "bg-red-100 text-red-700",
};

function BiomarkersTab({ patientId }: { patientId: string }) {
  const { patients, addBiomarker, getPatientBiomarkers, getRiskAssessment, removeBiomarker } = useCdss();
  const patient = patients.find((p) => p.id === patientId);
  const patientBiomarkers = useMemo(
    () => getPatientBiomarkers(patientId).sort((a, b) => b.date_collected.localeCompare(a.date_collected)),
    [patientId, getPatientBiomarkers]
  );
  const risk = useMemo(() => getRiskAssessment(patientId), [patientId, getRiskAssessment]);

  const today = new Date().toISOString().split("T")[0];
  const [newMarker, setNewMarker]     = useState<BiomarkerType>("ca125");
  const [newValue, setNewValue]       = useState("");
  const [newDate, setNewDate]         = useState(today);
  const [newSource, setNewSource]     = useState<BiomarkerSource>("hospital_lab");
  const [newOrderedBy, setNewOrderedBy] = useState("");
  const [newCycleDay, setNewCycleDay] = useState("");

  function handleAdd() {
    const value = parseFloat(newValue);
    if (isNaN(value)) return;
    addBiomarker(patientId, newMarker, value, newDate, {
      source: newSource,
      ordered_by: newOrderedBy.trim() || undefined,
      cycle_day: newCycleDay ? parseInt(newCycleDay, 10) : null,
    });
    setNewValue("");
    setNewCycleDay("");
  }

  if (!patient) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: history + add form */}
      <div className="lg:col-span-2 space-y-4">

        {/* Add new result form */}
        <Card className="bg-white border-[#E8E8E8]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-[var(--color-brand-midnight)] flex items-center gap-2">
              <Plus className="h-4 w-4 text-[var(--color-brand-orange)]" />
              Add Test Result
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Row 1: core fields */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-xs font-semibold text-[var(--color-brand-muted)]">Test</Label>
                <select
                  value={newMarker}
                  onChange={(e) => setNewMarker(e.target.value as BiomarkerType)}
                  className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {BIOMARKER_GROUPS.map((g) => (
                    <optgroup key={g.category} label={g.title}>
                      {g.markers.map((m) => (
                        <option key={m} value={m}>{BIOMARKER_META[m].label} ({BIOMARKER_META[m].unit})</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs font-semibold text-[var(--color-brand-muted)]">
                  Value ({BIOMARKER_META[newMarker].unit})
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder={BIOMARKER_META[newMarker].unit}
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-[var(--color-brand-muted)]">Date Collected</Label>
                <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="mt-1" />
              </div>
            </div>
            {/* Row 2: provenance */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-semibold text-[var(--color-brand-muted)]">Source</Label>
                <select
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value as BiomarkerSource)}
                  className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {(Object.keys(BIOMARKER_SOURCE_LABELS) as BiomarkerSource[]).map((s) => (
                    <option key={s} value={s}>{BIOMARKER_SOURCE_LABELS[s]}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs font-semibold text-[var(--color-brand-muted)]">
                  Ordered by <span className="font-normal opacity-60">(optional)</span>
                </Label>
                <Input
                  type="text"
                  placeholder="e.g. Dr. Smith"
                  value={newOrderedBy}
                  onChange={(e) => setNewOrderedBy(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-[var(--color-brand-muted)]">
                  Cycle day <span className="font-normal opacity-60">(optional)</span>
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={35}
                  placeholder="1–35"
                  value={newCycleDay}
                  onChange={(e) => setNewCycleDay(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <Button
              onClick={handleAdd}
              disabled={!newValue}
              className="h-9 bg-[var(--color-brand-primary)] text-white font-semibold hover:bg-[var(--color-brand-primary-hover)]"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Result
            </Button>
          </CardContent>
        </Card>

        {/* History per group */}
        {BIOMARKER_GROUPS.map((group) => {
          const groupHasData = group.markers.some((m) => patientBiomarkers.some((b) => b.marker === m));
          if (!groupHasData) return null;
          return (
            <Card key={group.category} className="bg-white border-[#E8E8E8]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-[var(--color-brand-midnight)]">{group.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {group.markers.map((marker) => {
                  const results = patientBiomarkers.filter((b) => b.marker === marker);
                  if (results.length === 0) return null;
                  const meta = BIOMARKER_META[marker];
                  return (
                    <div key={marker}>
                      {/* Marker header */}
                      <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[var(--color-brand-midnight)]">{meta.label}</span>
                          <span className="text-xs font-mono text-[var(--color-brand-muted)]">
                            ref {meta.reference.low}–{meta.reference.high} {meta.unit}
                          </span>
                        </div>
                        <Badge variant="secondary" className="text-[10px] bg-[#F8F9FA] text-[var(--color-brand-muted)]">
                          {results.length} result{results.length !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                      {/* Results table */}
                      <div className="overflow-x-auto rounded-lg border border-[#F3F4F6]">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-[#F8F9FA] border-b border-[#F3F4F6]">
                              <th className="px-3 py-2 text-left font-semibold text-[var(--color-brand-muted)] whitespace-nowrap">Date</th>
                              <th className="px-3 py-2 text-left font-semibold text-[var(--color-brand-muted)] whitespace-nowrap">Value</th>
                              <th className="px-3 py-2 text-left font-semibold text-[var(--color-brand-muted)] whitespace-nowrap">Change</th>
                              <th className="px-3 py-2 text-left font-semibold text-[var(--color-brand-muted)] whitespace-nowrap">Source</th>
                              <th className="px-3 py-2 text-left font-semibold text-[var(--color-brand-muted)] whitespace-nowrap">Ordered by</th>
                              <th className="px-3 py-2 text-left font-semibold text-[var(--color-brand-muted)] whitespace-nowrap">Cycle day</th>
                              <th className="w-8" />
                            </tr>
                          </thead>
                          <tbody>
                            {results.map((result, idx) => {
                              const prev = results[idx + 1]; // results sorted desc, so next index = older
                              const delta = prev ? result.value - prev.value : null;
                              const deltaStr = delta !== null
                                ? `${delta > 0 ? "+" : ""}${delta.toFixed(1)}`
                                : "—";
                              const deltaColor = delta === null
                                ? "text-[var(--color-brand-muted)]"
                                : delta > 0 ? "text-amber-600 font-semibold" : delta < 0 ? "text-emerald-600 font-semibold" : "text-[var(--color-brand-muted)]";
                              return (
                                <tr key={result.id} className="border-b border-[#F3F4F6] last:border-0 hover:bg-[#FAFAFA] transition-colors">
                                  <td className="px-3 py-2.5 whitespace-nowrap font-mono text-[var(--color-brand-midnight)]">
                                    {new Date(result.date_collected).toLocaleDateString("en-GB", {
                                      day: "numeric", month: "short", year: "numeric",
                                    })}
                                  </td>
                                  <td className="px-3 py-2.5 whitespace-nowrap">
                                    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold", FLAG_STYLES[result.flag])}>
                                      {result.value} {meta.unit}
                                    </span>
                                  </td>
                                  <td className={cn("px-3 py-2.5 font-mono whitespace-nowrap", deltaColor)}>
                                    {deltaStr}
                                  </td>
                                  <td className="px-3 py-2.5 whitespace-nowrap">
                                    {result.source ? (
                                      <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold", SOURCE_STYLES[result.source])}>
                                        {BIOMARKER_SOURCE_LABELS[result.source]}
                                      </span>
                                    ) : (
                                      <span className="text-[var(--color-brand-muted)]">—</span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2.5 text-[var(--color-brand-midnight)] whitespace-nowrap">
                                    {result.ordered_by ?? <span className="text-[var(--color-brand-muted)]">—</span>}
                                  </td>
                                  <td className="px-3 py-2.5 font-mono text-[var(--color-brand-midnight)] whitespace-nowrap">
                                    {result.cycle_day != null ? `Day ${result.cycle_day}` : <span className="text-[var(--color-brand-muted)]">—</span>}
                                  </td>
                                  <td className="px-3 py-2.5">
                                    <button
                                      onClick={() => removeBiomarker(result.id)}
                                      className="text-[var(--color-brand-muted)] hover:text-red-500 transition-colors"
                                      aria-label="Delete result"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}

        {patientBiomarkers.length === 0 && (
          <Card className="bg-white border-[#E8E8E8]">
            <CardContent className="py-12 text-center">
              <FlaskConical className="h-10 w-10 text-[var(--color-brand-muted)]/40 mx-auto mb-3" />
              <p className="text-sm text-[var(--color-brand-muted)]">No test results yet. Use the form above to add the first result.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right: Risk panel */}
      <div className="space-y-4">
        <Card className={`border-[#E8E8E8] ${risk ? riskColors[risk.overall_risk].bg : "bg-white"}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-[var(--color-brand-midnight)] flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              Risk Stratification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {risk ? (
              <>
                <div className="text-center py-2">
                  <div className={`text-4xl font-display font-bold ${riskColors[risk.overall_risk].text}`}>
                    {risk.score}<span className="text-lg font-normal">/100</span>
                  </div>
                  <Badge variant="secondary" className={`mt-2 text-sm font-bold ${riskColors[risk.overall_risk].badge}`}>
                    {riskLabels[risk.overall_risk]}
                  </Badge>
                </div>
                <Progress value={risk.score} className="h-2" />
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--color-brand-muted)]">Biomarker Score</span>
                    <span className="font-bold text-[var(--color-brand-midnight)]">{risk.biomarker_risk.score}/100</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--color-brand-muted)]">Clinical Score</span>
                    <span className="font-bold text-[var(--color-brand-midnight)]">{risk.clinical_risk.score}/100</span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-[var(--color-brand-muted)] text-center py-4">
                Enter biomarker values to calculate risk.
              </p>
            )}
          </CardContent>
        </Card>

        {risk && risk.clinical_alerts.length > 0 && (
          <Card className="bg-white border-[#E8E8E8]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-[var(--color-brand-midnight)] flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Clinical Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {risk.clinical_alerts.map((alert, i) => {
                const Icon = alertIcons[alert.severity];
                return (
                  <div key={i} className={`rounded border p-3 ${alertStyles[alert.severity]}`}>
                    <div className="flex items-start gap-2">
                      <Icon className="h-4 w-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold">{alert.message}</p>
                        <p className="text-xs mt-1 opacity-80">{alert.action}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {risk && risk.nice_ng73_criteria_met.length > 0 && (
          <Card className="bg-[var(--color-brand-orange)]/5 border-[var(--color-brand-orange)]/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-[var(--color-brand-orange)] flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                NICE NG73 Criteria Met
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {risk.nice_ng73_criteria_met.map((c, i) => (
                  <li key={i} className="text-xs text-[var(--color-brand-midnight)] flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[var(--color-brand-orange)] shrink-0 mt-0.5" />
                    {c}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ── Trends Tab ─────────────────────────────────────────────────────────────────

function TrendsTab({ patientId }: { patientId: string }) {
  const { getPatientBiomarkers, addBiomarker } = useCdss();
  const patientBiomarkers = useMemo(() => getPatientBiomarkers(patientId), [patientId, getPatientBiomarkers]);

  const availableMarkers = useMemo(() => {
    const withData = new Set(patientBiomarkers.map((b) => b.marker));
    return TREND_MARKERS.filter((m) => withData.has(m));
  }, [patientBiomarkers]);

  const [selectedMarker, setSelectedMarker] = useState<BiomarkerType | null>(null);
  const activeMarker = selectedMarker ?? availableMarkers[0] ?? null;
  const [newTestMarker, setNewTestMarker] = useState<BiomarkerType>("ca125");
  const [newTestValue, setNewTestValue] = useState("");
  const [newTestDate, setNewTestDate] = useState(new Date().toISOString().split("T")[0]);

  function handleAddTest() {
    if (!newTestValue) return;
    const value = parseFloat(newTestValue);
    if (isNaN(value)) return;
    addBiomarker(patientId, newTestMarker, value, newTestDate);
    setNewTestValue("");
    setSelectedMarker(newTestMarker);
  }

  const chartData = useMemo(() => {
    if (!activeMarker) return [];
    return patientBiomarkers
      .filter((b) => b.marker === activeMarker)
      .sort((a, b) => a.date_collected.localeCompare(b.date_collected))
      .map((b) => ({
        date: new Date(b.date_collected).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
        value: b.value,
        flag: b.flag,
      }));
  }, [patientBiomarkers, activeMarker]);

  const meta = activeMarker ? BIOMARKER_META[activeMarker] : null;

  const markerStats = useMemo(() => {
    if (!chartData.length) return null;
    const values = chartData.map((d) => d.value);
    const latest = values[values.length - 1];
    const first = values[0];
    return {
      latest,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
      trend: values.length >= 2 ? latest - first : 0,
    };
  }, [chartData]);

  return (
    <div className="space-y-4">
      {/* Add test */}
      <Card className="bg-white border-[#E8E8E8]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-[var(--color-brand-midnight)] flex items-center gap-2">
            <Plus className="h-4 w-4 text-[var(--color-brand-orange)]" />
            Add New Test Result
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-end gap-3">
            <div className="w-full sm:w-48">
              <Label className="text-xs font-semibold text-[var(--color-brand-muted)]">Test</Label>
              <select
                value={newTestMarker}
                onChange={(e) => setNewTestMarker(e.target.value as BiomarkerType)}
                className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                {TREND_MARKERS.map((m) => (
                  <option key={m} value={m}>{BIOMARKER_META[m].label} ({BIOMARKER_META[m].unit})</option>
                ))}
              </select>
            </div>
            <div className="w-full sm:w-32">
              <Label className="text-xs font-semibold text-[var(--color-brand-muted)]">Value ({BIOMARKER_META[newTestMarker].unit})</Label>
              <Input
                type="number"
                step="0.1"
                placeholder={BIOMARKER_META[newTestMarker].unit}
                value={newTestValue}
                onChange={(e) => setNewTestValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTest()}
                className="mt-1"
              />
            </div>
            <div className="w-full sm:w-44">
              <Label className="text-xs font-semibold text-[var(--color-brand-muted)]">Date Collected</Label>
              <Input type="date" value={newTestDate} onChange={(e) => setNewTestDate(e.target.value)} className="mt-1" />
            </div>
            <Button
              onClick={handleAddTest}
              disabled={!newTestValue}
              className="h-9 rounded bg-[var(--color-brand-primary)] text-white font-semibold px-5 hover:bg-[var(--color-brand-primary-hover)] shrink-0"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {availableMarkers.length > 0 ? (
        <>
          <div className="flex flex-wrap gap-2">
            {availableMarkers.map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMarker(m)}
                className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                  m === activeMarker
                    ? "bg-[var(--color-brand-blue)]/10 text-[var(--color-brand-blue)] border-[var(--color-brand-blue)]/30"
                    : "bg-white text-[var(--color-brand-muted)] border-[#E8E8E8] hover:border-[var(--color-brand-blue)]/30"
                }`}
              >
                {BIOMARKER_META[m].label}
              </button>
            ))}
          </div>

          {markerStats && meta && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: "Latest", value: `${markerStats.latest} ${meta.unit}` },
                { label: "Min", value: `${markerStats.min} ${meta.unit}` },
                { label: "Max", value: `${markerStats.max} ${meta.unit}` },
                { label: "Data Points", value: String(markerStats.count) },
                { label: "Trend", value: `${markerStats.trend > 0 ? "+" : ""}${markerStats.trend.toFixed(1)}` },
              ].map((stat) => (
                <Card key={stat.label} className="bg-white border-[#E8E8E8]">
                  <CardContent className="py-3 px-4 text-center">
                    <div className="font-mono text-lg font-bold text-[var(--color-brand-midnight)]">{stat.value}</div>
                    <p className="text-xs font-semibold text-[var(--color-brand-muted)] uppercase">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {meta && chartData.length > 0 && (
            <Card className="bg-white border-[#E8E8E8]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-[var(--color-brand-midnight)] flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-[var(--color-brand-blue)]" />
                  {meta.label} ({meta.unit})
                </CardTitle>
                <p className="text-xs text-[var(--color-brand-muted)]">
                  Reference range: {meta.reference.low}–{meta.reference.high} {meta.unit}
                </p>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="valGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-brand-blue)" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="var(--color-brand-blue)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6B8BAF" }} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#6B8BAF" }} tickLine={false} domain={["auto", "auto"]} />
                      <Tooltip
                        contentStyle={{ borderRadius: "12px", border: "1px solid #D4DCE6", fontSize: "12px" }}
                        formatter={(value) => [`${value} ${meta.unit}`, meta.label]}
                      />
                      <ReferenceLine y={meta.reference.high} stroke="#F59E0B" strokeDasharray="6 4"
                        label={{ value: `↑ ${meta.reference.high}`, position: "insideTopLeft", fontSize: 10, fill: "#F59E0B" }}
                      />
                      <ReferenceLine y={meta.reference.low} stroke="#6366F1" strokeDasharray="6 4"
                        label={{ value: `↓ ${meta.reference.low}`, position: "insideBottomLeft", fontSize: 10, fill: "#6366F1" }}
                      />
                      <Area type="monotone" dataKey="value" stroke="var(--color-brand-blue)" strokeWidth={2}
                        fill="url(#valGrad)"
                        dot={{ fill: "var(--color-brand-blue)", strokeWidth: 2, r: 4 }}
                        activeDot={{ fill: "var(--color-brand-orange)", strokeWidth: 0, r: 6 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card className="bg-white border-[#E8E8E8]">
          <CardContent className="py-12 text-center">
            <FlaskConical className="h-10 w-10 text-[var(--color-brand-muted)]/40 mx-auto mb-3" />
            <p className="text-sm text-[var(--color-brand-muted)]">
              No biomarker data yet. Add test results above to start tracking trends.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Patient Contributions Tab ─────────────────────────────────────────────────

const PAIN_COLORS = ["bg-emerald-500", "bg-yellow-400", "bg-orange-400", "bg-red-400", "bg-red-600"];

function ScoreBar({ score, max = 10 }: { score: number; max?: number }) {
  const pct = Math.round((score / max) * 100);
  const colorIdx = Math.min(Math.floor((score / max) * (PAIN_COLORS.length - 1)), PAIN_COLORS.length - 1);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-[#E8E8E8] overflow-hidden">
        <div className={`h-full rounded-full ${PAIN_COLORS[colorIdx]}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono font-bold text-[var(--color-brand-midnight)] w-6 text-right">{score}</span>
    </div>
  );
}

function SymptomTrendsChart({ logs }: { logs: SymptomLog[] }) {
  const chartData = useMemo(() => {
    return [...logs]
      .sort((a, b) => a.logged_at.localeCompare(b.logged_at))
      .map((log) => ({
        date: new Date(log.logged_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
        pain: log.pain_score,
        fatigue: log.fatigue_score,
        mood: log.mood_score,
        periodPain: log.period_pain_score,
      }));
  }, [logs]);

  if (chartData.length < 2) return null;

  return (
    <Card className="bg-white border-[#E8E8E8]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold text-[var(--color-brand-midnight)] flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-[var(--color-brand-primary)]" />
          Symptom Trends
        </CardTitle>
        <p className="text-xs text-[var(--color-brand-muted)]">Scores 0–10 as logged by patient</p>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6B8BAF" }} tickLine={false} />
              <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={{ fontSize: 10, fill: "#6B8BAF" }} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: "12px", border: "1px solid #D4DCE6", fontSize: "12px" }}
                formatter={(value, name) => {
                  const labels: Record<string, string> = { pain: "Overall Pain", fatigue: "Fatigue", mood: "Mood", periodPain: "Period Pain" };
                  return [`${value}/10`, labels[name as string] ?? name];
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                formatter={(value) => {
                  const labels: Record<string, string> = { pain: "Overall Pain", fatigue: "Fatigue", mood: "Mood", periodPain: "Period Pain" };
                  return labels[value] ?? value;
                }}
              />
              <Line type="monotone" dataKey="pain" stroke="#F97316" strokeWidth={2} dot={{ r: 3, fill: "#F97316" }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="fatigue" stroke="#6366F1" strokeWidth={2} dot={{ r: 3, fill: "#6366F1" }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="mood" stroke="#10B981" strokeWidth={2} dot={{ r: 3, fill: "#10B981" }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="periodPain" stroke="#EC4899" strokeWidth={2} strokeDasharray="4 3"
                dot={{ r: 3, fill: "#EC4899" }} activeDot={{ r: 5 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function ContributionsTab({ patientId }: { patientId: string }) {
  const { getPatientSymptomLogs } = useCdss();
  const logs = useMemo(() => getPatientSymptomLogs(patientId), [patientId, getPatientSymptomLogs]);

  if (logs.length === 0) {
    return (
      <Card className="bg-white border-[#E8E8E8]">
        <CardContent className="py-14 text-center">
          <Heart className="h-10 w-10 text-[var(--color-brand-muted)]/30 mx-auto mb-3" />
          <h3 className="font-display text-base font-bold text-[var(--color-brand-midnight)] mb-2">
            No patient contributions yet
          </h3>
          <p className="text-sm text-[var(--color-brand-muted)] max-w-sm mx-auto">
            When this patient logs symptoms through the Patient Portal, their entries will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--color-brand-muted)]">{logs.length} log{logs.length !== 1 ? "s" : ""} recorded by patient via Patient Portal</p>
      <SymptomTrendsChart logs={logs} />
      {logs.map((log) => (
        <LogCard key={log.id} log={log} />
      ))}
    </div>
  );
}

function LogCard({ log }: { log: SymptomLog }) {
  const date = new Date(log.logged_at).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
  const time = new Date(log.logged_at).toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit",
  });

  const activeSymptoms = Object.entries(log.symptoms)
    .filter(([, v]) => v)
    .map(([k]) => k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()));

  const bleedingLabels: Record<string, string> = {
    light: "Light", moderate: "Moderate", heavy: "Heavy", very_heavy: "Very Heavy",
  };

  return (
    <Card className="bg-white border-[#E8E8E8]">
      <CardContent className="py-4 px-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <p className="text-sm font-semibold text-[var(--color-brand-midnight)]">{date}</p>
            <p className="text-xs text-[var(--color-brand-muted)]">{time}</p>
          </div>
          {log.cycle_phase && (
            <Badge variant="secondary" className="text-xs bg-purple-50 text-purple-700 border-purple-100 capitalize">
              {log.cycle_phase.replace("_", " ")} phase
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 mb-3">
          <div>
            <p className="text-xs text-[var(--color-brand-muted)] mb-1">Overall Pain</p>
            <ScoreBar score={log.pain_score} />
          </div>
          <div>
            <p className="text-xs text-[var(--color-brand-muted)] mb-1">Fatigue</p>
            <ScoreBar score={log.fatigue_score} />
          </div>
          <div>
            <p className="text-xs text-[var(--color-brand-muted)] mb-1">Mood</p>
            <ScoreBar score={log.mood_score} />
          </div>
          {log.period_pain_score != null && (
            <div>
              <p className="text-xs text-[var(--color-brand-muted)] mb-1">Period Pain</p>
              <ScoreBar score={log.period_pain_score} />
            </div>
          )}
        </div>

        {(log.period_duration_hours != null || log.bleeding_heaviness) && (
          <div className="flex flex-wrap gap-2 mb-3">
            {log.period_duration_hours != null && (
              <Badge variant="secondary" className="text-xs bg-pink-50 text-pink-700 border-pink-100">
                Pain lasts {log.period_duration_hours}h
              </Badge>
            )}
            {log.bleeding_heaviness && (
              <Badge variant="secondary" className="text-xs bg-rose-50 text-rose-700 border-rose-100">
                {bleedingLabels[log.bleeding_heaviness]} bleeding
              </Badge>
            )}
          </div>
        )}

        {activeSymptoms.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {activeSymptoms.map((s) => (
              <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-100">
                {s}
              </span>
            ))}
          </div>
        )}

        {log.notes && (
          <p className="text-xs text-[var(--color-brand-midnight)] bg-[var(--color-brand-smoke)] rounded-lg px-3 py-2 leading-relaxed">
            {log.notes}
          </p>
        )}

        {log.transcript && (
          <details className="mt-2">
            <summary className="text-xs text-[var(--color-brand-muted)] cursor-pointer hover:text-[var(--color-brand-midnight)]">
              View voice transcript
            </summary>
            <p className="text-xs text-[var(--color-brand-muted)] mt-1.5 leading-relaxed italic">{log.transcript}</p>
          </details>
        )}
      </CardContent>
    </Card>
  );
}

// ── GP Records Tab ────────────────────────────────────────────────────────────

const GP_CONNECT_REASONS = [
  "Direct care — reviewing patient history before consultation",
  "Direct care — confirming medications and allergies",
  "Direct care — reviewing existing diagnoses and investigations",
  "Direct care — preparing referral letter",
  "Direct care — post-operative follow-up",
];

const MOCK_GP_RECORD = {
  demographics: {
    nhs_number: "943 476 5919",
    gp_practice: "The Nightingale Surgery",
    gp_name: "Dr. P. Okonkwo",
    registered_since: "2018-03-12",
  },
  conditions: [
    { code: "N80.0", description: "Endometriosis of uterus", status: "active", onset: "2021-06" },
    { code: "R10.2", description: "Pelvic and perineal pain", status: "active", onset: "2020-02" },
    { code: "N94.4", description: "Primary dysmenorrhoea", status: "active", onset: "2019-09" },
    { code: "K58.0", description: "Irritable bowel syndrome with diarrhoea", status: "active", onset: "2020-11" },
  ],
  medications: [
    { name: "Naproxen 500mg tablets", dose: "500mg", frequency: "Twice daily with food", start: "2021-08" },
    { name: "Norethisterone 5mg tablets", dose: "5mg", frequency: "Once daily", start: "2022-01" },
    { name: "Mefenamic acid 500mg capsules", dose: "500mg", frequency: "Three times daily PRN", start: "2021-08" },
  ],
  allergies: [
    { substance: "Penicillin", reaction: "Anaphylaxis", severity: "severe", recorded: "2015-04" },
    { substance: "Ibuprofen", reaction: "GI haemorrhage", severity: "moderate", recorded: "2020-09" },
  ],
  last_consultation: {
    date: "2024-11-14",
    clinician: "Dr. P. Okonkwo",
    summary: "Patient attended with ongoing cyclical pelvic pain and heavy menstrual bleeding. Endometriosis previously confirmed on laparoscopy (2021). Norethisterone providing partial symptom relief. Referred to secondary care gynaecology for review. Pain scores 7/10 at worst. Discussed lifestyle and dietary modifications. Prescription for Naproxen renewed.",
  },
};

function GpRecordsTab({ patientId, patientName }: { patientId: string; patientName: string }) {
  const { activeClinician } = useClinician();
  const { logEvent, compliance } = useCompliance();
  const [stage, setStage] = useState<"idle" | "request" | "loading" | "result" | "pds_loading" | "pds_result">("idle");
  const [reason, setReason] = useState(GP_CONNECT_REASONS[0]);
  const [pdsResult, setPdsResult] = useState<{ verified: boolean; discrepancy?: string } | null>(null);

  function requestGpConnect() {
    if (!activeClinician) return;
    setStage("loading");
    logEvent({
      clinician_id: activeClinician.id,
      clinician_name: activeClinician.name,
      event_type: "gp_connect_request",
      patient_id: patientId,
      patient_name: patientName,
      description: `GP Connect record requested for ${patientName}`,
      access_reason: reason,
    });
    setTimeout(() => setStage("result"), 1800);
  }

  function requestPds() {
    if (!activeClinician) return;
    setStage("pds_loading");
    logEvent({
      clinician_id: activeClinician.id,
      clinician_name: activeClinician.name,
      event_type: "pds_lookup",
      patient_id: patientId,
      patient_name: patientName,
      description: `PDS demographics lookup for ${patientName}`,
    });
    setTimeout(() => {
      setPdsResult({ verified: true });
      setStage("pds_result");
    }, 1400);
  }

  const gpConnectLive = compliance?.gp_connect_status === "live";
  const pdsLive = compliance?.pds_environment === "production";

  return (
    <div className="space-y-5">
      {/* Legal basis notice */}
      <div className="flex gap-3 rounded-xl bg-blue-50 border border-blue-200 p-4">
        <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-800 leading-relaxed">
          <p className="font-semibold mb-1">Lawful basis for access</p>
          <p>Accessing a patient&apos;s GP record is lawful under <strong>GDPR Article 9(2)(h)</strong> for direct care and <strong>NHS common law duty of confidentiality</strong>. Access is subject to the <strong>Caldicott Principles</strong> — only access data necessary for the immediate care episode. All requests are logged to the audit trail.</p>
        </div>
      </div>

      {/* PDS Demographics */}
      <Card className="bg-white border-[#E8E8E8]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-bold text-[var(--color-brand-midnight)] flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-[#0057FF]" />
                PDS Demographic Verification
              </CardTitle>
              <p className="text-xs text-[var(--color-brand-muted)] mt-0.5">Personal Demographics Service — NHS FHIR R4</p>
            </div>
            {!pdsLive && (
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 shrink-0">Demo</span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {stage === "idle" && (
            <div className="space-y-3">
              <p className="text-xs text-[var(--color-brand-muted)]">
                Verify the patient&apos;s NHS number and demographics against the NHS Personal Demographics Service to confirm identity before accessing clinical records.
              </p>
              <Button
                size="sm"
                onClick={requestPds}
                className="bg-[#0057FF] hover:bg-[#0046D4] text-white gap-1.5"
              >
                <Search className="h-3.5 w-3.5" />
                Verify via PDS {!pdsLive && "(Demo)"}
              </Button>
            </div>
          )}
          {stage === "pds_loading" && (
            <div className="flex items-center gap-3 py-3 text-sm text-[var(--color-brand-muted)]">
              <div className="h-4 w-4 rounded-full border-2 border-[#0057FF] border-t-transparent animate-spin shrink-0" />
              Querying PDS FHIR R4…
            </div>
          )}
          {(stage === "pds_result" || stage === "request" || stage === "loading" || stage === "result") && pdsResult && (
            <div className="space-y-3">
              <div className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold",
                pdsResult.verified ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
              )}>
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Demographics verified — NHS number confirmed
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(MOCK_GP_RECORD.demographics).map(([k, v]) => (
                  <div key={k} className="bg-[#F8FAFC] rounded-lg px-3 py-2">
                    <p className="text-[10px] font-semibold text-[var(--color-brand-muted)] uppercase tracking-wide">
                      {k.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs font-semibold text-[var(--color-brand-midnight)] mt-0.5">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* GP Connect */}
      <Card className="bg-white border-[#E8E8E8]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-bold text-[var(--color-brand-midnight)] flex items-center gap-2">
                <Database className="h-4 w-4 text-[#0057FF]" />
                GP Connect — Access Record: Structured
              </CardTitle>
              <p className="text-xs text-[var(--color-brand-muted)] mt-0.5">NHS England GP Connect API</p>
            </div>
            {!gpConnectLive && (
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 shrink-0">Demo</span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {(stage === "idle" || stage === "pds_loading" || stage === "pds_result") && (
            <div className="space-y-3">
              <p className="text-xs text-[var(--color-brand-muted)]">
                Pull the patient&apos;s structured GP record including diagnoses, medications, and allergies. Select a clinical reason — this is recorded in the audit trail in accordance with the Caldicott Principles.
              </p>
              <div>
                <label className="text-xs font-semibold text-[var(--color-brand-midnight)] block mb-1.5">Reason for access (required)</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full h-9 rounded-lg border border-[#E8E8E8] bg-white px-3 text-xs text-[#111827]"
                >
                  {GP_CONNECT_REASONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <Button
                size="sm"
                onClick={() => setStage("request")}
                disabled={stage !== "pds_result" && stage !== "idle"}
                className="bg-[#0057FF] hover:bg-[#0046D4] text-white gap-1.5"
              >
                <Database className="h-3.5 w-3.5" />
                Request GP Record {!gpConnectLive && "(Demo)"}
              </Button>
            </div>
          )}

          {stage === "request" && (
            <div className="space-y-3">
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-800">
                    <p className="font-semibold mb-1">Confirm access</p>
                    <p>You are requesting the structured GP record for <strong>{patientName}</strong>. This access will be logged in the audit trail and is governed by the <strong>Caldicott Principles</strong>.</p>
                    <p className="mt-1.5">Reason: <em>{reason}</em></p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={requestGpConnect} className="bg-[#0057FF] hover:bg-[#0046D4] text-white gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Confirm &amp; request
                </Button>
                <Button size="sm" variant="outline" onClick={() => setStage("idle")} className="border-[#E8E8E8]">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {stage === "loading" && (
            <div className="flex items-center gap-3 py-6 text-sm text-[var(--color-brand-muted)]">
              <div className="h-4 w-4 rounded-full border-2 border-[#0057FF] border-t-transparent animate-spin shrink-0" />
              Fetching structured record from GP Connect…
            </div>
          )}

          {stage === "result" && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                Record retrieved — {new Date().toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </div>

              {/* Last consultation */}
              <div>
                <p className="text-xs font-bold text-[var(--color-brand-midnight)] uppercase tracking-wide mb-2">Last GP Consultation</p>
                <div className="bg-[#F8FAFC] rounded-xl border border-[#E8E8E8] p-3">
                  <div className="flex justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold text-[var(--color-brand-midnight)]">{MOCK_GP_RECORD.last_consultation.clinician}</span>
                    <span className="text-xs text-[var(--color-brand-muted)]">
                      {new Date(MOCK_GP_RECORD.last_consultation.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  </div>
                  <p className="text-xs text-[#374151] leading-relaxed">{MOCK_GP_RECORD.last_consultation.summary}</p>
                </div>
              </div>

              {/* Active conditions */}
              <div>
                <p className="text-xs font-bold text-[var(--color-brand-midnight)] uppercase tracking-wide mb-2">Active Conditions</p>
                <div className="divide-y divide-[#F3F4F6] rounded-xl border border-[#E8E8E8] overflow-hidden">
                  {MOCK_GP_RECORD.conditions.map((c) => (
                    <div key={c.code} className="flex items-center justify-between gap-3 px-3 py-2.5 bg-white">
                      <div>
                        <span className="text-xs font-semibold text-[var(--color-brand-midnight)]">{c.description}</span>
                        <span className="ml-2 text-[10px] text-[var(--color-brand-muted)] font-mono">{c.code}</span>
                      </div>
                      <span className="text-[10px] text-[var(--color-brand-muted)] shrink-0">
                        Since {c.onset}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Current medications */}
              <div>
                <p className="text-xs font-bold text-[var(--color-brand-midnight)] uppercase tracking-wide mb-2">Current Medications</p>
                <div className="divide-y divide-[#F3F4F6] rounded-xl border border-[#E8E8E8] overflow-hidden">
                  {MOCK_GP_RECORD.medications.map((m) => (
                    <div key={m.name} className="px-3 py-2.5 bg-white">
                      <p className="text-xs font-semibold text-[var(--color-brand-midnight)]">{m.name}</p>
                      <p className="text-[10px] text-[var(--color-brand-muted)] mt-0.5">{m.frequency} · since {m.start}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Allergies */}
              <div>
                <p className="text-xs font-bold text-[var(--color-brand-midnight)] uppercase tracking-wide mb-2">Allergies &amp; Adverse Reactions</p>
                <div className="divide-y divide-[#F3F4F6] rounded-xl border border-red-100 overflow-hidden">
                  {MOCK_GP_RECORD.allergies.map((a) => (
                    <div key={a.substance} className="flex items-center justify-between gap-3 px-3 py-2.5 bg-red-50">
                      <div>
                        <span className="text-xs font-semibold text-red-800">{a.substance}</span>
                        <span className="ml-2 text-xs text-red-600">{a.reaction}</span>
                      </div>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                        a.severity === "severe" ? "bg-red-100 text-red-700 border-red-200" : "bg-orange-100 text-orange-700 border-orange-200"
                      )}>
                        {a.severity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-[10px] text-[var(--color-brand-muted)] leading-relaxed">
                Data sourced via NHS GP Connect Access Record: Structured API. This is mock data for demonstration purposes. In production, this would reflect the live GP record at time of query. Always verify clinical details with the patient.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PatientDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const patientId = params.id;

  const { patients, getRiskAssessment, setCurrentPatientId, getPatientBiomarkers } = useCdss();
  const { activeClinician } = useClinician();
  const { logEvent } = useCompliance();
  const patient = useMemo(() => patients.find((p) => p.id === patientId) ?? null, [patients, patientId]);

  // Log patient view
  useEffect(() => {
    if (patient && activeClinician) {
      logEvent({
        clinician_id: activeClinician.id,
        clinician_name: activeClinician.name,
        event_type: "patient_view",
        patient_id: patient.id,
        patient_name: patient.name,
        description: `Viewed patient record: ${patient.name}`,
      });
    }
    // Only run on mount / patient change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);
  const risk = useMemo(() => getRiskAssessment(patientId), [patientId, getRiskAssessment]);
  const patientBiomarkerCount = useMemo(() => getPatientBiomarkers(patientId).length, [patientId, getPatientBiomarkers]);
  const completeness = useMemo(
    () => patient ? getProfileCompleteness(patient, patientBiomarkerCount) : null,
    [patient, patientBiomarkerCount]
  );

  const activeTab = (searchParams.get("tab") ?? "history") as Tab;

  function setTab(tab: Tab) {
    setCurrentPatientId(patientId);
    router.push(`/cdss/patients/${patientId}?tab=${tab}`);
  }

  if (!patient) {
    return (
      <div className="px-6 lg:px-8 py-16 text-center">
        <p className="text-sm text-[var(--color-brand-muted)]">Patient not found.</p>
        <Link href="/cdss">
          <Button size="sm" variant="outline" className="mt-4">← Back to patients</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="px-6 lg:px-8 py-6 lg:py-8 overflow-x-hidden">
      {/* Back link */}
      <Link href="/cdss" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-brand-muted)] hover:text-[var(--color-brand-midnight)] mb-4 transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" />
        Dashboard
      </Link>

      {/* Patient header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-[var(--color-brand-midnight)] leading-tight">
          {patient.name}
        </h1>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="text-sm text-[var(--color-brand-muted)]">
            Age {patient.age} · {patient.symptom_duration_months}mo symptoms
          </span>
          {risk && (
            <Badge variant="secondary" className={`text-xs font-bold ${riskColors[risk.overall_risk].badge}`}>
              {riskLabels[risk.overall_risk]} · {risk.score}/100
            </Badge>
          )}
          {risk && risk.clinical_alerts.length > 0 && (
            <button
              onClick={() => setTab("biomarkers")}
              className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1 hover:bg-amber-100 transition-colors"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              {risk.clinical_alerts.length} alert{risk.clinical_alerts.length !== 1 ? "s" : ""} — view
            </button>
          )}
        </div>
      </div>

      {/* Incomplete profile banner */}
      {completeness && completeness.level !== "complete" && (
        <div className={cn(
          "rounded-xl border px-4 py-3 mb-5 flex items-start justify-between gap-4",
          completeness.level === "minimal"
            ? "bg-blue-50 border-blue-200"
            : "bg-amber-50 border-amber-200"
        )}>
          <div className="flex items-start gap-3 min-w-0">
            <ClipboardList className={cn("h-4 w-4 mt-0.5 shrink-0", completeness.level === "minimal" ? "text-blue-500" : "text-amber-500")} />
            <div className="min-w-0">
              <p className={cn("text-sm font-semibold", completeness.level === "minimal" ? "text-blue-800" : "text-amber-800")}>
                {completeness.level === "minimal"
                  ? "Profile not yet completed — add clinical details when ready"
                  : "Profile partially complete"}
              </p>
              <p className={cn("text-xs mt-0.5", completeness.level === "minimal" ? "text-blue-600" : "text-amber-700")}>
                Still needed: {completeness.missingSections.join(" · ")}
              </p>
            </div>
          </div>
          <Link
            href={`/cdss/patient?edit=${patientId}`}
            className={cn(
              "text-xs font-semibold shrink-0 underline hover:no-underline",
              completeness.level === "minimal" ? "text-blue-700" : "text-amber-700"
            )}
          >
            Complete profile
          </Link>
        </div>
      )}

      {/* Tabs — horizontally scrollable on mobile */}
      <div className="flex gap-0 border-b border-[#E8E8E8] mb-6 overflow-x-auto scrollbar-none -mx-6 lg:-mx-8 px-6 lg:px-8">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "shrink-0 flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap",
              activeTab === id
                ? "border-[var(--color-brand-primary)] text-[var(--color-brand-primary)]"
                : "border-transparent text-[var(--color-brand-muted)] hover:text-[var(--color-brand-midnight)]"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "history" && <HistoryTab patientId={patientId} />}
      {activeTab === "biomarkers" && <BiomarkersTab patientId={patientId} />}
      {activeTab === "trends" && <TrendsTab patientId={patientId} />}
      {activeTab === "contributions" && <ContributionsTab patientId={patientId} />}
      {activeTab === "records" && <GpRecordsTab patientId={patientId} patientName={patient.name} />}
    </div>
  );
}
