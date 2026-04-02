"use client";

import { useRef, useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, Link2, Upload, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCdss } from "@/lib/cdss-store";

// ── App definitions ───────────────────────────────────────────────────────────

interface AppDef {
  id: string;
  name: string;
  tagline: string;
  color: string; // bg colour class
  textColor: string;
  exportInstructions: string[];
  canImport: boolean;
  comingSoon?: boolean;
}

const APPS: AppDef[] = [
  {
    id: "clue",
    name: "Clue",
    tagline: "Period & cycle tracker",
    color: "bg-[#E8416C]",
    textColor: "text-[#E8416C]",
    canImport: true,
    exportInstructions: [
      "Open Clue on your phone",
      "Go to Profile → Settings → Data Export",
      "Tap 'Request data export' and wait for the email",
      "Download the ZIP, unzip it, and upload the .csv file below",
    ],
  },
  {
    id: "flo",
    name: "Flo",
    tagline: "Period & ovulation tracker",
    color: "bg-[#7C4DFF]",
    textColor: "text-[#7C4DFF]",
    canImport: false,
    comingSoon: true,
    exportInstructions: [
      "Open Flo on your phone",
      "Go to Profile → Settings → Privacy → Export data",
    ],
  },
  {
    id: "natural-cycles",
    name: "Natural Cycles",
    tagline: "Birth control & fertility app",
    color: "bg-[#2D9D78]",
    textColor: "text-[#2D9D78]",
    canImport: false,
    comingSoon: true,
    exportInstructions: [
      "Log in at naturalcycles.com",
      "Go to Settings → Data → Export data",
    ],
  },
  {
    id: "apple-health",
    name: "Apple Health",
    tagline: "Health data on iPhone",
    color: "bg-[#FF3B30]",
    textColor: "text-[#FF3B30]",
    canImport: false,
    comingSoon: true,
    exportInstructions: [
      "Apple Health import coming in a future update",
    ],
  },
];

// ── Clue CSV parser ───────────────────────────────────────────────────────────

interface ClueCycleEntry {
  date: string; // ISO date string YYYY-MM-DD
  cycleDay: number;
  period: "light" | "medium" | "heavy" | "spotting" | null;
  pain: boolean;
  mood: string | null;
}

function parseClueCsv(text: string): ClueCycleEntry[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  // Parse header — Clue uses comma-separated with quoted fields
  const header = lines[0].toLowerCase().split(",").map(h => h.trim().replace(/^"|"$/g, ""));

  const dateIdx = header.findIndex(h => h === "date");
  const cycleDayIdx = header.findIndex(h => h.includes("cycle day") || h === "cycle_day");
  const periodIdx = header.findIndex(h => h === "period");
  const painIdx = header.findIndex(h => h.includes("pain"));
  const moodIdx = header.findIndex(h => h === "mood");

  if (dateIdx === -1) return [];

  const entries: ClueCycleEntry[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map(c => c.trim().replace(/^"|"$/g, ""));
    const date = cols[dateIdx];
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;

    const cycleDay = cycleDayIdx >= 0 ? parseInt(cols[cycleDayIdx]) || 0 : 0;
    const periodRaw = periodIdx >= 0 ? cols[periodIdx].toLowerCase() : "";
    const period = (["light", "medium", "heavy", "spotting"].includes(periodRaw)
      ? periodRaw
      : null) as ClueCycleEntry["period"];
    const pain = painIdx >= 0 ? !!cols[painIdx] && cols[painIdx] !== "0" : false;
    const mood = moodIdx >= 0 && cols[moodIdx] ? cols[moodIdx] : null;

    entries.push({ date, cycleDay, period, pain, mood });
  }

  return entries;
}

