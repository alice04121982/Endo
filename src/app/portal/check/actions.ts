"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import {
  evaluateRedFlags,
  persistRedFlagFire,
  type ActiveSymptomCheck,
  type RedFlag,
} from "@/lib/clinical/red-flags";
import { listOwnJournalEntries } from "@/lib/clinical/journal";

const CheckSchema = z.object({
  bleedingThroughPad: z.coerce.boolean(),
  severeOneSidedPain: z.coerce.boolean(),
  pregnancyBleeding: z.coerce.boolean(),
  severeAbdominalSwelling: z.coerce.boolean(),
  severeFlankPain: z.coerce.boolean(),
  fainting: z.coerce.boolean(),
});

export interface CheckResult {
  ok: true;
  flags: RedFlag[];
}

export async function submitRedFlagCheck(
  formData: FormData,
): Promise<CheckResult | { ok: false; error: string }> {
  const parsed = CheckSchema.safeParse({
    bleedingThroughPad: formData.get("bleedingThroughPad") === "on",
    severeOneSidedPain: formData.get("severeOneSidedPain") === "on",
    pregnancyBleeding: formData.get("pregnancyBleeding") === "on",
    severeAbdominalSwelling: formData.get("severeAbdominalSwelling") === "on",
    severeFlankPain: formData.get("severeFlankPain") === "on",
    fainting: formData.get("fainting") === "on",
  });
  if (!parsed.success) {
    return { ok: false, error: "Invalid input" };
  }

  const supabase = await getSupabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return { ok: false, error: "Sign in to use the check." };

  const activeCheck: ActiveSymptomCheck = {
    submittedAt: new Date().toISOString(),
    ...parsed.data,
  };

  const recentEntries = await listOwnJournalEntries(14);
  const flags = evaluateRedFlags({
    recentEntries,
    activeCheck,
  });

  for (const flag of flags) {
    await persistRedFlagFire(user.id, flag, { recentEntries, activeCheck });
  }

  revalidatePath("/portal");
  revalidatePath("/portal/check");
  return { ok: true, flags };
}

export async function acknowledgeRedFlag(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const response = String(formData.get("response") ?? "");
  if (!id || !["opened", "cta_followed", "no_longer_relevant"].includes(response)) {
    throw new Error("Invalid acknowledgement");
  }

  const supabase = await getSupabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) throw new Error("Not signed in");

  await supabase
    .from("red_flag_events")
    .update({
      patient_response: response,
      patient_response_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("patient_subject_id", user.id);

  revalidatePath("/portal");
  revalidatePath("/portal/check");
}
