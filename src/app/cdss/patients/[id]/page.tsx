"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  FlaskConical,
  Heart,
  Info,
  Pencil,
  Plus,
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
import {
  BIOMARKER_META,
  type BiomarkerType,
  type ClinicalAlert,
  type RiskLevel,
  type SymptomLog,
} from "@/lib/types/cdss";
import { cn } from "@/lib/utils";

// ── Constants ─────────────────────────────────────────────────────────────────

type Tab = "history" | "biomarkers" | "trends" | "contributions";

const TABS: { id: Tab; label: string; icon: typeof ClipboardList }[] = [
  { id: "history", label: "History", icon: ClipboardList },
  { id: "biomarkers", label: "Biomarkers", icon: FlaskConical },
  { id: "trends", label: "Trends", icon: TrendingUp },
  { id: "contributions", label: "Patient Contributions", icon: Heart },
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

function BiomarkersTab({ patientId }: { patientId: string }) {
  const { patients, addBiomarker, getPatientBiomarkers, getRiskAssessment, removeBiomarker } = useCdss();
  const patient = patients.find((p) => p.id === patientId);
  const patientBiomarkers = useMemo(() => getPatientBiomarkers(patientId), [patientId, getPatientBiomarkers]);
  const risk = useMemo(() => getRiskAssessment(patientId), [patientId, getRiskAssessment]);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [inputDate, setInputDate] = useState(new Date().toISOString().split("T")[0]);

  function handleAddMarker(marker: BiomarkerType) {
    const raw = inputValues[marker];
    const value = parseFloat(raw);
    if (isNaN(value)) return;
    addBiomarker(patientId, marker, value, inputDate);
    setInputValues((prev) => ({ ...prev, [marker]: "" }));
  }

  if (!patient) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Lab entry */}
      <div className="lg:col-span-2 space-y-4">
        <Card className="bg-white border-[#E8E8E8]">
          <CardContent className="pt-4 pb-4 px-5">
            <div className="flex items-center gap-4">
              <Label className="text-xs font-semibold text-[var(--color-brand-muted)] shrink-0">Collection Date</Label>
              <Input type="date" value={inputDate} onChange={(e) => setInputDate(e.target.value)} className="w-48" />
            </div>
          </CardContent>
        </Card>

        {BIOMARKER_GROUPS.map((group) => (
          <Card key={group.category} className="bg-white border-[#E8E8E8]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-[var(--color-brand-midnight)]">{group.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {group.markers.map((marker) => {
                const meta = BIOMARKER_META[marker];
                const latestValue = patientBiomarkers.find((b) => b.marker === marker);
                return (
                  <div key={marker} className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                    <div className="w-32 shrink-0">
                      <span className="text-sm font-medium text-[var(--color-brand-midnight)]">{meta.label}</span>
                      <p className="text-xs text-[var(--color-brand-muted)] font-mono">
                        {meta.reference.low}–{meta.reference.high} {meta.unit}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Input
                        type="number"
                        step="0.1"
                        placeholder={meta.unit}
                        value={inputValues[marker] ?? ""}
                        onChange={(e) => setInputValues((prev) => ({ ...prev, [marker]: e.target.value }))}
                        onKeyDown={(e) => e.key === "Enter" && handleAddMarker(marker)}
                        className="w-28"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-lg text-xs shrink-0"
                        onClick={() => handleAddMarker(marker)}
                        disabled={!inputValues[marker]}
                      >
                        Add
                      </Button>
                    </div>
                    {latestValue && (
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant="secondary"
                          className={`text-xs ${
                            latestValue.flag === "normal" ? "bg-emerald-100 text-emerald-700"
                            : latestValue.flag === "critical" ? "bg-red-100 text-red-700"
                            : latestValue.flag === "elevated" ? "bg-amber-100 text-amber-700"
                            : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {latestValue.value} {meta.unit} — {latestValue.flag}
                        </Badge>
                        <button onClick={() => removeBiomarker(latestValue.id)} className="text-[var(--color-brand-muted)] hover:text-red-500">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
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
                        label={{ value: `Upper (${meta.reference.high})`, position: "right", fontSize: 10, fill: "#F59E0B" }}
                      />
                      <ReferenceLine y={meta.reference.low} stroke="#6366F1" strokeDasharray="6 4"
                        label={{ value: `Lower (${meta.reference.low})`, position: "right", fontSize: 10, fill: "#6366F1" }}
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

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PatientDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const patientId = params.id;

  const { patients, getRiskAssessment, setCurrentPatientId } = useCdss();
  const patient = useMemo(() => patients.find((p) => p.id === patientId) ?? null, [patients, patientId]);
  const risk = useMemo(() => getRiskAssessment(patientId), [patientId, getRiskAssessment]);

  const activeTab = (searchParams.get("tab") ?? "history") as Tab;

  function setTab(tab: Tab) {
    setCurrentPatientId(patientId);
    router.push(`/cdss/patients/${patientId}?tab=${tab}`);
  }

  if (!patient) {
    return (
      <div className="px-6 lg:px-8 py-16 text-center">
        <p className="text-sm text-[var(--color-brand-muted)]">Patient not found.</p>
        <Link href="/cdss/patients">
          <Button size="sm" variant="outline" className="mt-4">← Back to patients</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="px-6 lg:px-8 py-6 lg:py-8">
      {/* Back link */}
      <Link href="/cdss/patients" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-brand-muted)] hover:text-[var(--color-brand-midnight)] mb-4 transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" />
        All Patients
      </Link>

      {/* Patient header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-[var(--color-brand-smoke)] flex items-center justify-center shrink-0 text-lg font-bold text-[var(--color-brand-muted)]">
            {patient.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-[var(--color-brand-midnight)]">
              {patient.name}
            </h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-sm text-[var(--color-brand-muted)]">
                Age {patient.age} · {patient.symptom_duration_months}mo symptoms
              </span>
              {risk && (
                <Badge variant="secondary" className={`text-xs font-bold ${riskColors[risk.overall_risk].badge}`}>
                  {riskLabels[risk.overall_risk]} · {risk.score}/100
                </Badge>
              )}
              {risk && risk.clinical_alerts.length > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {risk.clinical_alerts.length} alert{risk.clinical_alerts.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#E8E8E8] mb-6">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors",
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
    </div>
  );
}
