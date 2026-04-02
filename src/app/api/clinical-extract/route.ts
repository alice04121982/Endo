import { generateText, Output } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

/**
 * Extracts structured clinical fields from a consultation transcript.
 * Maps spoken consultation history to PatientHistory fields.
 * All fields nullable — only populated when clearly stated in transcript.
 */
const clinicalSchema = z.object({
  // Demographics
  age: z.number().int().min(10).max(80).nullable()
    .describe("Patient's age in years, null if not stated"),
  bmi: z.number().min(10).max(60).nullable()
    .describe("BMI if mentioned, null if not stated"),

  // Menstrual history
  menarche_age: z.number().int().min(8).max(20).nullable()
    .describe("Age at first period (menarche), null if not stated"),
  cycle_length_days: z.number().int().min(14).max(60).nullable()
    .describe("Menstrual cycle length in days, null if not stated"),
  cycle_regularity: z.enum(["regular", "irregular", "absent"]).nullable()
    .describe("Cycle regularity, null if not stated"),
  dysmenorrhoea_severity: z.number().min(0).max(10).nullable()
    .describe("Period pain severity 0-10 VAS. Map verbal descriptors: 'mild'=2-3, 'moderate'=5-6, 'severe'=7-8, 'excruciating'=9-10. Null if not stated."),
  dysmenorrhoea_onset_age: z.number().int().min(8).max(40).nullable()
    .describe("Age when period pain started, null if not stated"),
  symptom_duration_months: z.number().int().min(0).nullable()
    .describe("How long symptoms have been present in months. Convert years to months. Null if not stated."),

  // Reproductive
  gravidity: z.number().int().min(0).nullable()
    .describe("Number of pregnancies (gravidity), null if not stated"),
  parity: z.number().int().min(0).nullable()
    .describe("Number of births (parity), null if not stated"),
  fertility_concerns: z.boolean().nullable()
    .describe("Whether patient has expressed fertility concerns, null if not mentioned"),

  // Pain profile
  chronic_pelvic_pain: z.boolean().nullable()
    .describe("Chronic pelvic pain present, null if not mentioned"),
  dyspareunia: z.boolean().nullable()
    .describe("Pain during sexual intercourse (dyspareunia), null if not mentioned"),
  dyschezia: z.boolean().nullable()
    .describe("Painful bowel movements (dyschezia), null if not mentioned"),
  dysuria: z.boolean().nullable()
    .describe("Painful urination (dysuria), null if not mentioned"),
  cyclical_bowel_symptoms: z.boolean().nullable()
    .describe("Bowel symptoms that worsen with menstrual cycle, null if not mentioned"),
  cyclical_bladder_symptoms: z.boolean().nullable()
    .describe("Bladder symptoms that worsen with menstrual cycle, null if not mentioned"),
  non_cyclical_pain: z.boolean().nullable()
    .describe("Pain that occurs outside of menstrual cycle, null if not mentioned"),

  // Previous investigations
  previous_ultrasound: z.boolean().nullable()
    .describe("Has had pelvic ultrasound previously, null if not mentioned"),
  previous_laparoscopy: z.boolean().nullable()
    .describe("Has had laparoscopy previously, null if not mentioned"),
  previous_mri: z.boolean().nullable()
    .describe("Has had MRI previously, null if not mentioned"),
  known_endometriosis_stage: z.enum(["none", "stage_i", "stage_ii", "stage_iii", "stage_iv"]).nullable()
    .describe("Known endometriosis stage if diagnosed. 'none' if explicitly no endo, null if not mentioned."),

  // Treatment & history
  current_treatments: z.array(z.string()).nullable()
    .describe("Current medications or treatments mentioned (e.g. 'combined oral contraceptive', 'Mirena IUS', 'naproxen', 'zoladex'). Null if none mentioned."),
  family_history_endo: z.boolean().nullable()
    .describe("Family history of endometriosis, null if not mentioned"),
  comorbidities: z.array(z.string()).nullable()
    .describe("Other medical conditions mentioned (e.g. 'IBS', 'fibromyalgia', 'PCOS'). Null if none."),
});

export type ClinicalExtract = z.infer<typeof clinicalSchema>;

const SYSTEM_PROMPT = `You are a specialist clinical data extraction assistant for an endometriosis CDSS.

Extract structured patient history fields from a UK gynaecology consultation transcript. The clinician is taking a history from the patient following standard UK gynaecological consultation format.

EXTRACTION RULES:
- Only extract values clearly stated or strongly implied in the transcript
- Use null for anything not mentioned — never guess or infer beyond what is said
- Pain scores: map verbal descriptors consistently ("mild" → 2-3, "moderate" → 5-6, "severe" → 7-8, "excruciating/unbearable" → 9-10)
- Symptom duration: convert to months ("2 years" → 24, "6 months" → 6, "since I was 15" → calculate from stated age)
- Boolean symptoms: true only if clearly described as present, false only if clearly denied. Null if not discussed.
- Treatments: use generic/common UK names (e.g. "combined oral contraceptive pill", "Mirena IUS", "norethisterone")
- Stages: only extract if a prior diagnosis with staging is explicitly mentioned`;

export async function POST(request: NextRequest) {
  if (!process.env.VERCEL_OIDC_TOKEN) {
    return NextResponse.json(
      { error: "AI Gateway not configured. Run `vercel link` then `vercel env pull`." },
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
      output: Output.object({ schema: clinicalSchema }),
      system: SYSTEM_PROMPT,
      prompt: `Extract structured clinical history fields from this consultation transcript:\n\n"${transcript}"`,
    });

    return NextResponse.json(result.experimental_output);
  } catch (err) {
    console.error("[clinical-extract] Error:", err);
    return NextResponse.json(
      { error: "Failed to extract clinical data" },
      { status: 500 }
    );
  }
}
