"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  FlaskConical,
  Plus,
  TrendingUp,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCdss } from "@/lib/cdss-store";
import { BIOMARKER_META, type BiomarkerType } from "@/lib/types/cdss";

export default function TrendsPage() {
  const searchParams = useSearchParams();
  const patientIdParam = searchParams.get("patient");
  const {
    patients,
    currentPatient,
    setCurrentPatientId,
    getPatientBiomarkers,
    addBiomarker,
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

  // Only show these markers on the trends page
  const TREND_MARKERS: BiomarkerType[] = ["ca125", "crp", "esr", "tnf_alpha", "il6", "promarker_endo", "arelis_endo"];

  const availableMarkers = useMemo(() => {
    const withData = new Set(patientBiomarkers.map((b) => b.marker));
    return TREND_MARKERS.filter((m) => withData.has(m));
  }, [patientBiomarkers]);

  const [selectedMarker, setSelectedMarker] = useState<BiomarkerType | null>(null);
  const activeMarker = selectedMarker ?? availableMarkers[0] ?? null;

  // Add new test form state
  const [newTestMarker, setNewTestMarker] = useState<BiomarkerType>("ca125");
  const [newTestValue, setNewTestValue] = useState("");
  const [newTestDate, setNewTestDate] = useState(new Date().toISOString().split("T")[0]);

  function handleAddTest() {
    if (!activePatient || !newTestValue) return;
    const value = parseFloat(newTestValue);
    if (isNaN(value)) return;
    addBiomarker(activePatient.id, newTestMarker, value, newTestDate);
    setNewTestValue("");
    setSelectedMarker(newTestMarker);
  }

  // Chart data for selected marker
  const chartData = useMemo(() => {
    if (!activeMarker) return [];
    return patientBiomarkers
      .filter((b) => b.marker === activeMarker)
      .sort((a, b) => a.date_collected.localeCompare(b.date_collected))
      .map((b) => ({
        date: new Date(b.date_collected).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        }),
        value: b.value,
        flag: b.flag,
      }));
  }, [patientBiomarkers, activeMarker]);

  const meta = activeMarker ? BIOMARKER_META[activeMarker] : null;

  // Stats for selected marker
  const markerStats = useMemo(() => {
    if (!chartData.length) return null;
    const values = chartData.map((d) => d.value);
    const latest = values[values.length - 1];
    const first = values[0];
    const trend = values.length >= 2 ? latest - first : 0;
    return {
      latest,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
      trend,
    };
  }, [chartData]);

  if (!activePatient) {
    return (
      <div className="max-w-3xl mx-auto px-6 lg:px-8 py-16 text-center">
        <TrendingUp className="h-12 w-12 text-[var(--color-brand-muted)]/40 mx-auto mb-4" />
        <h1 className="heading-display text-display-xs text-[var(--color-brand-midnight)] mb-2">
          No Patient Selected
        </h1>
        <p className="text-sm text-[var(--color-brand-muted)] mb-6">
          Select a patient to view longitudinal biomarker trends.
        </p>
        <Link href="/cdss">
          <Button className="rounded bg-[var(--color-brand-primary)] text-white font-semibold h-10 px-6 hover:bg-[var(--color-brand-primary-hover)]">
            Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="px-6 lg:px-8 py-6 lg:py-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <TrendingUp className="h-5 w-5 text-[var(--color-brand-blue)]" />
          <p className="text-xs font-semibold tracking-wide uppercase text-[var(--color-brand-muted)]">
            Longitudinal Trends
          </p>
        </div>
        <h1 className="heading-display text-display-xs sm:text-display-sm text-[var(--color-brand-midnight)]">
          {activePatient.name} — Biomarker Trends
        </h1>
        <p className="text-sm text-[var(--color-brand-muted)]">
          Track how lab values change over time. Reference ranges shown as shaded bands.
        </p>
      </div>

      {/* Add New Test */}
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
              <Label className="text-xs font-semibold text-[var(--color-brand-muted)]">
                Test
              </Label>
              <select
                value={newTestMarker}
                onChange={(e) => setNewTestMarker(e.target.value as BiomarkerType)}
                className="mt-1 w-full rounded-md border border-input bg-background p-3 text-sm"
              >
                {TREND_MARKERS.map((m) => (
                  <option key={m} value={m}>
                    {BIOMARKER_META[m].label} ({BIOMARKER_META[m].unit})
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full sm:w-32">
              <Label className="text-xs font-semibold text-[var(--color-brand-muted)]">
                Value ({BIOMARKER_META[newTestMarker].unit})
              </Label>
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
              <Label className="text-xs font-semibold text-[var(--color-brand-muted)]">
                Date Collected
              </Label>
              <Input
                type="date"
                value={newTestDate}
                onChange={(e) => setNewTestDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button
              onClick={handleAddTest}
              disabled={!newTestValue || !activePatient}
              className="h-9 rounded bg-[var(--color-brand-primary)] text-white font-semibold px-5 hover:bg-[var(--color-brand-primary-hover)] shrink-0"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add
            </Button>
          </div>
          <p className="text-xs text-[var(--color-brand-muted)] mt-2">
            Ref: {BIOMARKER_META[newTestMarker].reference.low}–{BIOMARKER_META[newTestMarker].reference.high} {BIOMARKER_META[newTestMarker].unit}
          </p>
        </CardContent>
      </Card>

      {/* Marker selector */}
      {availableMarkers.length > 0 ? (
        <>
          <div className="flex flex-wrap gap-2">
            {availableMarkers.map((m) => {
              const markerMeta = BIOMARKER_META[m];
              const isActive = m === activeMarker;
              return (
                <button
                  key={m}
                  onClick={() => setSelectedMarker(m)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                    isActive
                      ? "bg-[var(--color-brand-blue)]/10 text-[var(--color-brand-blue)] border-[var(--color-brand-blue)]/30"
                      : "bg-white text-[var(--color-brand-muted)] border-[#E8E8E8] hover:border-[var(--color-brand-blue)]/30"
                  }`}
                >
                  {markerMeta.label}
                </button>
              );
            })}
          </div>

          {/* Stats row */}
          {markerStats && meta && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: "Latest", value: `${markerStats.latest} ${meta.unit}` },
                { label: "Min", value: `${markerStats.min} ${meta.unit}` },
                { label: "Max", value: `${markerStats.max} ${meta.unit}` },
                { label: "Data Points", value: String(markerStats.count) },
                {
                  label: "Trend",
                  value: `${markerStats.trend > 0 ? "+" : ""}${markerStats.trend.toFixed(1)}`,
                },
              ].map((stat) => (
                <Card key={stat.label} className="bg-white border-[#E8E8E8]">
                  <CardContent className="py-3 px-4 text-center">
                    <div className="font-mono text-lg font-bold text-[var(--color-brand-midnight)]">
                      {stat.value}
                    </div>
                    <p className="text-xs font-semibold text-[var(--color-brand-muted)] uppercase">
                      {stat.label}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Chart */}
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
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-brand-blue)" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="var(--color-brand-blue)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: "#6B8BAF" }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#6B8BAF" }}
                        tickLine={false}
                        domain={["auto", "auto"]}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "1px solid #D4DCE6",
                          fontSize: "12px",
                        }}
                        formatter={(value) => [`${value} ${meta.unit}`, meta.label]}
                      />
                      {/* Reference range lines */}
                      <ReferenceLine
                        y={meta.reference.high}
                        stroke="#F59E0B"
                        strokeDasharray="6 4"
                        label={{
                          value: `Upper (${meta.reference.high})`,
                          position: "right",
                          fontSize: 10,
                          fill: "#F59E0B",
                        }}
                      />
                      <ReferenceLine
                        y={meta.reference.low}
                        stroke="#6366F1"
                        strokeDasharray="6 4"
                        label={{
                          value: `Lower (${meta.reference.low})`,
                          position: "right",
                          fontSize: 10,
                          fill: "#6366F1",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="var(--color-brand-blue)"
                        strokeWidth={2}
                        fill="url(#valueGradient)"
                        dot={{
                          fill: "var(--color-brand-blue)",
                          strokeWidth: 2,
                          r: 4,
                        }}
                        activeDot={{
                          fill: "var(--color-brand-orange)",
                          strokeWidth: 0,
                          r: 6,
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Data table */}
          {chartData.length > 0 && (
            <Card className="bg-white border-[#E8E8E8]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-[var(--color-brand-midnight)]">
                  All {meta?.label} Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {chartData.map((d, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg bg-[var(--color-brand-smoke)] px-4 py-2.5"
                    >
                      <span className="text-sm text-[var(--color-brand-midnight)] font-medium">
                        {d.date}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-[var(--color-brand-midnight)]">
                          {d.value} {meta?.unit}
                        </span>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${
                            d.flag === "normal"
                              ? "bg-emerald-100 text-emerald-700"
                              : d.flag === "critical"
                                ? "bg-red-100 text-red-700"
                                : d.flag === "elevated"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {d.flag}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card className="bg-white border-[#E8E8E8]">
          <CardContent className="py-12 text-center">
            <FlaskConical className="h-10 w-10 text-[var(--color-brand-muted)]/40 mx-auto mb-3" />
            <p className="text-sm text-[var(--color-brand-muted)] mb-4">
              No biomarker data recorded yet. Enter lab values to start tracking trends.
            </p>
            <Link href={`/cdss/biomarkers?patient=${activePatient.id}`}>
              <Button
                variant="outline"
                className="rounded font-semibold text-[var(--color-brand-primary)] border-[var(--color-brand-primary)]/40"
              >
                Enter Biomarkers <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
