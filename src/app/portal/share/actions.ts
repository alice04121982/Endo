"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { ConsentScope } from "@/lib/auth/consent";

const IssueSchema = z.object({
  clinicianEmail: z.string().email("Enter a valid clinician email").or(z.literal("")).optional(),
  scope: z.enum(["read_only", "read_and_note"]),
  durationHours: z.coerce.number().int().min(1).max(24 * 30),
});

function generateAccessCode(): string {
  // URL-safe 24-char random code. crypto.randomUUID() is available in
  // Node 18+; we strip dashes and add a short prefix so the URL reads
  // as deliberately a token, not a UUID exposed in plain.
  const raw = crypto.randomUUID().replace(/-/g, "");
  return `endo_${raw.slice(0, 22)}`;
}

export async function issueConsentToken(formData: FormData): Promise<void> {
  const parsed = IssueSchema.safeParse({
    clinicianEmail: formData.get("clinicianEmail") ?? "",
    scope: formData.get("scope") ?? "read_only",
    durationHours: formData.get("durationHours") ?? "24",
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const { clinicianEmail, scope, durationHours } = parsed.data;

  const supabase = await getSupabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) {
    throw new Error("You must be signed in as a patient to issue an access link.");
  }

  const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from("consent_tokens").insert({
    patient_subject_id: user.id,
    clinician_email: clinicianEmail || null,
    scope: scope as ConsentScope,
    expires_at: expiresAt,
    access_code: generateAccessCode(),
  });

  if (error) {
    throw new Error(`Could not create access link: ${error.message}`);
  }

  revalidatePath("/portal/share");
}

export async function revokeConsentToken(formData: FormData): Promise<void> {
  const tokenId = String(formData.get("tokenId") ?? "");
  if (!tokenId) throw new Error("Missing token id");

  const supabase = await getSupabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) throw new Error("Not signed in");

  const { error } = await supabase
    .from("consent_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", tokenId)
    .eq("patient_subject_id", user.id)
    .is("revoked_at", null);

  if (error) {
    throw new Error(`Could not revoke: ${error.message}`);
  }

  revalidatePath("/portal/share");
}
