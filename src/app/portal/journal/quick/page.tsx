"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveJournalEntry } from "../new/actions";

const PAIN_LOCATIONS = [
  "Lower abdomen",
  "Right pelvis",
  "Left pelvis",
  "Lower back",
  "Inner thighs",
  "Bottom",
];

const BOWEL_OPTIONS = ["Loose stool", "Constipation", "Urgency", "Bloating", "Dyschezia (pain on opening bowels)"];
const BLADDER_OPTIONS = ["Frequency", "Dysuria (pain when passing urine)", "Urgency"];

export default function QuickTapEntry() {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [painVas, setPainVas] = useState<number>(3);
  const [painLocations, setPainLocations] = useState<string[]>([]);
  const [bowel, setBowel] = useState<string[]>([]);
  const [bladder, setBladder] = useState<string[]>([]);
  const [dyspareunia, setDyspareunia] = useState<boolean | null>(null);
  const [bleedingHeaviness, setBleedingHeaviness] = useState<
    "none" | "spotting" | "light" | "moderate" | "heavy" | "very_heavy"
  >("none");
  const [fatigueVas, setFatigueVas] = useState<number>(3);
  const [moodScore, setMoodScore] = useState<number>(3);
  const [notes, setNotes] = useState("");

  function toggle(set: string[], setSet: (s: string[]) => void, v: string) {
    setSet(set.includes(v) ? set.filter((x) => x !== v) : [...set, v]);
  }

  function buildPlainSummary(): string {
    const parts: string[] = [];
    parts.push(`Pain ${painVas} out of 10`);
    if (painLocations.length) parts.push(`in ${painLocations.join(", ").toLowerCase()}`);
    if (bowel.length) parts.push(`bowel: ${bowel.join(", ").toLowerCase()}`);
    if (bladder.length) parts.push(`bladder: ${bladder.join(", ").toLowerCase()}`);
    if (dyspareunia === true) parts.push("pain during sex today");
    if (bleedingHeaviness !== "none") parts.push(`bleeding ${bleedingHeaviness.replace("_", " ")}`);
    return parts.join(", ") + ".";
  }

  async function submit() {
    setError(null);
    const result = await saveJournalEntry({
      source: "quick_tap",
      patientPlainSummary: buildPlainSummary(),
      painVas,
      painLocations,
      bowelSymptoms: bowel,
      bladderSymptoms: bladder,
      dyspareunia: dyspareunia,
      bleedingHeaviness,
      fatigueVas,
      moodScore,
      notes: notes.trim() || null,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push("/portal/journal");
  }

  return (
    <div className="max-w-3xl mx-auto px-6 lg:px-10 py-12 lg:py-16">
      <p className="text-sm uppercase tracking-[0.18em] text-[var(--color-brand-stone)] mb-2">
        Quick entry
      </p>
      <h1
        className="font-display font-extrabold text-[var(--color-brand-aubergine)] tracking-[-0.02em] leading-[1.05] mb-3"
        style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)" }}
      >
        How are you feeling?
      </h1>
      <p className="text-[var(--color-brand-stone)] mb-8 max-w-xl">
        Tap your way through. Same record, no voice needed.
      </p>

      <div className="bg-white border border-[var(--color-brand-sand)] rounded-[14px] p-6 mb-4">
        <Label>Pain right now</Label>
        <Vas value={painVas} setValue={setPainVas} accent="clay" />
      </div>

      <div className="bg-white border border-[var(--color-brand-sand)] rounded-[14px] p-6 mb-4">
        <Label>Where is the pain?</Label>
        <ToggleGroup
          options={PAIN_LOCATIONS}
          selected={painLocations}
          onToggle={(v) => toggle(painLocations, setPainLocations, v)}
        />
      </div>

      <div className="bg-white border border-[var(--color-brand-sand)] rounded-[14px] p-6 mb-4">
        <Label>Bowel</Label>
        <ToggleGroup
          options={BOWEL_OPTIONS}
          selected={bowel}
          onToggle={(v) => toggle(bowel, setBowel, v)}
        />
      </div>

      <div className="bg-white border border-[var(--color-brand-sand)] rounded-[14px] p-6 mb-4">
        <Label>Bladder</Label>
        <ToggleGroup
          options={BLADDER_OPTIONS}
          selected={bladder}
          onToggle={(v) => toggle(bladder, setBladder, v)}
        />
      </div>

      <div className="bg-white border border-[var(--color-brand-sand)] rounded-[14px] p-6 mb-4">
        <Label>Pain during sex today?</Label>
        <div className="flex gap-2">
          {[
            { v: true, label: "Yes" },
            { v: false, label: "No" },
            { v: null, label: "Not applicable" },
          ].map((o) => (
            <button
              key={String(o.v)}
              type="button"
              onClick={() => setDyspareunia(o.v)}
              className={`px-4 py-2 rounded-[10px] border text-sm font-medium transition-colors ${
                dyspareunia === o.v
                  ? "border-[var(--color-brand-clay)] bg-[var(--color-brand-blush)] text-[var(--color-brand-aubergine)]"
                  : "border-[var(--color-brand-sand)] bg-white text-[var(--color-brand-stone)] hover:border-[var(--color-brand-clay)]"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-[var(--color-brand-sand)] rounded-[14px] p-6 mb-4">
        <Label>Bleeding</Label>
        <div className="flex gap-2 flex-wrap">
          {(["none", "spotting", "light", "moderate", "heavy", "very_heavy"] as const).map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBleedingHeaviness(b)}
              className={`px-3 py-1.5 rounded-[8px] border text-sm transition-colors ${
                bleedingHeaviness === b
                  ? "border-[var(--color-brand-clay)] bg-[var(--color-brand-blush)] text-[var(--color-brand-aubergine)] font-medium"
                  : "border-[var(--color-brand-sand)] bg-white text-[var(--color-brand-stone)] hover:border-[var(--color-brand-clay)]"
              }`}
            >
              {b === "very_heavy" ? "Very heavy" : b.charAt(0).toUpperCase() + b.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div className="bg-white border border-[var(--color-brand-sand)] rounded-[14px] p-6">
          <Label>Fatigue</Label>
          <Vas value={fatigueVas} setValue={setFatigueVas} accent="plum" />
        </div>
        <div className="bg-white border border-[var(--color-brand-sand)] rounded-[14px] p-6">
          <Label>Mood</Label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMoodScore(m)}
                className={`w-12 h-12 rounded-[10px] border font-mono text-lg font-semibold transition-colors ${
                  moodScore === m
                    ? "border-[var(--color-brand-plum)] bg-[var(--color-brand-blush)] text-[var(--color-brand-aubergine)]"
                    : "border-[var(--color-brand-sand)] bg-white text-[var(--color-brand-stone)] hover:border-[var(--color-brand-plum)]"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-[var(--color-brand-sand)] rounded-[14px] p-6 mb-4">
        <Label>Anything else?</Label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What you took, what helped, anything you want your clinician to see…"
          className="w-full px-3 py-2.5 rounded-[8px] border border-[var(--color-brand-sand)] bg-white text-sm focus:outline-none focus:border-[var(--color-brand-clay)]"
        />
      </div>

      {error && (
        <p
          role="alert"
          className="text-sm text-[var(--color-brand-red)] font-medium mb-4"
        >
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => startTransition(submit)}
          disabled={busy}
          className="px-5 py-3 rounded-[10px] bg-[var(--color-brand-clay)] text-white font-semibold hover:bg-[var(--color-brand-clay-deep)] transition-colors disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save entry"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/portal/journal/new")}
          className="px-5 py-3 rounded-[10px] border border-[var(--color-brand-sand)] bg-white font-semibold hover:border-[var(--color-brand-clay)] transition-colors"
        >
          Use voice instead
        </button>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm font-semibold text-[var(--color-brand-aubergine)] mb-3">
      {children}
    </p>
  );
}

function Vas({
  value,
  setValue,
  accent,
}: {
  value: number;
  setValue: (n: number) => void;
  accent: "clay" | "plum";
}) {
  const accentVar = accent === "clay" ? "var(--color-brand-clay)" : "var(--color-brand-plum)";
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-[var(--color-brand-stone)]">0 None</span>
        <span
          className="font-mono text-2xl font-semibold tabular-nums"
          style={{ color: accentVar }}
        >
          {value}/10
        </span>
        <span className="text-xs text-[var(--color-brand-stone)]">10 Worst</span>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-full"
        style={{ accentColor: accentVar }}
        aria-label="Pain VAS slider"
      />
    </div>
  );
}

function ToggleGroup({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = selected.includes(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() => onToggle(o)}
            aria-pressed={on}
            className={`px-3 py-1.5 rounded-[8px] border text-sm transition-colors ${
              on
                ? "border-[var(--color-brand-clay)] bg-[var(--color-brand-blush)] text-[var(--color-brand-aubergine)] font-medium"
                : "border-[var(--color-brand-sand)] bg-white text-[var(--color-brand-stone)] hover:border-[var(--color-brand-clay)]"
            }`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}
