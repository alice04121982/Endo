import { generateText, Output } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

const soapSchema = z.object({
  subjective: z
    .string()
    .describe(
      "Patient's own reported symptoms, history, and concerns as described during the consultation. Include chief complaint, symptom onset, severity, character, and relevant history as reported by the patient."
    ),
  objective: z
    .string()
    .describe(
      "Clinician's observable findings: examination findings, vital signs, test results discussed, and any measurable data mentioned during the consultation."
    ),
  assessment: z
    .string()
    .describe(
      "Clinical impression and working diagnosis. Interpretation of findings, differential diagnoses considered, risk stratification, and clinical reasoning."
    ),
  plan: z
    .string()
    .describe(
      "Management plan: investigations ordered, treatments prescribed or changed, referrals made, safety netting advice, follow-up arrangements, and patient education discussed."
    ),
  summary: z
    .string()
    .describe(
      "One to two sentence executive summary of this consultation for quick reference."
    ),
});

export type SoapNote = z.infer<typeof soapSchema>;

const SYSTEM_PROMPT = `You are a specialist clinical documentation assistant for an endometriosis CDSS (Clinical Decision Support System).

Your task is to generate a structured SOAP consultation note from a clinical consultation transcript.

Guidelines:
- Write in professional clinical language appropriate for specialist gynaecology / endometriosis care
- Subjective: Use the patient's perspective — what they reported, how they described symptoms, their concerns
- Objective: Focus on measurable/observable clinical findings mentioned (examination, results, scores)
- Assessment: Synthesise findings into clinical impression; reference relevant NICE NG73 criteria if applicable
- Plan: Be specific and actionable; include investigations, treatments, referrals, follow-up, safety netting
- Summary: Concise 1-2 sentence overview for the record header
- If a section was not clearly covered in the consultation, write a brief professional note acknowledging this
- Do not fabricate clinical details not mentioned in the transcript`;

export async function POST(request: NextRequest) {
  if (!process.env.VERCEL_OIDC_TOKEN) {
    return NextResponse.json(
      { error: "AI Gateway not configured. Run `vercel link` then `vercel env pull`." },
      { status: 503 }
    );
  }

  let transcript: string;
  let patientContext: string | undefined;

  try {
    const body = await request.json();
    transcript = body.transcript;
    patientContext = body.patientContext;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!transcript?.trim()) {
    return NextResponse.json({ error: "No transcript provided" }, { status: 400 });
  }

  const contextSection = patientContext
    ? `\n\nPATIENT CONTEXT (from existing record):\n${patientContext}\n`
    : "";

  try {
    const result = await generateText({
      model: gateway("anthropic/claude-sonnet-4.6"),
      output: Output.object({ schema: soapSchema }),
      system: SYSTEM_PROMPT,
      prompt: `Generate a SOAP note from the following consultation transcript.${contextSection}\n\nCONSULTATION TRANSCRIPT:\n"${transcript}"`,
    });

    return NextResponse.json(result.experimental_output);
  } catch (err) {
    console.error("[soap-note] Error:", err);
    return NextResponse.json(
      { error: "Failed to generate SOAP note" },
      { status: 500 }
    );
  }
}
