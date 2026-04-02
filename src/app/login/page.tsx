"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Info,
  KeyRound,
  Lock,
  Shield,
  ShieldCheck,
  Stethoscope,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useClinician, ROLE_LABELS, type ClinicianRole } from "@/lib/clinician-store";
import { useCompliance } from "@/lib/compliance-store";
import { cn } from "@/lib/utils";

// ── Compliance statuses ────────────────────────────────────────────────────────

type ComplianceStatus = "demo" | "required" | "approved" | "pending";

const complianceItems: {
  title: string;
  status: ComplianceStatus;
  description: string;
  detail: string;
}[] = [
  {
    title: "GDPR Legal Basis",
    status: "demo",
    description: "Article 6(1)(e) + Article 9(2)(h)",
    detail:
      "Processing is lawful under Article 6(1)(e) (public task) and Article 9(2)(h) (healthcare provision/management). No separate patient consent is required for clinicians to use a CDSS within direct care. Primary consent model applies — this tool supports decisions within an existing care relationship.",
  },
  {
    title: "NHS CIS2 Authentication",
    status: "required",
    description: "Care Identity Service 2 — clinician identity",
    detail:
      "Clinicians accessing NHS patient data in production must authenticate via NHS CIS2 (formerly Spine identity). This replaces NHS Smartcard for modern systems. Integration requires onboarding with NHS England's Digital Identity programme. In production, clinicians log in via their NHS organisation SSO federated to CIS2.",
  },
  {
    title: "NHS Login (Patient Portal)",
    status: "required",
    description: "P9 identity verification for patient access",
    detail:
      "The Patient Portal must use NHS Login with P9 (highest) identity assurance — equivalent to in-person verification. Apply via the NHS Login developer portal. Requires a SCAS (Spine Connection Agreement), security review, and IG compliance assessment. OAuth2/OIDC integration pattern.",
  },
  {
    title: "Caldicott Guardian Approval",
    status: "required",
    description: "NHS Trust data governance sign-off",
    detail:
      "Each NHS organisation deploying EndoLink must obtain approval from their Caldicott Guardian — the senior person responsible for protecting patient information. This includes a review of all data flows, access controls, and data minimisation measures. The 8 Caldicott Principles must be documented and evidenced.",
  },
  {
    title: "DPIA",
    status: "required",
    description: "Data Protection Impact Assessment",
    detail:
      "A DPIA is mandatory under GDPR Article 35 as this system processes sensitive health data at scale. Must be completed before go-live. Covers: purpose and necessity, data flows, risks and mitigations, data retention, third-party processors, and subject rights. Review by the Data Protection Officer (DPO) required.",
  },
  {
    title: "GP Connect Access",
    status: "required",
    description: "NHS England API access for GP records",
    detail:
      "To access GP records, you must apply to NHS England's GP Connect programme. Two relevant APIs: (1) Access Record: Structured — for reading coded GP data; (2) Patient Facing Access API — for patient-initiated sharing. Requires: NHS Digital IG Toolkit completion, SCAS agreement, Conformance testing, and clinical safety case (DCB0129).",
  },
  {
    title: "PDS Integration",
    status: "required",
    description: "Personal Demographics Service (FHIR R4)",
    detail:
      "The Personal Demographics Service provides verified NHS patient demographics. Required for patient matching. Accessed via NHS API Platform (api.service.nhs.uk). Requires NHS login/CIS2 integration, environment onboarding (sandbox → integration → production), and Spine connection agreement.",
  },
  {
    title: "DSP Toolkit / IG Assessment",
    status: "required",
    description: "Data Security & Protection Toolkit",
    detail:
      "All organisations handling NHS patient data must complete the annual DSP Toolkit assessment, demonstrating compliance with the National Data Guardian's 10 data security standards. Required before connecting to NHS systems. Aligned with ISO 27001.",
  },
  {
    title: "Clinical Safety (DCB0129/0160)",
    status: "required",
    description: "MHRA / NHS clinical safety case",
    detail:
      "As a clinical decision support tool, EndoLink is a medical device under UK MDR 2002 (as amended post-Brexit). DCB0129 (manufacturer clinical risk management) and DCB0160 (deploying organisation) standards apply. A Clinical Safety Officer (CSO) must be appointed. A Clinical Risk Management File must be maintained.",
  },
  {
    title: "HRA / Section 251 (If Research)",
    status: "demo",
    description: "Only if data used for research beyond direct care",
    detail:
      "If patient data is used for research purposes beyond an individual's direct care — this is secondary use. You cannot rely on primary consent. Options: (1) Obtain explicit research consent from patients; (2) Apply to the Health Research Authority (HRA) Confidentiality Advisory Group (CAG) for Section 251 support, which permits use of identifiable data without consent for public interest research. A Research Ethics Committee (REC) opinion will also be required.",
  },
];

