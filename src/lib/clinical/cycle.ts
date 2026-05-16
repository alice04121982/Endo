// Cycle-day and cycle-phase computation. Deterministic, rule-based — no
// LLM in the trigger path.
//
// Phase boundaries follow the standard textbook division for an average
// cycle length. Real menstrual physiology is more variable; this is a
// useful approximation for the journal's overlay, NOT a clinical
// determination. The boundaries are visible in the patient view of the
// dossier and configurable in a future settings surface.

export type CyclePhase =
  | "menstrual"
  | "follicular"
  | "ovulatory"
  | "luteal"
  | "cycle_agnostic";

export const DEFAULT_CYCLE_LENGTH_DAYS = 28;

/** Days between two dates, normalised to the date components only. */
function daysBetween(from: string | Date, to: string | Date): number {
  const a = typeof from === "string" ? new Date(from + "T00:00:00") : new Date(from);
  const b = typeof to === "string" ? new Date(to + "T00:00:00") : new Date(to);
  const ms = b.getTime() - a.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

/**
 * Compute the cycle day for a given entry date, given the patient's last
 * menstrual period start and average cycle length. Returns null when LMP
 * is unknown (cycle-agnostic mode).
 *
 * Cycle day 1 = first day of menses. If the entry date is before the
 * stored LMP (back-fill), we wrap one cycle backwards.
 */
export function computeCycleDay(
  entryDate: string | Date,
  lastMenstrualPeriodStart: string | Date | null,
  averageCycleLengthDays: number | null,
): number | null {
  if (!lastMenstrualPeriodStart) return null;
  const cycleLen = averageCycleLengthDays ?? DEFAULT_CYCLE_LENGTH_DAYS;
  const diff = daysBetween(lastMenstrualPeriodStart, entryDate);

  // Wrap the diff into the cycle range [1..cycleLen]
  const day = ((diff % cycleLen) + cycleLen) % cycleLen + 1;
  return day;
}

/**
 * Map a cycle day to a phase. Boundaries assume a 28-day cycle and scale
 * proportionally for shorter / longer cycles. Specifically:
 *   menstrual:   days 1–5 (scaled)
 *   follicular:  days 6–13 (scaled)
 *   ovulatory:   days 14–15 (scaled)
 *   luteal:      day 16 onward (scaled)
 */
export function computeCyclePhase(
  cycleDay: number | null,
  averageCycleLengthDays: number | null,
): CyclePhase {
  if (cycleDay == null) return "cycle_agnostic";
  const cycleLen = averageCycleLengthDays ?? DEFAULT_CYCLE_LENGTH_DAYS;
  const ratio = cycleDay / cycleLen;
  if (ratio <= 5 / 28) return "menstrual";
  if (ratio <= 13 / 28) return "follicular";
  if (ratio <= 15 / 28) return "ovulatory";
  return "luteal";
}

export function describeCyclePhase(p: CyclePhase): string {
  switch (p) {
    case "menstrual":
      return "Period";
    case "follicular":
      return "Follicular";
    case "ovulatory":
      return "Ovulatory";
    case "luteal":
      return "Luteal";
    default:
      return "Cycle-agnostic";
  }
}
