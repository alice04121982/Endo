import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listActiveRedFlagEventsForCurrentPatient } from "@/lib/clinical/red-flags";
import { RedFlagBannerStack } from "@/components/red-flag-banner";

const NAV = [
  { href: "/portal", label: "Today" },
  { href: "/portal/journal", label: "Journal" },
  { href: "/portal/quality", label: "Quality of life" },
  { href: "/portal/uploads", label: "Documents" },
  { href: "/portal/dossier", label: "Dossier" },
  { href: "/portal/share", label: "Share" },
  { href: "/portal/check", label: "Urgent check" },
];

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const signedIn = user?.role === "patient";
  const displayName = signedIn ? user.displayName : "Demo · Emma Clarke";
  const activeFlags = signedIn
    ? await listActiveRedFlagEventsForCurrentPatient()
    : [];

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      <header className="bg-white/90 backdrop-blur border-b border-[var(--color-brand-sand)] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between gap-6">
          <Link href="/portal" className="flex items-center gap-3 shrink-0">
            <span className="inline-block h-8 w-8 rounded-full bg-[var(--color-brand-clay)]" />
            <span className="font-display font-extrabold text-[var(--color-brand-aubergine)] text-lg tracking-tight">
              Endo
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-[var(--color-brand-stone)] hover:text-[var(--color-brand-aubergine)] font-medium transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden sm:inline text-sm text-[var(--color-brand-stone)]">
              {displayName}
            </span>
            {signedIn ? (
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="text-sm font-medium text-[var(--color-brand-stone)] hover:text-[var(--color-brand-aubergine)] transition-colors"
                >
                  Sign out
                </button>
              </form>
            ) : (
              <Link
                href="/signin?role=patient"
                className="text-sm font-semibold text-[var(--color-brand-clay)] hover:text-[var(--color-brand-clay-deep)] transition-colors"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>
      <RedFlagBannerStack events={activeFlags} audience="patient" />
      <main>{children}</main>
    </div>
  );
}
