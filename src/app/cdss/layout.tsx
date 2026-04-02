"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { useClinician } from "@/lib/clinician-store";

export default function CdssLayout({ children }: { children: React.ReactNode }) {
  const { activeClinician } = useClinician();
  const router = useRouter();

  useEffect(() => {
    if (activeClinician === null) {
      router.replace("/login");
    } else if (!activeClinician.onboarding_complete) {
      router.replace("/onboarding");
    }
  }, [activeClinician, router]);

  if (!activeClinician || !activeClinician.onboarding_complete) return null;

  return <DashboardShell>{children}</DashboardShell>;
}
