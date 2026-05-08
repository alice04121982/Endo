import Link from "next/link";

const REASONS: Record<string, { title: string; body: string }> = {
  invalid: {
    title: "Access link not recognised",
    body: "The link you followed isn't valid. Ask the patient to send you a fresh one.",
  },
  expired: {
    title: "Access link has expired",
    body: "This link has passed its expiry. Ask the patient to issue a new one.",
  },
  revoked: {
    title: "Access has been revoked",
    body: "The patient has revoked this link. Ask them to issue a new one if they want to grant access again.",
  },
  claimed: {
    title: "Access link is in use",
    body: "Another clinician has already claimed this link. Ask the patient for a fresh one for you.",
  },
  role: {
    title: "Sign in as a clinician",
    body: "This link is for clinicians. Sign out and sign back in with a clinician account, or ask the patient to send the right link.",
  },
  "claim-failed": {
    title: "Could not claim the link",
    body: "Something went wrong claiming the link. Try following it again, or ask the patient to issue a fresh one.",
  },
};

export default async function CodeErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const params = await searchParams;
  const reason = params.reason ?? "invalid";
  const copy = REASONS[reason] ?? REASONS["invalid"];

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg bg-white border border-[var(--color-brand-sand)] rounded-[20px] p-10">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-brand-stone)] mb-3">
          Access link
        </p>
        <h1
          className="font-display font-extrabold text-[var(--color-brand-aubergine)] tracking-[-0.02em] leading-[1.1] mb-4"
          style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)" }}
        >
          {copy.title}
        </h1>
        <p className="text-[var(--color-brand-stone)] leading-relaxed mb-8">
          {copy.body}
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-5 py-2.5 rounded-[10px] border border-[var(--color-brand-sand)] bg-white text-[var(--color-brand-aubergine)] font-semibold hover:border-[var(--color-brand-clay)] transition-colors"
        >
          Back to Endo
        </Link>
      </div>
    </div>
  );
}
