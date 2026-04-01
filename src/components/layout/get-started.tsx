"use client";

import { useState } from "react";
import { Stethoscope, Shield, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useClinician, ROLE_LABELS, type ClinicianRole } from "@/lib/clinician-store";

interface Props {
  existingClinicians?: { id: string; name: string; role: ClinicianRole }[];
  onSwitch?: (id: string) => void;
}

export function GetStarted({ existingClinicians = [], onSwitch }: Props) {
  const { addClinician } = useClinician();
  const [name, setName] = useState("");
  const [role, setRole] = useState<ClinicianRole>("consultant_gynaecologist");
  const [hospital, setHospital] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [showNew, setShowNew] = useState(existingClinicians.length === 0);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Please enter your name."); return; }
    if (!accepted) { setError("You must accept the data handling notice to continue."); return; }
    addClinician({ name: name.trim(), role, hospital: hospital.trim() });
  }

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="h-10 w-10 rounded-full bg-[#0057FF] flex items-center justify-center">
            <Stethoscope className="h-5 w-5 text-white" />
          </div>
          <span className="font-display text-xl font-bold text-[#111827] tracking-tight">
            EndoLink
          </span>
        </div>

        {/* Existing clinicians — switch panel */}
        {existingClinicians.length > 0 && !showNew && (
          <div className="bg-white rounded-2xl border border-[#E8E8E8] p-6 shadow-sm">
            <h1 className="font-display text-xl font-bold text-[#111827] mb-1">
              Welcome back
            </h1>
            <p className="text-sm text-[#6B7280] mb-5">
              Select your profile to continue, or add a new clinician.
            </p>

            <div className="space-y-2 mb-4">
              {existingClinicians.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onSwitch?.(c.id)}
                  className="w-full flex items-center gap-3 rounded-xl border border-[#E8E8E8] px-4 py-3 hover:border-[#0057FF]/30 hover:bg-blue-50/30 transition-colors text-left group"
                >
                  <div className="h-10 w-10 rounded-full bg-[#0057FF]/10 flex items-center justify-center shrink-0 text-sm font-bold text-[#0057FF]">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#111827] truncate">{c.name}</p>
                    <p className="text-xs text-[#6B7280]">{ROLE_LABELS[c.role]}</p>
                  </div>
                  <span className="ml-auto text-xs font-semibold text-[#0057FF] opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    Continue →
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowNew(true)}
              className="w-full text-sm font-semibold text-[#0057FF] hover:text-[#0046D4] transition-colors py-2"
            >
              + Add new clinician
            </button>
          </div>
        )}

        {/* New clinician form */}
        {showNew && (
          <div className="bg-white rounded-2xl border border-[#E8E8E8] p-6 shadow-sm">
            <h1 className="font-display text-xl font-bold text-[#111827] mb-1">
              {existingClinicians.length > 0 ? "Add new clinician" : "Welcome to EndoLink"}
            </h1>
            <p className="text-sm text-[#6B7280] mb-5">
              {existingClinicians.length > 0
                ? "Enter your details to create a new clinician profile."
                : "NICE NG73 aligned clinical decision support for endometriosis. Set up your profile to get started."}
            </p>

            {/* Data handling notice */}
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-2.5 mb-5">
              <Shield className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 leading-relaxed">
                <p className="font-semibold mb-1">Data Handling Notice</p>
                <p>
                  EndoLink is a <strong>clinical decision support tool for demonstration and research purposes only</strong>.
                  Do not enter real, identifiable patient data. All data is stored locally in your browser
                  and is not transmitted to any server. This tool does not replace clinical judgement and
                  must not be used as the sole basis for clinical decisions.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="text-xs font-semibold text-[#6B7280]">Full Name *</Label>
                <Input
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(""); }}
                  placeholder="Dr. Sarah Johnson"
                  className="mt-1"
                  autoFocus
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-[#6B7280]">Role *</Label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as ClinicianRole)}
                  className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {(Object.entries(ROLE_LABELS) as [ClinicianRole, string][]).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-xs font-semibold text-[#6B7280]">Hospital / Trust</Label>
                <Input
                  value={hospital}
                  onChange={(e) => setHospital(e.target.value)}
                  placeholder="e.g. Guy's and St Thomas' NHS Foundation Trust"
                  className="mt-1"
                />
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => { setAccepted(e.target.checked); setError(""); }}
                  className="mt-0.5 h-4 w-4 rounded border-[#D4DCE6] accent-[#0057FF]"
                />
                <span className="text-xs text-[#6B7280] leading-relaxed">
                  I confirm this tool is being used for <strong>demonstration or research purposes only</strong> and
                  I will not enter real identifiable patient data. I understand this tool does not replace
                  clinical judgement.
                </span>
              </label>

              {error && (
                <div className="flex items-center gap-2 text-xs text-red-600">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-[#0057FF] text-white font-semibold h-10 hover:bg-[#0046D4]"
                disabled={!name.trim() || !accepted}
              >
                {existingClinicians.length > 0 ? "Add Clinician" : "Get Started"}
              </Button>

              {existingClinicians.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowNew(false)}
                  className="w-full text-sm text-[#6B7280] hover:text-[#111827] transition-colors"
                >
                  ← Back
                </button>
              )}
            </form>
          </div>
        )}

        {/* NHS disclaimer */}
        <p className="text-center text-xs text-[#9CA3AF] mt-6 leading-relaxed">
          EndoLink is not a registered medical device. Based on NICE NG73.<br />
          For demonstration purposes only. Not for use with real patient data.
        </p>
      </div>
    </div>
  );
}
