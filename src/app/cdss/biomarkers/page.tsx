"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FlaskConical,
  Info,
  ShieldAlert,
  Stethoscope,
  TrendingUp,
  X,
} from "lucide-react";
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
  type RiskLevel,
  type ClinicalAlert,
} from "@/lib/types/cdss";

const BIOMARKER_GROUPS: { title: string; category: string; markers: BiomarkerType[] }[] = [
  { title: "Tumour Markers", category: "tumour_marker", markers: ["ca125", "he4"] },
  { title: "Inflammatory Markers", category: "inflammatory", markers: ["crp", "esr", "neutrophil_lymphocyte_ratio", "il6", "tnf_alpha"] },
  { title: "Hormonal / Metabolic", category: "hormonal", markers: ["amh", "tsh", "vitamin_d"] },
  { title: "Haematology", category: "haematology", markers: ["fbc_haemoglobin", "ferritin"] },
  { title: "Endometriosis Diagnostics", category: "diagnostic", markers: ["promarker_endo", "arelis_endo"] },
];

const riskColors: Record<RiskLevel, { bg: string; text: string; progress: string }> = {
  low:       { bg: "bg-emerald-50", text: "text-emerald-700", progress: "[&>div]:bg-emerald-500" },
  moderate:  { bg: "bg-amber-50",   text: "text-amber-700",   progress: "[&>div]:bg-amber-500" },
  high:      { bg: "bg-orange-50",  text: "text-orange-700",  progress: "[&>div]:bg-orange-500" },
  very_high: { bg: "bg-red-50",     text: "text-red-700",     progress: "[&>div]:bg-red-500" },
};

const riskLabels: Record<RiskLevel, string> = {
  low: "Low Risk",
  moderate: "Moderate Risk",
  high: "High Risk",
  very_high: "Very High Risk",
};

const alertIcons: Record<ClinicalAlert["severity"], typeof Info> = {
  info: Info,
  warning: AlertTriangle,
  critical: ShieldAlert,
};

const alertStyles: Record<ClinicalAlert["severity"], string> = {
  info: "bg-blue-50 border-blue-200 text-blue-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
  critical: "bg-red-50 border-red-200 text-red-800",
};

