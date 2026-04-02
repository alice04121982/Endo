"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Mic,
  Minus,
  Plus,
  Search,
  Sparkles,
  Square,
  UserPlus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useCdss } from "@/lib/cdss-store";
import type { ConsultationNote, FailedTreatment, PatientHistory } from "@/lib/types/cdss";
import type { ClinicalExtract } from "@/app/api/clinical-extract/route";
import { ConsultationRecorder } from "@/components/consultation/consultation-recorder";
import { getProfileCompleteness } from "@/lib/profile-completeness";
import { cn } from "@/lib/utils";

const COMORBIDITY_OPTIONS = [
  "IBS", "Fibromyalgia", "Adenomyosis", "PCOS",
  "Interstitial cystitis", "Chronic fatigue syndrome",
  "Migraine", "Depression/Anxiety", "Autoimmune condition",
];

const TREATMENT_OPTIONS = [
  "Combined oral contraceptive", "Progesterone-only pill", "Mirena IUS",
  "GnRH agonist", "GnRH antagonist", "Depo-Provera", "Mefenamic acid",
  "Tranexamic acid", "Naproxen/Ibuprofen", "Paracetamol",
  "Amitriptyline", "Gabapentin", "Pelvic floor physiotherapy",
  "Laparoscopic excision", "Laparoscopic ablation",
];

type FormState = Omit<PatientHistory, "id" | "created_at">;

const initialForm: FormState = {
  name: "",
  age: 30,
  bmi: null,
  menarche_age: null,
  cycle_length_days: 28,
  cycle_regularity: "regular",
  dysmenorrhoea_severity: 5,
  dysmenorrhoea_onset_age: null,
  gravidity: 0,
  parity: 0,
  fertility_concerns: false,
  symptom_duration_months: 12,
  chronic_pelvic_pain: false,
  dyspareunia: false,
  dyschezia: false,
  dysuria: false,
  cyclical_bowel_symptoms: false,
  cyclical_bladder_symptoms: false,
  non_cyclical_pain: false,
  previous_ultrasound: false,
  previous_laparoscopy: false,
  previous_mri: false,
  known_endometriosis_stage: null,
  current_treatments: [],
  failed_treatments: [],
  comorbidities: [],
  family_history_endo: false,
  consultation_notes: [],
};

// ── Reusable sub-components ───────────────────────────────────────────────────

