"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BookOpen,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Settings,
  Shield,
  Stethoscope,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useClinician, ROLE_LABELS } from "@/lib/clinician-store";
import { useCdss } from "@/lib/cdss-store";
import type { LabNotification } from "@/lib/types/cdss";

const navItems = [
  {
    name: "Dashboard",
    href: "/cdss",
    icon: LayoutDashboard,
    isActive: (p: string) => p === "/cdss",
  },
  {
    name: "Research",
    href: "/cdss/research",
    icon: BookOpen,
    isActive: (p: string) => p === "/cdss/research",
  },
  {
    name: "Audit",
    href: "/cdss/audit",
    icon: Shield,
    isActive: (p: string) => p === "/cdss/audit",
  },
];

function ClinicianMenu() {
  const { activeClinician, clinicians, isAdmin, switchClinician } = useClinician();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
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
        onClick={() => setOpen((v) => !v)}
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
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-sm font-bold text-[#111827]">{activeClinician.name}</p>
              {activeClinician.is_admin && (
                <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold">Admin</span>
              )}
            </div>
            <p className="text-xs text-[#6B7280]">{ROLE_LABELS[activeClinician.role]}</p>
            {activeClinician.hospital && (
              <p className="text-xs text-[#6B7280] truncate">{activeClinician.hospital}</p>
            )}
          </div>

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
            {isAdmin && (
              <Link
                href="/cdss/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-[#F3F4F6] transition-colors text-left text-sm font-medium text-[#111827]"
              >
                <Plus className="h-4 w-4 text-[#6B7280]" />
                Invite team member
              </Link>
            )}
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
        </div>
      )}
    </div>
  );
}

