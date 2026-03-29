"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { format } from "date-fns";
import {
  Activity,
  Brain,
  ChevronRight,
  Droplets,
  Heart,
  Moon,
  Pill,
  Utensils,
  AlertTriangle,
  FlaskConical,
  Save,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PainBodyMap } from "./pain-body-map";
import {
  analyzeSymptomProfile,
  detectRedFlags,
  getNonHormonalPathways,
} from "@/lib/engine/research-mapper";
import type {
  PainZoneEntry,
  CyclePhase,
  GutBladderSymptom,
  LifestyleTrigger,
  ResearchCorrelation,
  RedFlagMarker,
} from "@/lib/types/database";
import type { VoiceExtractedData } from "./voice-input";

const GUT_BLADDER_OPTIONS: { value: GutBladderSymptom; label: string }[] = [
  { value: "urinary_frequency", label: "Urinary Frequency" },
  { value: "urinary_urgency", label: "Urinary Urgency" },
  { value: "painful_urination", label: "Painful Urination" },
  { value: "constipation", label: "Constipation" },
  { value: "diarrhea", label: "Diarrhea" },
  { value: "painful_bowel", label: "Painful Bowel Movement" },
  { value: "bloating_endo_belly", label: "Endo Belly / Bloating" },
  { value: "incomplete_evacuation", label: "Incomplete Evacuation" },
  { value: "rectal_bleeding", label: "Rectal Bleeding" },
];

const LIFESTYLE_CATEGORIES = [
  { value: "diet" as const, label: "Diet", icon: Utensils },
  { value: "sleep" as const, label: "Sleep", icon: Moon },
  { value: "stress" as const, label: "Stress", icon: Brain },
  { value: "medication" as const, label: "Medication", icon: Pill },
];

interface SymptomLoggerProps {
  cycleMode?: "regular" | "cycle_agnostic";
  onSave?: (entry: SymptomFormData) => Promise<void>;
  voicePrefill?: VoiceExtractedData | null;
}

export interface SymptomFormData {
  entry_date: string;
  cycle_day: number | null;
  cycle_phase: CyclePhase;
  overall_vas: number;
  pain_zones: PainZoneEntry[];
  dyspareunia_vas: number | null;
  gut_bladder_symptoms: GutBladderSymptom[];
  endo_belly_severity: number | null;
  fatigue_vas: number | null;
  mood_score: number | null;
  sleep_quality: number | null;
  notes: string | null;
  lifestyle_triggers: LifestyleTrigger[];
  red_flags_detected: RedFlagMarker[];
  research_correlations: ResearchCorrelation[];
}

