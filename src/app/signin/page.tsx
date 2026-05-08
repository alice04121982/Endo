import Link from "next/link";
import { sendMagicLink } from "./actions";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{
    role?: string;
    sent?: string;
    email?: string;
    error?: string;
    access?: string;
  }>;
}) {
  const params = await searchParams;
  const requestedRole = params.role === "clinician" ? "clinician" : "patient";
  const sent = params.sent === "1";
  const error = params.error;
  const email = params.email ?? "";
  const access = params.access ?? "";

  if (sent) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-6 py-16 bg-[var(--color-brand-cream)]">
        <div className="w-full max-w-lg bg-white border border-[var(--color-brand-sand)] rounded-[20px] p-10 text-center">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-brand-stone)] mb-3">
            Check your email
          </p>
          <h1
            className="font-display font-extrabold text-[var(--color-brand-aubergine)] tracking-[-0.02em] leading-[1.1] mb-4"
            style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)" }}
          >
            We&apos;ve sent you a link
          </h1>
          <p className="text-[var(--color-brand-stone)] leading-relaxed mb-6">
            Open the email at <strong>{email}</strong> and tap the link to
            sign in. The link is good for one hour, then it stops working.
          </p>
          <p className="text-sm text-[var(--color-brand-stone)] mb-6">
            Didn&apos;t arrive? Check your spam folder, or send another.
          </p>
          <Link
            href={`/signin?role=${requestedRole}`}
            className="inline-flex items-center px-5 py-2.5 rounded-[10px] border border-[var(--color-brand-sand)] bg-white text-[var(--color-brand-aubergine)] font-semibold hover:border-[var(--color-brand-clay)] transition-colors"
          >
            Send another link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-6 py-16 bg-[var(--color-brand-cream)]">
      <div className="w-full max-w-xl bg-white border border-[var(--color-brand-sand)] rounded-[20px] p-10">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-brand-stone)] mb-3">
          Sign in to Endo
        </p>
        <h1
          className="font-display font-extrabold text-[var(--color-brand-aubergine)] tracking-[-0.02em] leading-[1.05] mb-3"
          style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
        >
          No password. Just your email.
        </h1>
        <p className="text-[var(--color-brand-stone)] leading-relaxed mb-8">
          Enter your email below. We&apos;ll send you a link that signs you in
          and brings you straight to the right view for your role.
        </p>

        {access && (
          <p className="text-sm text-[var(--color-brand-aubergine)] bg-[var(--color-brand-blush)]/40 border border-[var(--color-brand-sand)] rounded-[10px] px-4 py-3 mb-6">
            You&apos;re following a patient access link. Sign in as a clinician
            and we&apos;ll bring you straight to their record.
          </p>
        )}

        <form action={sendMagicLink} className="space-y-5">
          {access && <input type="hidden" name="access" value={access} />}
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-[var(--color-brand-aubergine)] mb-1">
              I&apos;m signing in as a…
            </legend>
            <RoleRadio
              name="role"
              value="patient"
              checked={requestedRole === "patient"}
              title="Patient"
              body="Track symptoms, manage your record, share with a clinician."
            />
            <RoleRadio
              name="role"
              value="clinician"
              checked={requestedRole === "clinician"}
              title="Clinician"
              body="Read a patient's record at a glance via consent link."
            />
          </fieldset>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-[var(--color-brand-aubergine)] mb-2"
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              defaultValue={email}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-[10px] border border-[var(--color-brand-sand)] bg-white text-[var(--color-brand-aubergine)] focus:outline-none focus:border-[var(--color-brand-clay)] focus:ring-2 focus:ring-[var(--color-brand-clay)]/30"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="text-sm text-[var(--color-brand-red)] font-medium"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center px-5 py-3.5 rounded-[12px] bg-[var(--color-brand-clay)] text-white font-semibold hover:bg-[var(--color-brand-clay-deep)] transition-colors"
          >
            Send sign-in link
          </button>
        </form>

        <p className="mt-8 text-xs text-[var(--color-brand-stone)] text-center">
          By continuing you agree this is decision support, not medical advice.
          Your data is held in a UK/EU region.
        </p>
      </div>
    </div>
  );
}

function RoleRadio({
  name,
  value,
  checked,
  title,
  body,
}: {
  name: string;
  value: string;
  checked: boolean;
  title: string;
  body: string;
}) {
  return (
    <label
      className={`flex items-start gap-3 p-4 rounded-[10px] border cursor-pointer transition-colors ${
        checked
          ? "border-[var(--color-brand-clay)] bg-[var(--color-brand-blush)]/40"
          : "border-[var(--color-brand-sand)] bg-white hover:border-[var(--color-brand-clay)]"
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        defaultChecked={checked}
        className="mt-1 accent-[var(--color-brand-clay)]"
      />
      <div>
        <p className="font-semibold text-[var(--color-brand-aubergine)]">
          {title}
        </p>
        <p className="text-sm text-[var(--color-brand-stone)]">{body}</p>
      </div>
    </label>
  );
}
