"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useCdss } from "@/lib/cdss-store";
import type { RiskLevel } from "@/lib/types/cdss";

const navItems = [
  {
    name: "Dashboard",
    href: "/cdss",
    isActive: (p: string) => p === "/cdss",
  },
  {
    name: "Patients",
    href: "/cdss/patients",
    isActive: (p: string) =>
      p.startsWith("/cdss/patients") ||
      p.startsWith("/cdss/patient") ||
      p.startsWith("/cdss/biomarkers") ||
      p.startsWith("/cdss/trends"),
  },
  {
    name: "Latest Research",
    href: "/cdss/research",
    isActive: (p: string) => p === "/cdss/research",
  },
];

const riskBadgeStyles: Record<RiskLevel, string> = {
  low: "bg-emerald-100 text-emerald-700",
  moderate: "bg-amber-100 text-amber-700",
  high: "bg-orange-100 text-orange-700",
  very_high: "bg-red-100 text-red-700",
};

const riskLabels: Record<RiskLevel, string> = {
  low: "Low",
  moderate: "Mod",
  high: "High",
  very_high: "V.High",
};

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentPatient, getRiskAssessment } = useCdss();
  const risk = currentPatient ? getRiskAssessment(currentPatient.id) : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#F0F4F8]">
      {/* ── Top navigation ── */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E8E8E8]">
        <div className="flex items-center h-16 px-6 gap-6">
          {/* Logo */}
          <Link href="/cdss" className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 rounded-full bg-[#0057FF] flex items-center justify-center">
              <Stethoscope className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-base font-bold text-[#111827] tracking-tight">
              EndoLink
            </span>
          </Link>

          {/* Nav items */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const active = item.isActive(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                    active
                      ? "bg-[#111827] text-white"
                      : "text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]"
                  )}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-3">
            {/* Active patient chip */}
            {currentPatient && (
              <div className="hidden sm:flex items-center gap-2 rounded-full bg-[#F0F4F8] border border-[#E8E8E8] px-3 py-1.5">
                <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
                  Active:
                </span>
                <span className="text-sm font-semibold text-[#111827]">
                  {currentPatient.name}
                </span>
                {risk && (
                  <Badge
                    variant="secondary"
                    className={`text-xs py-0 ${riskBadgeStyles[risk.overall_risk]}`}
                  >
                    {riskLabels[risk.overall_risk]} {risk.score}
                  </Badge>
                )}
              </div>
            )}

            {/* Patient portal link */}
            <Link
              href="/portal"
              className="hidden sm:inline-flex text-xs font-semibold text-[#0057FF] hover:text-[#0046D4] transition-colors"
            >
              Patient Portal ↗
            </Link>

          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
