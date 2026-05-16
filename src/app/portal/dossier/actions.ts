"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase/server";
import {
  buildCSDPayloadForCurrentPatient,
  regenerateCSD,
} from "@/lib/clinical/csd";

export async function regeneratePatientDossier() {
  const supabase = await getSupabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) {
    return { ok: false as const, error: "Sign in to regenerate your dossier." };
  }

  const payload = await buildCSDPayloadForCurrentPatient();
  if (!payload) {
    return { ok: false as const, error: "Could not build payload." };
  }

  const result = await regenerateCSD(user.id, "patient", payload);
  // Also generate the clinician view from the same payload so the next
  // clinician read is byte-stable. Same hash, both audiences cached.
  await regenerateCSD(user.id, "clinician", payload);

  revalidatePath("/portal/dossier");
  if (!result.ok) return { ok: false as const, error: result.error };
  return { ok: true as const };
}