const statusConfig: Record<ComplianceStatus, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  approved: { label: "Approved",  color: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
  demo:     { label: "Demo Only", color: "text-blue-700 bg-blue-50 border-blue-200",          icon: Info },
  required: { label: "Required",  color: "text-amber-700 bg-amber-50 border-amber-200",        icon: AlertTriangle },
  pending:  { label: "Pending",   color: "text-purple-700 bg-purple-50 border-purple-200",     icon: ShieldCheck },
};

function CompliancePanel() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      {complianceItems.map((item, i) => {
        const cfg = statusConfig[item.status];
        const Icon = cfg.icon;
        const isOpen = expanded === i;

        return (
          <div
            key={i}
            className={cn(
              "rounded-xl border transition-colors",
              isOpen ? "border-[#C8D4E0] bg-white" : "border-[#E8E8E8] bg-white hover:border-[#C8D4E0]"
            )}
          >
            <button
              onClick={() => setExpanded(isOpen ? null : i)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left"
            >
              <Icon className={cn("h-4 w-4 shrink-0", cfg.color.split(" ")[0])} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-[#111827]">{item.title}</span>
                  <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full border", cfg.color)}>
                    {cfg.label}
                  </span>
                </div>
                <p className="text-xs text-[#6B7280] mt-0.5">{item.description}</p>
              </div>
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-[#9CA3AF] shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-[#9CA3AF] shrink-0" />
              )}
            </button>
            {isOpen && (
              <div className="px-4 pb-4">
                <p className="text-xs text-[#374151] leading-relaxed border-t border-[#F3F4F6] pt-3">
                  {item.detail}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Auth form ──────────────────────────────────────────────────────────────────

function LoginForm() {
  const router = useRouter();
  const { clinicians, addClinician, switchClinician, validateInvite, consumeInvite } = useClinician();
  const { logEvent } = useCompliance();
  const isFirstUser = clinicians.length === 0;

  const [view, setView] = useState<"select" | "new">(isFirstUser ? "new" : "select");
  const [name, setName] = useState("");
  const [role, setRole] = useState<ClinicianRole>("consultant_gynaecologist");
  const [hospital, setHospital] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Please enter your name."); return; }
    if (!accepted) { setError("You must accept the data handling notice to continue."); return; }
    if (!isFirstUser) {
      if (!inviteCode.trim()) { setError("An invite code is required."); return; }
      if (!validateInvite(inviteCode.trim())) { setError("Invalid or already-used invite code."); return; }
    }

    const clinician = addClinician({ name: name.trim(), role, hospital: hospital.trim(), is_admin: isFirstUser });
    if (!isFirstUser && inviteCode.trim()) consumeInvite(inviteCode.trim());
    logEvent({ clinician_id: clinician.id, clinician_name: clinician.name, event_type: "login", description: "New profile created and signed in" });
    router.push(isFirstUser ? "/onboarding" : "/cdss");
  }

  // Existing clinicians — select profile
  if (view === "select" && clinicians.length > 0) {
    return (
      <div className="space-y-3">
        <div>
          <h2 className="font-display text-xl font-bold text-[#111827] mb-1">Welcome back</h2>
          <p className="text-sm text-[#6B7280]">Select your profile to continue.</p>
        </div>

        <div className="space-y-2 pt-1">
          {clinicians.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                switchClinician(c.id);
                logEvent({ clinician_id: c.id, clinician_name: c.name, event_type: "login", description: "Signed in" });
                router.push(c.onboarding_complete ? "/cdss" : "/onboarding");
              }}
              className="w-full flex items-center gap-3 rounded-xl border border-[#E8E8E8] px-4 py-3 hover:border-[#0057FF]/40 hover:bg-blue-50/30 transition-colors text-left group"
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

        <div className="pt-2 border-t border-[#F3F4F6]">
          <button
            onClick={() => setView("new")}
            className="w-full text-sm text-[#6B7280] hover:text-[#111827] transition-colors flex items-center gap-1.5 justify-center py-2"
          >
            <KeyRound className="h-3.5 w-3.5" />
            Join with an invite code
          </button>
        </div>
      </div>
    );
  }

  // New user / create profile
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-bold text-[#111827] mb-1">
          {isFirstUser ? "Set up your workspace" : "Join your team"}
        </h2>
        <p className="text-sm text-[#6B7280]">
          {isFirstUser
            ? "You'll be the team admin and can invite colleagues."
            : "Enter your invite code and create your profile."}
        </p>
      </div>

      {/* NHS Login CTA — production path */}
      <div className="rounded-xl border border-[#C8D4E0] p-4 bg-[#F8FAFC]">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-6 w-6 rounded bg-[#003087] flex items-center justify-center shrink-0">
            <span className="text-white text-[9px] font-bold">NHS</span>
          </div>
          <span className="text-sm font-semibold text-[#111827]">NHS CIS2 Login</span>
          <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded-full ml-auto">
            Production Only
          </span>
        </div>
        <p className="text-xs text-[#6B7280] leading-relaxed mb-3">
          In production, clinicians sign in via NHS Care Identity Service 2 (CIS2) — federated through
          your NHS organisation's SSO. This ensures verified clinician identity before accessing
          patient data.
        </p>
        <button
          disabled
          className="w-full h-9 rounded-lg bg-[#003087] text-white text-sm font-semibold opacity-40 cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Lock className="h-3.5 w-3.5" />
          Sign in with NHS CIS2
        </button>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-[#E8E8E8]" />
        <span className="text-xs text-[#9CA3AF] font-semibold">DEMO MODE</span>
        <div className="flex-1 h-px bg-[#E8E8E8]" />
      </div>

      {/* Demo form */}
      <form onSubmit={handleCreate} className="space-y-3">
        {!isFirstUser && (
          <div>
            <Label className="text-xs font-semibold text-[#6B7280]">Invite Code *</Label>
            <div className="relative mt-1">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
              <Input
                value={inviteCode}
                onChange={(e) => { setInviteCode(e.target.value.toUpperCase()); setError(""); }}
                placeholder="e.g. A3F9KZ"
                className="pl-9 font-mono tracking-widest"
                maxLength={8}
              />
            </div>
          </div>
        )}

        <div>
          <Label className="text-xs font-semibold text-[#6B7280]">Full Name *</Label>
          <Input
            value={name}
            onChange={(e) => { setName(e.target.value); setError(""); }}
            placeholder="Dr. Sarah Johnson"
            className="mt-1"
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

        <label className="flex items-start gap-3 cursor-pointer bg-amber-50 border border-amber-200 rounded-lg p-3">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => { setAccepted(e.target.checked); setError(""); }}
            className="mt-0.5 h-4 w-4 rounded border-[#D4DCE6] accent-[#0057FF] shrink-0"
          />
          <span className="text-xs text-amber-800 leading-relaxed">
            I confirm this is a <strong>demonstration environment only</strong>. I will not enter real,
            identifiable patient data. All data is stored locally in my browser and not transmitted anywhere.
          </span>
        </label>

        {error && (
          <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <XCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={!name.trim() || !accepted}
          className="w-full bg-[#0057FF] text-white font-semibold h-10 hover:bg-[#0046D4]"
        >
          {isFirstUser ? "Set Up Demo Workspace" : "Join Team"}
        </Button>

        {clinicians.length > 0 && (
          <button
            type="button"
            onClick={() => setView("select")}
            className="w-full text-sm text-[#6B7280] hover:text-[#111827] transition-colors py-1"
          >
            ← Back to profiles
          </button>
        )}
      </form>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const [showCompliance, setShowCompliance] = useState(false);

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-[#E8E8E8] px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-[#0057FF] flex items-center justify-center">
            <Stethoscope className="h-4 w-4 text-white" />
          </div>
          <span className="font-display text-base font-bold text-[#111827]">EndoLink</span>
        </Link>
        <span className="text-xs font-semibold text-[#0057FF] bg-[#EEF4FF] border border-[#C8D4E0] rounded px-2.5 py-1 flex items-center gap-1.5">
          <ShieldCheck className="h-3 w-3" />
          Demo mode
        </span>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row items-start justify-center gap-8 px-6 py-10 max-w-6xl mx-auto w-full">
        {/* ── Left: auth form ── */}
        <div className="w-full max-w-md lg:sticky lg:top-10">
          <div className="bg-white rounded-2xl border border-[#E8E8E8] p-6 shadow-sm">
            <LoginForm />
          </div>

          <p className="text-center text-xs text-[#9CA3AF] mt-4 leading-relaxed px-4">
            EndoLink is not a registered medical device. Based on NICE NG73.
            For demonstration purposes only. Do not enter real patient data.
          </p>
        </div>

        {/* ── Right: compliance framework ── */}
        <div className="w-full max-w-xl">
          <div className="bg-white rounded-2xl border border-[#E8E8E8] p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="h-4 w-4 text-[#0057FF]" />
                  <h2 className="text-base font-bold text-[#111827]">Compliance Framework</h2>
                </div>
                <p className="text-xs text-[#6B7280] leading-relaxed">
                  Requirements for production deployment handling real NHS patient data.
                  Tap each item to read more.
                </p>
              </div>
            </div>

            {/* Consent model callout */}
            <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 mb-4">
              <div className="flex items-start gap-2.5">
                <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-800 leading-relaxed">
                  <p className="font-semibold mb-1">Primary Consent Model Applies</p>
                  <p>
                    EndoLink is used within a patient&apos;s <strong>direct care pathway</strong>. Clinicians using
                    a CDSS to support decisions for their own patients do not require separate patient
                    consent — care is lawful under GDPR Art. 9(2)(h) and NHS common law duty of
                    confidentiality. Secondary consent (or Section 251 support from HRA CAG) is only
                    required if data is used for <em>research beyond direct care</em>.
                  </p>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-2 mb-4">
              {(Object.entries(statusConfig) as [ComplianceStatus, typeof statusConfig[ComplianceStatus]][]).map(([k, v]) => {
                const Icon = v.icon;
                return (
                  <span key={k} className={cn("inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border", v.color)}>
                    <Icon className="h-3 w-3" />
                    {v.label}
                  </span>
                );
              })}
            </div>

            {/* Mobile toggle */}
            <button
              onClick={() => setShowCompliance((v) => !v)}
              className="lg:hidden w-full text-sm font-semibold text-[#0057FF] bg-[#EEF4FF] border border-[#C8D4E0] rounded-lg px-4 py-2.5 mb-4 flex items-center justify-between"
            >
              {showCompliance ? "Hide requirements" : "Show all requirements"}
              <ChevronDown className={cn("h-4 w-4 transition-transform", showCompliance && "rotate-180")} />
            </button>

            <div className={cn("lg:block", showCompliance ? "block" : "hidden")}>
              <CompliancePanel />
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 px-1">
            <a
              href="https://digital.nhs.uk/developer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#0057FF] hover:underline"
            >
              NHS England Developer Community ↗
            </a>
            <a
              href="https://digital.nhs.uk/services/personal-demographics-service"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#0057FF] hover:underline"
            >
              PDS (FHIR) ↗
            </a>
            <a
              href="https://digital.nhs.uk/services/gp-connect"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#0057FF] hover:underline"
            >
              GP Connect ↗
            </a>
            <a
              href="https://www.hra.nhs.uk/approvals-amendments/what-approvals-do-i-need/confidentiality-advisory-group/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#0057FF] hover:underline"
            >
              HRA CAG (Section 251) ↗
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
