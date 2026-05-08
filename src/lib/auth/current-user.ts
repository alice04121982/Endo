import { getSupabaseServer } from "@/lib/supabase/server";

export type Role = "patient" | "clinician";

export interface CurrentUser {
  id: string;
  email: string;
  displayName: string;
  role: Role;
}

/**
 * Read the current Supabase session and the user's profile row. Returns
 * null when there is no session or no profile (e.g. before the migration is
 * applied, or for users created outside the trigger).
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await getSupabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name")
    .eq("id", user.id)
    .single<{ role: Role; display_name: string | null }>();

  if (!profile) return null;

  return {
    id: user.id,
    email: user.email ?? "",
    displayName: profile.display_name ?? user.email?.split("@")[0] ?? "",
    role: profile.role,
  };
}

export function homeForRole(role: Role): "/portal" | "/cdss" {
  return role === "clinician" ? "/cdss" : "/portal";
}
