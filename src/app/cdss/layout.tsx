import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function CdssLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
