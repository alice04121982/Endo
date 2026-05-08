import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getActiveClinicianAccess } from "@/lib/auth/consent";

const NAV = [
  { href: "/cdss", label: "Rapid Answer" },
  { href: "/cdss/dossier", label: "CSD" },
  { href: "/cdss/timeline", label: "Timeline" },
  { href: "/cdss/patients", label: "Patients" },
  { href: "/cdss/audit", label: "Audit" },
];

export default async function CdssLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const signedIn = user?.role === "clinician";
  const access = signedIn ? await getActiveClinicianAccess() : null;

  // Display name resolution
  const clinicianLabel = signedIn ? user.displayName : "Demo · Ms R Patel";

  return (
    <div
      data-theme="clinician"
      className="bg-background text-foreground min-h-[calc(100vh-3.5rem)]"
    >
      <header className="bg-card border-b border-border sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-12 flex items-center justify-between gap-6">
          <Link href="/cdss" className="flex items-center gap-2.5">
            <span className="inline-block h-5 w-5 rounded-sm bg-primary" />
            <span className="font-display font-bold tracking-tight">Endo</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Clinician
            </span>
          </Link>
          <nav className="flex items-center gap-5 text-[13px]">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <span className="h-4 w-px bg-border" aria-hidden="true" />
            <span className="text-muted-foreground hidden md:inline">
              {clinicianLabel}
            </span>
            {signedIn ? (
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign out
                </button>
              </form>
            ) : (
              <Link
                href="/signin?role=clinician"
                className="text-primary font-semibold hover:opacity-80 transition-opacity"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>

        {/* Patient-context strip — shown when a consent token is active */}
        {signedIn && access && (
          <div className="bg-secondary text-secondary-foreground border-b border-border">
            <div className="max-w-7xl mx-auto px-6 lg:px-10 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-semibold">{access.patientDisplayName}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">
                  {access.token.scope === "read_and_note"
                    ? "Read & note"
                    : "Read only"}
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">
                  Expires {formatExpires(access.token.expiresAt)}
                </span>
              </div>
              <span className="text-muted-foreground font-mono">
                Consent {access.token.id.slice(0, 8)}…
              </span>
            </div>
          </div>
        )}
      </header>
      <main>{children}</main>
    </div>
  );
}

function formatExpires(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "expired";
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours < 24) return `in ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `in ${days}d`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
