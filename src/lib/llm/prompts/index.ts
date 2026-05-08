import { z } from "zod";
import type { ModelTier } from "../models";
import type { Audience, Citation } from "../types";

// A registered task is a tuple of:
//   - input Zod schema (validated before model call)
//   - output Zod schema (validated after model call)
//   - allowed audiences
//   - model tier
//   - prompt template version (semver)
//   - task block (appended to base voice + audience block)
//   - citation policy: must declare whether citations are required
//
// Tasks are registered in code, not in the database. Adding a task is a code
// change, reviewable in PR. The audit log captures the version string so any
// historical replay can find the exact template that generated an output.

export interface TaskDefinition<I, O> {
  name: string;
  version: string; // "<task>@<semver>"
  audiences: readonly Audience[];
  modelTier: ModelTier;
  inputSchema: z.ZodType<I>;
  outputSchema: z.ZodType<O>;
  buildTaskBlock: (audience: Audience) => string;
  requiresCitations: boolean;
  // Permits the gateway to attach default citations harvested from inputs
  // (e.g. the source utterance id) without going to the model.
  defaultCitations?: (input: I) => Citation[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Task: extract-symptom-from-voice
// Tier: extraction (Haiku)
// Used by: voice-first pain journal (feature 2 of the brief)
// ─────────────────────────────────────────────────────────────────────────────
const ExtractSymptomInput = z.object({
  utteranceId: z.string().min(1),
  transcript: z.string().min(1),
});
const ExtractSymptomOutput = z.object({
  plainSummary: z.string().min(1),
  observations: z.array(
    z.object({
      kind: z.enum([
        "pain_severity_vas",
        "pain_location",
        "dyspareunia",
        "bowel_symptom",
        "bladder_symptom",
        "bleeding",
        "fatigue",
        "mood",
        "trigger",
        "relief",
        "other",
      ]),
      value: z.string(),
      cycleDay: z.number().int().min(1).max(60).nullable(),
    }),
  ),
});

const extractSymptomTask: TaskDefinition<
  z.infer<typeof ExtractSymptomInput>,
  z.infer<typeof ExtractSymptomOutput>
> = {
  name: "extract-symptom-from-voice",
  version: "extract-symptom-from-voice@0.1.0",
  audiences: ["patient"],
  modelTier: "extraction",
  inputSchema: ExtractSymptomInput,
  outputSchema: ExtractSymptomOutput,
  requiresCitations: true,
  defaultCitations: (input) => [
    {
      kind: "source_data",
      sourceId: input.utteranceId,
      label: "Patient voice utterance",
    },
  ],
  buildTaskBlock: () => `\
Task: extract structured pain-journal observations from a patient's voice transcript.

Output JSON only, conforming to this shape:
{
  "plainSummary": string,
  "observations": Array<{
    "kind": "pain_severity_vas"|"pain_location"|"dyspareunia"|"bowel_symptom"|
            "bladder_symptom"|"bleeding"|"fatigue"|"mood"|"trigger"|"relief"|"other",
    "value": string,
    "cycleDay": number | null
  }>
}

The "plainSummary" is what we will read back to the patient for confirmation.
Use the patient's own words where possible. Do not infer information that is
not in the transcript. If the transcript does not mention a field, omit the
observation rather than guessing.`,
};

// ─────────────────────────────────────────────────────────────────────────────
// Task: synth-csd-section
// Tier: synthesis (Sonnet)
// Used by: Cumulative Symptom Dossier (feature 5 of the brief)
// ─────────────────────────────────────────────────────────────────────────────
const SynthCsdInput = z.object({
  section: z.enum([
    "presenting_history",
    "treatment_trial",
    "imaging_summary",
    "qol_trend",
  ]),
  structuredData: z.record(z.string(), z.unknown()),
});
const SynthCsdOutput = z.object({
  body: z.string().min(1),
  citationsHint: z
    .array(z.object({ sourceId: z.string(), label: z.string() }))
    .default([]),
});

const synthCsdSectionTask: TaskDefinition<
  z.infer<typeof SynthCsdInput>,
  z.infer<typeof SynthCsdOutput>
> = {
  name: "synth-csd-section",
  version: "synth-csd-section@0.1.0",
  audiences: ["patient", "clinician"],
  modelTier: "synthesis",
  inputSchema: SynthCsdInput,
  outputSchema: SynthCsdOutput,
  requiresCitations: true,
  buildTaskBlock: (audience) => `\
Task: write one section of the Cumulative Symptom Dossier from structured data.

You are given JSON describing a patient's record. Produce a single section's
narrative for the requested audience. Do not invent facts. Every clinical
claim must reference a source data point id in the citationsHint array; the
gateway will surface those citations next to the body.

${
  audience === "patient"
    ? "Length: 60-90 words. Tone: empathetic, plain English."
    : "Length: 50-70 words, bullet-friendly. Tone: terse, NICE/ESHRE terminology."
}

Output JSON only:
{ "body": string, "citationsHint": Array<{ "sourceId": string, "label": string }> }`,
};

// ─────────────────────────────────────────────────────────────────────────────
// Task: generate-csd-view
// Tier: synthesis (Sonnet)
// Used by: Cumulative Symptom Dossier — both audiences are generated from
// the same typed payload. The gateway is invoked once per audience with
// identical inputs; the audience parameter governs voice. This is the
// brief's "never re-prompted independently" rule.
// ─────────────────────────────────────────────────────────────────────────────
const GenerateCsdInput = z.object({
  payload: z.record(z.string(), z.unknown()),
  audience: z.enum(["patient", "clinician"]),
});
const GenerateCsdOutput = z.object({
  body: z.string().min(1),
  citationsHint: z
    .array(z.object({ sourceId: z.string(), label: z.string() }))
    .min(1),
});

const generateCsdViewTask: TaskDefinition<
  z.infer<typeof GenerateCsdInput>,
  z.infer<typeof GenerateCsdOutput>
> = {
  name: "generate-csd-view",
  version: "generate-csd-view@0.1.0",
  audiences: ["patient", "clinician"],
  modelTier: "synthesis",
  inputSchema: GenerateCsdInput,
  outputSchema: GenerateCsdOutput,
  requiresCitations: true,
  buildTaskBlock: (audience) => `\
Task: write the Cumulative Symptom Dossier from the structured payload below.

You are given a JSON payload describing a patient's record. Produce a
single, one-page narrative ${
    audience === "patient"
      ? "for the patient herself, in empathetic British English. Write directly to her using \"you\" and \"your\". Length: 180–260 words."
      : "for a clinician. NICE NG73 / ESHRE / rASRM / Enzian terminology where applicable. Bullet structure where it helps clarity. Length: 140–200 words."
  }

Rules:
- Frame everything as a clinical consideration. Never use \"diagnose\",
  \"diagnosis\", \"definitive\", \"you have endometriosis\",
  \"confirms endometriosis\", or any equivalent.
- Every clinical claim must reference a sourceId from the payload via
  citationsHint. If the payload doesn't support a claim, do not make it.
- Do not invent imaging findings, treatments, or family history that
  the payload doesn't list.
- If the payload includes a NICE gap or an adenomyosis flag, surface it
  as a discussion point — never as an action you have decided.

Output JSON only:
{
  "body": string,
  "citationsHint": Array<{ "sourceId": string, "label": string }>
}`,
};

// ─────────────────────────────────────────────────────────────────────────────
// Task: clinician-freetext-qa
// Tier: clinician_query (Opus)
// Used by: Rapid Answer Panel free-text query field (feature 9 of the brief)
// ─────────────────────────────────────────────────────────────────────────────
const ClinicianQaInput = z.object({
  question: z.string().min(1),
  recordSnapshot: z.record(z.string(), z.unknown()),
});
const ClinicianQaOutput = z.object({
  answer: z.string().min(1),
  citationsHint: z
    .array(z.object({ sourceId: z.string(), label: z.string() }))
    .min(1, "clinician answers must cite at least one source"),
});

const clinicianQaTask: TaskDefinition<
  z.infer<typeof ClinicianQaInput>,
  z.infer<typeof ClinicianQaOutput>
> = {
  name: "clinician-freetext-qa",
  version: "clinician-freetext-qa@0.1.0",
  audiences: ["clinician"],
  modelTier: "clinician_query",
  inputSchema: ClinicianQaInput,
  outputSchema: ClinicianQaOutput,
  requiresCitations: true,
  buildTaskBlock: () => `\
Task: answer a clinician's free-text question about a patient's record.

You are given a JSON snapshot of the patient's record and a question. Synthesise
a concise, evidence-grounded answer.

Rules:
- One paragraph maximum. Be terse.
- Cite the source data point id for every clinical claim via citationsHint.
- If the record does not contain the answer, say so plainly. Do not extrapolate.
- Never produce a diagnostic conclusion. Use "consistent with", "suggestive of",
  or "consideration for" framings.

Output JSON only:
{ "answer": string, "citationsHint": Array<{ "sourceId": string, "label": string }> }`,
};

// ─────────────────────────────────────────────────────────────────────────────
// Registry
// ─────────────────────────────────────────────────────────────────────────────
// Each task constant is strongly typed individually. The registry itself
// erases the parameter types because TaskDefinition's input parameter
// (defaultCitations, inputSchema) is contravariant and a Record of
// concrete-typed tasks doesn't widen to TaskDefinition<unknown, unknown>.
// Callers re-derive types via the task's own schemas.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTaskDefinition = TaskDefinition<any, any>;

const REGISTRY: Record<string, AnyTaskDefinition> = {
  [extractSymptomTask.name]: extractSymptomTask,
  [synthCsdSectionTask.name]: synthCsdSectionTask,
  [generateCsdViewTask.name]: generateCsdViewTask,
  [clinicianQaTask.name]: clinicianQaTask,
};

export function getTask(name: string): AnyTaskDefinition | null {
  return REGISTRY[name] ?? null;
}

export function listTaskNames(): string[] {
  return Object.keys(REGISTRY);
}
