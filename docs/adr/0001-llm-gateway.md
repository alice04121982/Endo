# ADR 0001 — Single server-side LLM gateway with hash-chained audit log

- **Status:** accepted
- **Date:** 2026-05-07
- **Decision drivers:** UK MDR 2002 Class IIa SaMD requirements; brief sections "Critical regulatory framing" and "Audit and logging".

## Context

Endo is being built to Class IIa standards from day one. The brief mandates that:

- Every AI-generated clinical output is labelled, traceable to source data, and reviewable by a clinician.
- Outputs are framed as "clinical considerations", never diagnoses.
- A persistent disclaimer states outputs are decision support, not medical advice.
- Red-flag triage outputs are unambiguous and never softened by AI rewriting.
- Every clinical-relevant output has an audit log row capturing input, model, prompt, output, and citations.

A typical Next.js application has multiple call sites that talk to a model SDK directly. That topology is incompatible with the requirements above: it is impossible to retroactively prove that every call was logged, that the disclaimer travelled with every output, or that the diagnostic-conclusion guard ran. Audit completeness has to be a property of the architecture, not of code review discipline.

## Decision

All clinical LLM calls flow through a single server-side gateway (`src/lib/llm/gateway.ts`). Application code does not import the model SDK; the gateway is the only module that does.

The gateway:

1. Validates a `GatewayRequest` shape (Zod).
2. Resolves the requested **task** from a code-defined registry. Each task declares: input schema, output schema, allowed audiences, model tier, prompt template version (semver), prompt block, citation policy, and optional default citations.
3. Validates task-specific inputs against the task's Zod input schema.
4. Builds the system prompt as `BASE_VOICE_RULES + audienceBlock + taskBlock`. Tasks cannot suppress the base rules — the gateway concatenates in this fixed order.
5. Calls Anthropic via AI SDK + Vercel AI Gateway using `generateObject` with the task's output schema for structured-output enforcement.
6. Re-validates the model output against the task schema (defensive).
7. Sweeps the serialised output for diagnostic-shaped statements (`detectsDiagnosticConclusion`). On positive match, the call is converted to `refused_diagnostic_conclusion` and the model output is suppressed.
8. Enforces the task's citation policy. Tasks tagged `requiresCitations: true` fail with `validation_failed` if no citations are present.
9. Appends a row to `llm_audit_log` via the security-definer stored procedure `llm_audit_log_append`. Every call writes a row regardless of outcome (success, refusal, validation failure, model error).
10. Returns a typed `GatewayResponse` carrying the disclaimer, the audit row id, the prompt template version, the model id, the citations, and the labelled output.

Public ingress is through `/api/llm/route.ts`. The route is server-only Node runtime; client components POST a `GatewayRequest` to it. Application servers, including Server Components and Server Actions, may import the gateway directly.

## Audit log shape

`supabase/migrations/001_audit_log.sql` defines `public.llm_audit_log`:

- Append-only: a `BEFORE UPDATE` and `BEFORE DELETE` trigger raises an exception on any mutation. RLS allows subjects (caller or patient) to `SELECT` their own rows; no `INSERT` policy exists. Writes go exclusively through the `llm_audit_log_append` security-definer function called by the service-role client.
- Hash-chained: each row carries `prev_hash` and `row_hash`. `row_hash = sha256(canonical_payload(prev_hash, row fields))`. The append procedure takes an `EXCLUSIVE` lock for the prev-hash read, so two concurrent appends cannot share a `prev_hash`.
- Verification: `llm_audit_log_verify_chain()` walks the table in insertion order and returns the first row id whose stored hash disagrees with the recomputed value, or NULL if the chain is intact. Off-platform tooling (regulatory inspection) calls this function.

Hash inputs are concatenated with `|` separators in a fixed field order, defined in `llm_audit_log_canonical_payload()`. The append and verify functions share that helper, so the hash specification lives in one place.

## Model tiering

Tasks declare a `modelTier` (`extraction`, `synthesis`, `clinician_query`). Tiers map to Anthropic model ids in `src/lib/llm/models.ts`:

| Tier              | Model (Vercel AI Gateway id)   | Use                                            |
|-------------------|--------------------------------|------------------------------------------------|
| extraction        | `anthropic/claude-haiku-4.5`   | voice-transcript → FHIR-shaped Observation     |
| synthesis         | `anthropic/claude-sonnet-4.6`  | CSD section narratives                         |
| clinician_query   | `anthropic/claude-opus-4.6`    | Rapid Answer Panel free-text Q&A               |

Opus 4.7 is the latest released by Anthropic but is not exposed through the
Vercel AI Gateway as of this build. The clinician-query tier is pinned to
Opus 4.6 with a follow-up to bump once the gateway routes 4.7.

Rotation does not require touching task code; only `models.ts` changes.

## Tradeoffs and what we are not doing

- **Prompt template storage in code, not DB.** A new task is a code change reviewable in PR. We accept the slower change cycle in exchange for review traceability and reproducibility (a historical audit row's `prompt_template_version` resolves to a specific git commit).
- **No streaming output yet.** `generateObject` is a single-response call. Streaming adds complexity in audit logging (when do you write the row?) and refusal detection (you cannot sweep a partial sentence). When a feature actually needs streaming, we will revisit.
- **No NICE/ESHRE guideline citations from the model yet.** The model only emits `source_data` citation hints. Guideline citations come from the gateway only, sourced from a separate registry that lands when the NICE NG73 prompter feature ships.
- **Refusal sweep is a regex over serialised output.** Coarse but cheap. The system prompt is the primary control. We will graduate to a classifier only if leakage rates demand it.
- **Auth not yet enforced on `/api/llm`.** The dev sandbox runs unauthenticated. The patient/clinician auth feature gates this route. Until that lands, the route must not be exposed publicly outside dev.
- **Region pinning deferred.** Supabase region not yet locked. No real patient data lands until it is. A `// TODO: region lock` flag is not present in code because the constraint is operational, not code-shaped.

## Consequences

- Every clinical output in Endo, forever, can be replayed from the audit log: input, prompt template at the version used, model, output, citations, refusal reason. This is what a Class IIa technical file expects.
- A regression that breaks the diagnostic-conclusion sweep cannot leak more than one output before it is caught — every call writes an audit row, and a separate scheduled scan flags `outcome != success` rates.
- Adding a feature that needs the LLM (CSD, voice extraction, Rapid Answer Panel free-text Q&A) is purely about adding a registered task. The gateway, audit, refusal, and citation machinery does not change per feature.

## References

- `src/lib/llm/gateway.ts`, `src/lib/llm/audience.ts`, `src/lib/llm/prompts/index.ts`, `src/lib/llm/refusal.ts`, `src/lib/llm/audit.ts`
- `supabase/migrations/001_audit_log.sql`
- `src/app/api/llm/route.ts`
- Brief sections "Critical regulatory framing", "Audit and logging", "Voice and tone"
