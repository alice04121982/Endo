import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, homeForRole } from "@/lib/auth/current-user";
import { listOwnPasskeys, type PasskeyRow } from "@/lib/auth/passkeys";
import { deletePasskey } from "./actions";
import { EnrollPasskeyButton } from "./enroll-button";

export default async function SecurityPage({
  searchParams,
}: {
  searchParams: Promise<{ required?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/signin");
  }

  const params = await searchParams;
  const required = params.required === "1";
  const passkeys = await listOwnPasskeys();
  const isClinician = user.role === "clinician";

  return (
    <div className="max-w-3xl mx-auto px-6 lg:px-10 py-12 lg:py-16">
      <p className="text-sm uppercase tracking-[0.18em] text-[var(--color-brand-stone)] mb-2">
        Account · Security
      </p>
      <h1
        className="font-display text-2xl font-semibold tracking-tight text-[var(--color-brand-aubergine)] mb-3"
      >
        Passkeys
      </h1>
      <p className="text-[var(--color-brand-stone)] leading-relaxed mb-8 max-w-2xl">
        Passkeys are a strong, phishing-resistant way to prove it&apos;s you.
        Your device holds a secret only it can use; Endo holds the matching
        public key.
        {isClinician
          ? " A passkey is required for clinician access."
          : " Optional — your magic link is enough on its own."}
      </p>

      {required && passkeys.length === 0 && isClinician && (
        <div
          role="alert"
          className="mb-8 p-4 rounded-[10px] border-l-2 border-[var(--color-brand-red)] bg-[#FBE5DD] text-[var(--color-brand-aubergine)]"
        >
          <p className="font-semibold mb-1">Passkey required</p>
          <p className="text-sm">
            You can&apos;t open a patient&apos;s record until you&apos;ve
            enrolled at least one passkey on this account.
          </p>
        </div>
      )}

      <section className="mb-10">
        <h2 className="font-display text-lg font-bold text-[var(--color-brand-aubergine)] mb-2">
          Add a passkey
        </h2>
        <div className="bg-white border border-[var(--color-brand-sand)] rounded-[14px] p-6">
          <EnrollPasskeyButton hasExisting={passkeys.length > 0} />
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-bold text-[var(--color-brand-aubergine)] mb-3">
          Your passkeys ({passkeys.length})
        </h2>
        {passkeys.length === 0 ? (
          <p className="text-sm text-[var(--color-brand-stone)] bg-white border border-dashed border-[var(--color-brand-sand)] rounded-[10px] p-6 text-center">
            No passkeys yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {passkeys.map((p) => (
              <PasskeyRowItem key={p.id} passkey={p} />
            ))}
          </ul>
        )}
      </section>

      <p className="mt-12 text-xs text-[var(--color-brand-stone)]">
        <Link
          href={homeForRole(user.role)}
          className="hover:text-[var(--color-brand-aubergine)] underline-offset-2 hover:underline"
        >
          ← Back to {user.role === "clinician" ? "Rapid Answer Panel" : "your portal"}
        </Link>
      </p>
    </div>
  );
}

function PasskeyRowItem({ passkey }: { passkey: PasskeyRow }) {
  const created = new Date(passkey.createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const lastUsed = passkey.lastUsedAt
    ? new Date(passkey.lastUsedAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "never used";
  const transport =
    passkey.transports.length > 0 ? passkey.transports.join(", ") : "—";

  return (
    <li className="bg-white border border-[var(--color-brand-sand)] rounded-[14px] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-display font-bold text-[var(--color-brand-aubergine)]">
            {passkey.deviceName ?? "Unnamed device"}
          </p>
          <p className="text-sm text-[var(--color-brand-stone)] mt-0.5">
            {passkey.backedUp ? "Synced across devices" : "This device only"}
            {" · "}
            {transport}
          </p>
        </div>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[var(--color-brand-cream)] text-[var(--color-brand-sage)] text-xs font-semibold shrink-0">
          Active
        </span>
      </div>
      <div className="grid sm:grid-cols-2 gap-3 mt-3 text-sm">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-brand-stone)] mb-0.5">
            Enrolled
          </p>
          <p className="text-[var(--color-brand-aubergine)]">{created}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-brand-stone)] mb-0.5">
            Last used
          </p>
          <p className="text-[var(--color-brand-aubergine)]">{lastUsed}</p>
        </div>
      </div>
      <form action={deletePasskey} className="mt-4">
        <input type="hidden" name="id" value={passkey.id} />
        <button
          type="submit"
          className="text-sm font-semibold text-[var(--color-brand-red)] hover:underline"
        >
          Remove this passkey
        </button>
      </form>
    </li>
  );
}
