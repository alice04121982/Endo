"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Plus,
  Search,
  UserCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCdss } from "@/lib/cdss-store";
import type { RiskLevel } from "@/lib/types/cdss";

const riskColors: Record<RiskLevel, string> = {
  low: "bg-emerald-100 text-emerald-700 border-emerald-200",
  moderate: "bg-amber-100 text-amber-700 border-amber-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  very_high: "bg-red-100 text-red-700 border-red-200",
};

const riskLabels: Record<RiskLevel, string> = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
  very_high: "Very High",
};


export default function CdssDashboard() {
  const { patients, getRiskAssessment, setCurrentPatientId } = useCdss();
  const [patientQuery, setPatientQuery] = useState("");

  const assessments = useMemo(() => {
    const q = patientQuery.toLowerCase().trim();
    return patients
      .filter((p) => !q || p.name.toLowerCase().includes(q))
      .map((p) => ({ patient: p, risk: getRiskAssessment(p.id) }));
  }, [patients, patientQuery, getRiskAssessment]);

  const alertPatients = assessments.filter(
    (a) => (a.risk?.clinical_alerts.length ?? 0) > 0
  );

  return (
    <div className="px-6 lg:px-8 py-6 lg:py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-[var(--color-brand-midnight)]">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-[var(--color-brand-muted)]">
          NICE NG73 aligned · Endometriosis clinical decision support
        </p>
      </div>

      <div className="space-y-6">
          {/* Alerts banner */}
          {alertPatients.length > 0 && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-sm font-semibold text-amber-800 shrink-0">
                  {alertPatients.length} patient{alertPatients.length !== 1 ? "s" : ""} need review
                </span>
                {/* Avatar stack */}
                <div className="flex items-center -space-x-1.5">
                  {alertPatients.slice(0, 3).map((a) => (
                    <Link
                      key={a.patient.id}
                      href={`/cdss/biomarkers?patient=${a.patient.id}`}
                      onClick={() => setCurrentPatientId(a.patient.id)}
                      title={a.patient.name}
                      className="h-6 w-6 rounded-full bg-amber-200 border-2 border-amber-50 flex items-center justify-center text-[10px] font-bold text-amber-800 hover:z-10 hover:scale-110 transition-transform"
                    >
                      {a.patient.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                    </Link>
                  ))}
                  {alertPatients.length > 3 && (
                    <div className="h-6 w-6 rounded-full bg-amber-300 border-2 border-amber-50 flex items-center justify-center text-[9px] font-bold text-amber-900">
                      +{alertPatients.length - 3}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Patient list */}
          <Card className="bg-white border-[#E8E8E8]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3 mb-3">
                <CardTitle className="font-display text-base font-bold text-[var(--color-brand-midnight)]">
                  My Patients
                  {patients.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-[var(--color-brand-muted)]">
                      ({patients.length})
                    </span>
                  )}
                </CardTitle>
                <Link href="/cdss/patient?new=1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5 text-xs font-semibold border-[#E8E8E8] shrink-0"
                  >
                    <Plus className="h-3 w-3" />
                    Add Patient
                  </Button>
                </Link>
              </div>
              {patients.length > 0 && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-brand-muted)]" />
                  <Input
                    value={patientQuery}
                    onChange={(e) => setPatientQuery(e.target.value)}
                    placeholder="Search patients…"
                    className="pl-9 h-8 text-sm bg-[#F8F9FA] border-[#E8E8E8]"
                  />
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {assessments.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <UserCircle className="h-10 w-10 text-[var(--color-brand-muted)]/30 mx-auto mb-3" />
                  <p className="text-sm text-[var(--color-brand-muted)] mb-4">
                    No patients yet. Add your first patient to begin.
                  </p>
                  <Link href="/cdss/patient?new=1">
                    <Button
                      size="sm"
                      className="bg-[var(--color-brand-primary)] text-white hover:bg-[var(--color-brand-primary-hover)] gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      New Assessment
                    </Button>
                  </Link>
                </div>
              ) : assessments.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm text-[var(--color-brand-muted)]">
                    No patients match &ldquo;{patientQuery}&rdquo;.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#E8E8E8]">
                  {assessments.map(({ patient, risk }) => (
                    <Link
                      key={patient.id}
                      href={`/cdss/patients/${patient.id}`}
                      onClick={() => setCurrentPatientId(patient.id)}
                      className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-[#F8F9FA] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-full bg-[var(--color-brand-smoke)] flex items-center justify-center shrink-0 text-sm font-bold text-[var(--color-brand-muted)]">
                          {patient.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-[var(--color-brand-midnight)] truncate">
                              {patient.name}
                            </span>
                            {risk && (
                              <Badge
                                variant="secondary"
                                className={`text-xs shrink-0 ${riskColors[risk.overall_risk]}`}
                              >
                                {riskLabels[risk.overall_risk]}
                              </Badge>
                            )}
                            {risk && risk.clinical_alerts.length > 0 && (
                              <Badge
                                variant="secondary"
                                className="text-xs shrink-0 bg-amber-100 text-amber-700 border-amber-200"
                              >
                                {risk.clinical_alerts.length} alert{risk.clinical_alerts.length !== 1 ? "s" : ""}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-[var(--color-brand-muted)] mt-0.5">
                            {patient.symptom_duration_months}mo symptoms
                            {patient.known_endometriosis_stage && patient.known_endometriosis_stage !== "none"
                              ? ` · ${patient.known_endometriosis_stage.replace("stage_", "Stage ").toUpperCase()}`
                              : ""}
                          </p>
                        </div>
                      </div>

                      <span className="text-xs font-semibold text-[var(--color-brand-primary)] transition-colors shrink-0">
                        View →
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
      </div>

      {/* Disclaimer */}
      <p className="mt-8 text-xs text-[var(--color-brand-muted)] text-center max-w-2xl mx-auto leading-relaxed">
        Clinical decision support tool — intended as an aid to clinical judgement, not a replacement.
        Risk scores are indicative. Based on NICE NG73: Endometriosis — Diagnosis and Management.
      </p>
    </div>
  );
}
