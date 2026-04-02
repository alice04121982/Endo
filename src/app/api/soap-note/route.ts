import { generateText, Output } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

/**
 * Extracts structured UK clinical history sections from a consultation transcript.
 * Follows standard UK gynaecology history-taking format.
 */
const consultationSchema = z.object({
  co: z
    .string()
    .describe(
      "CO — Complains Of. The patient's presenting complaint in their own words. What has brought them to this appointment today."
    ),
  hpc: z
    .string()
    .describe(
      "HPC — History of Present Complaint. Full history of the presenting symptoms: onset, duration, character, severity (including VAS pain scores if mentioned), relieving/aggravating factors, associated symptoms, cyclical patterns, impact on daily life and quality of life."
    ),
  pmh: z
    .string()
    .describe(
      "PMH — Past Medical History. Previous medical conditions, surgical history (including any laparoscopy, hysteroscopy, or other gynaecological procedures), previous investigations (ultrasound, MRI, laparoscopy findings), hospitalisations. Write 'Nil significant' if none mentioned."
    ),
  fh: z
    .string()
    .describe(
      "FH — Family History. Relevant family history, particularly endometriosis, other gynaecological conditions, autoimmune conditions, cancers. Write 'Not reported' if not discussed."
    ),
  allergies: z
    .string()
    .describe(
      "Allergies. Any known drug or food allergies and the nature of the reaction. Write 'NKDA' (No Known Drug Allergies) if stated, or 'Not reported' if not discussed."
    ),
  drugs: z
    .string()
    .describe(
      "Drugs / Current Medications. All current medications including dose and frequency where mentioned. Include contraception, hormonal treatments, analgesics, supplements. Write 'None reported' if not discussed."
    ),
  summary: z
    .string()
    .describe(
      "One to two sentence executive summary of this consultation for the record header."
    ),
});

export type SoapNote = z.infer<typeof consultationSchema>;

const SYSTEM_PROMPT = `You are a specialist clinical documentation assistant for an endometriosis CDSS (Clinical Decision Support System).

Your task is to extract structured clinical history from a UK gynaecology consultation transcript, following the standard UK clinical history-taking format.

Guidelines:
- Write in professional clinical language appropriate for specialist gynaecology / endometriosis care
- Extract only what was actually said — do not fabricate clinical details not in the transcript
- If a section was not covered, state clearly: "Not discussed in this consultation" or "NKDA" / "Nil significant" as appropriate
- For HPC, capture severity using VAS scores if mentioned, and note cyclical patterns which are clinically significant in endometriosis
- For Drugs, use generic UK medication names where possible
- Reference relevant NICE NG73 criteria in the summary if applicable`;

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
      output: Output.object({ schema: consultationSchema }),
      system: SYSTEM_PROMPT,
      prompt: `Extract the clinical history sections from the following consultation transcript.${contextSection}\n\nCONSULTATION TRANSCRIPT:\n"${transcript}"`,
    });

    return NextResponse.json(result.experimental_output);
  } catch (err) {
    console.error("[consultation-note] Error:", err);
    return NextResponse.json(
      { error: "Failed to generate consultation note" },
      { status: 500 }
    );
  }
}
