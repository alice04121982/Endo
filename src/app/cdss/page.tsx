"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
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

const RESEARCH_HIGHLIGHTS = [
  {
    id: 1,
    title: "Endometriosis: pathogenesis, diagnosis and treatment (ESHRE 2024 Guidelines)",
    journal: "Human Reproduction Open",
    year: "2024",
    tag: "Guidelines",
    summary:
      "Updated ESHRE recommendations covering laparoscopic diagnosis, hormonal suppression, and fertility-sparing management. Emphasises shared decision-making and multi-disciplinary team approach.",
    href: "https://academic.oup.com/hropen",
  },
  {
    id: 2,
    title: "Elagolix for moderate-to-severe endometriosis pain — phase III extension",
    journal: "New England Journal of Medicine",
    year: "2023",
    tag: "RCT",
    summary:
      "24-month follow-up confirms sustained reduction in dysmenorrhoea and non-menstrual pelvic pain with GnRH antagonist therapy. Bone density monitoring protocol updated.",
    href: "#",
  },
  {
    id: 3,
    title: "CA-125 and combined biomarker panels for non-invasive diagnosis",
    journal: "Fertility and Sterility",
    year: "2024",
    tag: "Diagnostics",
    summary:
      "Systematic review of 48 studies: combined CA-125 + IL-6 + NLR panel achieves 78% sensitivity and 82% specificity for endometriosis, outperforming CA-125 alone.",
    href: "#",
  },
  {
    id: 4,
    title: "Letrozole vs norethisterone acetate for deep infiltrating endometriosis",
    journal: "Cochrane Database",
    year: "2024",
    tag: "Meta-analysis",
    summary:
      "Aromatase inhibitors demonstrate superior pain relief at 6 months in DIE but with comparable recurrence rates. Consider as second-line after progestin failure.",
    href: "#",
  },
  {
    id: 5,
    title: "LUNA vs no LUNA in laparoscopic pelvic pain management — 10yr follow-up",
    journal: "BJOG",
    year: "2023",
    tag: "Surgical",
    summary:
      "Laparoscopic uterine nerve ablation shows no additional benefit over excision alone at 10 years. Excision of visible endometriosis remains the evidence-based surgical standard.",
    href: "#",
  },
];

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

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 items-start">
        {/* ── Left: patients ── */}
        <div className="space-y-6">
          {/* Alerts banner */}
          {alertPatients.length > 0 && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-800">
                <span className="font-semibold">{alertPatients.length} patient{alertPatients.length !== 1 ? "s" : ""}</span>{" "}
                {alertPatients.length === 1 ? "has" : "have"} active clinical alerts requiring review.{" "}
                {alertPatients.map((a) => (
                  <Link
                    key={a.patient.id}
                    href={`/cdss/biomarkers?patient=${a.patient.id}`}
                    className="font-semibold underline underline-offset-2 mr-1"
                    onClick={() => setCurrentPatientId(a.patient.id)}
                  >
                    {a.patient.name}
                  </Link>
                ))}
              </p>
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
                <Link href="/cdss/patients">
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
                            Age {patient.age} · {patient.symptom_duration_months}mo symptoms
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

        {/* ── Right: latest research ── */}
        <div>
          <Card className="bg-white border-[#E8E8E8]">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="font-display text-base font-bold text-[var(--color-brand-midnight)]">
                Latest Evidence
              </CardTitle>
              <Link
                href="/cdss/research"
                className="text-xs font-semibold text-[var(--color-brand-primary)] flex items-center gap-1 hover:text-[var(--color-brand-primary-hover)]"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-[#E8E8E8]">
                {RESEARCH_HIGHLIGHTS.slice(0, 4).map((paper) => (
                  <div key={paper.id} className="px-5 py-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-semibold text-[var(--color-brand-primary)] bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5">
                        {paper.tag}
                      </span>
                      <span className="text-xs text-[var(--color-brand-muted)]">{paper.year}</span>
                    </div>
                    <p className="text-sm font-semibold text-[var(--color-brand-midnight)] leading-snug mb-1">
                      {paper.title}
                    </p>
                    <p className="text-xs text-[var(--color-brand-muted)] italic mb-2">
                      {paper.journal}
                    </p>
                    <p className="text-xs text-[#4B5563] leading-relaxed line-clamp-2">
                      {paper.summary}
                    </p>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 border-t border-[#E8E8E8]">
                <Link
                  href="/cdss/research"
                  className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary-hover)] transition-colors"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  View all research & trials
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="mt-8 text-xs text-[var(--color-brand-muted)] text-center max-w-2xl mx-auto leading-relaxed">
        Clinical decision support tool — intended as an aid to clinical judgement, not a replacement.
        Risk scores are indicative. Based on NICE NG73: Endometriosis — Diagnosis and Management.
      </p>
    </div>
  );
}
