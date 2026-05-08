import { cookies } from "next/headers";
import { getSupabaseServer } from "@/lib/supabase/server";

// Cookie carrying the active consent token id for a clinician's session.
// HttpOnly + Secure. Cleared when the clinician signs out or follows a
// new access link. Validated against the database on every read — the
// cookie alone is not authority.
const COOKIE_NAME = "endo_consent_token";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours; tokens themselves carry their own expiry

export type ConsentScope = "read_only" | "read_and_note";

export interface ConsentToken {
  id: string;
  patientSubjectId: string;
  clinicianSubjectId: string | null;
  clinicianEmail: string | null;
  scope: ConsentScope;
  issuedAt: string;
  expiresAt: string;
  revokedAt: string | null;
  accessCode: string;
  claimedAt: string | null;
  lastUsedAt: string | null;
}

interface DbToken {
  id: string;
  patient_subject_id: string;
  clinician_subject_id: string | null;
  clinician_email: string | null;
  scope: ConsentScope;
  issued_at: string;
  expires_at: string;
  revoked_at: string | null;
  access_code: string;
  claimed_at: string | null;
  last_used_at: string | null;
}

function fromDb(row: DbToken): ConsentToken {
  return {
    id: row.id,
    patientSubjectId: row.patient_subject_id,
    clinicianSubjectId: row.clinician_subject_id,
    clinicianEmail: row.clinician_email,
    scope: row.scope,
    issuedAt: row.issued_at,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at,
    accessCode: row.access_code,
    claimedAt: row.claimed_at,
    lastUsedAt: row.last_used_at,
  };
}

export function isActive(t: ConsentToken): boolean {
  if (t.revokedAt) return false;
  return new Date(t.expiresAt).getTime() > Date.now();
}

// ─────────────────────────────────────────────────────────────────────────────
// Cookie I/O
// ─────────────────────────────────────────────────────────────────────────────
export async function setActiveConsentCookie(consentTokenId: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, consentTokenId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}

export async function clearActiveConsentCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

async function readActiveConsentCookie(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Active access lookup
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Resolves the clinician's currently-active consent token. Returns null if
 * no cookie, no token in DB, the token is revoked / expired, or the
 * cookie's token belongs to a different clinician.
 *
 * The DB row is the authority — the cookie is just a session pointer.
 */
export async function getActiveClinicianAccess(): Promise<{
  token: ConsentToken;
  patientDisplayName: string;
} | null> {
  const tokenId = await readActiveConsentCookie();
  if (!tokenId) return null;

  const supabase = await getSupabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return null;

  const { data: row } = await supabase
    .from("consent_tokens")
    .select(
      "id, patient_subject_id, clinician_subject_id, clinician_email, scope, issued_at, expires_at, revoked_at, access_code, claimed_at, last_used_at",
    )
    .eq("id", tokenId)
    .single<DbToken>();

  if (!row) return null;
  const token = fromDb(row);
  if (token.clinicianSubjectId !== user.id) return null;
  if (!isActive(token)) return null;

  // Look up the patient's display name (best-effort; falls back to "Patient")
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", token.patientSubjectId)
    .single<{ display_name: string | null }>();

  return {
    token,
    patientDisplayName: profile?.display_name ?? "Patient",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Patient-side: list, create, revoke
// ─────────────────────────────────────────────────────────────────────────────
export async function listOwnConsentTokens(): Promise<ConsentToken[]> {
  const supabase = await getSupabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return [];
  const { data } = await supabase
    .from("consent_tokens")
    .select(
      "id, patient_subject_id, clinician_subject_id, clinician_email, scope, issued_at, expires_at, revoked_at, access_code, claimed_at, last_used_at",
    )
    .eq("patient_subject_id", user.id)
    .order("created_at", { ascending: false })
    .returns<DbToken[]>();
  return (data ?? []).map(fromDb);
}

// Build the public access URL the patient shares.
export function buildAccessUrl(accessCode: string, origin: string): string {
  return `${origin.replace(/\/$/, "")}/access/${accessCode}`;
}
