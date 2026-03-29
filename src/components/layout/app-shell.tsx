"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Calendar,
  FileText,
  Heart,
  Menu,
  Search,
  Shield,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Home", href: "/" },
  { name: "Track", href: "/log" },
  { name: "Timeline", href: "/timeline" },
  { name: "Insights", href: "/insights" },
  { name: "Community", href: "/research" },
  { name: "Report", href: "/report" },
];

const mobileNav = [
  { name: "Home", href: "/", icon: Heart },
  { name: "Track", href: "/log", icon: Activity },
  { name: "Timeline", href: "/timeline", icon: Calendar },
  { name: "Insights", href: "/insights", icon: Sparkles },
  { name: "Community", href: "/research", icon: Users },
  { name: "Report", href: "/report", icon: FileText },
  { name: "Privacy", href: "/privacy", icon: Shield },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Top navigation bar ── */}
      <header className="sticky top-0 z-50 bg-[var(--color-brand-smoke)]/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl relative flex items-center justify-between h-18 lg:h-16 px-5 lg:px-8">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            <svg
              width="221"
              height="68"
              viewBox="0 0 221 68"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-auto text-[var(--color-brand-midnight)]"
              aria-label="Endo"
            >
              <path d="M23.527 59.0174C20.6649 59.0174 18.0413 58.3973 15.6562 57.157C13.3188 55.9168 11.4584 54.2234 10.075 52.0768C8.69168 49.8825 8 47.3542 8 44.4921C8 42.2501 8.50087 40.1512 9.50262 38.1954C10.5521 36.1919 11.9831 34.5224 13.7958 33.1867C12.2216 31.9465 10.9575 30.4438 10.0035 28.6789C9.04945 26.8662 8.57243 25.0058 8.57243 23.0977C8.57243 20.2833 9.24026 17.8266 10.5759 15.7277C11.9593 13.5811 13.7958 11.9116 16.0855 10.719C18.4229 9.52645 20.975 8.93018 23.7417 8.93018H45.9947V21.0227H27.1763C26.413 21.0227 25.7213 21.1658 25.1012 21.452C24.4811 21.6905 23.9802 22.0721 23.5986 22.5968C23.2647 23.0739 23.0977 23.694 23.0977 24.4572C23.0977 25.1728 23.2647 25.7929 23.5986 26.3176C23.9802 26.7946 24.4811 27.1762 25.1012 27.4625C25.7213 27.701 26.413 27.8202 27.1763 27.8202H43.4904V39.8412H27.2478C26.4369 39.8412 25.7213 39.9843 25.1012 40.2705C24.4811 40.5567 23.9802 40.9622 23.5986 41.4869C23.2647 42.0116 23.0977 42.6556 23.0977 43.4188C23.0977 44.1344 23.2647 44.7545 23.5986 45.2792C23.9802 45.8039 24.4811 46.2094 25.1012 46.4956C25.7213 46.7341 26.4369 46.8534 27.2478 46.8534H45.9947V59.0174H23.527Z" fill="currentColor"/>
              <path d="M87.3473 59.9476C84.2943 59.9476 81.4083 59.3275 78.6893 58.0872C76.018 56.7993 73.8476 54.9389 72.178 52.5061C70.5084 50.0733 69.6736 47.1158 69.6736 43.6335V24.2426C69.6736 23.6224 69.5305 23.0977 69.2443 22.6684C69.0058 22.1914 68.6719 21.8336 68.2426 21.5951C67.8132 21.3566 67.3124 21.2373 66.7399 21.2373C66.1675 21.2373 65.6428 21.3566 65.1658 21.5951C64.7365 21.8336 64.3787 22.1914 64.0925 22.6684C63.854 23.0977 63.7347 23.6224 63.7347 24.2426V59.0174H48.9948V24.3857C48.9948 20.9034 49.8057 17.9459 51.4276 15.5131C53.0971 13.0803 55.2914 11.2199 58.0105 9.93193C60.7295 8.64398 63.6393 8 66.7399 8C69.8406 8 72.7266 8.64398 75.3979 9.93193C78.0692 11.2199 80.2396 13.0803 81.9092 15.5131C83.5788 17.9459 84.4136 20.9034 84.4136 24.3857V43.7766C84.4136 44.3967 84.5567 44.9453 84.8429 45.4223C85.1291 45.8993 85.4869 46.2571 85.9162 46.4956C86.3455 46.7341 86.7987 46.8534 87.2757 46.8534C87.8004 46.8534 88.3013 46.7341 88.7783 46.4956C89.2553 46.2571 89.637 45.8993 89.9232 45.4223C90.2094 44.9453 90.3525 44.3967 90.3525 43.7766V8.93019H105.021V43.6335C105.021 47.1158 104.186 50.0733 102.517 52.5061C100.847 54.9389 98.6527 56.7993 95.9336 58.0872C93.2623 59.3275 90.4002 59.9476 87.3473 59.9476Z" fill="currentColor"/>
              <path d="M108.021 59.0174V8.93018H129.272C134.519 8.93018 139.075 10.0035 142.939 12.1501C146.803 14.2967 149.784 17.2542 151.883 21.0227C154.03 24.7911 155.103 29.1082 155.103 33.9738C155.103 38.8394 154.03 43.1565 151.883 46.9249C149.784 50.6934 146.803 53.6509 142.939 55.7975C139.075 57.9441 134.519 59.0174 129.272 59.0174H108.021ZM123.476 46.9249H128.414C130.56 46.9249 132.468 46.4241 134.138 45.4223C135.807 44.3729 137.119 42.8702 138.073 40.9145C139.027 38.9587 139.504 36.6451 139.504 33.9738C139.504 31.3025 139.027 29.0128 138.073 27.1047C137.119 25.1489 135.807 23.6463 134.138 22.5968C132.468 21.5474 130.56 21.0227 128.414 21.0227H123.476V46.9249Z" fill="currentColor"/>
              <path d="M185.222 59.9476C181.262 59.9476 177.613 59.3036 174.274 58.0157C170.982 56.7277 168.12 54.915 165.688 52.5776C163.302 50.1925 161.442 47.4258 160.106 44.2775C158.771 41.1291 158.103 37.6946 158.103 33.9738C158.103 30.253 158.771 26.8185 160.106 23.6702C161.442 20.4741 163.302 17.7074 165.688 15.37C168.12 13.0326 170.982 11.2199 174.274 9.93193C177.613 8.64398 181.262 8 185.222 8C189.181 8 192.806 8.64398 196.098 9.93193C199.437 11.2199 202.299 13.0326 204.684 15.37C207.117 17.7074 209.001 20.4741 210.337 23.6702C211.672 26.8185 212.34 30.253 212.34 33.9738C212.34 37.6946 211.672 41.1291 210.337 44.2775C209.001 47.4258 207.117 50.1925 204.684 52.5776C202.299 54.915 199.437 56.7277 196.098 58.0157C192.806 59.3036 189.181 59.9476 185.222 59.9476ZM185.222 47.4974C186.987 47.4974 188.585 47.1634 190.016 46.4956C191.447 45.7801 192.663 44.8022 193.665 43.5619C194.667 42.3217 195.43 40.8906 195.955 39.2687C196.479 37.5992 196.742 35.8342 196.742 33.9738C196.742 32.1134 196.479 30.3723 195.955 28.7504C195.43 27.0809 194.667 25.6259 193.665 24.3857C192.663 23.1454 191.447 22.1914 190.016 21.5236C188.585 20.808 186.987 20.4503 185.222 20.4503C183.457 20.4503 181.859 20.808 180.428 21.5236C178.996 22.1914 177.78 23.1454 176.778 24.3857C175.777 25.6259 175.013 27.0809 174.489 28.7504C173.964 30.3723 173.702 32.1134 173.702 33.9738C173.702 35.8342 173.964 37.5992 174.489 39.2687C175.013 40.8906 175.777 42.3217 176.778 43.5619C177.78 44.8022 178.996 45.7801 180.428 46.4956C181.859 47.1634 183.457 47.4974 185.222 47.4974Z" fill="currentColor"/>
            </svg>
          </Link>

          {/* Desktop links — centre */}
          <nav className="hidden lg:flex items-center gap-1">
            {navigation.map((item) => {
              const isActive =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-3.5 py-2 text-sm font-semibold rounded-xl transition-colors",
                    isActive
                      ? "text-[var(--color-brand-orange)] bg-[var(--color-brand-orange)]/8"
                      : "text-[var(--color-brand-ink-soft)] hover:text-[var(--color-brand-midnight)] hover:bg-white/60"
                  )}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* ── Search overlay — slides in from right ── */}
          <div
            className={cn(
              "absolute top-0 bottom-0 right-0 flex items-center gap-2 px-3 lg:px-4 bg-[var(--color-brand-smoke)] transition-transform duration-250 ease-out",
              searchOpen ? "translate-x-0" : "translate-x-[105%]"
            )}
            style={{ left: "120px" }}
          >
            <Search className="h-4 w-4 shrink-0 text-[var(--color-brand-muted)]" />
            <input
              ref={searchInputRef}
              type="search"
              placeholder="Search symptoms, insights…"
              className="flex-1 bg-transparent text-sm text-[var(--color-brand-midnight)] placeholder:text-[var(--color-brand-muted)] outline-none min-w-0"
              onKeyDown={(e) => e.key === "Enter" && setSearchOpen(false)}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(false)}
              className="h-8 w-8 rounded-xl shrink-0 text-[var(--color-brand-muted)] hover:text-[var(--color-brand-midnight)] hover:bg-white/60"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(true)}
              className="h-11 w-11 lg:h-9 lg:w-9 rounded-xl text-[var(--color-brand-muted)] hover:text-[var(--color-brand-midnight)] hover:bg-white/60"
            >
              <Search className="h-5 w-5 lg:h-4 lg:w-4" />
            </Button>

            {/* Mobile menu trigger */}
            <div className="lg:hidden">
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-12 w-12 rounded-xl text-[var(--color-brand-midnight)] hover:bg-white/60"
                    />
                  }
                >
                  {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </SheetTrigger>
                <SheetContent side="right" className="w-72 p-0 bg-[var(--color-brand-smoke)]">
                  <SheetTitle className="sr-only">Navigation</SheetTitle>
                  <div className="flex flex-col h-full">
                    {/* Mobile brand */}
                    <div className="px-6 pt-6 pb-4">
                      <svg
                        width="221"
                        height="68"
                        viewBox="0 0 221 68"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-7 w-auto text-[var(--color-brand-midnight)]"
                        aria-label="Endo"
                      >
                        <path d="M23.527 59.0174C20.6649 59.0174 18.0413 58.3973 15.6562 57.157C13.3188 55.9168 11.4584 54.2234 10.075 52.0768C8.69168 49.8825 8 47.3542 8 44.4921C8 42.2501 8.50087 40.1512 9.50262 38.1954C10.5521 36.1919 11.9831 34.5224 13.7958 33.1867C12.2216 31.9465 10.9575 30.4438 10.0035 28.6789C9.04945 26.8662 8.57243 25.0058 8.57243 23.0977C8.57243 20.2833 9.24026 17.8266 10.5759 15.7277C11.9593 13.5811 13.7958 11.9116 16.0855 10.719C18.4229 9.52645 20.975 8.93018 23.7417 8.93018H45.9947V21.0227H27.1763C26.413 21.0227 25.7213 21.1658 25.1012 21.452C24.4811 21.6905 23.9802 22.0721 23.5986 22.5968C23.2647 23.0739 23.0977 23.694 23.0977 24.4572C23.0977 25.1728 23.2647 25.7929 23.5986 26.3176C23.9802 26.7946 24.4811 27.1762 25.1012 27.4625C25.7213 27.701 26.413 27.8202 27.1763 27.8202H43.4904V39.8412H27.2478C26.4369 39.8412 25.7213 39.9843 25.1012 40.2705C24.4811 40.5567 23.9802 40.9622 23.5986 41.4869C23.2647 42.0116 23.0977 42.6556 23.0977 43.4188C23.0977 44.1344 23.2647 44.7545 23.5986 45.2792C23.9802 45.8039 24.4811 46.2094 25.1012 46.4956C25.7213 46.7341 26.4369 46.8534 27.2478 46.8534H45.9947V59.0174H23.527Z" fill="currentColor"/>
                        <path d="M87.3473 59.9476C84.2943 59.9476 81.4083 59.3275 78.6893 58.0872C76.018 56.7993 73.8476 54.9389 72.178 52.5061C70.5084 50.0733 69.6736 47.1158 69.6736 43.6335V24.2426C69.6736 23.6224 69.5305 23.0977 69.2443 22.6684C69.0058 22.1914 68.6719 21.8336 68.2426 21.5951C67.8132 21.3566 67.3124 21.2373 66.7399 21.2373C66.1675 21.2373 65.6428 21.3566 65.1658 21.5951C64.7365 21.8336 64.3787 22.1914 64.0925 22.6684C63.854 23.0977 63.7347 23.6224 63.7347 24.2426V59.0174H48.9948V24.3857C48.9948 20.9034 49.8057 17.9459 51.4276 15.5131C53.0971 13.0803 55.2914 11.2199 58.0105 9.93193C60.7295 8.64398 63.6393 8 66.7399 8C69.8406 8 72.7266 8.64398 75.3979 9.93193C78.0692 11.2199 80.2396 13.0803 81.9092 15.5131C83.5788 17.9459 84.4136 20.9034 84.4136 24.3857V43.7766C84.4136 44.3967 84.5567 44.9453 84.8429 45.4223C85.1291 45.8993 85.4869 46.2571 85.9162 46.4956C86.3455 46.7341 86.7987 46.8534 87.2757 46.8534C87.8004 46.8534 88.3013 46.7341 88.7783 46.4956C89.2553 46.2571 89.637 45.8993 89.9232 45.4223C90.2094 44.9453 90.3525 44.3967 90.3525 43.7766V8.93019H105.021V43.6335C105.021 47.1158 104.186 50.0733 102.517 52.5061C100.847 54.9389 98.6527 56.7993 95.9336 58.0872C93.2623 59.3275 90.4002 59.9476 87.3473 59.9476Z" fill="currentColor"/>
                        <path d="M108.021 59.0174V8.93018H129.272C134.519 8.93018 139.075 10.0035 142.939 12.1501C146.803 14.2967 149.784 17.2542 151.883 21.0227C154.03 24.7911 155.103 29.1082 155.103 33.9738C155.103 38.8394 154.03 43.1565 151.883 46.9249C149.784 50.6934 146.803 53.6509 142.939 55.7975C139.075 57.9441 134.519 59.0174 129.272 59.0174H108.021ZM123.476 46.9249H128.414C130.56 46.9249 132.468 46.4241 134.138 45.4223C135.807 44.3729 137.119 42.8702 138.073 40.9145C139.027 38.9587 139.504 36.6451 139.504 33.9738C139.504 31.3025 139.027 29.0128 138.073 27.1047C137.119 25.1489 135.807 23.6463 134.138 22.5968C132.468 21.5474 130.56 21.0227 128.414 21.0227H123.476V46.9249Z" fill="currentColor"/>
                        <path d="M185.222 59.9476C181.262 59.9476 177.613 59.3036 174.274 58.0157C170.982 56.7277 168.12 54.915 165.688 52.5776C163.302 50.1925 161.442 47.4258 160.106 44.2775C158.771 41.1291 158.103 37.6946 158.103 33.9738C158.103 30.253 158.771 26.8185 160.106 23.6702C161.442 20.4741 163.302 17.7074 165.688 15.37C168.12 13.0326 170.982 11.2199 174.274 9.93193C177.613 8.64398 181.262 8 185.222 8C189.181 8 192.806 8.64398 196.098 9.93193C199.437 11.2199 202.299 13.0326 204.684 15.37C207.117 17.7074 209.001 20.4741 210.337 23.6702C211.672 26.8185 212.34 30.253 212.34 33.9738C212.34 37.6946 211.672 41.1291 210.337 44.2775C209.001 47.4258 207.117 50.1925 204.684 52.5776C202.299 54.915 199.437 56.7277 196.098 58.0157C192.806 59.3036 189.181 59.9476 185.222 59.9476ZM185.222 47.4974C186.987 47.4974 188.585 47.1634 190.016 46.4956C191.447 45.7801 192.663 44.8022 193.665 43.5619C194.667 42.3217 195.43 40.8906 195.955 39.2687C196.479 37.5992 196.742 35.8342 196.742 33.9738C196.742 32.1134 196.479 30.3723 195.955 28.7504C195.43 27.0809 194.667 25.6259 193.665 24.3857C192.663 23.1454 191.447 22.1914 190.016 21.5236C188.585 20.808 186.987 20.4503 185.222 20.4503C183.457 20.4503 181.859 20.808 180.428 21.5236C178.996 22.1914 177.78 23.1454 176.778 24.3857C175.777 25.6259 175.013 27.0809 174.489 28.7504C173.964 30.3723 173.702 32.1134 173.702 33.9738C173.702 35.8342 173.964 37.5992 174.489 39.2687C175.013 40.8906 175.777 42.3217 176.778 43.5619C177.78 44.8022 178.996 45.7801 180.428 46.4956C181.859 47.1634 183.457 47.4974 185.222 47.4974Z" fill="currentColor"/>
                      </svg>
                    </div>

                    {/* Mobile links */}
                    <nav className="flex-1 px-4 py-2">
                      {mobileNav.map((item) => {
                        const isActive =
                          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex items-center gap-3.5 rounded-xl px-4 py-3.5 text-base font-semibold transition-colors",
                              isActive
                                ? "bg-[var(--color-brand-orange)]/10 text-[var(--color-brand-orange)]"
                                : "text-[var(--color-brand-muted)] hover:bg-white/60 hover:text-[var(--color-brand-midnight)]"
                            )}
                          >
                            <item.icon className="h-5 w-5 shrink-0" />
                            {item.name}
                          </Link>
                        );
                      })}
                    </nav>

                    {/* Support footer */}
                    <div className="px-6 py-5">
                      <div className="rounded-xl bg-white px-4 py-3">
                        <p className="text-xs font-bold text-[var(--color-brand-midnight)]">
                          Need support?
                        </p>
                        <p className="text-[11px] text-[var(--color-brand-muted)] mt-0.5 leading-relaxed">
                          You&apos;re not alone. Connect with others who understand.
                        </p>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