export default function BiomarkersPage() {
  const searchParams = useSearchParams();
  const patientIdParam = searchParams.get("patient");
  const {
    patients,
    currentPatient,
    setCurrentPatientId,
    addBiomarker,
    getPatientBiomarkers,
    getRiskAssessment,
    removeBiomarker,
  } = useCdss();

  useEffect(() => {
    if (patientIdParam) setCurrentPatientId(patientIdParam);
  }, [patientIdParam, setCurrentPatientId]);

  const activePatient = useMemo(() => {
    if (patientIdParam) return patients.find((p) => p.id === patientIdParam) ?? null;
    return currentPatient;
  }, [patientIdParam, patients, currentPatient]);

  const patientBiomarkers = useMemo(
    () => (activePatient ? getPatientBiomarkers(activePatient.id) : []),
    [activePatient, getPatientBiomarkers]
  );

  const risk = useMemo(
    () => (activePatient ? getRiskAssessment(activePatient.id) : null),
    [activePatient, getRiskAssessment]
  );

  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [inputDate, setInputDate] = useState(new Date().toISOString().split("T")[0]);

  function handleAddMarker(marker: BiomarkerType) {
    if (!activePatient) return;
    const raw = inputValues[marker];
    const value = parseFloat(raw);
    if (isNaN(value)) return;
    addBiomarker(activePatient.id, marker, value, inputDate);
    setInputValues((prev) => ({ ...prev, [marker]: "" }));
  }

  if (!activePatient) {
    return (
      <div className="max-w-3xl mx-auto px-6 lg:px-8 py-16 text-center">
        <FlaskConical className="h-12 w-12 text-[var(--color-brand-muted)]/40 mx-auto mb-4" />
        <h1 className="heading-display text-display-xs text-[var(--color-brand-midnight)] mb-2">
          No Patient Selected
        </h1>
        <p className="text-sm text-[var(--color-brand-muted)] mb-6">
          Create a patient assessment first to enter biomarker values.
        </p>
        <Link href="/cdss/patient">
          <Button className="rounded bg-[var(--color-brand-primary)] text-white font-semibold h-10 px-6 hover:bg-[var(--color-brand-primary-hover)]">
            New Assessment <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="px-6 lg:px-8 py-6 lg:py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-1">
          <FlaskConical className="h-5 w-5 text-[var(--color-brand-blue)]" />
          <p className="text-xs font-semibold tracking-wide uppercase text-[var(--color-brand-muted)]">
            Biomarker Entry & Risk Calculator
          </p>
        </div>
        <h1 className="heading-display text-display-xs sm:text-display-sm text-[var(--color-brand-midnight)]">
          {activePatient.name}
        </h1>
        <p className="text-sm text-[var(--color-brand-muted)]">
          Age {activePatient.age} &middot; Symptoms for {activePatient.symptom_duration_months} months
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Lab entry */}
        <div className="lg:col-span-2 space-y-6">
          {/* Collection date */}
          <Card className="bg-white border-[#E8E8E8]">
            <CardContent className="pt-4 pb-4 px-5">
              <div className="flex items-center gap-4">
                <Label className="text-xs font-semibold text-[var(--color-brand-muted)] shrink-0">
                  Collection Date
                </Label>
                <Input
                  type="date"
                  value={inputDate}
                  onChange={(e) => setInputDate(e.target.value)}
                  className="w-48"
                />
              </div>
            </CardContent>
          </Card>

          {/* Biomarker groups */}
          {BIOMARKER_GROUPS.map((group) => (
            <Card key={group.category} className="bg-white border-[#E8E8E8]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-[var(--color-brand-midnight)]">
                  {group.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {group.markers.map((marker) => {
                  const meta = BIOMARKER_META[marker];
                  const latestValue = patientBiomarkers.find((b) => b.marker === marker);
                  return (
                    <div
                      key={marker}
                      className="flex items-center gap-3 flex-wrap sm:flex-nowrap"
                    >
                      <div className="w-32 shrink-0">
                        <span className="text-sm font-medium text-[var(--color-brand-midnight)]">
                          {meta.label}
                        </span>
                        <p className="text-xs text-[var(--color-brand-muted)] font-mono">
                          {meta.reference.low}–{meta.reference.high} {meta.unit}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Input
                          type="number"
                          step="0.1"
                          placeholder={`${meta.unit}`}
                          value={inputValues[marker] ?? ""}
                          onChange={(e) =>
                            setInputValues((prev) => ({ ...prev, [marker]: e.target.value }))
                          }
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
                              latestValue.flag === "normal"
                                ? "bg-emerald-100 text-emerald-700"
                                : latestValue.flag === "critical"
                                  ? "bg-red-100 text-red-700"
                                  : latestValue.flag === "elevated"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {latestValue.value} {meta.unit} — {latestValue.flag}
                          </Badge>
                          <button
                            onClick={() => removeBiomarker(latestValue.id)}
                            className="text-[var(--color-brand-muted)] hover:text-red-500"
                          >
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
        <div className="space-y-6">
          {/* Risk score */}
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
                      {risk.score}
                      <span className="text-lg font-normal">/100</span>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`mt-2 text-sm font-bold ${riskColors[risk.overall_risk].text} ${riskColors[risk.overall_risk].bg}`}
                    >
                      {riskLabels[risk.overall_risk]}
                    </Badge>
                  </div>
                  <Progress
                    value={risk.score}
                    className={`h-2 ${riskColors[risk.overall_risk].progress}`}
                  />
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--color-brand-muted)]">Biomarker Score</span>
                      <span className="font-bold text-[var(--color-brand-midnight)]">
                        {risk.biomarker_risk.score}/100
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--color-brand-muted)]">Clinical Score</span>
                      <span className="font-bold text-[var(--color-brand-midnight)]">
                        {risk.clinical_risk.score}/100
                      </span>
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

          {/* NICE criteria */}
          {risk && risk.nice_ng73_criteria_met.length > 0 && (
            <Card className="bg-[var(--color-brand-orange)]/5 border-[var(--color-brand-orange)]/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-[var(--color-brand-orange)] flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Referral Criteria Met
                </CardTitle>
                <p className="text-xs text-[var(--color-brand-muted)]">
                  NICE NG73 criteria identified
                </p>
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

          {/* Clinical alerts */}
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
                    <div
                      key={i}
                      className={`rounded border p-3 ${alertStyles[alert.severity]}`}
                    >
                      <div className="flex items-start gap-2">
                        <Icon className="h-4 w-4 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold">{alert.message}</p>
                          <p className="text-xs mt-1 opacity-80">{alert.action}</p>
                          {alert.guideline_ref && (
                            <p className="text-xs mt-1 font-mono opacity-60">
                              Ref: {alert.guideline_ref}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Recommended investigations */}
          {risk && risk.recommended_investigations.length > 0 && (
            <Card className="bg-white border-[#E8E8E8]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-[var(--color-brand-midnight)] flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[var(--color-brand-blue)]" />
                  Recommended Investigations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {risk.recommended_investigations.map((inv, i) => (
                  <div
                    key={i}
                    className="rounded bg-[var(--color-brand-smoke)] p-3"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-[var(--color-brand-midnight)]">
                        {inv.name}
                      </span>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${
                          inv.urgency === "immediate"
                            ? "bg-red-100 text-red-700"
                            : inv.urgency === "urgent"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {inv.urgency}
                      </Badge>
                    </div>
                    <p className="text-xs text-[var(--color-brand-muted)] leading-relaxed">
                      {inv.rationale}
                    </p>
                    <p className="text-xs font-mono text-[var(--color-brand-muted)]/60 mt-1">
                      {inv.guideline_ref}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Risk factors breakdown */}
          {risk && (risk.biomarker_risk.factors.length > 0 || risk.clinical_risk.factors.length > 0) && (
            <Card className="bg-white border-[#E8E8E8]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-[var(--color-brand-midnight)]">
                  Risk Factor Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {risk.biomarker_risk.factors.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-[var(--color-brand-muted)] uppercase mb-1">
                      Biomarker Factors
                    </p>
                    <ul className="space-y-1">
                      {risk.biomarker_risk.factors.map((f, i) => (
                        <li key={i} className="text-xs text-[var(--color-brand-midnight)]">
                          &bull; {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {risk.clinical_risk.factors.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-[var(--color-brand-muted)] uppercase mb-1">
                      Clinical Factors
                    </p>
                    <ul className="space-y-1">
                      {risk.clinical_risk.factors.map((f, i) => (
                        <li key={i} className="text-xs text-[var(--color-brand-midnight)]">
                          &bull; {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Link to trends */}
          {activePatient && patientBiomarkers.length > 0 && (
            <Link href={`/cdss/trends?patient=${activePatient.id}`}>
              <Button
                variant="outline"
                className="w-full rounded font-semibold text-[var(--color-brand-primary)] border-[var(--color-brand-primary)]/40 hover:bg-[var(--color-brand-primary)]/5"
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                View Longitudinal Trends
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
