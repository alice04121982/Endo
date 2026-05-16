// PBAC (Pictorial Blood-loss Assessment Chart) — Higham scoring.
//
// Heavy menstrual bleeding is defined as a PBAC score > 100 in the
// validated Higham instrument. This module computes the score from a
// structured count of pads, tampons, and clots used over a single cycle.
//
// Reference: Higham, O'Brien, Shaw 1990. The weights below are the
// published values; they are not invented.
//
// This module is purely deterministic — the journal feature uses it to
// flag heavy menstrual bleeding without an LLM in the trigger path.

export interface PbacInputs {
  // Pads
  padsLightlyStained: number;
  padsModeratelyStained: number;
  padsSaturated: number;

  // Tampons
  tamponsLightlyStained: number;
  tamponsModeratelyStained: number;
  tamponsSaturated: number;

  // Clots (visual reference: 1p = small, 50p = large)
  clotsSmall: number;
  clotsLarge: number;

  // Optional: number of times in the cycle the patient experienced flooding
  flooding: number;
}

export const PBAC_WEIGHTS = {
  padsLightlyStained: 1,
  padsModeratelyStained: 5,
  padsSaturated: 20,
  tamponsLightlyStained: 1,
  tamponsModeratelyStained: 5,
  tamponsSaturated: 10,
  clotsSmall: 1,
  clotsLarge: 5,
  flooding: 5,
} as const satisfies Record<keyof PbacInputs, number>;

export const PBAC_HMB_THRESHOLD = 100;

export function computePbacScore(inputs: PbacInputs): number {
  let total = 0;
  for (const key of Object.keys(PBAC_WEIGHTS) as (keyof PbacInputs)[]) {
    const count = Math.max(0, Math.floor(inputs[key] ?? 0));
    total += count * PBAC_WEIGHTS[key];
  }
  return total;
}

export function isHeavyMenstrualBleeding(score: number): boolean {
  return score > PBAC_HMB_THRESHOLD;
}

/**
 * Empty input — used as a starting point for forms.
 */
export const EMPTY_PBAC: PbacInputs = {
  padsLightlyStained: 0,
  padsModeratelyStained: 0,
  padsSaturated: 0,
  tamponsLightlyStained: 0,
  tamponsModeratelyStained: 0,
  tamponsSaturated: 0,
  clotsSmall: 0,
  clotsLarge: 0,
  flooding: 0,
};
