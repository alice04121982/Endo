import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listOwnConsentTokens, buildAccessUrl, isActive, type ConsentToken } from "@/lib/auth/consent";
import { issueConsentToken, revokeConsentToken } from "./actions";
import { consentTokens as MOCK_TOKENS } from "@/lib/mock/patient";

const SCOPE_LABEL: Record<string, string> = {
  read_only: "Read only",
  read_and_note: "Read and add notes",
};

export default async function SharePage() {
  const user = await getCurrentUser();
  const isAuthedPatient = user?.role === "patient";

  // Live data when signed in; mock data when anonymous demo
  const liveTokens = isAuthedPatient ? await listOwnConsentTokens() : [];
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "localhost:3000";
  const proto = headerStore.get("x-forwarded-proto") ?? "https";
  const origin = `${proto}://${host}`;

  return (
    <div className="max-w-5xl mx-auto px-6 lg:px-10 py-12 lg:py-16">
      <p className="text-sm uppercase tracking-[0.18em] text-[var(--color-brand-stone)] mb-2">
        Sharing
      </p>
      <h1
        className="font-display text-2xl font-semibold tracking-tight text-[var(--color-brand-aubergine)] mb-3"
      >
        Who can see your record
      </h1>
      <p className="text-[var(--color-brand-stone)] mb-8 max-w-2xl">
        Generate a time-limited link for a clinician. They land on a one-page
        summary of your history. Access is read-only by default. You can
        revoke at any time.
      </p>

      {!isAuthedPatient && (
        <div className="mb-8 p-4 rounded-[10px] border border-[var(--color-brand-sand)] bg-[var(--color-brand-blush)]/40 text-sm text-[var(--color-brand-aubergine)]">
          You&apos;re viewing the demo. Sign in to issue a real access link
          that a clinician can follow.
        </div>
      )}

      {/* Issue form */}
      <section className="bg-white border border-[var(--color-brand-sand)] rounded-[14px] p-6 mb-10">
        <h2 className="font-display text-lg font-bold text-[var(--color-brand-aubergine)] mb-1">
          Create a new access link
        </h2>
        <p className="text-sm text-[var(--color-brand-stone)] mb-5">
          The link is single-purpose: anyone with the URL who&apos;s signed in
          as a clinician can claim it. After it&apos;s claimed it&apos;s tied
          to that clinician.
        </p>
        <form
          action={issueConsentToken}
          className="grid sm:grid-cols-3 gap-4"
        >
          <div>
            <label
              htmlFor="clinicianEmail"
              className="block text-sm font-semibold text-[var(--color-brand-aubergine)] mb-2"
            >
              Clinician email <span className="font-normal text-[var(--color-brand-stone)]">(optional)</span>
            </label>
            <input
              id="clinicianEmail"
              name="clinicianEmail"
              type="email"
              placeholder="dr.patel@cuh.nhs.uk"
              className="w-full px-3 py-2.5 rounded-[8px] border border-[var(--color-brand-sand)] bg-white text-sm focus:outline-none focus:border-[var(--color-brand-clay)]"
            />
          </div>
          <div>
            <label
              htmlFor="scope"
              className="block text-sm font-semibold text-[var(--color-brand-aubergine)] mb-2"
            >
              Permissions
            </label>
            <select
              id="scope"
              name="scope"
              defaultValue="read_only"
              className="w-full px-3 py-2.5 rounded-[8px] border border-[var(--color-brand-sand)] bg-white text-sm focus:outline-none focus:border-[var(--color-brand-clay)]"
            >
              <option value="read_only">Read only</option>
              <option value="read_and_note">Read and add notes</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="durationHours"
              className="block text-sm font-semibold text-[var(--color-brand-aubergine)] mb-2"
            >
              Expires in
            </label>
            <select
              id="durationHours"
              name="durationHours"
              defaultValue="24"
              className="w-full px-3 py-2.5 rounded-[8px] border border-[var(--color-brand-sand)] bg-white text-sm focus:outline-none focus:border-[var(--color-brand-clay)]"
            >
              <option value="1">1 hour</option>
              <option value="24">24 hours</option>
              <option value="168">7 days</option>
              <option value="720">30 days</option>
            </select>
          </div>
          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={!isAuthedPatient}
              className="px-5 py-2.5 rounded-[10px] bg-[var(--color-brand-clay)] text-white font-semibold hover:bg-[var(--color-brand-clay-deep)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Create access link
            </button>
          </div>
        </form>
      </section>

      {/* Active access — live or mock */}
      <h2 className="font-display text-lg font-bold text-[var(--color-brand-aubergine)] mb-3">
        {isAuthedPatient ? "Your active access" : "Demo access"}
      </h2>
      {isAuthedPatient ? (
        <LiveTokens tokens={liveTokens} origin={origin} />
      ) : (
        <DemoTokens />
      )}

      <p className="text-xs text-[var(--color-brand-stone)] mt-10 max-w-2xl">
        Endo never auto-shares your record with anyone. Every access happens
        because you created a link, and every action a clinician takes is
        logged in your audit trail.
      </p>
    </div>
  );
}

