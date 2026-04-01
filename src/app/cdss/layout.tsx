"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { GetStarted } from "@/components/layout/get-started";
import { useClinician } from "@/lib/clinician-store";

export default function CdssLayout({ children }: { children: React.ReactNode }) {
  const { activeClinician, clinicians, switchClinician } = useClinician();

  if (!activeClinician) {
    return (
      <GetStarted
        existingClinicians={clinicians}
        onSwitch={switchClinician}
      />
    );
  }

  return <DashboardShell>{children}</DashboardShell>;
}
