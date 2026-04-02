import { generateText, Output } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

const GUT_BLADDER_VALUES = [
  "urinary_frequency",
  "urinary_urgency",
  "painful_urination",
  "constipation",
  "diarrhea",
  "painful_bowel",
  "bloating_endo_belly",
  "incomplete_evacuation",
  "rectal_bleeding",
] as const;

const CYCLE_PHASE_VALUES = [
  "menstrual",
  "follicular",
  "ovulatory",
  "luteal",
] as const;

const BLEEDING_VALUES = ["light", "moderate", "heavy", "very_heavy"] as const;

const extractedSchema = z.object({
  overall_vas: z
    .number().min(0).max(10).nullable()
    .describe("Overall pain level 0-10, null if not mentioned"),
  fatigue_vas: z
    .number().min(0).max(10).nullable()
    .describe("Fatigue level 0-10, null if not mentioned"),
  mood_score: z
    .number().min(1).max(5).nullable()
    .describe("Mood 1–5 (1=awful, 5=great), null if not mentioned"),
  // Period-specific
  period_pain_vas: z
    .number().min(0).max(10).nullable()
    .describe("Period pain specifically 0-10, null if not mentioned"),
  period_duration_hours: z
    .number().nullable()
    .describe("How long period pain lasts in hours (e.g. '2 days' = 48), null if not mentioned"),
  bleeding_heaviness: z
    .enum(BLEEDING_VALUES).nullable()
    .describe("Bleeding heaviness: light/moderate/heavy/very_heavy, null if not mentioned"),
  cycle_phase: z
    .enum(CYCLE_PHASE_VALUES).nullable()
    .describe("Current cycle phase if mentioned"),
  // Symptom flags
  gut_bladder_symptoms: z
    .array(z.enum(GUT_BLADDER_VALUES))
    .describe("Gut and bladder symptoms explicitly mentioned"),
  has_pelvic_pain: z.boolean().describe("Pelvic pain mentioned"),
  has_bloating: z.boolean().describe("Bloating or endo belly mentioned"),
  has_nausea: z.boolean().describe("Nausea mentioned"),
  has_painful_intercourse: z.boolean().describe("Pain during sex/intercourse mentioned"),
  has_bowel_symptoms: z.boolean().describe("Any bowel symptoms mentioned"),
  has_bladder_symptoms: z.boolean().describe("Any bladder symptoms mentioned"),
  endo_belly_severity: z
    .number().min(0).max(10).nullable()
    .describe("Endo belly / abdominal bloating severity 0-10, null if not mentioned"),
  sleep_quality: z
    .number().min(1).max(5).nullable()
    .describe("Sleep quality 1–5 (1=terrible, 5=excellent), null if not mentioned"),
  notes: z
    .string().nullable()
    .describe("Any other relevant details as a short note, summarising what wasn't captured in structured fields"),
});

export type VoiceExtractedData = z.infer<typeof extractedSchema>;

const SYSTEM_PROMPT = `You are a symptom extraction assistant for EndoLink, an endometriosis clinical decision support app.
Extract structured symptom data from patient voice transcripts. Patients may speak conversationally — interpret naturally.

NUMERIC SCALES:
Pain/severity 0–10: "excruciating/unbearable" → 9–10, "really bad/severe" → 7–8, "moderate/quite bad" → 5–6, "mild/a bit" → 2–4, "none/fine" → 0–1
Mood 1–5: "awful/depressed/really low" → 1, "low/not great" → 2, "okay/neutral" → 3, "good/decent" → 4, "great/happy" → 5

PERIOD PAIN: Listen for mentions of period pain, cramps, dysmenorrhoea, menstrual pain — capture separately from general pelvic pain.
DURATION: "a few hours" → 3–4h, "all day" → 12–16h, "a day" → 24h, "2 days" → 48h, "all week" → 120h.
BLEEDING: "spotting/light" → light, "normal" → moderate, "heavy/flooding/lots of clots" → heavy, "extremely heavy/can't leave house" → very_heavy.
CYCLE PHASE: "period/menstruating/on my period" → menstrual, "just finished period/after period" → follicular, "ovulating/mid-cycle" → ovulatory, "PMS/before period/luteal phase" → luteal.

GUT/BLADDER: Listen for bloating, endo belly, constipation, diarrhoea, painful bowel movements, needing to wee a lot, urgency, painful urination, rectal bleeding, incomplete evacuation.

Only extract values explicitly or clearly implied. Use null for anything not mentioned. Boolean symptoms default to false unless mentioned.`;

export async function POST(request: NextRequest) {
  if (!process.env.VERCEL_OIDC_TOKEN) {
    return NextResponse.json(
      { error: "AI Gateway not configured. Run `vercel link` then `vercel env pull` to provision OIDC credentials." },
      { status: 503 }
    );
  }

  const model = gateway("anthropic/claude-haiku-4.5");

  let transcript: string;
  try {
    const body = await request.json();
    transcript = body.transcript;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!transcript?.trim()) {
    return NextResponse.json({ error: "No transcript provided" }, { status: 400 });
  }

  try {
    const result = await generateText({
      model: model,
      output: Output.object({ schema: extractedSchema }),
      system: SYSTEM_PROMPT,
      prompt: `Extract symptom data from this patient voice recording:\n\n"${transcript}"`,
    });

    return NextResponse.json(result.experimental_output);
  } catch (err) {
    console.error("[voice-parse] Error:", err);
    return NextResponse.json(
      { error: "Failed to parse symptoms from transcript" },
      { status: 500 }
    );
  }
}
