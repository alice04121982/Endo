import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { setActiveConsentCookie } from "@/lib/auth/consent";

// Clinician access landing. The patient shares /access/<code>; the
// clinician follows it. Server validates the code, claims the token for
// the signed-in clinician, sets a server-only cookie carrying the consent
// token id, and redirects to /cdss.
//
// Failure modes (each redirects to a small dedicated page that explains
// the failure to the clinician without leaking why to anyone unsigned-in):
//   - not signed in → /signin?role=clinician&access=<code>
//   - signed in as patient → /access/code-error?reason=role
//   - code invalid → /access/code-error?reason=invalid
//   - token revoked or expired → /access/code-error?reason=expired
//   - token already claimed by another clinician → /access/code-error?reason=claimed
//
// All outcomes are append to llm_audit_log via a follow-up audit-token
// migration; the audit instrumentation is wired in chunk 4.

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const url = new URL(request.url);

  const supabase = await getSupabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;

  // Not signed in → bounce to clinician sign-in, preserving the access code
  if (!user) {
    const dest = new URL("/signin", url.origin);
    dest.searchParams.set("role", "clinician");
    dest.searchParams.set("access", code);
    return NextResponse.redirect(dest);
  }

  // Signed in as the wrong role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: "patient" | "clinician" }>();
  if (!profile || profile.role !== "clinician") {
    return NextResponse.redirect(
      new URL("/access/code-error?reason=role", url.origin),
    );
  }

  // Look up the token
  const { data: row } = await supabase
    .from("consent_tokens")
    .select(
      "id, patient_subject_id, clinician_subject_id, expires_at, revoked_at",
    )
    .eq("access_code", code)
    .maybeSingle<{
      id: string;
      patient_subject_id: string;
      clinician_subject_id: string | null;
      expires_at: string;
      revoked_at: string | null;
    }>();

  if (!row) {
    return NextResponse.redirect(
      new URL("/access/code-error?reason=invalid", url.origin),
    );
  }
  if (row.revoked_at) {
    return NextResponse.redirect(
      new URL("/access/code-error?reason=revoked", url.origin),
    );
  }
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    return NextResponse.redirect(
      new URL("/access/code-error?reason=expired", url.origin),
    );
  }
  if (row.clinician_subject_id && row.clinician_subject_id !== user.id) {
    return NextResponse.redirect(
      new URL("/access/code-error?reason=claimed", url.origin),
    );
  }

  // Claim the token (idempotent if already claimed by this clinician)
  const now = new Date().toISOString();
  const { error: updateErr } = await supabase
    .from("consent_tokens")
    .update({
      clinician_subject_id: user.id,
      claimed_at: row.clinician_subject_id ? undefined : now,
      last_used_at: now,
    })
    .eq("id", row.id);

  if (updateErr) {
    return NextResponse.redirect(
      new URL("/access/code-error?reason=claim-failed", url.origin),
    );
  }

  // Set the active-access cookie + redirect to the Rapid Answer Panel
  await setActiveConsentCookie(row.id);
  return NextResponse.redirect(new URL("/cdss", url.origin));
}
