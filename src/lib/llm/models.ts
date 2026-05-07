// Model tier mapping. The gateway resolves a tier to a concrete model id
// at call time so we can rotate model versions without touching task code.
//
// Decision (2026-05-07): tiered defaults — Haiku for extraction, Sonnet for
// synthesis, Opus for the clinician free-text query. See ADR 0001.
//
// IDs use the Vercel AI Gateway dotted form (anthropic/claude-<size>-<ver>).
// The gateway prefix is added at call time. Opus 4.7 not yet exposed via the
// gateway as of this build; pinned to 4.6 with a follow-up to bump when it
// lands.

export type ModelTier = "extraction" | "synthesis" | "clinician_query";

const MODEL_BY_TIER: Record<ModelTier, string> = {
  extraction: "claude-haiku-4.5",
  synthesis: "claude-sonnet-4.6",
  clinician_query: "claude-opus-4.6",
};

export function resolveModel(tier: ModelTier): string {
  return MODEL_BY_TIER[tier];
}
