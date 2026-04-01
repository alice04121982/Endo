import Link from "next/link";
import { Stethoscope } from "lucide-react";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F0F4F8]">
      <header className="bg-white border-b border-[#E8E8E8]">
        <div className="flex items-center justify-between h-14 px-6">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-full bg-[#0057FF] flex items-center justify-center">
              <Stethoscope className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-display text-sm font-bold text-[#111827]">EndoLink</span>
            <span className="text-xs text-[#6B7280] font-medium ml-1">· Patient Portal</span>
          </div>
          <Link
            href="/cdss"
            className="text-xs font-semibold text-[#0057FF] hover:text-[#0046D4] transition-colors"
          >
            Clinician View →
          </Link>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
