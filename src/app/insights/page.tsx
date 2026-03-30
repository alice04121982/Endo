"use client";

import { useMemo } from "react";
import Image from "next/image";
import {
  Brain,
  FlaskConical,
  MapPin,
  Sparkles,
  ChevronRight,
  Pill,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MOCK_ENTRIES, MOCK_TRIALS } from "@/lib/mock/data";
import { getNonHormonalPathways } from "@/lib/engine/research-mapper";

export default function InsightsPage() {
  const latestEntry = MOCK_ENTRIES[MOCK_ENTRIES.length - 1];
  const correlations = latestEntry?.research_correlations ?? [];
  const redFlags = latestEntry?.red_flags_detected ?? [];
  const pathways = useMemo(() => getNonHormonalPathways(correlations), [correlations]);

  const matchedTrials = useMemo(() => {
    const activePathways = correlations
      .filter((c) => c.confidence >= 0.2)
      .map((c) => c.marker_category);
    return MOCK_TRIALS.filter((t) =>
      activePathways.includes(t.target_pathway)
    );
  }, [correlations]);

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header with lifestyle image */}
      <div className="rounded-[24px] overflow-hidden relative">
        <div className="relative h-48 lg:h-64">
          <Image
            src="https://images.unsplash.com/photo-1521566652839-697aa473761a?w=1200&q=80&auto=format&fit=crop"
            alt="Woman reviewing health insights"
            fill
            className="object-cover object-top"
            sizes="(min-width: 1024px) 80vw, 100vw"
            priority
          />
          <div className="absolute inset-0 bg-[var(--color-brand-midnight)]/60" />
          <div className="absolute inset-0 flex flex-col justify-end p-6 lg:p-8">
            <h1 className="text-2xl font-bold tracking-tight text-white">Your Endo Insights</h1>
            <p className="mt-1 text-sm text-white/70 max-w-md">
              Your symptoms mapped to endometriosis research — from inflammatory pathways to non-hormonal treatments being studied right now.
            </p>
          </div>
        </div>
      </div>

      {/* Top correlations */}
      <Card className="card-soft border-0 gradient-card-lavender rounded-3xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Brain className="h-4 w-4 text-endo-lavender" />
            Your Pathway Correlations
            <Badge variant="secondary" className="text-[10px]">
              Based on latest entry
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {correlations.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              Log symptoms to see your personalized pathway analysis.
            </p>
          ) : (
            <div className="space-y-3">
              {correlations.slice(0, 5).map((corr) => (
                <div key={corr.marker_category} className="rounded-xl bg-white/60 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold capitalize">
                      {corr.marker_category.replace(/_/g, " ")}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 rounded-full bg-white overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${corr.confidence * 100}%`,
                            background: "var(--color-brand-lavender)",
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-primary">
                        {Math.round(corr.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {corr.explanation}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Red flags */}
      {redFlags.length > 0 && (
        <Card className="card-soft border-0 gradient-card-coral rounded-3xl">
          <CardContent className="pt-5">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-endo-coral shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">
                  Deep Infiltrating Endometriosis Indicators
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your symptom pattern includes markers that may indicate DIE.
                  Share this with your provider to discuss laparoscopy.
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {redFlags.map((flag) => (
                    <Badge key={flag} variant="secondary" className="text-[10px]">
                      {flag.replace(/_/g, " ")}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Non-hormonal pathways */}
      {pathways.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Pill className="h-5 w-5 text-endo-sage" />
            Non-Hormonal Treatment Pathways
          </h2>
          <div className="grid gap-3">
            {pathways.map((p) => (
              <Card key={p.pathway} className="card-soft border-0 rounded-3xl">
                <CardContent className="pt-5">
                  <div className="flex items-center gap-2 mb-3">
                    <ChevronRight className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold capitalize">{p.pathway}</span>
                    <Badge variant="secondary" className="text-[9px]">{p.evidence}</Badge>
                  </div>
                  <ul className="space-y-1.5 ml-6">
                    {p.treatments.map((t, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                        <span className="text-endo-lavender mt-0.5">&#8226;</span>
                        {t}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* How your symptoms connect — illustrated */}
      <div className="rounded-[24px] bg-[var(--color-brand-midnight)] p-6 lg:p-8 card-soft overflow-hidden">
        <div className="lg:grid lg:grid-cols-2 lg:gap-10 lg:items-center">
          <div>
            <p className="text-xs font-semibold tracking-wide uppercase text-[var(--color-brand-blue-light)] mb-2">
              How it works
            </p>
            <h2 className="font-display text-xl font-bold text-white mb-3">
              Your symptoms, mapped to biology
            </h2>
            <p className="text-sm text-white/70 leading-relaxed">
              Each symptom you log is matched against known inflammatory and neurological pathways. The diagram shows the three core systems most commonly disrupted in endometriosis — and where your pattern sits.
            </p>
            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              {[
                { label: "Inflammatory", color: "#FBBFEC", desc: "Cytokine signals" },
                { label: "Neurological", color: "#4791FF", desc: "Nerve sensitisation" },
                { label: "Hormonal", color: "#FFB299", desc: "Estrogen cycling" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl bg-white/10 p-3">
                  <div className="w-3 h-3 rounded-full mx-auto mb-2" style={{ background: item.color }} />
                  <p className="text-[11px] font-bold text-white">{item.label}</p>
                  <p className="text-[10px] text-white/50 mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-8 lg:mt-0 flex items-center justify-center">
            <svg viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-xs">
              {/* Central node — endometriosis lesion */}
              <circle cx="140" cy="140" r="36" fill="#1a4d7a" stroke="#4791FF" strokeWidth="1.5"/>
              <circle cx="140" cy="140" r="22" fill="#0E3D68" stroke="#4791FF" strokeWidth="1"/>
              <text x="140" y="136" textAnchor="middle" fill="#FBBFEC" fontSize="8" fontWeight="600">Endo</text>
              <text x="140" y="147" textAnchor="middle" fill="#FBBFEC" fontSize="8" fontWeight="600">Lesion</text>

              {/* Inflammatory pathway — top left */}
              <line x1="114" y1="114" x2="68" y2="68" stroke="#FBBFEC" strokeWidth="1.5" strokeDasharray="5 3"/>
              <circle cx="52" cy="52" r="28" fill="#1a4d7a" stroke="#FBBFEC" strokeWidth="1.5"/>
              <text x="52" y="48" textAnchor="middle" fill="white" fontSize="7" fontWeight="600">Inflam-</text>
              <text x="52" y="58" textAnchor="middle" fill="white" fontSize="7" fontWeight="600">matory</text>
              {/* Inflammatory sub-nodes */}
              <circle cx="20" cy="28" r="12" fill="#FBBFEC" opacity="0.3" stroke="#FBBFEC" strokeWidth="1"/>
              <text x="20" y="31" textAnchor="middle" fill="white" fontSize="6">IL-6</text>
              <circle cx="18" cy="52" r="12" fill="#FBBFEC" opacity="0.3" stroke="#FBBFEC" strokeWidth="1"/>
              <text x="18" y="55" textAnchor="middle" fill="white" fontSize="6">TNF-α</text>

              {/* Neurological pathway — top right */}
              <line x1="166" y1="114" x2="212" y2="68" stroke="#4791FF" strokeWidth="1.5" strokeDasharray="5 3"/>
              <circle cx="228" cy="52" r="28" fill="#1a4d7a" stroke="#4791FF" strokeWidth="1.5"/>
              <text x="228" y="48" textAnchor="middle" fill="white" fontSize="7" fontWeight="600">Neuro-</text>
              <text x="228" y="58" textAnchor="middle" fill="white" fontSize="7" fontWeight="600">logical</text>
              {/* Neurological sub-nodes */}
              <circle cx="260" cy="28" r="12" fill="#4791FF" opacity="0.3" stroke="#4791FF" strokeWidth="1"/>
              <text x="260" y="31" textAnchor="middle" fill="white" fontSize="6">NGF</text>
              <circle cx="262" cy="52" r="12" fill="#4791FF" opacity="0.3" stroke="#4791FF" strokeWidth="1"/>
              <text x="262" y="55" textAnchor="middle" fill="white" fontSize="6">CGRP</text>

              {/* Hormonal pathway — bottom */}
              <line x1="140" y1="176" x2="140" y2="216" stroke="#FFB299" strokeWidth="1.5" strokeDasharray="5 3"/>
              <circle cx="140" cy="236" r="28" fill="#1a4d7a" stroke="#FFB299" strokeWidth="1.5"/>
              <text x="140" y="232" textAnchor="middle" fill="white" fontSize="7" fontWeight="600">Hormonal</text>
              <text x="140" y="242" textAnchor="middle" fill="white" fontSize="7" fontWeight="600">Axis</text>
              {/* Hormonal sub-nodes */}
              <circle cx="108" cy="262" r="12" fill="#FFB299" opacity="0.3" stroke="#FFB299" strokeWidth="1"/>
              <text x="108" y="265" textAnchor="middle" fill="white" fontSize="6">E2</text>
              <circle cx="172" cy="262" r="12" fill="#FFB299" opacity="0.3" stroke="#FFB299" strokeWidth="1"/>
              <text x="172" y="265" textAnchor="middle" fill="white" fontSize="6">PGE2</text>

              {/* Symptom nodes — scattered */}
              <circle cx="80" cy="164" r="16" fill="#0E3D68" stroke="#FBBFEC" strokeWidth="1" opacity="0.9"/>
              <text x="80" y="161" textAnchor="middle" fill="#FBBFEC" fontSize="6">Pelvic</text>
              <text x="80" y="170" textAnchor="middle" fill="#FBBFEC" fontSize="6">Pain</text>

              <circle cx="200" cy="164" r="16" fill="#0E3D68" stroke="#4791FF" strokeWidth="1" opacity="0.9"/>
              <text x="200" y="161" textAnchor="middle" fill="#A3C4FF" fontSize="6">Fatigue</text>
              <text x="200" y="170" textAnchor="middle" fill="#A3C4FF" fontSize="6">&amp; Fog</text>

              <circle cx="88" cy="210" r="14" fill="#0E3D68" stroke="#FFB299" strokeWidth="1" opacity="0.8"/>
              <text x="88" y="213" textAnchor="middle" fill="#FFB299" fontSize="6">Bloat</text>

              <circle cx="192" cy="210" r="14" fill="#0E3D68" stroke="#FFB299" strokeWidth="1" opacity="0.8"/>
              <text x="192" y="213" textAnchor="middle" fill="#FFB299" fontSize="6">Cramps</text>
            </svg>
          </div>
        </div>
      </div>

      <Separator />

      {/* Clinical Trial Matcher */}
      <div>
        <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-endo-pink" />
          Clinical Trial Matches
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Non-hormonal trials matched to your active pathways. {matchedTrials.length} trial{matchedTrials.length !== 1 ? "s" : ""} found.
        </p>
        <div className="grid gap-3">
          {matchedTrials.map((trial) => (
            <Card key={trial.nct_id} className="card-soft border-0 rounded-3xl">
              <CardContent className="pt-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="secondary"
                        className={`text-[10px] ${
                          trial.status === "recruiting"
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {trial.status}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {trial.phase}
                      </Badge>
                      {trial.is_non_hormonal && (
                        <Badge variant="secondary" className="text-[10px] bg-endo-lilac text-endo-deep">
                          Non-hormonal
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold leading-snug">{trial.title}</h3>
                    <p className="text-xs text-muted-foreground">{trial.eligibility_summary}</p>
                    <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {trial.location_countries.join(", ")}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      <span className="font-medium">Primary outcome:</span> {trial.primary_outcome}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                    {trial.nct_id}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
