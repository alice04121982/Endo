"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Area,
  AreaChart,
  BarChart,
  Bar,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";
import { Calendar, TrendingUp, Droplets, Brain } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEntries } from "@/lib/entries-store";

export default function TimelinePage() {
  const { entries: MOCK_ENTRIES } = useEntries();

  const chartData = useMemo(() => {
    return MOCK_ENTRIES.map((entry) => ({
      date: new Date(entry.entry_date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      }),
      pain: entry.overall_vas,
      fatigue: entry.fatigue_vas ?? 0,
      endoBelly: entry.endo_belly_severity ?? 0,
      mood: entry.mood_score ?? 3,
      sleep: entry.sleep_quality ?? 3,
      phase: entry.cycle_phase,
    }));
  }, [MOCK_ENTRIES]);

  const phaseData = useMemo(() => {
    const phases: Record<string, { totalPain: number; count: number; label: string }> = {
      menstrual: { totalPain: 0, count: 0, label: "Menstrual" },
      follicular: { totalPain: 0, count: 0, label: "Follicular" },
      ovulatory: { totalPain: 0, count: 0, label: "Ovulatory" },
      luteal: { totalPain: 0, count: 0, label: "Luteal" },
    };
    MOCK_ENTRIES.forEach((e) => {
      if (phases[e.cycle_phase]) {
        phases[e.cycle_phase].totalPain += e.overall_vas;
        phases[e.cycle_phase].count += 1;
      }
    });
    return Object.entries(phases).map(([, val]) => ({
      phase: val.label,
      avgPain: val.count > 0 ? Math.round((val.totalPain / val.count) * 10) / 10 : 0,
    }));
  }, [MOCK_ENTRIES]);

  const triggerData = useMemo(() => {
    const triggers: Record<string, { total: number; count: number }> = {};
    MOCK_ENTRIES.forEach((e) => {
      e.lifestyle_triggers.forEach((t) => {
        const key = t.detail;
        if (!triggers[key]) triggers[key] = { total: 0, count: 0 };
        triggers[key].total += t.severity_impact;
        triggers[key].count += 1;
      });
    });
    return Object.entries(triggers)
      .map(([name, { total, count }]) => ({
        trigger: name,
        avgImpact: Math.round((total / count) * 10) / 10,
        count,
      }))
      .sort((a, b) => b.avgImpact - a.avgImpact);
  }, [MOCK_ENTRIES]);

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Your Timeline</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          See how your symptoms change over time and discover what helps.
        </p>
      </div>

      {/* Pain + Fatigue over time */}
      <Card className="card-soft border-0 rounded-3xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-endo-lavender" />
            Pain & Fatigue Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="painGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.65 0.18 300)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="oklch(0.65 0.18 300)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fatigueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.72 0.18 350)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="oklch(0.72 0.18 350)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.02 300)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="oklch(0.7 0.02 270)" />
                <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} stroke="oklch(0.7 0.02 270)" />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid oklch(0.9 0.02 300)",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                <Area type="monotone" dataKey="pain" name="Pain (VAS)" stroke="oklch(0.55 0.18 300)" fill="url(#painGrad)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="fatigue" name="Fatigue" stroke="oklch(0.72 0.18 350)" fill="url(#fatigueGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Endo belly + mood */}
        <Card className="card-soft border-0 rounded-3xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Droplets className="h-4 w-4 text-endo-pink" />
              Endo Belly & Mood
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.02 300)" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="oklch(0.7 0.02 270)" />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 9 }} stroke="oklch(0.7 0.02 270)" />
                  <RechartsTooltip contentStyle={{ backgroundColor: "white", border: "1px solid oklch(0.9 0.02 300)", borderRadius: "12px", fontSize: "11px" }} />
                  <Line type="monotone" dataKey="endoBelly" name="Endo Belly" stroke="oklch(0.75 0.14 30)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="mood" name="Mood" stroke="oklch(0.78 0.1 155)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pain by cycle phase */}
        <Card className="card-soft border-0 rounded-3xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-endo-sage" />
              Average Pain by Cycle Phase
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={phaseData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.02 300)" />
                  <XAxis dataKey="phase" tick={{ fontSize: 10 }} stroke="oklch(0.7 0.02 270)" />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} stroke="oklch(0.7 0.02 270)" />
                  <RechartsTooltip contentStyle={{ backgroundColor: "white", border: "1px solid oklch(0.9 0.02 300)", borderRadius: "12px", fontSize: "11px" }} />
                  <Bar dataKey="avgPain" name="Avg Pain" fill="oklch(0.65 0.18 300)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lifestyle trigger impact */}
      <Card className="card-soft border-0 rounded-3xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Brain className="h-4 w-4 text-endo-lavender" />
            Lifestyle Trigger Impact
          </CardTitle>
        </CardHeader>
        <CardContent>
          {triggerData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No lifestyle triggers logged yet
            </p>
          ) : (
            <div className="space-y-3">
              {triggerData.map((t) => (
                <div key={t.trigger} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-40 truncate">{t.trigger}</span>
                  <div className="flex-1 h-3 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(Math.abs(t.avgImpact) * 20, 100)}%`,
                        backgroundColor: t.avgImpact > 0
                          ? "oklch(0.72 0.18 350)"
                          : "oklch(0.78 0.1 155)",
                      }}
                    />
                  </div>
                  <Badge
                    variant="secondary"
                    className={`text-[10px] min-w-[60px] justify-center ${
                      t.avgImpact > 0 ? "text-endo-pink" : "text-endo-sage"
                    }`}
                  >
                    {t.avgImpact > 0 ? `+${t.avgImpact} worse` : `${t.avgImpact} better`}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">{t.count}x</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
