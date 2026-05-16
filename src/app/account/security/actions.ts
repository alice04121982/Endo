"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import {
  buildRegistrationOptions,
  listOwnPasskeys,
  verifyRegistration,
} from "@/lib/auth/passkeys";

// Server actions invoked by the client component on /account/security.
//
// Two-step enrollment:
//   1. startPasskeyEnrollment() — server generates registration options,
//      stores the challenge in an HttpOnly cookie, returns options to the
//      client.
//   2. finishPasskeyEnrollment(payload, deviceName) — server verifies the
//      attestation, inserts a passkey row, clears the challenge.
//
// finishPasskeyEnrollment is invoked from a "use client" component using
// `@simplewebauthn/browser`'s `startRegistration` flow.

export async function startPasskeyEnrollment() {
  const supabase = await getSupabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) {
    throw new Error("You need to be signed in to enrol a passkey.");
  }

  const existing = await listOwnPasskeys();
  return buildRegistrationOptions({
    userId: user.id,
    userName: user.email ?? user.id,
    excludeCredentialIds: existing.map((p) => p.credentialId),
  });
}

const FinishSchema = z.object({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: z.any(),
  deviceName: z.string().min(1).max(64).optional(),
});

export async function finishPasskeyEnrollment(input: {
  payload: unknown;
  deviceName?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = FinishSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid payload" };
  }

  const supabase = await getSupabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return { ok: false, error: "Not signed in" };

  let verification;
  try {
    verification = await verifyRegistration(parsed.data.payload);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Verification failed",
    };
  }

  if (!verification.verified || !verification.registrationInfo) {
    return { ok: false, error: "Passkey could not be verified." };
  }

  const info = verification.registrationInfo;
  const credentialId = info.credential.id;
  const publicKey = Buffer.from(info.credential.publicKey).toString("base64url");
  const counter = info.credential.counter;
  const transports = info.credential.transports ?? [];
  const backedUp = Boolean(info.credentialBackedUp);

  const { error } = await supabase.from("passkeys").insert({
    user_id: user.id,
    credential_id: credentialId,
    public_key: publicKey,
    counter,
    transports,
    backed_up: backedUp,
    device_name: parsed.data.deviceName ?? null,
  });

  if (error) {
    return { ok: false, error: `Could not save passkey: ${error.message}` };
  }

  revalidatePath("/account/security");
  return { ok: true };
}

export async function deletePasskey(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing id");

  const supabase = await getSupabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) throw new Error("Not signed in");

  const { error } = await supabase
    .from("passkeys")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(`Could not remove passkey: ${error.message}`);
  revalidatePath("/account/security");
}