function CheckboxField({
  label, checked, onChange, hint,
}: {
  label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string;
}) {
  return (
    <label className="flex items-start gap-3 py-2 cursor-pointer group">
      <div className={cn(
        "mt-0.5 h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
        checked ? "bg-[#0057FF] border-[#0057FF]" : "border-[#D4DCE6] bg-white"
      )}>
        {checked && (
          <svg className="h-3 w-3 text-white" viewBox="0 0 12 10" fill="none">
            <path d="M1 5l3.5 4L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
      </div>
      <div>
        <span className="text-sm font-medium text-[#111827]">{label}</span>
        {hint && <p className="text-xs text-[#6B7280] mt-0.5">{hint}</p>}
      </div>
    </label>
  );
}

// ── Form section components ───────────────────────────────────────────────────

function SectionDemographics({ form, update }: { form: FormState; update: <K extends keyof FormState>(k: K, v: FormState[K]) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-1">
          <Label className="text-xs font-semibold text-[#6B7280]">Patient Name / ID <span className="text-red-500">*</span></Label>
          <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Emma Clarke" className="mt-1" />
        </div>
        <div>
          <Label className="text-xs font-semibold text-[#6B7280]">Age <span className="text-red-500">*</span></Label>
          <Input type="number" value={form.age} onChange={(e) => update("age", Number(e.target.value))} min={10} max={60} className="mt-1" />
        </div>
        <div>
          <Label className="text-xs font-semibold text-[#6B7280]">BMI <span className="text-[#9CA3AF]">(optional)</span></Label>
          <Input type="number" value={form.bmi ?? ""} onChange={(e) => update("bmi", e.target.value ? Number(e.target.value) : null)} step={0.1} placeholder="—" className="mt-1" />
        </div>
      </div>
    </div>
  );
}

function SectionMenstrual({ form, update }: { form: FormState; update: <K extends keyof FormState>(k: K, v: FormState[K]) => void }) {
  const isRegular = form.cycle_regularity === "regular";
  const cycleOutOfRange = isRegular && form.cycle_length_days !== null && (form.cycle_length_days < 21 || form.cycle_length_days > 35);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <Label className="text-xs font-semibold text-[#6B7280]">Age at Menarche</Label>
          <Input type="number" value={form.menarche_age ?? ""} onChange={(e) => update("menarche_age", e.target.value ? Number(e.target.value) : null)} placeholder="—" className="mt-1" />
        </div>
        <div>
          <Label className="text-xs font-semibold text-[#6B7280]">
            Cycle Length (days){isRegular && <span className="ml-1 font-normal text-[#9CA3AF]">21–35</span>}
          </Label>
          <Input
            type="number"
            value={form.cycle_length_days ?? ""}
            min={isRegular ? 21 : undefined}
            max={isRegular ? 35 : undefined}
            onChange={(e) => {
              const raw = e.target.value ? Number(e.target.value) : null;
              if (isRegular && raw !== null) {
                update("cycle_length_days", Math.min(35, Math.max(21, raw)));
              } else {
                update("cycle_length_days", raw);
              }
            }}
            className={cn("mt-1", cycleOutOfRange && "border-red-400 focus-visible:ring-red-400")}
          />
          {cycleOutOfRange && (
            <p className="text-xs text-red-600 mt-1 font-medium">Regular cycles must be 21–35 days</p>
          )}
          {isRegular && !cycleOutOfRange && form.cycle_length_days !== null && (
            <p className="text-xs text-[#6B7280] mt-1">Normal range for regular cycles</p>
          )}
        </div>
        <div>
          <Label className="text-xs font-semibold text-[#6B7280]">Cycle Regularity</Label>
          <select
            value={form.cycle_regularity}
            onChange={(e) => {
              const val = e.target.value as FormState["cycle_regularity"];
              update("cycle_regularity", val);
              if (val === "regular" && form.cycle_length_days !== null) {
                const clamped = Math.min(35, Math.max(21, form.cycle_length_days));
                if (clamped !== form.cycle_length_days) update("cycle_length_days", clamped);
              }
            }}
            className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="regular">Regular (21–35 days)</option>
            <option value="irregular">Irregular</option>
            <option value="absent">Absent (amenorrhoea)</option>
          </select>
        </div>
      </div>
      <div>
        <Label className="text-xs font-semibold text-[#6B7280]">Dysmenorrhoea Severity (VAS 0–10)</Label>
        <div className="flex items-center gap-4 mt-2">
          <input type="range" min={0} max={10} value={form.dysmenorrhoea_severity} onChange={(e) => update("dysmenorrhoea_severity", Number(e.target.value))} className="flex-1 accent-[#0057FF]" />
          <span className="font-mono text-lg font-bold text-[#111827] w-8 text-right">{form.dysmenorrhoea_severity}</span>
        </div>
        <div className="flex justify-between text-xs text-[#9CA3AF] mt-1">
          <span>No pain</span><span>Worst imaginable</span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs font-semibold text-[#6B7280]">Symptom Duration (months)</Label>
          <Input type="number" value={form.symptom_duration_months} onChange={(e) => update("symptom_duration_months", Number(e.target.value))} min={0} className="mt-1" />
        </div>
        <div>
          <Label className="text-xs font-semibold text-[#6B7280]">Dysmenorrhoea Onset Age</Label>
          <Input type="number" value={form.dysmenorrhoea_onset_age ?? ""} onChange={(e) => update("dysmenorrhoea_onset_age", e.target.value ? Number(e.target.value) : null)} placeholder="—" className="mt-1" />
        </div>
      </div>
    </div>
  );
}

function SectionSymptoms({ form, update }: { form: FormState; update: <K extends keyof FormState>(k: K, v: FormState[K]) => void }) {
  const symptoms = [
    { key: "chronic_pelvic_pain" as const, label: "Chronic pelvic pain", hint: "Pain persisting >6 months" },
    { key: "dyspareunia" as const, label: "Deep dyspareunia", hint: "Pain during/after intercourse" },
    { key: "dyschezia" as const, label: "Dyschezia", hint: "Painful defecation" },
    { key: "dysuria" as const, label: "Dysuria", hint: "Painful urination" },
    { key: "cyclical_bowel_symptoms" as const, label: "Cyclical bowel symptoms", hint: "Bloating, diarrhoea, constipation with menses" },
    { key: "cyclical_bladder_symptoms" as const, label: "Cyclical bladder symptoms", hint: "Frequency, urgency, haematuria with menses" },
    { key: "non_cyclical_pain" as const, label: "Non-cyclical pelvic pain", hint: "Pain unrelated to menstrual cycle" },
    { key: "family_history_endo" as const, label: "Family history of endometriosis", hint: "First-degree relative" },
  ];
  const checkedCount = symptoms.filter((s) => form[s.key]).length;
  return (
    <div className="space-y-4">
      {checkedCount > 0 && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-2.5 text-sm text-blue-800 font-medium">
          {checkedCount} symptom{checkedCount !== 1 ? "s" : ""} selected — NICE NG73 criteria being scored
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 bg-[#F8F9FA] rounded-xl border border-[#E8E8E8] px-5 py-3">
        {symptoms.map((s) => (
          <CheckboxField key={s.key} label={s.label} checked={form[s.key]} onChange={(v) => update(s.key, v)} hint={s.hint} />
        ))}
      </div>
    </div>
  );
}

function SectionInvestigations({ form, update }: { form: FormState; update: <K extends keyof FormState>(k: K, v: FormState[K]) => void }) {
  return (
    <div className="space-y-4">
      <div className="bg-[#F8F9FA] rounded-xl border border-[#E8E8E8] px-5 py-3">
        <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wide mb-2">Previous investigations</p>
        <CheckboxField label="Transvaginal ultrasound" checked={form.previous_ultrasound} onChange={(v) => update("previous_ultrasound", v)} />
        <CheckboxField label="Diagnostic laparoscopy" checked={form.previous_laparoscopy} onChange={(v) => update("previous_laparoscopy", v)} />
        <CheckboxField label="MRI pelvis" checked={form.previous_mri} onChange={(v) => update("previous_mri", v)} />
      </div>
      <div>
        <Label className="text-xs font-semibold text-[#6B7280]">Known Endometriosis Stage</Label>
        <select value={form.known_endometriosis_stage ?? "none"} onChange={(e) => update("known_endometriosis_stage", e.target.value === "none" ? null : (e.target.value as PatientHistory["known_endometriosis_stage"]))} className="mt-1 w-full sm:w-72 h-9 rounded-md border border-input bg-background px-3 text-sm">
          <option value="none">Not diagnosed / Unknown</option>
          <option value="stage_i">Stage I (Minimal)</option>
          <option value="stage_ii">Stage II (Mild)</option>
          <option value="stage_iii">Stage III (Moderate)</option>
          <option value="stage_iv">Stage IV (Severe)</option>
        </select>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div>
          <Label className="text-xs font-semibold text-[#6B7280]">Gravidity</Label>
          <Input type="number" value={form.gravidity} onChange={(e) => update("gravidity", Number(e.target.value))} min={0} className="mt-1" />
        </div>
        <div>
          <Label className="text-xs font-semibold text-[#6B7280]">Parity</Label>
          <Input type="number" value={form.parity} onChange={(e) => update("parity", Number(e.target.value))} min={0} className="mt-1" />
        </div>
      </div>
      <CheckboxField label="Fertility concerns" checked={form.fertility_concerns} onChange={(v) => update("fertility_concerns", v)} hint="Patient actively trying to conceive or concerned about future fertility" />
    </div>
  );
}

function SectionTreatment({
  form, update, newTreatment, setNewTreatment, addTreatment, removeTreatment,
}: {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  newTreatment: FailedTreatment;
  setNewTreatment: (t: FailedTreatment) => void;
  addTreatment: () => void;
  removeTreatment: (i: number) => void;
}) {
  function toggleComorbidity(c: string) {
    update("comorbidities", form.comorbidities.includes(c)
      ? form.comorbidities.filter((x) => x !== c)
      : [...form.comorbidities, c]);
  }
  return (
    <div className="space-y-4">
      {form.failed_treatments.length > 0 && (
        <div className="space-y-2">
          {form.failed_treatments.map((t, i) => (
            <div key={i} className="flex items-center justify-between gap-3 rounded-lg bg-[#F8F9FA] border border-[#E8E8E8] px-4 py-3">
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-[#111827]">{t.name}</span>
                <span className="text-xs text-[#6B7280] ml-2">{t.duration_months}mo</span>
              </div>
              <Badge variant="secondary" className={`text-xs shrink-0 ${t.outcome === "worsened" ? "bg-red-100 text-red-700" : t.outcome === "no_change" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                {t.outcome.replace("_", " ")}
              </Badge>
              <button onClick={() => removeTreatment(i)} className="text-[#9CA3AF] hover:text-red-500 shrink-0">
                <Minus className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="rounded-xl border border-[#E8E8E8] bg-[#F8F9FA] px-4 py-4 space-y-3">
        <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wide">Add failed/previous treatment</p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div className="sm:col-span-1">
            <Label className="text-xs font-semibold text-[#6B7280]">Treatment</Label>
            <select value={newTreatment.name} onChange={(e) => setNewTreatment({ ...newTreatment, name: e.target.value })} className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Select…</option>
              {TREATMENT_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-xs font-semibold text-[#6B7280]">Duration (months)</Label>
            <Input type="number" value={newTreatment.duration_months} onChange={(e) => setNewTreatment({ ...newTreatment, duration_months: Number(e.target.value) })} min={1} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs font-semibold text-[#6B7280]">Outcome</Label>
            <select value={newTreatment.outcome} onChange={(e) => setNewTreatment({ ...newTreatment, outcome: e.target.value as FailedTreatment["outcome"] })} className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
              <option value="no_change">No change</option>
              <option value="worsened">Worsened</option>
              <option value="mild_improvement">Mild improvement</option>
            </select>
          </div>
          <Button onClick={addTreatment} variant="outline" className="h-9 rounded-lg" disabled={!newTreatment.name}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
      </div>
      <Separator />
      <div>
        <p className="text-xs font-bold text-[#6B7280] uppercase tracking-wide mb-3">Comorbidities</p>
        <div className="flex flex-wrap gap-2">
          {COMORBIDITY_OPTIONS.map((c) => (
            <button key={c} type="button" onClick={() => toggleComorbidity(c)} className={cn(
              "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
              form.comorbidities.includes(c)
                ? "bg-[#0057FF]/10 text-[#0057FF] border-[#0057FF]/30"
                : "bg-white text-[#6B7280] border-[#D4DCE6] hover:border-[#0057FF]/30"
            )}>
              {c}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Capture panel (voice + text, always visible) ──────────────────────────────

type CaptureStatus = "idle" | "recording" | "extracting" | "done" | "error";

function CapturePanel({ onExtract }: { onExtract: (extract: ClinicalExtract) => void }) {
  const [notes, setNotes] = useState(""); // shared — voice transcript lands here; user can also type
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState<CaptureStatus>("idle");
  const [populatedCount, setPopulatedCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const finalTextRef = useRef("");
  const interimRef = useRef("");

  const isSupported =
    typeof window !== "undefined" &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  function startRecording() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SR) return;
    finalTextRef.current = notes; // preserve any existing typed text
    interimRef.current = "";
    setIsRecording(true);
    setStatus("idle");
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-GB";
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalTextRef.current += t + " ";
        else interim = t;
      }
      interimRef.current = interim;
      setNotes(finalTextRef.current + interim);
    };
    rec.onerror = () => {
      setIsRecording(false);
      setStatus("error");
      setErrorMsg("Microphone access denied or unavailable.");
    };
    rec.onend = () => setIsRecording(false);
    recognitionRef.current = rec;
    rec.start();
  }

  function stopRecording() {
    recognitionRef.current?.stop();
    setIsRecording(false);
  }

  async function handleConfirm() {
    if (!notes.trim()) return;
    setStatus("extracting");
    try {
      const res = await fetch("/api/clinical-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: notes.trim() }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data: ClinicalExtract = await res.json();
      const count = Object.values(data).filter(
        (v) => v !== null && (Array.isArray(v) ? v.length > 0 : true)
      ).length;
      setPopulatedCount(count);
      onExtract(data);
      setStatus("done");
    } catch {
      setErrorMsg("Could not extract clinical data. Check your connection and try again.");
      setStatus("error");
    }
  }

  function reset() {
    setNotes("");
    setStatus("idle");
    setErrorMsg("");
    setPopulatedCount(0);
  }

  const isDone = status === "done";
  const isExtracting = status === "extracting";

  return (
    <div className="rounded-2xl border border-[#E8E8E8] bg-white px-5 py-5 space-y-4">
      <div>
        <p className="text-sm font-semibold text-[#111827]">Capture patient history</p>
        <p className="text-xs text-[#6B7280] mt-0.5">
          Record or type the patient history — AI will populate the form fields below.
          You can also fill the form directly without using this.
        </p>
      </div>

      {/* Voice controls */}
      <div className="flex items-center gap-3">
        {!isRecording ? (
          <Button
            onClick={startRecording}
            disabled={!isSupported || isDone || isExtracting}
            variant="outline"
            className="rounded-full h-9 px-4 gap-2 border-[#0057FF]/40 text-[#0057FF] hover:bg-[#F0F4FF]"
          >
            <Mic className="h-4 w-4" />
            {notes && !isDone ? "Continue recording" : "Start recording"}
          </Button>
        ) : (
          <Button
            onClick={stopRecording}
            variant="outline"
            className="rounded-full h-9 px-4 gap-2 border-red-300 text-red-600 hover:bg-red-50"
          >
            <Square className="h-3.5 w-3.5 fill-current" />
            Stop
          </Button>
        )}
        {isRecording && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-red-600">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            Recording…
          </span>
        )}
        {!isSupported && (
          <span className="text-xs text-amber-600">Voice requires Chrome or Edge</span>
        )}
      </div>

      {/* Shared notes textarea */}
      <Textarea
        value={notes}
        onChange={(e) => { setNotes(e.target.value); if (isDone) setStatus("idle"); }}
        placeholder="Speak or type the patient history here — age, symptoms, cycle length, treatments tried, investigations, family history…"
        rows={4}
        className="resize-none text-sm"
        disabled={isExtracting}
      />

      {/* Confirm button — visible when there's content and not yet done */}
      {notes.trim() && !isDone && (
        <Button
          onClick={handleConfirm}
          disabled={isExtracting}
          className="rounded bg-[#0057FF] text-white h-10 px-5 gap-2 hover:bg-[#0046D4] font-semibold"
        >
          <Sparkles className="h-4 w-4" />
          {isExtracting ? "Populating fields…" : "Confirm & populate fields"}
        </Button>
      )}

      {/* Success state */}
      {isDone && (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="text-sm font-semibold text-emerald-700">
              {populatedCount} field{populatedCount !== 1 ? "s" : ""} populated — review and adjust below
            </span>
          </div>
          <button onClick={reset} className="text-xs text-emerald-700 underline hover:no-underline shrink-0">
            Clear &amp; redo
          </button>
        </div>
      )}

      {/* Error state */}
      {status === "error" && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center justify-between gap-3">
          <span>{errorMsg}</span>
          <button onClick={() => setStatus("idle")} className="text-xs underline hover:no-underline shrink-0">Dismiss</button>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PatientHistoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editPatientId = searchParams.get("edit");
  const skipSearch = searchParams.get("new") === "1";
  const { addPatient, updatePatient, patients, getRiskAssessment } = useCdss();

  const existingPatient = useMemo(
    () => (editPatientId ? patients.find((p) => p.id === editPatientId) ?? null : null),
    [editPatientId, patients]
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [showNewForm, setShowNewForm] = useState(skipSearch);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return patients;
    const q = searchQuery.toLowerCase();
    return patients.filter((p) => p.name.toLowerCase().includes(q));
  }, [searchQuery, patients]);

  const showForm = !!editPatientId || showNewForm;

  const [form, setForm] = useState<FormState>(initialForm);
  const [newTreatment, setNewTreatment] = useState<FailedTreatment>({
    name: "", type: "hormonal", duration_months: 3, outcome: "no_change",
  });
  const [newNoteContent, setNewNoteContent] = useState("");

  useEffect(() => {
    if (existingPatient) {
      const { id, created_at, ...rest } = existingPatient;
      setForm({
        ...rest,
        consultation_notes: rest.consultation_notes ?? [],
        failed_treatments: rest.failed_treatments ?? [],
        current_treatments: rest.current_treatments ?? [],
        comorbidities: rest.comorbidities ?? [],
      });
    }
  }, [existingPatient]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function applyExtract(extract: ClinicalExtract) {
    setForm((prev) => {
      const next = { ...prev };
      if (extract.age !== null) next.age = extract.age;
      if (extract.bmi !== null) next.bmi = extract.bmi;
      if (extract.menarche_age !== null) next.menarche_age = extract.menarche_age;
      if (extract.cycle_length_days !== null) next.cycle_length_days = extract.cycle_length_days;
      if (extract.cycle_regularity !== null) next.cycle_regularity = extract.cycle_regularity;
      if (extract.dysmenorrhoea_severity !== null) next.dysmenorrhoea_severity = extract.dysmenorrhoea_severity;
      if (extract.dysmenorrhoea_onset_age !== null) next.dysmenorrhoea_onset_age = extract.dysmenorrhoea_onset_age;
      if (extract.symptom_duration_months !== null) next.symptom_duration_months = extract.symptom_duration_months;
      if (extract.gravidity !== null) next.gravidity = extract.gravidity;
      if (extract.parity !== null) next.parity = extract.parity;
      if (extract.fertility_concerns !== null) next.fertility_concerns = extract.fertility_concerns;
      if (extract.chronic_pelvic_pain !== null) next.chronic_pelvic_pain = extract.chronic_pelvic_pain;
      if (extract.dyspareunia !== null) next.dyspareunia = extract.dyspareunia;
      if (extract.dyschezia !== null) next.dyschezia = extract.dyschezia;
      if (extract.dysuria !== null) next.dysuria = extract.dysuria;
      if (extract.cyclical_bowel_symptoms !== null) next.cyclical_bowel_symptoms = extract.cyclical_bowel_symptoms;
      if (extract.cyclical_bladder_symptoms !== null) next.cyclical_bladder_symptoms = extract.cyclical_bladder_symptoms;
      if (extract.non_cyclical_pain !== null) next.non_cyclical_pain = extract.non_cyclical_pain;
      if (extract.previous_ultrasound !== null) next.previous_ultrasound = extract.previous_ultrasound;
      if (extract.previous_laparoscopy !== null) next.previous_laparoscopy = extract.previous_laparoscopy;
      if (extract.previous_mri !== null) next.previous_mri = extract.previous_mri;
      if (extract.known_endometriosis_stage !== null) next.known_endometriosis_stage = extract.known_endometriosis_stage;
      if (extract.current_treatments !== null && extract.current_treatments.length > 0) next.current_treatments = extract.current_treatments;
      if (extract.family_history_endo !== null) next.family_history_endo = extract.family_history_endo;
      if (extract.comorbidities !== null && extract.comorbidities.length > 0) next.comorbidities = extract.comorbidities;
      return next;
    });
  }

  function addTreatment() {
    if (!newTreatment.name) return;
    setForm((prev) => ({ ...prev, failed_treatments: [...prev.failed_treatments, { ...newTreatment }] }));
    setNewTreatment({ name: "", type: "hormonal", duration_months: 3, outcome: "no_change" });
  }

  function removeTreatment(index: number) {
    setForm((prev) => ({ ...prev, failed_treatments: prev.failed_treatments.filter((_, i) => i !== index) }));
  }

  function addConsultationNoteFromRecording({ content, transcript }: { content: string; transcript: string }) {
    const note: ConsultationNote = { id: `note-${Date.now()}`, date: new Date().toISOString().split("T")[0], clinician: "", content: content.trim() };
    void transcript;
    setForm((prev) => ({ ...prev, consultation_notes: [note, ...prev.consultation_notes] }));
  }

  function addConsultationNote() {
    if (!newNoteContent.trim()) return;
    const note: ConsultationNote = { id: `note-${Date.now()}`, date: new Date().toISOString().split("T")[0], clinician: "", content: newNoteContent.trim() };
    setForm((prev) => ({ ...prev, consultation_notes: [note, ...prev.consultation_notes] }));
    setNewNoteContent("");
  }

  function removeNote(noteId: string) {
    setForm((prev) => ({ ...prev, consultation_notes: prev.consultation_notes.filter((n) => n.id !== noteId) }));
  }

  function handleSubmit() {
    if (!form.name.trim() || form.age < 1) return;
    if (editPatientId && existingPatient) {
      updatePatient(editPatientId, form);
      router.push(`/cdss/patients/${editPatientId}`);
    } else {
      const patient = addPatient(form);
      // Minimal profile (secretary quick-add) → go to patient detail page
      // so the incomplete banner is visible and the doctor can complete via voice
      const completeness = getProfileCompleteness(patient, 0);
      if (completeness.level === "minimal") {
        router.push(`/cdss/patients/${patient.id}`);
      } else {
        router.push(`/cdss/patients/${patient.id}`);
      }
    }
  }

  // ── Search screen ────────────────────────────────────────────────────────────
  if (!showForm) {
    return (
      <div className="max-w-2xl px-6 lg:px-8 py-6 lg:py-8 space-y-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <ClipboardList className="h-5 w-5 text-[#0057FF]" />
            <p className="text-xs font-semibold tracking-wide uppercase text-[#6B7280]">Patient History</p>
          </div>
          <h1 className="text-2xl font-bold text-[#111827]">Find or Add Patient</h1>
          <p className="mt-1 text-sm text-[#6B7280]">Search for an existing patient record or create a new one.</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by name or patient ID…" className="pl-10 h-11" autoFocus />
        </div>

        <div className="space-y-2">
          {searchResults.length > 0 ? searchResults.map((p) => {
            const risk = getRiskAssessment(p.id);
            return (
              <button key={p.id} onClick={() => router.push(`/cdss/patient?edit=${p.id}`)} className="w-full text-left rounded-xl bg-white border border-[#E8E8E8] hover:border-[#0057FF]/30 px-5 py-4 transition-colors group">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-bold text-[#111827] truncate">{p.name}</p>
                    <p className="text-xs text-[#6B7280] mt-0.5">
                      Age {p.age} · {p.symptom_duration_months}mo symptoms
                      {risk && <span className={`ml-2 font-semibold ${risk.overall_risk === "very_high" || risk.overall_risk === "high" ? "text-red-500" : risk.overall_risk === "moderate" ? "text-amber-600" : "text-emerald-600"}`}>· Risk {risk.score}/100</span>}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#9CA3AF] group-hover:text-[#0057FF] shrink-0 transition-colors" />
                </div>
              </button>
            );
          }) : (
            <div className="rounded-xl bg-white border border-[#E8E8E8] px-5 py-8 text-center">
              <p className="text-sm text-[#6B7280]">No patients found{searchQuery ? ` matching "${searchQuery}"` : ""}.</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 pt-2">
          <div className="flex-1 h-px bg-[#D4DCE6]" />
          <span className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide">or</span>
          <div className="flex-1 h-px bg-[#D4DCE6]" />
        </div>
        <Button onClick={() => setShowNewForm(true)} className="w-full rounded bg-[#0057FF] text-white font-semibold h-11 hover:bg-[#0046D4]">
          <UserPlus className="mr-2 h-4 w-4" />
          New Patient Assessment
        </Button>
      </div>
    );
  }

  const isEdit = !!editPatientId;

  // ── Shared form layout (new patient + edit) ───────────────────────────────────
  return (
    <div className="max-w-3xl px-6 lg:px-8 py-6 lg:py-8 space-y-6">
      {/* Back link */}
      <button
        onClick={() => isEdit ? router.back() : setShowNewForm(false)}
        className="flex items-center gap-1.5 text-sm font-semibold text-[#6B7280] hover:text-[#111827] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {isEdit ? "Back" : "Back to search"}
      </button>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          {isEdit ? <ClipboardList className="h-4 w-4 text-[#0057FF]" /> : <UserPlus className="h-4 w-4 text-[#0057FF]" />}
          <p className="text-xs font-semibold tracking-wide uppercase text-[#6B7280]">
            {isEdit ? "Update Assessment" : "New Patient"}
          </p>
        </div>
        <h1 className="text-2xl font-bold text-[#111827]">
          {isEdit ? `Edit — ${existingPatient?.name ?? "Patient"}` : "New Patient Assessment"}
        </h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          {isEdit
            ? "Update clinical history, add consultation notes, and reassess risk."
            : "Capture the patient history by voice, text, or filling in the form below."}
        </p>
      </div>

      {/* Capture panel — new patient only */}
      {!isEdit && <CapturePanel onExtract={applyExtract} />}

      {/* Consultation recorder — edit mode only */}
      {isEdit && <ConsultationRecorder patient={form} onSave={addConsultationNoteFromRecording} />}

      {/* Form sections */}
      <Card className="bg-white border-[#E8E8E8]">
        <CardHeader className="pb-3"><CardTitle className="text-sm font-bold text-[#111827]">Demographics</CardTitle></CardHeader>
        <CardContent><SectionDemographics form={form} update={update} /></CardContent>
      </Card>
      <Card className="bg-white border-[#E8E8E8]">
        <CardHeader className="pb-3"><CardTitle className="text-sm font-bold text-[#111827]">Menstrual History</CardTitle></CardHeader>
        <CardContent><SectionMenstrual form={form} update={update} /></CardContent>
      </Card>
      <Card className="bg-white border-[#E8E8E8]">
        <CardHeader className="pb-3"><CardTitle className="text-sm font-bold text-[#111827]">Symptoms (NICE NG73)</CardTitle></CardHeader>
        <CardContent><SectionSymptoms form={form} update={update} /></CardContent>
      </Card>
      <Card className="bg-white border-[#E8E8E8]">
        <CardHeader className="pb-3"><CardTitle className="text-sm font-bold text-[#111827]">Investigations &amp; Reproductive</CardTitle></CardHeader>
        <CardContent><SectionInvestigations form={form} update={update} /></CardContent>
      </Card>
      <Card className="bg-white border-[#E8E8E8]">
        <CardHeader className="pb-3"><CardTitle className="text-sm font-bold text-[#111827]">Treatment &amp; Comorbidities</CardTitle></CardHeader>
        <CardContent>
          <SectionTreatment
            form={form} update={update}
            newTreatment={newTreatment} setNewTreatment={setNewTreatment}
            addTreatment={addTreatment} removeTreatment={removeTreatment}
          />
        </CardContent>
      </Card>

      {/* Consultation notes — edit mode only */}
      {isEdit && (
        <Card className="bg-white border-[#E8E8E8]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-[#111827]">Consultation Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {form.consultation_notes.length > 0 && (
              <div className="space-y-2">
                {form.consultation_notes.map((note) => (
                  <div key={note.id} className="rounded bg-[#F8F9FA] px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-[#6B7280]">{new Date(note.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                      <button onClick={() => removeNote(note.id)} className="text-[#9CA3AF] hover:text-red-500"><Minus className="h-3.5 w-3.5" /></button>
                    </div>
                    <p className="text-sm text-[#111827] whitespace-pre-wrap">{note.content}</p>
                  </div>
                ))}
              </div>
            )}
            <Separator />
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#6B7280]">New Consultation Note</Label>
              <textarea value={newNoteContent} onChange={(e) => setNewNoteContent(e.target.value)} placeholder="Record symptoms reported, clinical observations..." rows={4} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0057FF]/20" />
              <Button onClick={addConsultationNote} variant="outline" className="h-9 rounded-lg" disabled={!newNoteContent.trim()}><Plus className="h-4 w-4 mr-1" /> Add Note</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit */}
      <div className="flex justify-end gap-3 pt-2 pb-8">
        <Button
          onClick={handleSubmit}
          disabled={!form.name.trim()}
          className="rounded bg-[#0057FF] text-white font-semibold h-10 px-6 hover:bg-[#0046D4] gap-2"
        >
          {isEdit ? "Update & View Results" : "Save & Enter Biomarkers"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
