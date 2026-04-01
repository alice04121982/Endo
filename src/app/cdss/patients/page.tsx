"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  FlaskConical,
  Plus,
  Search,
  TrendingUp,
  UserCircle,
  UserPlus,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCdss } from "@/lib/cdss-store";
import type { RiskLevel } from "@/lib/types/cdss";

const riskColors: Record<RiskLevel, string> = {
  low: "bg-emerald-100 text-emerald-700 border-emerald-200",
  moderate: "bg-amber-100 text-amber-700 border-amber-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  very_high: "bg-red-100 text-red-700 border-red-200",
};

const riskLabels: Record<RiskLevel, string> = {
  low: "Low Risk",
  moderate: "Moderate",
  high: "High Risk",
  very_high: "Very High",
};

export default function PatientsPage() {
  const router = useRouter();
  const { patients, getRiskAssessment, setCurrentPatientId } = useCdss();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return patients;
    return patients.filter((p) => p.name.toLowerCase().includes(q));
  }, [patients, query]);

  const assessments = useMemo(
    () => filtered.map((p) => ({ patient: p, risk: getRiskAssessment(p.id) })),
    [filtered, getRiskAssessment]
  );

  function handleSelect(patientId: string, dest: string) {
    setCurrentPatientId(patientId);
    router.push(dest);
  }

  return (
    <div className="px-6 lg:px-8 py-6 lg:py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--color-brand-midnight)]">
            Patients
          </h1>
          <p className="mt-1 text-sm text-[var(--color-brand-muted)]">
            Select a patient to continue their assessment, or add a new one.
          </p>
        </div>
        <Link href="/cdss/patient">
          <Button className="shrink-0 bg-[var(--color-brand-primary)] text-white hover:bg-[var(--color-brand-primary-hover)] gap-1.5 font-semibold">
            <UserPlus className="h-4 w-4" />
            New Patient
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-brand-muted)]" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search patients by name…"
          className="pl-10 bg-white border-[#E8E8E8] h-10 text-sm"
        />
      </div>

      {/* Patient list */}
      {patients.length === 0 ? (
        <Card className="bg-white border-[#E8E8E8]">
          <CardContent className="py-14 text-center">
            <UserCircle className="h-12 w-12 text-[var(--color-brand-muted)]/30 mx-auto mb-4" />
            <h3 className="font-display text-base font-bold text-[var(--color-brand-midnight)] mb-2">
              No patients yet
            </h3>
            <p className="text-sm text-[var(--color-brand-muted)] mb-5 max-w-sm mx-auto">
              Add your first patient to begin a risk stratification assessment.
            </p>
            <Link href="/cdss/patient">
              <Button className="bg-[var(--color-brand-primary)] text-white hover:bg-[var(--color-brand-primary-hover)] gap-1.5">
                <Plus className="h-4 w-4" />
                Add First Patient
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="bg-white border-[#E8E8E8]">
          <CardContent className="py-10 text-center">
            <p className="text-sm text-[var(--color-brand-muted)]">
              No patients match &ldquo;{query}&rdquo;.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {assessments.map(({ patient, risk }) => (
            <Card
              key={patient.id}
              className="bg-white border-[#E8E8E8] hover:border-[var(--color-brand-primary)]/30 transition-colors"
            >
              <CardContent className="py-4 px-5">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="h-11 w-11 rounded-full bg-[var(--color-brand-smoke)] flex items-center justify-center shrink-0 text-base font-bold text-[var(--color-brand-muted)]">
                    {patient.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-display font-bold text-[var(--color-brand-midnight)]">
                        {patient.name}
                      </span>
                      {risk && (
                        <Badge
                          variant="secondary"
                          className={`text-xs ${riskColors[risk.overall_risk]}`}
                        >
                          {riskLabels[risk.overall_risk]}
                          {risk.score > 0 && ` · ${risk.score}/100`}
                        </Badge>
                      )}
                      {risk && risk.clinical_alerts.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                          <AlertTriangle className="h-3 w-3" />
                          {risk.clinical_alerts.length} alert{risk.clinical_alerts.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--color-brand-muted)] mt-0.5">
                      Age {patient.age}
                      {patient.bmi ? ` · BMI ${patient.bmi}` : ""}
                      {" · "}
                      Symptoms {patient.symptom_duration_months} months
                      {patient.known_endometriosis_stage &&
                      patient.known_endometriosis_stage !== "none"
                        ? ` · ${patient.known_endometriosis_stage.replace("stage_", "Stage ").replace("_", " ").toUpperCase()}`
                        : ""}
                    </p>
                    {risk && risk.nice_ng73_criteria_met.length > 0 && (
                      <p className="text-xs text-[var(--color-brand-primary)] font-semibold mt-0.5">
                        {risk.nice_ng73_criteria_met.length} NICE NG73 criteria met
                      </p>
                    )}
                  </div>

                  {/* Journey actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelect(patient.id, `/cdss/patient?edit=${patient.id}`)}
                      className="h-8 text-xs font-semibold border-[#E8E8E8] text-[var(--color-brand-muted)] hover:text-[var(--color-brand-midnight)]"
                    >
                      History
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelect(patient.id, `/cdss/biomarkers?patient=${patient.id}`)}
                      className="h-8 text-xs font-semibold border-[#E8E8E8] gap-1 text-[var(--color-brand-primary)]"
                    >
                      <FlaskConical className="h-3 w-3" />
                      Biomarkers
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelect(patient.id, `/cdss/trends?patient=${patient.id}`)}
                      className="h-8 text-xs font-semibold border-[#E8E8E8] gap-1 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-midnight)]"
                    >
                      <TrendingUp className="h-3 w-3" />
                      Trends
                    </Button>
                  </div>
                </div>

                {/* Assessment journey steps */}
                <div className="mt-3 pt-3 border-t border-[#F3F4F6] flex items-center gap-1 text-xs text-[var(--color-brand-muted)]">
                  <span className="font-semibold text-[var(--color-brand-midnight)]">Assessment journey:</span>
                  <button
                    onClick={() => handleSelect(patient.id, `/cdss/patient?edit=${patient.id}`)}
                    className="px-2 py-0.5 rounded bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] font-semibold hover:bg-[var(--color-brand-primary)]/20 transition-colors"
                  >
                    1. Patient History
                  </button>
                  <ArrowRight className="h-3 w-3" />
                  <button
                    onClick={() => handleSelect(patient.id, `/cdss/biomarkers?patient=${patient.id}`)}
                    className="px-2 py-0.5 rounded hover:bg-[#F3F4F6] transition-colors"
                  >
                    2. Biomarkers
                  </button>
                  <ArrowRight className="h-3 w-3" />
                  <button
                    onClick={() => handleSelect(patient.id, `/cdss/trends?patient=${patient.id}`)}
                    className="px-2 py-0.5 rounded hover:bg-[#F3F4F6] transition-colors"
                  >
                    3. Longitudinal Trends
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
