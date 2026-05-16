import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { clearActiveConsentCookie } from "@/lib/auth/consent";

// POST /auth/signout — invalidates the Supabase session, clears any
// active consent token cookie, and bounces the user to the landing page.
// Layout sign-out controls submit a form to this route so logout is a
// server action, not a client-side mutation.

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServer();
  await supabase.auth.signOut();
  await clearActiveConsentCookie();
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
