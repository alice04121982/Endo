import type { JournalEntry } from "./journal";
import type { CSDPayload } from "./csd";

// Rapid Answer Panel — rule-based derivation of the 13 standard
// endometriosis history rows from a patient's journal entries + payload.
//
// No LLM in this trigger path. Each row resolves to one of:
//   - a one-line answer with a flag and a source link list, or
//   - "Awaiting data" when the underlying record can't yet support an
//     answer (the dependent feature hasn't shipped, or the patient
//     hasn't logged enough).
//
// Order and labels follow the brief verbatim. Grouping is the same as
// the design-system reference (Symptom pattern · Organ involvement ·
// Bleeding & family · Investigations / treatment / fertility).

export type RowFlag =
  | "adenomyosis_consideration"
  | "imaging_gap"
  | "treatment_escalation"
  | null;

export interface DerivedAnswer {
  question: string;
  group: "symptom_pattern" | "organ_involvement" | "bleeding_family" | "investigations_treatment_fertility";
  answer: string;
  awaiting?: boolean;
  flag?: Exclude<RowFlag, null>;
  sources: { id: string; label: string }[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function topCounts<T extends string>(values: T[]): { value: T; count: number }[] {
  const map = new Map<T, number>();
  for (const v of values) map.set(v, (map.get(v) ?? 0) + 1);
  return [...map.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);
}

function describeBleeding(h: string): string {
  return h.replace(/_/g, " ");
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-row derivers
// ─────────────────────────────────────────────────────────────────────────────

function rowAgeOnset(): DerivedAnswer {
  return {
    question: "Age of pelvic pain onset",
    group: "symptom_pattern",
    answer: "Awaiting data",
    awaiting: true,
    sources: [],
  };
}

function rowCyclicity(entries: JournalEntry[]): DerivedAnswer {
  if (entries.length === 0) {
    return {
      question: "Cyclicity",
      group: "symptom_pattern",
      answer: "Awaiting data",
      awaiting: true,
      sources: [],
    };
  }

  // Average pain by phase
  const sums: Record<string, { sum: number; n: number }> = {};
  for (const e of entries) {
    if (e.painVas == null) continue;
    const k = e.cyclePhase;
    const slot = sums[k] ?? { sum: 0, n: 0 };
    slot.sum += e.painVas;
    slot.n += 1;
    sums[k] = slot;
  }
  const phaseAverages = Object.entries(sums).map(([phase, { sum, n }]) => ({
    phase,
    avg: sum / n,
  }));

  if (phaseAverages.length === 0) {
    return {
      question: "Cyclicity",
      group: "symptom_pattern",
      answer: "Awaiting data",
      awaiting: true,
      sources: [],
    };
  }

  const peak = phaseAverages.reduce((a, b) => (b.avg > a.avg ? b : a));
  const trough = phaseAverages.reduce((a, b) => (b.avg < a.avg ? b : a));
  const swing = peak.avg - trough.avg;

  let answer: string;
  if (swing >= 3) {
    answer = `Strongly cyclical. Worst on ${peak.phase.replace("_", "-")} phase (mean VAS ${peak.avg.toFixed(1)}); calmest on ${trough.phase.replace("_", "-")} (mean VAS ${trough.avg.toFixed(1)}).`;
  } else if (swing >= 1.5) {
    answer = `Moderately cyclical. ${peak.phase.replace("_", "-")} highest (mean VAS ${peak.avg.toFixed(1)}).`;
  } else if (entries.some((e) => e.cyclePhase === "cycle_agnostic")) {
    answer = "Cyclicity not assessable yet — patient hasn't set last menstrual period.";
  } else {
    answer = `Largely non-cyclical. Pain steady across phases (range ${trough.avg.toFixed(1)}–${peak.avg.toFixed(1)}).`;
  }

  return {
    question: "Cyclicity",
    group: "symptom_pattern",
    answer,
    sources: [{ id: "journal", label: `${entries.length}-entry journal` }],
  };
}

function rowSeverityTrend(entries: JournalEntry[]): DerivedAnswer {
  if (entries.length < 4) {
    return {
      question: "Severity trend",
      group: "symptom_pattern",
      answer:
        entries.length === 0
          ? "Awaiting data"
          : `Insufficient data (${entries.length} entries; need at least 4)`,
      awaiting: true,
      sources: [],
    };
  }

  // Compare first half to second half VAS averages.
  const sorted = [...entries].sort((a, b) => a.entryDate.localeCompare(b.entryDate));
  const mid = Math.floor(sorted.length / 2);
  const first = sorted.slice(0, mid);
  const second = sorted.slice(mid);

  function avg(es: JournalEntry[]): number {
    const ps = es.map((e) => e.painVas).filter((v): v is number => v != null);
    if (ps.length === 0) return 0;
    return ps.reduce((a, b) => a + b, 0) / ps.length;
  }

  const oldAvg = avg(first);
  const newAvg = avg(second);
  const delta = newAvg - oldAvg;

  let answer: string;
  let flag: Exclude<RowFlag, null> | undefined;
  if (delta >= 1) {
    answer = `Worsening. Mean VAS ${oldAvg.toFixed(1)} → ${newAvg.toFixed(1)} across ${sorted.length} entries.`;
    flag = "treatment_escalation";
  } else if (delta <= -1) {
    answer = `Improving. Mean VAS ${oldAvg.toFixed(1)} → ${newAvg.toFixed(1)} across ${sorted.length} entries.`;
  } else {
    answer = `Stable. Mean VAS ${oldAvg.toFixed(1)} → ${newAvg.toFixed(1)} across ${sorted.length} entries.`;
  }

  return {
    question: "Severity trend",
    group: "symptom_pattern",
    answer,
    flag,
    sources: [{ id: "journal", label: `${sorted.length}-entry journal trend` }],
  };
}

function rowAnatomicalPattern(entries: JournalEntry[]): DerivedAnswer {
  const all = entries.flatMap((e) => e.painLocations);
  if (all.length === 0) {
    return {
      question: "Anatomical pattern",
      group: "symptom_pattern",
      answer: "Awaiting data",
      awaiting: true,
      sources: [],
    };
  }
  const tops = topCounts(all).slice(0, 3);
  const labels = tops.map((t) => `${t.value.toLowerCase()} (${t.count})`);
  return {
    question: "Anatomical pattern",
    group: "symptom_pattern",
    answer: `Most reported: ${labels.join(", ")}.`,
    sources: [{ id: "journal", label: "Journal pain locations" }],
  };
}

function rowBowel(entries: JournalEntry[]): DerivedAnswer {
  const all = entries.flatMap((e) => e.bowelSymptoms);
  if (all.length === 0) {
    return {
      question: "Bowel involvement",
      group: "organ_involvement",
      answer: "Not reported in last 30 entries.",
      sources: [{ id: "journal", label: "Journal" }],
    };
  }
  const tops = topCounts(all).slice(0, 3);
  return {
    question: "Bowel involvement",
    group: "organ_involvement",
    answer: tops.map((t) => `${t.value.toLowerCase()} (${t.count})`).join(", ") + ".",
    sources: [{ id: "journal", label: "Journal bowel symptoms" }],
  };
}

function rowBladder(entries: JournalEntry[]): DerivedAnswer {
  const all = entries.flatMap((e) => e.bladderSymptoms);
  if (all.length === 0) {
    return {
      question: "Bladder involvement",
      group: "organ_involvement",
      answer: "Not reported in last 30 entries.",
      sources: [{ id: "journal", label: "Journal" }],
    };
  }
  const tops = topCounts(all).slice(0, 3);
  return {
    question: "Bladder involvement",
    group: "organ_involvement",
    answer: tops.map((t) => `${t.value.toLowerCase()} (${t.count})`).join(", ") + ".",
    sources: [{ id: "journal", label: "Journal bladder symptoms" }],
  };
}

function rowSexual(entries: JournalEntry[]): DerivedAnswer {
  const yes = entries.filter((e) => e.dyspareunia === true);
  const total = entries.filter((e) => e.dyspareunia != null).length;
  if (total === 0) {
    return {
      question: "Sexual function",
      group: "organ_involvement",
      answer: "Not reported.",
      sources: [{ id: "journal", label: "Journal" }],
    };
  }
  const recent = yes
    .map((e) => e.entryDate)
    .sort()
    .reverse()[0];
  return {
    question: "Sexual function",
    group: "organ_involvement",
    answer:
      yes.length === 0
        ? `No dyspareunia reported across ${total} entries.`
        : `Dyspareunia in ${yes.length}/${total} entries. Most recent: ${recent ? new Date(recent + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"}.`,
    sources: [{ id: "journal", label: "Journal dyspareunia field" }],
  };
}

function rowBleeding(entries: JournalEntry[]): DerivedAnswer {
  const heavy = entries.filter((e) =>
    ["heavy", "very_heavy"].includes(e.bleedingHeaviness),
  );
  const all = entries.filter((e) => e.bleedingHeaviness !== "none");
  if (all.length === 0) {
    return {
      question: "Heavy menstrual bleeding",
      group: "bleeding_family",
      answer: "No bleeding reported in last 30 entries.",
      sources: [{ id: "journal", label: "Journal" }],
    };
  }
  const heaviest = all.reduce((a, b) => {
    const order = [
      "none",
      "spotting",
      "light",
      "moderate",
      "heavy",
      "very_heavy",
    ];
    return order.indexOf(b.bleedingHeaviness) > order.indexOf(a.bleedingHeaviness)
      ? b
      : a;
  });
  const flag =
    heavy.length >= 2 ? "adenomyosis_consideration" : undefined;
  return {
    question: "Heavy menstrual bleeding",
    group: "bleeding_family",
    answer: `Heaviest reported: ${describeBleeding(heaviest.bleedingHeaviness)}. ${heavy.length}/${all.length} entries flagged heavy or very heavy. PBAC capture not yet wired.`,
    flag,
    sources: [{ id: "journal", label: "Journal bleeding heaviness" }],
  };
}

function rowFamilyHistory(): DerivedAnswer {
  return {
    question: "Family history",
    group: "bleeding_family",
    answer: "Awaiting data",
    awaiting: true,
    sources: [],
  };
}

function rowTreatments(): DerivedAnswer {
  return {
    question: "Treatment trial history",
    group: "investigations_treatment_fertility",
    answer: "Awaiting data",
    awaiting: true,
    sources: [],
  };
}

function rowPriorImaging(payload: CSDPayload | null): DerivedAnswer {
  const docs = payload?.uploadedDocuments ?? [];
  const imaging = docs.filter((d) => d.kind.includes("tvs") || d.kind.includes("mri"));
  if (imaging.length === 0) {
    return {
      question: "Prior imaging",
      group: "investigations_treatment_fertility",
      answer: "No imaging in record.",
      flag: "imaging_gap",
      sources: [],
    };
  }
  return {
    question: "Prior imaging",
    group: "investigations_treatment_fertility",
    answer: imaging
      .map((d) => `${d.kind.toUpperCase()} ${d.performedAt}: ${d.summary.slice(0, 80)}…`)
      .join(" · "),
    sources: imaging.map((d) => ({ id: d.sourceId, label: d.kind.toUpperCase() })),
  };
}

function rowPriorSurgery(): DerivedAnswer {
  return {
    question: "Prior surgery",
    group: "investigations_treatment_fertility",
    answer: "Awaiting data",
    awaiting: true,
    sources: [],
  };
}

function rowFertility(): DerivedAnswer {
  return {
    question: "Fertility status and intent",
    group: "investigations_treatment_fertility",
    answer: "Awaiting data",
    awaiting: true,
    sources: [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public entry
// ─────────────────────────────────────────────────────────────────────────────
export function deriveRapidAnswers(
  entries: JournalEntry[],
  payload: CSDPayload | null,
): DerivedAnswer[] {
  return [
    rowAgeOnset(),
    rowCyclicity(entries),
    rowSeverityTrend(entries),
    rowAnatomicalPattern(entries),
    rowBowel(entries),
    rowBladder(entries),
    rowSexual(entries),
    rowBleeding(entries),
    rowFamilyHistory(),
    rowTreatments(),
    rowPriorImaging(payload),
    rowPriorSurgery(),
    rowFertility(),
  ];
}