export function SymptomLogger({
  cycleMode = "regular",
  onSave,
  voicePrefill,
}: SymptomLoggerProps) {
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("pain");

  // Form state
  const [painZones, setPainZones] = useState<PainZoneEntry[]>([]);
  const [overallVas, setOverallVas] = useState(0);
  const [cyclePhase, setCyclePhase] = useState<CyclePhase>(
    cycleMode === "cycle_agnostic" ? "cycle_agnostic" : "menstrual"
  );
  const [cycleDay, setCycleDay] = useState<number | null>(null);
  const [dyspareuniaVas, setDyspareuniaVas] = useState<number | null>(null);
  const [trackDyspareunia, setTrackDyspareunia] = useState(false);
  const [gutBladderSymptoms, setGutBladderSymptoms] = useState<GutBladderSymptom[]>([]);
  const [endoBellySeverity, setEndoBellySeverity] = useState<number | null>(null);
  const [fatigueVas, setFatigueVas] = useState<number | null>(null);
  const [moodScore, setMoodScore] = useState<number | null>(null);
  const [sleepQuality, setSleepQuality] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [lifestyleTriggers, setLifestyleTriggers] = useState<LifestyleTrigger[]>([]);
  const triggerDetailRef = useRef<HTMLInputElement>(null);

  // Apply voice-extracted data when it arrives
  useEffect(() => {
    if (!voicePrefill) return;
    if (voicePrefill.overall_vas !== null && voicePrefill.overall_vas !== undefined)
      setOverallVas(voicePrefill.overall_vas);
    if (voicePrefill.fatigue_vas !== null && voicePrefill.fatigue_vas !== undefined)
      setFatigueVas(voicePrefill.fatigue_vas);
    if (voicePrefill.mood_score !== null && voicePrefill.mood_score !== undefined)
      setMoodScore(voicePrefill.mood_score);
    if (voicePrefill.sleep_quality !== null && voicePrefill.sleep_quality !== undefined)
      setSleepQuality(voicePrefill.sleep_quality);
    if (voicePrefill.endo_belly_severity !== null && voicePrefill.endo_belly_severity !== undefined)
      setEndoBellySeverity(voicePrefill.endo_belly_severity);
    if (voicePrefill.gut_bladder_symptoms?.length)
      setGutBladderSymptoms(voicePrefill.gut_bladder_symptoms as GutBladderSymptom[]);
    if (voicePrefill.cycle_phase)
      setCyclePhase(voicePrefill.cycle_phase as CyclePhase);
    if (voicePrefill.notes)
      setNotes(voicePrefill.notes);
    // Jump to the pain tab so user sees the filled values
    setActiveTab("pain");
  }, [voicePrefill]);

  // Computed analysis
  const analysisResult = useCallback(() => {
    const profile = {
      painZones,
      overallVas,
      dyspareuniaVas,
      gutBladderSymptoms,
      endoBellySeverity,
      fatigueVas,
      cyclePhase,
    };
    const correlations = analyzeSymptomProfile(profile);
    const redFlags = detectRedFlags(profile);
    const pathways = getNonHormonalPathways(correlations);
    return { correlations, redFlags, pathways };
  }, [
    painZones,
    overallVas,
    dyspareuniaVas,
    gutBladderSymptoms,
    endoBellySeverity,
    fatigueVas,
    cyclePhase,
  ]);

  const { correlations, redFlags, pathways } = analysisResult();

  function toggleGutBladder(symptom: GutBladderSymptom) {
    setGutBladderSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
    );
  }

  function addLifestyleTrigger(category: LifestyleTrigger["category"]) {
    const detail = triggerDetailRef.current?.value?.trim();
    if (!detail) return;
    setLifestyleTriggers((prev) => [
      ...prev,
      { category, detail, severity_impact: 0 },
    ]);
    if (triggerDetailRef.current) triggerDetailRef.current.value = "";
  }

  async function handleSave() {
    setSaving(true);
    try {
      const formData: SymptomFormData = {
        entry_date: format(new Date(), "yyyy-MM-dd"),
        cycle_day: cycleDay,
        cycle_phase: cyclePhase,
        overall_vas: overallVas,
        pain_zones: painZones,
        dyspareunia_vas: dyspareuniaVas,
        gut_bladder_symptoms: gutBladderSymptoms,
        endo_belly_severity: endoBellySeverity,
        fatigue_vas: fatigueVas,
        mood_score: moodScore,
        sleep_quality: sleepQuality,
        notes: notes || null,
        lifestyle_triggers: lifestyleTriggers,
        red_flags_detected: redFlags,
        research_correlations: correlations,
      };
      await onSave?.(formData);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            How are you feeling?
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {format(new Date(), "EEEE, MMMM d")}
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Entry
        </Button>
      </div>

      {/* Red flags alert */}
      {redFlags.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5 card-soft">
          <CardContent className="flex items-start gap-3 pt-5">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">
                Red Flag Patterns Detected
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Your symptom pattern may need a closer look. Consider sharing
                this with your doctor to discuss next steps.
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {redFlags.map((flag) => (
                  <Badge
                    key={flag}
                    variant="secondary"
                    className="text-[10px] bg-destructive/10 text-destructive border-destructive/20"
                  >
                    {flag.replace(/_/g, " ")}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 bg-secondary">
          <TabsTrigger value="pain" className="text-xs">
            <Activity className="mr-1.5 h-3 w-3" />
            Pain
          </TabsTrigger>
          <TabsTrigger value="symptoms" className="text-xs">
            <Droplets className="mr-1.5 h-3 w-3" />
            Symptoms
          </TabsTrigger>
          <TabsTrigger value="lifestyle" className="text-xs">
            <Heart className="mr-1.5 h-3 w-3" />
            Lifestyle
          </TabsTrigger>
          <TabsTrigger value="analysis" className="text-xs">
            <FlaskConical className="mr-1.5 h-3 w-3" />
            Analysis
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Pain Mapping */}
        <TabsContent value="pain" className="space-y-6">
          {/* Cycle info */}
          <Card>
            <CardContent className="pt-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Cycle Phase
                  </Label>
                  <Select
                    value={cyclePhase}
                    onValueChange={(val) => { if (val) setCyclePhase(val as CyclePhase); }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cycleMode === "cycle_agnostic" ? (
                        <SelectItem value="cycle_agnostic">
                          Cycle Agnostic (on therapy)
                        </SelectItem>
                      ) : (
                        <>
                          <SelectItem value="menstrual">Menstrual</SelectItem>
                          <SelectItem value="follicular">Follicular</SelectItem>
                          <SelectItem value="ovulatory">Ovulatory</SelectItem>
                          <SelectItem value="luteal">Luteal</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                {cycleMode === "regular" && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Cycle Day
                    </Label>
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[cycleDay ?? 1]}
                        onValueChange={(val) => setCycleDay(Array.isArray(val) ? val[0] : val)}
                        min={1}
                        max={45}
                        step={1}
                      />
                      <span className="text-sm font-mono w-8 text-right">
                        {cycleDay ?? "—"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <Separator className="opacity-30" />

              {/* Overall VAS */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">
                    Overall Pain Level (VAS)
                  </Label>
                  <span className="text-lg font-mono font-bold text-primary">
                    {overallVas}
                  </span>
                </div>
                <Slider
                  value={[overallVas]}
                  onValueChange={(val) => setOverallVas(Array.isArray(val) ? val[0] : val)}
                  min={0}
                  max={10}
                  step={1}
                />
                <div className="flex justify-between text-[10px] font-mono text-muted-foreground/50">
                  <span>0 — None</span>
                  <span>10 — Worst</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Body map */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Multi-Dimensional Pain Map
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PainBodyMap zones={painZones} onChange={setPainZones} />
            </CardContent>
          </Card>

          {/* Dyspareunia */}
          <Card>
            <CardContent className="pt-5 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Track Dyspareunia</Label>
                <Switch
                  checked={trackDyspareunia}
                  onCheckedChange={(val) => {
                    setTrackDyspareunia(val);
                    if (!val) setDyspareuniaVas(null);
                  }}
                />
              </div>
              {trackDyspareunia && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">
                      Pain During Intercourse (VAS)
                    </Label>
                    <span className="text-sm font-mono font-semibold text-primary">
                      {dyspareuniaVas ?? 0}/10
                    </span>
                  </div>
                  <Slider
                    value={[dyspareuniaVas ?? 0]}
                    onValueChange={(val) => setDyspareuniaVas(Array.isArray(val) ? val[0] : val)}
                    min={0}
                    max={10}
                    step={1}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: Additional Symptoms */}
        <TabsContent value="symptoms" className="space-y-6">
          {/* Gut / Bladder */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Droplets className="h-4 w-4 text-endo-lavender" />
                Bowel & Bladder Dysfunction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {GUT_BLADDER_OPTIONS.map((opt) => (
                  <Badge
                    key={opt.value}
                    variant={
                      gutBladderSymptoms.includes(opt.value)
                        ? "default"
                        : "secondary"
                    }
                    className="cursor-pointer text-xs transition-all"
                    onClick={() => toggleGutBladder(opt.value)}
                  >
                    {opt.label}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Endo Belly */}
          <Card>
            <CardContent className="pt-5 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">
                  Endo Belly Severity
                </Label>
                <span className="text-sm font-mono font-semibold text-primary">
                  {endoBellySeverity ?? 0}/10
                </span>
              </div>
              <Slider
                value={[endoBellySeverity ?? 0]}
                onValueChange={(val) => setEndoBellySeverity(Array.isArray(val) ? val[0] : val)}
                min={0}
                max={10}
                step={1}
              />
              <p className="text-[10px] text-muted-foreground/60">
                Metabolic bloating — may correlate with estrobolome dysbiosis
                (2024 microbiome research)
              </p>
            </CardContent>
          </Card>

          {/* Fatigue + Mood + Sleep */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Systemic Symptoms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">
                    Fatigue (VAS)
                  </Label>
                  <span className="text-sm font-mono text-primary">
                    {fatigueVas ?? 0}/10
                  </span>
                </div>
                <Slider
                  value={[fatigueVas ?? 0]}
                  onValueChange={(val) => setFatigueVas(Array.isArray(val) ? val[0] : val)}
                  min={0}
                  max={10}
                  step={1}
                />
              </div>

              <Separator className="opacity-30" />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Mood (1-5)
                  </Label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        onClick={() => setMoodScore(val)}
                        className={`flex-1 py-2 rounded-md text-xs font-mono transition-all ${
                          moodScore === val
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Sleep Quality (1-5)
                  </Label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        onClick={() => setSleepQuality(val)}
                        className={`flex-1 py-2 rounded-md text-xs font-mono transition-all ${
                          sleepQuality === val
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardContent className="pt-5">
              <Label className="text-xs text-muted-foreground">Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional observations..."
                className="mt-2 min-h-[80px] resize-none"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: Lifestyle Triggers */}
        <TabsContent value="lifestyle" className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Heart className="h-4 w-4 text-endo-coral" />
                Lifestyle Triggers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Track what may worsen or improve your symptoms. This data powers
                the inflammatory flare prediction engine.
              </p>

              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">
                    Trigger detail
                  </Label>
                  <input
                    ref={triggerDetailRef}
                    type="text"
                    placeholder="e.g., Gluten, poor sleep, high stress..."
                    className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <div className="flex gap-1">
                  {LIFESTYLE_CATEGORIES.map((cat) => (
                    <Button
                      key={cat.value}
                      variant="secondary"
                      size="sm"
                      onClick={() => addLifestyleTrigger(cat.value)}
                      className="text-xs"
                    >
                      <cat.icon className="h-3 w-3 mr-1" />
                      {cat.label}
                    </Button>
                  ))}
                </div>
              </div>

              {lifestyleTriggers.length > 0 && (
                <div className="space-y-2 mt-4">
                  {lifestyleTriggers.map((trigger, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px]">
                          {trigger.category}
                        </Badge>
                        <span className="text-sm">{trigger.detail}</span>
                      </div>
                      <button
                        onClick={() =>
                          setLifestyleTriggers((prev) =>
                            prev.filter((_, i) => i !== idx)
                          )
                        }
                        className="text-muted-foreground hover:text-destructive text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: Real-time Analysis */}
        <TabsContent value="analysis" className="space-y-6">
          {/* Research correlations */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-endo-lavender" />
                Research Pathway Correlations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {correlations.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Add symptoms above to see research correlations
                </p>
              ) : (
                <div className="space-y-3">
                  {correlations.map((corr) => (
                    <div
                      key={corr.marker_category}
                      className="rounded-lg bg-secondary/30 p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {corr.marker_category.replace(/_/g, " ")}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 rounded-full bg-secondary overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-endo-lavender to-endo-pink"
                              style={{
                                width: `${corr.confidence * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground">
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

          {/* Treatment pathways */}
          {pathways.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  Non-Hormonal Treatment Pathways
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pathways.map((p) => (
                  <div
                    key={p.pathway}
                    className="rounded-lg bg-secondary/30 p-3"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <ChevronRight className="h-3 w-3 text-primary" />
                      <span className="text-sm font-medium capitalize">
                        {p.pathway}
                      </span>
                      <Badge
                        variant="secondary"
                        className="text-[9px] font-mono"
                      >
                        {p.evidence}
                      </Badge>
                    </div>
                    <ul className="space-y-1 ml-5">
                      {p.treatments.map((t, i) => (
                        <li
                          key={i}
                          className="text-[11px] text-muted-foreground"
                        >
                          &bull; {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
