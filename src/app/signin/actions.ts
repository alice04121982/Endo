"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";

const SignInSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  role: z.enum(["patient", "clinician"]),
  access: z.string().optional(),
});

function siteOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.VERCEL_URL ??
    "http://localhost:3000"
  ).replace(/^(?!https?:\/\/)/, "https://");
}

export async function sendMagicLink(formData: FormData) {
  const parsed = SignInSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
    access: formData.get("access") ?? undefined,
  });
  if (!parsed.success) {
    const reason = parsed.error.issues[0]?.message ?? "Invalid input";
    redirect(`/signin?error=${encodeURIComponent(reason)}`);
  }
  const { email, role, access } = parsed.data;

  const supabase = await getSupabaseServer();
  const origin = siteOrigin();

  const callbackParams = new URLSearchParams({ role });
  if (access) callbackParams.set("access", access);

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?${callbackParams.toString()}`,
      // Captured by the handle_new_user trigger on first sign-in.
      data: { role, display_name: email.split("@")[0] },
    },
  });

  if (error) {
    const params = new URLSearchParams({ role, error: error.message });
    if (access) params.set("access", access);
    redirect(`/signin?${params.toString()}`);
  }

  const sentParams = new URLSearchParams({ sent: "1", email, role });
  if (access) sentParams.set("access", access);
  redirect(`/signin?${sentParams.toString()}`);
}