// Calculate average cycle length from cycle-start dates
function calcCycleStats(entries: ClueCycleEntry[]): { avgLength: number | null; regularity: "regular" | "irregular" | null } {
  const cyclestarts = entries
    .filter(e => e.cycleDay === 1 && e.period !== null)
    .map(e => new Date(e.date).getTime())
    .sort((a, b) => a - b);

  if (cyclestarts.length < 2) return { avgLength: null, regularity: null };

  const gaps: number[] = [];
  for (let i = 1; i < cyclestarts.length; i++) {
    gaps.push(Math.round((cyclestarts[i] - cyclestarts[i - 1]) / (1000 * 60 * 60 * 24)));
  }

  const avg = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
  const min = Math.min(...gaps);
  const max = Math.max(...gaps);
  // Regular = all cycles within ±7 days of mean and within 21–35 day range
  const regularity = (max - min <= 7 && avg >= 21 && avg <= 35) ? "regular" : "irregular";

  return { avgLength: avg, regularity };
}

// ── App card ──────────────────────────────────────────────────────────────────

function AppCard({
  app,
  patientId,
  onImported,
}: {
  app: AppDef;
  patientId: string;
  onImported: (count: number) => void;
}) {
  const { addSymptomLog, updatePatient } = useCdss();
  const [expanded, setExpanded] = useState(false);
  const [importState, setImportState] = useState<"idle" | "parsing" | "preview" | "done" | "error">("idle");
  const [preview, setPreview] = useState<ClueCycleEntry[]>([]);
  const [cycleStats, setCycleStats] = useState<{ avgLength: number | null; regularity: "regular" | "irregular" | null }>({ avgLength: null, regularity: null });
  const [errorMsg, setErrorMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportState("parsing");
    setErrorMsg("");

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const entries = parseClueCsv(text);
      if (entries.length === 0) {
        setErrorMsg("Couldn't read this file. Make sure you're uploading the Clue CSV export.");
        setImportState("error");
        return;
      }
      const stats = calcCycleStats(entries);
      setPreview(entries);
      setCycleStats(stats);
      setImportState("preview");
    };
    reader.readAsText(file);
  }

  function confirmImport() {
    // Add symptom logs for period days
    const periodEntries = preview.filter(e => e.period !== null);
    for (const entry of periodEntries) {
      addSymptomLog(patientId, {
        pain_score: entry.pain ? 6 : 0,
        fatigue_score: 0,
        mood_score: 5,
        period_pain_score: entry.pain ? 6 : null,
        period_duration_hours: null,
        bleeding_heaviness: entry.period === "spotting" ? "light" :
          entry.period === "light" ? "light" :
          entry.period === "medium" ? "moderate" : "heavy",
        cycle_phase: "menstrual",
        symptoms: {
          pelvic_pain: entry.pain,
          bloating: false,
          nausea: false,
          painful_periods: entry.pain,
          painful_intercourse: false,
          bowel_symptoms: false,
          bladder_symptoms: false,
        },
        notes: `Imported from Clue — cycle day ${entry.cycleDay}`,
        transcript: null,
        logged_at: new Date(entry.date).toISOString(),
      });
    }

    // Update clinical record with cycle stats
    if (cycleStats.avgLength || cycleStats.regularity) {
      const updates: Record<string, unknown> = {};
      if (cycleStats.avgLength) updates.cycle_length_days = cycleStats.avgLength;
      if (cycleStats.regularity) updates.cycle_regularity = cycleStats.regularity;
      updatePatient(patientId, updates);
    }

    setImportState("done");
    onImported(periodEntries.length);
  }

  const periodDays = preview.filter(e => e.period !== null).length;
  const cycleStarts = preview.filter(e => e.cycleDay === 1 && e.period !== null).length;

  return (
    <div className="rounded-xl border border-[#E8E8E8] bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F8F9FA] transition-colors text-left"
      >
        <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", app.color)}>
          <span className="text-white text-xs font-bold">{app.name[0]}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#111827]">{app.name}</p>
          <p className="text-xs text-[#6B7280]">{app.tagline}</p>
        </div>
        {app.comingSoon ? (
          <span className="text-xs font-semibold text-[#9CA3AF] bg-[#F3F4F6] px-2 py-0.5 rounded-full shrink-0">
            Coming soon
          </span>
        ) : importState === "done" ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
        ) : (
          <div className="flex items-center gap-1 shrink-0">
            <span className={cn("text-xs font-semibold", app.textColor)}>Connect</span>
            {expanded ? <ChevronUp className="h-3.5 w-3.5 text-[#6B7280]" /> : <ChevronDown className="h-3.5 w-3.5 text-[#6B7280]" />}
          </div>
        )}
      </button>

      {expanded && !app.comingSoon && (
        <div className="px-4 pb-4 border-t border-[#F3F4F6] pt-3 space-y-3">
          {importState !== "done" && (
            <>
              <p className="text-xs font-semibold text-[#374151] uppercase tracking-wide">How to export from {app.name}</p>
              <ol className="space-y-1.5">
                {app.exportInstructions.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[#6B7280]">
                    <span className={cn("h-4 w-4 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5", app.color)}>
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </>
          )}

          {importState === "idle" && (
            <>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
                className="gap-2 border-[#E8E8E8] text-sm"
              >
                <Upload className="h-3.5 w-3.5" />
                Upload CSV export
              </Button>
            </>
          )}

          {importState === "parsing" && (
            <div className="flex items-center gap-2 text-xs text-[#6B7280]">
              <span className="h-3.5 w-3.5 rounded-full border-2 border-[#9CA3AF] border-t-transparent animate-spin" />
              Reading file…
            </div>
          )}

          {importState === "error" && (
            <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-700 flex items-start gap-2">
              <X className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              {errorMsg}
              <button type="button" onClick={() => { setImportState("idle"); if (fileRef.current) fileRef.current.value = ""; }}
                className="ml-auto underline shrink-0">Try again</button>
            </div>
          )}

          {importState === "preview" && (
            <div className="space-y-3">
              <div className="rounded-lg bg-[#F8F9FA] border border-[#E8E8E8] px-3 py-2.5 space-y-1">
                <p className="text-xs font-semibold text-[#374151]">Ready to import</p>
                <p className="text-xs text-[#6B7280]">{periodDays} period day logs across {cycleStarts} cycles</p>
                {cycleStats.avgLength && (
                  <p className="text-xs text-[#6B7280]">
                    Average cycle length: <strong className="text-[#374151]">{cycleStats.avgLength} days</strong>
                    {" "}({cycleStats.regularity})
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" size="sm" onClick={confirmImport}
                  className="gap-1.5 bg-[var(--color-brand-primary)] text-white hover:bg-[var(--color-brand-primary-hover)] text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Import data
                </Button>
                <button type="button" onClick={() => { setImportState("idle"); setPreview([]); if (fileRef.current) fileRef.current.value = ""; }}
                  className="text-xs text-[#6B7280] hover:text-[#374151]">Cancel</button>
              </div>
            </div>
          )}

          {importState === "done" && (
            <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              {periodDays} entries imported — your clinical team can now see your cycle history.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function ConnectedApps({ patientId }: { patientId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [totalImported, setTotalImported] = useState(0);

  return (
    <Card className="bg-white border-[#E8E8E8]">
      <CardHeader className="pb-0">
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="flex items-center justify-between w-full text-left"
        >
          <CardTitle className="font-display text-base font-bold text-[var(--color-brand-midnight)] flex items-center gap-2">
            <Link2 className="h-4 w-4 text-[var(--color-brand-primary)]" />
            Connect your period tracker
            {totalImported > 0 && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                {totalImported} entries imported
              </span>
            )}
          </CardTitle>
          {expanded
            ? <ChevronUp className="h-4 w-4 text-[#6B7280]" />
            : <ChevronDown className="h-4 w-4 text-[#6B7280]" />}
        </button>
        <p className="text-xs text-[var(--color-brand-muted)] mt-1">
          Import your cycle history from Clue, Flo, or Natural Cycles so your clinical team has a complete picture.
        </p>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-4 space-y-2">
          {APPS.map(app => (
            <AppCard
              key={app.id}
              app={app}
              patientId={patientId}
              onImported={(count) => setTotalImported(v => v + count)}
            />
          ))}
          <p className="text-xs text-[var(--color-brand-muted)] pt-1 leading-relaxed">
            Data is imported to your local record only. Your clinical team sees the imported history alongside your symptom logs.
          </p>
        </CardContent>
      )}
    </Card>
  );
}