function LiveTokens({
  tokens,
  origin,
}: {
  tokens: ConsentToken[];
  origin: string;
}) {
  const visible = tokens.filter((t) => isActive(t));
  if (visible.length === 0) {
    return (
      <p className="text-sm text-[var(--color-brand-stone)] bg-white border border-dashed border-[var(--color-brand-sand)] rounded-[10px] p-6 text-center">
        No active access links. Issue one above when you&apos;re ready to
        share with a clinician.
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {visible.map((t) => (
        <li
          key={t.id}
          className="bg-white border border-[var(--color-brand-sand)] rounded-[14px] p-5"
        >
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <p className="font-display font-bold text-[var(--color-brand-aubergine)]">
                {t.clinicianEmail ?? "Anyone with the link"}
              </p>
              <p className="text-sm text-[var(--color-brand-stone)] mt-0.5">
                Status: {t.claimedAt ? "Claimed" : "Unclaimed"}
                {t.lastUsedAt &&
                  ` · last opened ${formatDateTime(t.lastUsedAt)}`}
              </p>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[var(--color-brand-cream)] text-[var(--color-brand-sage)] text-xs font-semibold shrink-0">
              Active
            </span>
          </div>
          <div className="grid sm:grid-cols-3 gap-3 text-sm mb-3">
            <Detail label="Permissions" value={SCOPE_LABEL[t.scope]} />
            <Detail label="Issued" value={formatDateTime(t.issuedAt)} />
            <Detail label="Expires" value={formatDateTime(t.expiresAt)} />
          </div>
          <div className="bg-[var(--color-brand-cream)] rounded-[8px] p-3 text-sm font-mono break-all mb-3">
            {buildAccessUrl(t.accessCode, origin)}
          </div>
          <form action={revokeConsentToken}>
            <input type="hidden" name="tokenId" value={t.id} />
            <button
              type="submit"
              className="text-sm font-semibold text-[var(--color-brand-red)] hover:underline"
            >
              Revoke access
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}

function DemoTokens() {
  return (
    <ul className="space-y-3">
      {MOCK_TOKENS.filter((t) => t.status === "active").map((t) => (
        <li
          key={t.id}
          className="bg-white border border-[var(--color-brand-sand)] rounded-[14px] p-5"
        >
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <p className="font-display font-bold text-[var(--color-brand-aubergine)]">
                {t.clinicianRole}
              </p>
              <p className="text-sm text-[var(--color-brand-stone)]">
                {t.clinicianHandle}
              </p>
              <p className="text-sm text-[var(--color-brand-stone)] mt-0.5">
                {t.organisation}
              </p>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[var(--color-brand-cream)] text-[var(--color-brand-sage)] text-xs font-semibold shrink-0">
              Active
            </span>
          </div>
          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <Detail label="Permissions" value={SCOPE_LABEL[t.scope]} />
            <Detail label="Granted" value={formatDate(t.grantedAt)} />
            <Detail label="Expires" value={formatDate(t.expiresAt)} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-brand-stone)] mb-0.5">
        {label}
      </p>
      <p className="text-[var(--color-brand-aubergine)]">{value}</p>
    </div>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso.includes("T") ? iso : iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
