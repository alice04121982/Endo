"use client";

import { useMemo } from "react";
import {
  Brain,
  FlaskConical,
  MapPin,
  ExternalLink,
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Your Insights</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Personalized analysis of your symptoms and new treatments being studied
          that might help you.
        </p>
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
                            background: "linear-gradient(90deg, oklch(0.65 0.18 300), oklch(0.72 0.18 350))",
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
