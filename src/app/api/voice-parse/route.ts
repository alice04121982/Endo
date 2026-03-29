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
  "cycle_agnostic",
] as const;

const extractedSchema = z.object({
  overall_vas: z
    .number()
    .min(0)
    .max(10)
    .nullable()
    .describe("Overall pain level 0-10, null if not mentioned"),
  fatigue_vas: z
    .number()
    .min(0)
    .max(10)
    .nullable()
    .describe("Fatigue level 0-10, null if not mentioned"),
  mood_score: z
    .number()
    .min(1)
    .max(5)
    .nullable()
    .describe("Mood 1–5 (1=awful, 5=great), null if not mentioned"),
  sleep_quality: z
    .number()
    .min(1)
    .max(5)
    .nullable()
    .describe("Sleep quality 1–5 (1=terrible, 5=excellent), null if not mentioned"),
  endo_belly_severity: z
    .number()
    .min(0)
    .max(10)
    .nullable()
    .describe("Bloating/endo belly severity 0-10, null if not mentioned"),
  gut_bladder_symptoms: z
    .array(z.enum(GUT_BLADDER_VALUES))
    .describe("Gut and bladder symptoms explicitly mentioned"),
  cycle_phase: z
    .enum(CYCLE_PHASE_VALUES)
    .nullable()
    .describe("Current cycle phase if mentioned"),
  notes: z
    .string()
    .nullable()
    .describe("Any other relevant details as a short note"),
});

export type VoiceExtractedData = z.infer<typeof extractedSchema>;

const SYSTEM_PROMPT = `You are a symptom extraction assistant for Endo, an endometriosis tracking app.
Extract structured symptom data from voice transcripts.

Numeric scale guidance (use these mappings):
Pain/severity 0 to 10: "excruciating/unbearable" maps to 9 or 10, "really bad/severe" maps to 7 or 8, "moderate/quite bad" maps to 5 or 6, "mild/a bit" maps to 2 to 4, "none/fine" maps to 0 or 1.
Mood 1 to 5: "awful/depressed/really low" = 1, "low/not great" = 2, "okay/neutral" = 3, "good/decent" = 4, "great/happy" = 5.
Sleep 1 to 5: "terrible/barely slept" = 1, "poor/not great" = 2, "okay/alright" = 3, "good" = 4, "excellent/amazing" = 5.

Cycle phase: "period/menstruating" → menstrual, "after period" → follicular, "ovulating/mid-cycle" → ovulatory, "PMS/before period/luteal" → luteal.

Gut and bladder: listen for bloating, endo belly, constipation, diarrhea, painful bowel movements, urinary frequency or urgency, painful urination, rectal bleeding, incomplete evacuation.

Only extract values explicitly or clearly implied. Use null for anything not mentioned. Return an empty array for gut_bladder_symptoms if none mentioned.`;

export async function POST(request: NextRequest) {
  // Gateway auth via OIDC — run `vercel env pull` to provision VERCEL_OIDC_TOKEN locally.
  // On Vercel deployments the token is auto-refreshed; no secrets to manage.
  if (!process.env.VERCEL_OIDC_TOKEN) {
    return NextResponse.json(
      {
        error:
          "AI Gateway not configured. Run `vercel link` then `vercel env pull` to provision OIDC credentials.",
      },
      { status: 503 }
    );
  }

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
      model: gateway("anthropic/claude-haiku-4.5"),
      output: Output.object({ schema: extractedSchema }),
      system: SYSTEM_PROMPT,
      prompt: `Extract symptom data from this voice recording transcript:\n\n"${transcript}"`,
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
