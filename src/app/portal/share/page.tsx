import { consentTokens } from "@/lib/mock/patient";

const SCOPE_LABEL: Record<string, string> = {
  read_only: "Read only",
  read_and_note: "Read and add notes",
};

export default function SharePage() {
  return (
    <div className="max-w-5xl mx-auto px-6 lg:px-10 py-12 lg:py-16">
      <p className="text-sm uppercase tracking-[0.18em] text-[var(--color-brand-stone)] mb-2">
        Sharing
      </p>
      <h1 className="font-display font-extrabold text-[var(--color-brand-aubergine)] tracking-[-0.02em] leading-[1.05] mb-4" style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)" }}>
        Who can see your record
      </h1>
      <p className="text-[var(--color-brand-stone)] mb-8 max-w-2xl">
        Generate a time-limited link for a clinician. They land on a one-page
        summary of your history. Access is read-only by default. You can
        revoke at any time.
      </p>

      <button
        type="button"
        className="inline-flex items-center gap-2 px-5 py-3 rounded-[10px] bg-[var(--color-brand-clay)] text-white font-semibold hover:bg-[var(--color-brand-clay-deep)] transition-colors mb-10"
      >
        Create a new access link
      </button>

      <h2 className="font-display text-lg font-bold text-[var(--color-brand-aubergine)] mb-3">
        Active access
      </h2>
      <ul className="space-y-3 mb-10">
        {consentTokens
          .filter((t) => t.status === "active")
          .map((t) => (
            <li
              key={t.id}
              className="bg-white border border-[var(--color-brand-sand)] rounded-[14px] p-5"
            >
              <div className="flex items-start justify-between gap-4">
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
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[var(--color-brand-cream)] text-[var(--color-brand-sage)] text-xs font-semibold">
                  Active
                </span>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 mt-4 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-brand-stone)] mb-0.5">
                    Granted
                  </p>
                  <p className="text-[var(--color-brand-aubergine)]">
                    {formatDate(t.grantedAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-brand-stone)] mb-0.5">
                    Expires
                  </p>
                  <p className="text-[var(--color-brand-aubergine)]">
                    {formatDate(t.expiresAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-brand-stone)] mb-0.5">
                    Permissions
                  </p>
                  <p className="text-[var(--color-brand-aubergine)]">
                    {SCOPE_LABEL[t.scope]}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="mt-4 text-sm font-semibold text-[var(--color-brand-red)] hover:underline"
              >
                Revoke access
              </button>
            </li>
          ))}
      </ul>

      <p className="text-xs text-[var(--color-brand-stone)] max-w-2xl">
        Endo never auto-shares your record with anyone. Every access happens
        because you created a link, and every action a clinician takes is
        logged in your audit trail.
      </p>
    </div>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
