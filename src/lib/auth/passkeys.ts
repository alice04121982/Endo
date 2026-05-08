import { cookies, headers } from "next/headers";
import { getSupabaseServer } from "@/lib/supabase/server";

// Server-side WebAuthn helpers.
//
// Configuration via env:
//   WEBAUTHN_RP_ID     — relying party id, must be the eTLD+1 or a
//                        subdomain of the origin. Defaults to "localhost"
//                        in dev, falls back to the request host otherwise.
//   WEBAUTHN_RP_NAME   — human-readable name shown in OS / browser UI.
//                        Defaults to "Endo".
//
// The challenge for each ceremony is stored in a short-lived HttpOnly
// cookie. The cookie is wiped after the ceremony completes or fails.

const CHALLENGE_COOKIE = "endo_passkey_challenge";
const CHALLENGE_TTL_SECONDS = 5 * 60;

export interface PasskeyRow {
  id: string;
  userId: string;
  credentialId: string;
  publicKey: string;
  counter: number;
  transports: string[];
  deviceName: string | null;
  backedUp: boolean;
  createdAt: string;
  lastUsedAt: string | null;
}

interface DbPasskey {
  id: string;
  user_id: string;
  credential_id: string;
  public_key: string;
  counter: number;
  transports: string[];
  device_name: string | null;
  backed_up: boolean;
  created_at: string;
  last_used_at: string | null;
}

function fromDb(row: DbPasskey): PasskeyRow {
  return {
    id: row.id,
    userId: row.user_id,
    credentialId: row.credential_id,
    publicKey: row.public_key,
    counter: row.counter,
    transports: row.transports,
    deviceName: row.device_name,
    backedUp: row.backed_up,
    createdAt: row.created_at,
    lastUsedAt: row.last_used_at,
  };
}

export async function listOwnPasskeys(): Promise<PasskeyRow[]> {
  const supabase = await getSupabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return [];
  const { data } = await supabase
    .from("passkeys")
    .select(
      "id, user_id, credential_id, public_key, counter, transports, device_name, backed_up, created_at, last_used_at",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<DbPasskey[]>();
  return (data ?? []).map(fromDb);
}

export async function countOwnPasskeys(): Promise<number> {
  const supabase = await getSupabaseServer();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return 0;
  const { count } = await supabase
    .from("passkeys")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  return count ?? 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Relying-party config
// ─────────────────────────────────────────────────────────────────────────────
async function rpConfig() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "localhost";
  const proto = headerStore.get("x-forwarded-proto") ?? "https";
  const origin = `${proto}://${host}`;

  // RP ID: prefer env, otherwise the bare host (no port).
  const envRpId = process.env.WEBAUTHN_RP_ID;
  const hostBare = host.split(":")[0];
  const rpID = envRpId && envRpId.length > 0 ? envRpId : hostBare;

  return {
    rpID,
    rpName: process.env.WEBAUTHN_RP_NAME ?? "Endo",
    origin,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Challenge cookie I/O
// ─────────────────────────────────────────────────────────────────────────────
async function setChallenge(challenge: string) {
  const store = await cookies();
  store.set(CHALLENGE_COOKIE, challenge, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: CHALLENGE_TTL_SECONDS,
  });
}

async function readChallenge(): Promise<string | null> {
  const store = await cookies();
  return store.get(CHALLENGE_COOKIE)?.value ?? null;
}

async function clearChallenge() {
  const store = await cookies();
  store.delete(CHALLENGE_COOKIE);
}

// ─────────────────────────────────────────────────────────────────────────────
// Registration ceremony
// ─────────────────────────────────────────────────────────────────────────────
export async function buildRegistrationOptions(opts: {
  userId: string;
  userName: string;
  excludeCredentialIds: string[];
}) {
  const { generateRegistrationOptions } = await import(
    "@simplewebauthn/server"
  );
  const { rpID, rpName } = await rpConfig();

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: new TextEncoder().encode(opts.userId),
    userName: opts.userName,
    attestationType: "none",
    excludeCredentials: opts.excludeCredentialIds.map((id) => ({ id })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  });

  await setChallenge(options.challenge);
  return options;
}

export async function verifyRegistration(payload: unknown) {
  const { verifyRegistrationResponse } = await import("@simplewebauthn/server");
  const { rpID, origin } = await rpConfig();
  const expectedChallenge = await readChallenge();
  if (!expectedChallenge) {
    throw new Error("No challenge in flight. Try again.");
  }

  const verification = await verifyRegistrationResponse({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    response: payload as any,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
  });

  await clearChallenge();
  return verification;
}
