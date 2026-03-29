"use client";

import { useMemo } from "react";
import {
  FileText,
  Download,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Printer,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MOCK_ENTRIES, getMockStats } from "@/lib/mock/data";

export default function ReportPage() {
  const stats = useMemo(() => getMockStats(), []);

  const redFlagEntries = useMemo(
    () => MOCK_ENTRIES.filter((e) => e.red_flags_detected.length > 0),
    []
  );

  const allRedFlags = useMemo(
    () => [...new Set(MOCK_ENTRIES.flatMap((e) => e.red_flags_detected))],
    []
  );

  const topCorrelations = useMemo(() => {
    const latest = MOCK_ENTRIES[MOCK_ENTRIES.length - 1];
    return latest?.research_correlations.slice(0, 4) ?? [];
  }, []);

  const peakPainEntries = useMemo(
    () =>
      MOCK_ENTRIES.filter((e) => e.overall_vas >= 7).map((e) => ({
        date: e.entry_date,
        vas: e.overall_vas,
        phase: e.cycle_phase,
        zones: e.pain_zones.map(
          (z) => `${z.zone.replace(/_/g, " ")} (${z.quality}, VAS ${z.intensity})`
        ),
      })),
    []
  );

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your Doctor Report</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A clear summary to help your doctor understand what you&apos;re experiencing.
          </p>
        </div>
        <Button
          onClick={() => window.print()}
          className="bg-primary text-primary-foreground"
        >
          <Printer className="mr-2 h-4 w-4" />
          Print / Save PDF
        </Button>
      </div>

      {/* Report preview */}
      <div className="bg-white rounded-3xl border border-border p-8 card-lifted space-y-8 print:shadow-none print:border-0">
        {/* Report header */}
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold">My Endometriosis Symptom Report</h2>
          <p className="text-sm text-muted-foreground">
            Generated {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            {" "}&middot; {stats.totalEntries} entries over 30 days
          </p>
        </div>

        <Separator />

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{stats.avgVas7d}</div>
            <div className="text-[10px] text-muted-foreground uppercase">Avg Pain (7d)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.totalEntries}</div>
            <div className="text-[10px] text-muted-foreground uppercase">Total Entries</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-destructive">{allRedFlags.length}</div>
            <div className="text-[10px] text-muted-foreground uppercase">Red Flags</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{peakPainEntries.length}</div>
            <div className="text-[10px] text-muted-foreground uppercase">High Pain Days</div>
          </div>
        </div>

        <Separator />

        {/* Red flags section */}
        {allRedFlags.length > 0 && (
          <Card className="border-destructive/20 bg-red-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                Red Flag Markers — Deep Infiltrating Endometriosis Indicators
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">
                The following patterns were detected across {redFlagEntries.length} entries
                and may warrant further investigation including laparoscopy:
              </p>
              <div className="flex flex-wrap gap-2">
                {allRedFlags.map((flag) => (
                  <Badge key={flag} variant="secondary" className="text-xs bg-red-100 text-red-700 border-red-200">
                    {flag.replace(/_/g, " ")}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Peak pain episodes */}
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-endo-pink" />
            High Pain Episodes (VAS &ge; 7)
          </h3>
          <div className="space-y-2">
            {peakPainEntries.map((entry) => (
              <div
                key={entry.date}
                className="rounded-lg bg-secondary/30 px-4 py-3 flex items-start justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{entry.date}</span>
                    <Badge variant="secondary" className="text-[10px] capitalize">
                      {entry.phase}
                    </Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {entry.zones.map((z) => (
                      <span key={z} className="text-[10px] text-muted-foreground">
                        {z}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="text-lg font-bold text-destructive">{entry.vas}/10</span>
              </div>
            ))}
          </div>
        </div>

        {/* Research correlations */}
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-endo-lavender" />
            Active Research Pathway Correlations
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {topCorrelations.map((corr) => (
              <div key={corr.marker_category} className="rounded-lg bg-secondary/30 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold capitalize">
                    {corr.marker_category.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs font-bold text-primary">
                    {Math.round(corr.confidence * 100)}%
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">
                  {corr.explanation}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <div className="pt-4 border-t text-center">
          <p className="text-[10px] text-muted-foreground">
            This report is generated by Endo, an evidence-based symptom tracking tool.
            It is not a diagnosis. Patterns are identified using published clinical research.
            Please discuss these findings with your healthcare provider.
          </p>
        </div>
      </div>
    </div>
  );
}
