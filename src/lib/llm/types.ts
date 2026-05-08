import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// Audience
// ─────────────────────────────────────────────────────────────────────────────
// Every clinical LLM call is framed for one of two audiences. The gateway
// injects the audience-appropriate system prompt; tasks cannot bypass this.
export const AudienceSchema = z.enum(["patient", "clinician"]);
export type Audience = z.infer<typeof AudienceSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Citations
// ─────────────────────────────────────────────────────────────────────────────
// Every output that makes a clinical claim must cite either:
//   - source_data: a data point in the patient's own record (entry id,
//     observation id, document id) so a reader can trace the claim back, or
//   - guideline: a NICE NG73 recommendation or ESHRE guideline section
//     that drove the framing.
// Citations are validated at the gateway; tasks declare a citation policy.
export const CitationSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("source_data"),
    sourceId: z.string().min(1),
    label: z.string().min(1),
  }),
  z.object({
    kind: z.literal("guideline"),
    body: z.enum(["NICE_NG73", "ESHRE", "rASRM", "Enzian"]),
    reference: z.string().min(1), // e.g. "NG73 1.5.2 (Nov 2024)"
    label: z.string().min(1),
  }),
]);
export type Citation = z.infer<typeof CitationSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Outcome
// ─────────────────────────────────────────────────────────────────────────────
export const OutcomeSchema = z.enum([
  "success",
  "refused_diagnostic_conclusion",
  "refused_red_flag_routing",
  "validation_failed",
  "model_error",
  "rate_limited",
]);
export type Outcome = z.infer<typeof OutcomeSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Gateway request
// ─────────────────────────────────────────────────────────────────────────────
// callerSubjectId and patientSubjectId are required at the call site, but
// optional in this schema because the dev sandbox runs unauthenticated.
// The production /api/llm route will enforce auth and reject anonymous calls.
export const GatewayRequestSchema = z.object({
  audience: AudienceSchema,
  task: z.string().min(1),
  inputs: z.record(z.string(), z.unknown()),
  callerSubjectId: z.string().uuid().nullable(),
  patientSubjectId: z.string().uuid().nullable(),
  consentTokenId: z.string().uuid().nullable().optional(),
});
export type GatewayRequest = z.infer<typeof GatewayRequestSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Gateway response
// ─────────────────────────────────────────────────────────────────────────────
// Every response is labelled aiGenerated:true and carries a reviewStatus.
// reviewStatus is always 'pending_clinician_review' on output; a downstream
// clinician review action moves it to 'reviewed' (separate table, later).
export const GatewayResponseSchema = z.object({
  outputId: z.string().uuid(),
  auditEntryId: z.string().uuid(),
  aiGenerated: z.literal(true),
  reviewStatus: z.literal("pending_clinician_review"),
  audience: AudienceSchema,
  taskName: z.string(),
  modelId: z.string(),
  promptTemplateVersion: z.string(),
  output: z.unknown().nullable(),
  citations: z.array(CitationSchema),
  outcome: OutcomeSchema,
  refusalReason: z.string().nullable(),
  disclaimer: z.string(),
});
export type GatewayResponse = z.infer<typeof GatewayResponseSchema>;
