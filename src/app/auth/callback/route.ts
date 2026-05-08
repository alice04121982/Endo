import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { homeForRole, type Role } from "@/lib/auth/current-user";

// Magic-link callback. Supabase appends ?code=<...> to the redirect; we
// exchange it for a session, look up the profile's role, and route the
// signed-in user to the right home (/portal for patient, /cdss for
// clinician).

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const requestedRole = url.searchParams.get("role");
  const supabase = await getSupabaseServer();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const dest = new URL("/signin", url.origin);
      dest.searchParams.set("error", error.message);
      return NextResponse.redirect(dest);
    }
  }

  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) {
    return NextResponse.redirect(new URL("/signin", url.origin));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: Role }>();

  const role: Role =
    profile?.role ??
    (requestedRole === "clinician" ? "clinician" : "patient");

  return NextResponse.redirect(new URL(homeForRole(role), url.origin));
}
