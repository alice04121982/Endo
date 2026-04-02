"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Plus,
  Search,
  Trash2,
  UserCircle,
  UserPlus,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCdss } from "@/lib/cdss-store";
import type { RiskLevel } from "@/lib/types/cdss";
import { getProfileCompleteness } from "@/lib/profile-completeness";

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
  const { patients, getRiskAssessment, setCurrentPatientId, removePatient, currentPatient, getPatientBiomarkers } = useCdss();
  const [query, setQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return patients;
    return patients.filter((p) => p.name.toLowerCase().includes(q));
  }, [patients, query]);

  const assessments = useMemo(
    () => filtered.map((p) => ({
      patient: p,
      risk: getRiskAssessment(p.id),
      completeness: getProfileCompleteness(p, getPatientBiomarkers(p.id).length),
    })),
    [filtered, getRiskAssessment, getPatientBiomarkers]
  );

  function handleSelect(patientId: string, dest: string) {
    setCurrentPatientId(patientId);
    router.push(dest);
  }

  function goToPatient(patientId: string, tab?: string) {
    setCurrentPatientId(patientId);
    router.push(`/cdss/patients/${patientId}${tab ? `?tab=${tab}` : ""}`);
  }

  function handleDelete() {
    if (!deleteId) return;
    if (currentPatient?.id === deleteId) setCurrentPatientId(null);
    removePatient(deleteId);
    setDeleteId(null);
  }

  const patientToDelete = patients.find((p) => p.id === deleteId);

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
        <Link href="/cdss/patient?new=1">
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
            <Link href="/cdss/patient?new=1">
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
          {assessments.map(({ patient, risk, completeness }) => (
            <Card
              key={patient.id}
              className="bg-white border-[#E8E8E8] hover:border-[var(--color-brand-primary)]/30 transition-colors cursor-pointer"
              onClick={() => goToPatient(patient.id)}
            >
              <CardContent className="py-4 px-5">
                {/* Row 1: name + actions */}
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="font-display font-bold text-[var(--color-brand-midnight)] truncate">
                    {patient.name}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); goToPatient(patient.id); }}
                      className="h-8 text-xs font-semibold border-[#E8E8E8] text-[var(--color-brand-primary)]"
                    >
                      View Patient
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); setDeleteId(patient.id); }}
                      className="h-8 w-8 p-0 border-[#E8E8E8] text-[var(--color-brand-muted)] hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
                      aria-label="Delete patient"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Row 2: badges */}
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  {completeness.level === "minimal" && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
                      Profile incomplete
                    </span>
                  )}
                  {completeness.level === "partial" && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                      Partial profile
                    </span>
                  )}
                  {risk && completeness.level === "complete" && (
                    <Badge variant="secondary" className={`text-xs ${riskColors[risk.overall_risk]}`}>
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

                {/* Row 3: age / symptoms — single line */}
                <p className="text-xs text-[var(--color-brand-muted)] whitespace-nowrap overflow-hidden text-ellipsis">
                  Age {patient.age}
                  {patient.bmi ? ` · BMI ${patient.bmi}` : ""}
                  {" · Symptoms "}
                  {patient.symptom_duration_months} months
                  {patient.known_endometriosis_stage && patient.known_endometriosis_stage !== "none"
                    ? ` · ${patient.known_endometriosis_stage.replace("stage_", "Stage ").replace("_", " ").toUpperCase()}`
                    : ""}
                </p>

                {risk && risk.nice_ng73_criteria_met.length > 0 && (
                  <p className="text-xs text-[var(--color-brand-primary)] font-semibold mt-0.5">
                    {risk.nice_ng73_criteria_met.length} NICE NG73 criteria met
                  </p>
                )}

                {/* Quick access */}
                <div className="mt-3 pt-3 border-t border-[#F3F4F6]">
                  <p className="text-xs font-semibold text-[var(--color-brand-midnight)] mb-1.5">Quick access:</p>
                  <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                    <button
                      onClick={(e) => { e.stopPropagation(); goToPatient(patient.id, "history"); }}
                      className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#F3F4F6] text-[var(--color-brand-midnight)] hover:bg-[var(--color-brand-primary)]/10 hover:text-[var(--color-brand-primary)] transition-colors"
                    >
                      History
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); goToPatient(patient.id, "biomarkers"); }}
                      className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#F3F4F6] text-[var(--color-brand-midnight)] hover:bg-[var(--color-brand-primary)]/10 hover:text-[var(--color-brand-primary)] transition-colors"
                    >
                      Biomarkers
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); goToPatient(patient.id, "trends"); }}
                      className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#F3F4F6] text-[var(--color-brand-midnight)] hover:bg-[var(--color-brand-primary)]/10 hover:text-[var(--color-brand-primary)] transition-colors"
                    >
                      Trends
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); goToPatient(patient.id, "contributions"); }}
                      className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#F3F4F6] text-[var(--color-brand-midnight)] hover:bg-[var(--color-brand-primary)]/10 hover:text-[var(--color-brand-primary)] transition-colors"
                    >
                      Contributions
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete patient?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{" "}
              <span className="font-semibold text-[var(--color-brand-midnight)]">
                {patientToDelete?.name}
              </span>{" "}
              and all their biomarker records and symptom logs. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
            >
              Delete patient
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
