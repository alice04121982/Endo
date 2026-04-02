"use client";

import Link from "next/link";
import { ArrowRight, FlaskConical, Heart, ShieldCheck } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F0F4F8] flex flex-col items-center justify-center px-6 py-12">

      {/* Brand */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2.5 mb-4">
          <div className="h-9 w-9 rounded bg-[#0057FF] flex items-center justify-center shrink-0">
            <FlaskConical className="h-5 w-5 text-white" />
          </div>
          <span className="font-display text-2xl font-bold text-[#111827] tracking-tight">EndoLink</span>
        </div>
        <p className="text-[#374151] text-base max-w-sm mx-auto leading-relaxed">
          Endometriosis Clinical Decision Support — NICE NG73 aligned risk stratification and patient management.
        </p>
        <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0057FF] bg-[#EEF3FF] border border-[#C8D4E0] rounded px-2.5 py-1">
          <ShieldCheck className="h-3.5 w-3.5" />
          Demo mode — no authentication required
        </span>
      </div>

      {/* Role selector */}
      <div className="w-full max-w-2xl">
        <p className="text-xs font-bold text-[#6B7280] uppercase tracking-widest text-center mb-4">
          How are you accessing EndoLink today?
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Clinician card */}
          <Link href="/login" className="group block">
            <div className="h-full bg-white border-2 border-[#C8D4E0] rounded group-hover:border-[#0057FF] group-hover:shadow-md transition-all duration-150 p-6 flex flex-col">
              <div className="h-10 w-10 rounded bg-[#EEF3FF] flex items-center justify-center mb-4">
                <FlaskConical className="h-5 w-5 text-[#0057FF]" />
              </div>
              <h2 className="font-display text-lg font-bold text-[#111827] mb-1">
                Medical Professional
              </h2>
              <p className="text-sm text-[#6B7280] leading-relaxed flex-1 mb-5">
                Access the clinical dashboard for risk stratification, biomarker tracking, and patient management.
              </p>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-[#0057FF] group-hover:gap-2.5 transition-all">
                Enter CDSS
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </Link>

          {/* Patient card */}
          <Link href="/portal" className="group block">
            <div className="h-full bg-white border-2 border-[#C8D4E0] rounded group-hover:border-[#0057FF] group-hover:shadow-md transition-all duration-150 p-6 flex flex-col">
              <div className="h-10 w-10 rounded bg-[#EEF3FF] flex items-center justify-center mb-4">
                <Heart className="h-5 w-5 text-[#0057FF]" />
              </div>
              <h2 className="font-display text-lg font-bold text-[#111827] mb-1">
                Patient
              </h2>
              <p className="text-sm text-[#6B7280] leading-relaxed flex-1 mb-5">
                Log your symptoms, track your cycle, and share data with your clinical care team.
              </p>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-[#0057FF] group-hover:gap-2.5 transition-all">
                Patient Portal
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-10 text-xs text-[#6B7280] text-center max-w-sm">
        EndoLink is a clinical decision support tool. It does not replace clinical judgement. Always follow local guidelines and protocols.
      </p>
    </div>
  );
}