const flagColors: Record<LabNotification["flag"], { dot: string; text: string; bg: string }> = {
  elevated: { dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50" },
  critical: { dot: "bg-red-500",   text: "text-red-700",   bg: "bg-red-50"   },
  low:      { dot: "bg-blue-500",  text: "text-blue-700",  bg: "bg-blue-50"  },
};

function NotificationBell() {
  const { notifications, unreadCount, markNotificationRead, markAllNotificationsRead } = useCdss();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const recent = notifications.slice(0, 20);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center h-9 w-9 rounded-lg hover:bg-[#F3F4F6] transition-colors text-[#374151]"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl border border-[#E8E8E8] shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#F3F4F6]">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-[#374151]" />
              <span className="text-sm font-bold text-[#111827]">Lab Alerts</span>
              {unreadCount > 0 && (
                <span className="text-xs bg-red-100 text-red-700 font-semibold px-1.5 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllNotificationsRead}
                className="text-xs text-[#0057FF] font-semibold hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-96 overflow-y-auto divide-y divide-[#F3F4F6]">
            {recent.length === 0 ? (
              <p className="text-sm text-[#9CA3AF] text-center py-8">No lab alerts</p>
            ) : (
              recent.map((n) => {
                const colors = flagColors[n.flag];
                return (
                  <Link
                    key={n.id}
                    href={`/cdss/patients/${n.patient_id}?tab=biomarkers`}
                    onClick={() => { markNotificationRead(n.id); setOpen(false); }}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 hover:bg-[#F8F9FA] transition-colors",
                      !n.read && colors.bg
                    )}
                  >
                    <span className={cn("h-2 w-2 rounded-full mt-1.5 shrink-0", colors.dot)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#111827] truncate">{n.patient_name}</span>
                        <span className="text-[10px] text-[#9CA3AF] shrink-0">
                          {new Date(n.date_collected).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                      <p className="text-xs text-[#374151] mt-0.5">
                        <span className="font-semibold">{n.marker_label}</span>
                        {" "}{n.value} {n.unit}
                        {" · "}
                        <span className={cn("font-semibold capitalize", colors.text)}>{n.flag}</span>
                      </p>
                    </div>
                    {!n.read && (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#0057FF] mt-2 shrink-0" />
                    )}
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { activeClinician } = useClinician();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  const initials = activeClinician
    ? activeClinician.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <div className="min-h-screen flex flex-col bg-[#F0F4F8]">
      {/* ── Top navigation ── */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E8E8E8]">
        <div className="flex items-center h-14 sm:h-16 px-4 sm:px-6 gap-3 sm:gap-6">
          {/* Logo */}
          <Link href="/cdss" className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-[#0057FF] flex items-center justify-center">
              <Stethoscope className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
            </div>
            <span className="font-display text-sm sm:text-base font-bold text-[#111827] tracking-tight">
              EndoLink
            </span>
          </Link>

          {/* Desktop nav items */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = item.isActive(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-3 lg:px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
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
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            {/* Patient portal link — desktop only */}
            <Link
              href="/portal"
              className="hidden lg:inline-flex text-xs font-semibold text-[#0057FF] hover:text-[#0046D4] transition-colors"
            >
              Patient Portal ↗
            </Link>

            {/* Notification bell */}
            <NotificationBell />

            {/* Clinician menu — desktop only */}
            <div className="hidden md:block">
              <ClinicianMenu />
            </div>

            {/* Mobile: avatar + hamburger */}
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="md:hidden flex items-center gap-2 rounded-full bg-[#F0F4F8] border border-[#E8E8E8] px-2.5 py-1.5"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              <div className="h-6 w-6 rounded-full bg-[#0057FF] flex items-center justify-center text-white text-xs font-bold shrink-0">
                {initials}
              </div>
              {mobileMenuOpen ? (
                <X className="h-4 w-4 text-[#374151]" />
              ) : (
                <Menu className="h-4 w-4 text-[#374151]" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Full-screen mobile menu overlay ── */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-white flex flex-col">
          {/* Top bar */}
          <div className="flex items-center justify-between px-6 h-16 border-b border-[#F3F4F6]">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-[#0057FF] flex items-center justify-center">
                <Stethoscope className="h-4 w-4 text-white" />
              </div>
              <span className="font-display text-base font-bold text-[#111827] tracking-tight">EndoLink</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="h-9 w-9 flex items-center justify-center rounded-full bg-[#F3F4F6] text-[#374151]"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Nav links — centred */}
          <nav className="flex-1 flex flex-col items-center justify-center gap-2 px-8">
            {navItems.map((item) => {
              const active = item.isActive(pathname);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl text-sm font-bold transition-colors",
                    active
                      ? "bg-[#111827] text-white"
                      : "text-[#374151] hover:bg-[#F3F4F6]"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.name === "Research" ? "Latest Research" : item.name}
                </Link>
              );
            })}
            <Link
              href="/portal"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl text-sm font-bold text-[#0057FF] hover:bg-[#EEF4FF] transition-colors"
            >
              Patient Portal ↗
            </Link>
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl text-sm font-bold text-[#6B7280] hover:bg-[#F3F4F6] transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </Link>
          </nav>

          {/* Bottom: clinician info */}
          {activeClinician && (
            <div className="px-6 py-6 border-t border-[#F3F4F6]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#0057FF] flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#111827] truncate">{activeClinician.name}</p>
                  <p className="text-xs text-[#6B7280]">{ROLE_LABELS[activeClinician.role]}</p>
                </div>
                <Link
                  href="/cdss/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="ml-auto h-9 w-9 flex items-center justify-center rounded-full bg-[#F3F4F6] text-[#6B7280]"
                >
                  <Settings className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Content ── */}
      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[#E8E8E8] flex items-stretch">
        {navItems.map((item) => {
          const active = item.isActive(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-semibold transition-colors",
                active ? "text-[#0057FF]" : "text-[#9CA3AF]"
              )}
            >
              <Icon className={cn("h-5 w-5", active ? "text-[#0057FF]" : "text-[#9CA3AF]")} />
              {item.name}
            </Link>
          );
        })}
        {/* More button */}
        <button
          onClick={() => setMobileMenuOpen((v) => !v)}
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-semibold transition-colors",
            mobileMenuOpen ? "text-[#0057FF]" : "text-[#9CA3AF]"
          )}
        >
          <Menu className={cn("h-5 w-5", mobileMenuOpen ? "text-[#0057FF]" : "text-[#9CA3AF]")} />
          More
        </button>
      </nav>
    </div>
  );
}
