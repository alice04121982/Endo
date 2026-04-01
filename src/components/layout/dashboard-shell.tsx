"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LogOut, Plus, Settings, Stethoscope, UserCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useCdss } from "@/lib/cdss-store";
import { useClinician, ROLE_LABELS } from "@/lib/clinician-store";
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

function ClinicianMenu() {
  const { activeClinician, clinicians, switchClinician, addClinician } = useClinician();
  const [open, setOpen] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [accepted, setAccepted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setShowAdd(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!activeClinician) return null;

  const initials = activeClinician.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen((v) => !v); setShowAdd(false); }}
        className="flex items-center gap-2 rounded-full bg-[#F0F4F8] border border-[#E8E8E8] px-3 py-1.5 hover:border-[#0057FF]/30 transition-colors"
      >
        <div className="h-6 w-6 rounded-full bg-[#0057FF] flex items-center justify-center text-white text-xs font-bold shrink-0">
          {initials}
        </div>
        <span className="hidden sm:block text-sm font-semibold text-[#111827] max-w-[120px] truncate">
          {activeClinician.name}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-[#6B7280]" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl border border-[#E8E8E8] shadow-lg z-50 overflow-hidden">
          {/* Active clinician info */}
          <div className="px-4 py-3 border-b border-[#F3F4F6] bg-[#F8F9FA]">
            <p className="text-sm font-bold text-[#111827]">{activeClinician.name}</p>
            <p className="text-xs text-[#6B7280]">{ROLE_LABELS[activeClinician.role]}</p>
            {activeClinician.hospital && (
              <p className="text-xs text-[#6B7280] truncate">{activeClinician.hospital}</p>
            )}
          </div>

          {!showAdd ? (
            <>
              {/* Switch clinician */}
              {clinicians.length > 1 && (
                <div className="px-2 py-1.5 border-b border-[#F3F4F6]">
                  <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide px-2 py-1">
                    Switch Clinician
                  </p>
                  {clinicians
                    .filter((c) => c.id !== activeClinician.id)
                    .map((c) => (
                      <button
                        key={c.id}
                        onClick={() => { switchClinician(c.id); setOpen(false); }}
                        className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[#F3F4F6] transition-colors text-left"
                      >
                        <div className="h-7 w-7 rounded-full bg-[#0057FF]/10 flex items-center justify-center text-xs font-bold text-[#0057FF] shrink-0">
                          {c.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#111827] truncate">{c.name}</p>
                          <p className="text-xs text-[#6B7280]">{ROLE_LABELS[c.role]}</p>
                        </div>
                      </button>
                    ))}
                </div>
              )}

              {/* Actions */}
              <div className="px-2 py-1.5">
                <button
                  onClick={() => setShowAdd(true)}
                  className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-[#F3F4F6] transition-colors text-left text-sm font-medium text-[#111827]"
                >
                  <Plus className="h-4 w-4 text-[#6B7280]" />
                  Add new clinician
                </button>
                <Link
                  href="/cdss/settings"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-[#F3F4F6] transition-colors text-sm font-medium text-[#111827]"
                >
                  <Settings className="h-4 w-4 text-[#6B7280]" />
                  Account settings
                </Link>
              </div>

              {/* Privacy notice */}
              <div className="px-4 py-2.5 border-t border-[#F3F4F6] bg-[#F8F9FA]">
                <p className="text-xs text-[#9CA3AF] leading-relaxed">
                  Demo use only — do not enter real patient data.
                  All data is stored locally in your browser.
                </p>
              </div>
            </>
          ) : (
            /* Add clinician inline form */
            <div className="p-4">
              <p className="text-sm font-bold text-[#111827] mb-3">Add new clinician</p>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Full name"
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm mb-2"
                autoFocus
              />
              <label className="flex items-start gap-2 mb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  className="mt-0.5 h-3.5 w-3.5 rounded accent-[#0057FF]"
                />
                <span className="text-xs text-[#6B7280] leading-relaxed">
                  Demo use only — no real patient data
                </span>
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (!newName.trim() || !accepted) return;
                    addClinician({ name: newName.trim(), role: "consultant_gynaecologist", hospital: "" });
                    setOpen(false);
                    setShowAdd(false);
                    setNewName("");
                    setAccepted(false);
                  }}
                  disabled={!newName.trim() || !accepted}
                  className="flex-1 bg-[#0057FF] text-white text-xs font-semibold h-8 rounded-md hover:bg-[#0046D4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAdd(false)}
                  className="px-3 text-xs text-[#6B7280] hover:text-[#111827] h-8 rounded-md border border-[#E8E8E8]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
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
                  Patient:
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

            {/* Clinician menu */}
            <ClinicianMenu />
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
