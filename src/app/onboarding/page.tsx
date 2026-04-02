"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Database,
  ExternalLink,
  FileText,
  Info,
  Link2,
  Lock,
  ScrollText,
  Shield,
  ShieldCheck,
  Stethoscope,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useClinician } from "@/lib/clinician-store";
import { useCompliance, type OrgCompliance, type OrgType, type DspStatus, type ApiStatus, type PdsEnvironment, ORG_TYPE_LABELS, DSP_STATUS_LABELS, API_STATUS_LABELS, PDS_ENV_LABELS } from "@/lib/compliance-store";

// ── Step definitions ──────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Organisation",     icon: Building2,       short: "Org" },
  { id: 2, label: "Caldicott",        icon: UserCheck,       short: "Caldicott" },
  { id: 3, label: "DPIA",             icon: FileText,        short: "DPIA" },
  { id: 4, label: "DSP Toolkit",      icon: ClipboardCheck,  short: "DSP" },
  { id: 5, label: "Clinical Safety",  icon: ShieldCheck,     short: "Safety" },
  { id: 6, label: "API Readiness",    icon: Link2,           short: "APIs" },
];

// ── Field helpers ─────────────────────────────────────────────────────────────

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-semibold text-[#111827]">{label}</Label>
      {hint && <p className="text-xs text-[#6B7280]">{hint}</p>}
      {children}
    </div>
  );
}

function Select<T extends string>({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Record<T, string>;
  placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="w-full h-10 rounded-md border border-[#E8E8E8] bg-white px-3 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#0057FF]/20 focus:border-[#0057FF]"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {(Object.entries(options) as [T, string][]).map(([k, v]) => (
        <option key={k} value={k}>{v}</option>
      ))}
    </select>
  );
}

function AckCheckbox({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className={cn(
      "flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors",
      checked ? "border-[#0057FF]/30 bg-blue-50/50" : "border-[#E8E8E8] hover:border-[#C8D4E0]"
    )}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-[#D4DCE6] accent-[#0057FF] shrink-0"
      />
      <span className="text-sm text-[#374151] leading-relaxed">{children}</span>
    </label>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-xl bg-blue-50 border border-blue-200 p-4">
      <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
      <div className="text-xs text-blue-800 leading-relaxed">{children}</div>
    </div>
  );
}

function WarnBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-xl bg-amber-50 border border-amber-200 p-4">
      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
      <div className="text-xs text-amber-800 leading-relaxed">{children}</div>
    </div>
  );
}

// ── Step components ───────────────────────────────────────────────────────────

function Step1({ data, set }: { data: Partial<OrgCompliance>; set: (k: keyof OrgCompliance, v: string) => void }) {
  return (
    <div className="space-y-5">
      <InfoBox>
        <p className="font-semibold mb-1">Why this matters</p>
        <p>EndoLink processes NHS patient data. Before accessing the CDSS, we need to know which organisation is deploying it so that data governance responsibilities are correctly attributed. This satisfies <strong>GDPR Article 5(2)</strong> accountability and NHS Data Security Standard 1.</p>
      </InfoBox>

      <Field label="Organisation name" hint="Full legal name of the deploying NHS organisation or healthcare provider">
        <Input
          value={data.org_name ?? ""}
          onChange={(e) => set("org_name", e.target.value)}
          placeholder="e.g. Guy's and St Thomas' NHS Foundation Trust"
        />
      </Field>

      <Field label="ODS code" hint="NHS Organisational Data Service code — used for GP Connect and PDS integration">
        <Input
          value={data.org_ods_code ?? ""}
          onChange={(e) => set("org_ods_code", e.target.value.toUpperCase())}
          placeholder="e.g. RJ1"
          className="font-mono uppercase"
          maxLength={10}
        />
      </Field>

      <Field label="Organisation type">
        <Select<OrgType>
          value={(data.org_type as OrgType) ?? "nhs_trust"}
          onChange={(v) => set("org_type", v)}
          options={ORG_TYPE_LABELS}
        />
      </Field>
    </div>
  );
}

function Step2({ data, set, setb }: { data: Partial<OrgCompliance>; set: (k: keyof OrgCompliance, v: string) => void; setb: (k: keyof OrgCompliance, v: boolean) => void }) {
  return (
    <div className="space-y-5">
      <InfoBox>
        <p className="font-semibold mb-1">Caldicott Guardian</p>
        <p>Every NHS organisation must appoint a <strong>Caldicott Guardian</strong> — a senior clinician responsible for protecting patient information. They must formally approve the deployment of systems that process patient data. The 8 Caldicott Principles govern all patient data use in the NHS.</p>
      </InfoBox>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Guardian name">
          <Input
            value={data.caldicott_name ?? ""}
            onChange={(e) => set("caldicott_name", e.target.value)}
            placeholder="e.g. Prof. Sarah Ahmed"
          />
        </Field>
        <Field label="Guardian email">
          <Input
            type="email"
            value={data.caldicott_email ?? ""}
            onChange={(e) => set("caldicott_email", e.target.value)}
            placeholder="s.ahmed@nhs.uk"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Approval date" hint="Date the Caldicott Guardian approved this deployment">
          <Input
            type="date"
            value={data.caldicott_approval_date ?? ""}
            onChange={(e) => set("caldicott_approval_date", e.target.value)}
          />
        </Field>
        <Field label="Reference / approval number">
          <Input
            value={data.caldicott_reference ?? ""}
            onChange={(e) => set("caldicott_reference", e.target.value)}
            placeholder="e.g. IG-2026-047"
          />
        </Field>
      </div>

      <AckCheckbox
        checked={data.caldicott_principles_acknowledged ?? false}
        onChange={(v) => setb("caldicott_principles_acknowledged", v)}
      >
        I confirm that the Caldicott Guardian has reviewed this deployment against the <strong>8 Caldicott Principles</strong>: justified purpose, not used unless necessary, minimum necessary data, need-to-know access, everyone aware of responsibilities, compliance with law, duty to share equal to duty to protect, and inform and involve patients.
      </AckCheckbox>

      <a
        href="https://www.gov.uk/government/publications/the-caldicott-principles"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs text-[#0057FF] hover:underline"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        Read the 8 Caldicott Principles (gov.uk)
      </a>
    </div>
  );
}

function Step3({ data, set, setb }: { data: Partial<OrgCompliance>; set: (k: keyof OrgCompliance, v: string) => void; setb: (k: keyof OrgCompliance, v: boolean) => void }) {
  return (
    <div className="space-y-5">
      <InfoBox>
        <p className="font-semibold mb-1">DPIA — Data Protection Impact Assessment</p>
        <p>A DPIA is <strong>mandatory under GDPR Article 35</strong> for systems that process special category health data at scale. It must be completed and reviewed by a Data Protection Officer (DPO) before go-live. The legal basis for processing is <strong>Article 9(2)(h)</strong> — healthcare provision — supported by NHS Act 2006 s.251.</p>
      </InfoBox>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Data Protection Officer (DPO) name">
          <Input
            value={data.dpo_name ?? ""}
            onChange={(e) => set("dpo_name", e.target.value)}
            placeholder="e.g. James Okafor"
          />
        </Field>
        <Field label="DPO email">
          <Input
            type="email"
            value={data.dpo_email ?? ""}
            onChange={(e) => set("dpo_email", e.target.value)}
            placeholder="dpo@nhs.uk"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="DPIA reference number">
          <Input
            value={data.dpia_ref ?? ""}
            onChange={(e) => set("dpia_ref", e.target.value)}
            placeholder="e.g. DPIA-2026-014"
          />
        </Field>
        <Field label="DPIA completion date">
          <Input
            type="date"
            value={data.dpia_date ?? ""}
            onChange={(e) => set("dpia_date", e.target.value)}
          />
        </Field>
      </div>

      <AckCheckbox
        checked={data.gdpr_acknowledged ?? false}
        onChange={(v) => setb("gdpr_acknowledged", v)}
      >
        I confirm a DPIA has been completed and approved by the DPO. Legal basis for processing is <strong>GDPR Article 6(1)(e)</strong> (public task) and <strong>Article 9(2)(h)</strong> (healthcare provision and management). Data is processed under NHS common law duty of confidentiality. No separate patient consent is required for direct care use of a CDSS — primary consent model applies.
      </AckCheckbox>

      <div className="rounded-xl border border-[#E8E8E8] p-4 bg-[#F8FAFC]">
        <p className="text-xs font-semibold text-[#111827] mb-2">Primary vs. Secondary Consent</p>
        <div className="space-y-2 text-xs text-[#374151]">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
            <span><strong>Primary consent (direct care):</strong> Clinician uses CDSS to inform decisions about their own patients. No extra consent needed — lawful under Art. 9(2)(h) and NHS confidentiality duty.</span>
          </div>
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
            <span><strong>Secondary consent (research/audit):</strong> If data is used beyond direct care (anonymised cohorts, research, quality improvement), explicit patient consent OR HRA Section 251 support is required.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step4({ data, set, setb: _setb }: { data: Partial<OrgCompliance>; set: (k: keyof OrgCompliance, v: string) => void; setb: (k: keyof OrgCompliance, v: boolean) => void }) {
  return (
    <div className="space-y-5">
      <InfoBox>
        <p className="font-semibold mb-1">DSP Toolkit</p>
        <p>The <strong>NHS Data Security and Protection (DSP) Toolkit</strong> is the mandatory annual self-assessment for all organisations handling NHS patient data. It demonstrates compliance with the National Data Guardian&apos;s 10 data security standards and is required before NHS Digital will grant access to Spine services (PDS, GP Connect, CIS2).</p>
      </InfoBox>

      <Field label="Toolkit submission status">
        <Select<DspStatus>
          value={(data.dsp_status as DspStatus) ?? "not_started"}
          onChange={(v) => set("dsp_status", v)}
          options={DSP_STATUS_LABELS}
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Named DSP lead" hint="Person responsible for the submission">
          <Input
            value={data.dsp_lead ?? ""}
            onChange={(e) => set("dsp_lead", e.target.value)}
            placeholder="e.g. Maria Santos"
          />
        </Field>
        <Field label="Submission ID" hint="Leave blank if not yet submitted">
          <Input
            value={data.dsp_submission_id ?? ""}
            onChange={(e) => set("dsp_submission_id", e.target.value)}
            placeholder="e.g. DSP-2026-00142"
          />
        </Field>
      </div>

      <Field label="Submission / approval date">
        <Input
          type="date"
          value={data.dsp_date ?? ""}
          onChange={(e) => set("dsp_date", e.target.value)}
        />
      </Field>

      {(data.dsp_status === "not_started" || data.dsp_status === "in_progress") && (
        <WarnBox>
          <strong>Action required:</strong> Your DSP Toolkit assessment is not yet complete. NHS Digital requires an approved submission before production access to Spine services. You can continue this setup, but API connections will not be available until the toolkit is approved.
        </WarnBox>
      )}

      <a
        href="https://www.dsptoolkit.nhs.uk"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs text-[#0057FF] hover:underline"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        Access the DSP Toolkit (dsptoolkit.nhs.uk)
      </a>
    </div>
  );
}

function Step5({ data, set, setb }: { data: Partial<OrgCompliance>; set: (k: keyof OrgCompliance, v: string) => void; setb: (k: keyof OrgCompliance, v: boolean) => void }) {
  return (
    <div className="space-y-5">
      <InfoBox>
        <p className="font-semibold mb-1">Clinical Safety — DCB0129 &amp; DCB0160</p>
        <p>EndoLink is a <strong>clinical decision support tool</strong> and constitutes a medical device under UK MDR 2002. <strong>DCB0129</strong> applies to the manufacturer (Endo); <strong>DCB0160</strong> applies to the deploying organisation. A Clinical Safety Officer (CSO) must be appointed and a Clinical Risk Management File (CRMF) maintained. The MHRA must be notified of any incidents.</p>
      </InfoBox>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Clinical Safety Officer (CSO) name" hint="Must be a registered clinician">
          <Input
            value={data.cso_name ?? ""}
            onChange={(e) => set("cso_name", e.target.value)}
            placeholder="e.g. Dr. Rachel Webb"
          />
        </Field>
        <Field label="CSO email">
          <Input
            type="email"
            value={data.cso_email ?? ""}
            onChange={(e) => set("cso_email", e.target.value)}
            placeholder="r.webb@nhs.uk"
          />
        </Field>
      </div>

      <Field label="Hazard log reference" hint="Reference to your organisation's DCB0160 hazard log">
        <Input
          value={data.hazard_log_ref ?? ""}
          onChange={(e) => set("hazard_log_ref", e.target.value)}
          placeholder="e.g. CRMF-2026-ENDO-001"
        />
      </Field>

      <AckCheckbox
        checked={data.dcb0129_acknowledged ?? false}
        onChange={(v) => setb("dcb0129_acknowledged", v)}
      >
        <span>
          <strong>DCB0129 (Manufacturer):</strong> I acknowledge that Endo Clinical Ltd maintains a Clinical Risk Management System in accordance with DCB0129, including hazard identification, risk assessment, and risk control measures documented in the Manufacturer&apos;s Clinical Risk Management File.
        </span>
      </AckCheckbox>

      <AckCheckbox
        checked={data.dcb0160_acknowledged ?? false}
        onChange={(v) => setb("dcb0160_acknowledged", v)}
      >
        <span>
          <strong>DCB0160 (Deploying Organisation):</strong> I confirm that our organisation has completed a local clinical safety assessment of EndoLink under DCB0160. This includes a local hazard log, assessment of the system&apos;s clinical risk, and CSO sign-off. We accept responsibility for safe deployment within our clinical environment.
        </span>
      </AckCheckbox>

      <a
        href="https://digital.nhs.uk/data-and-information/information-standards/information-standards-and-data-collections-including-extractions/publications-and-notifications/standards-and-collections/dcb0129-clinical-risk-management-its-application-in-the-manufacture-of-health-it-systems"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs text-[#0057FF] hover:underline"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        DCB0129 standard (NHS Digital)
      </a>
    </div>
  );
}

function Step6({ data, set, setb: _setb }: { data: Partial<OrgCompliance>; set: (k: keyof OrgCompliance, v: string) => void; setb: (k: keyof OrgCompliance, v: boolean) => void }) {
  return (
    <div className="space-y-5">
      <InfoBox>
        <p className="font-semibold mb-1">NHS API Readiness</p>
        <p>EndoLink integrates with three NHS APIs: <strong>GP Connect</strong> (structured GP record access), <strong>PDS</strong> (patient demographics), and <strong>NHS CIS2</strong> (clinician identity). Each requires separate onboarding with NHS England. Record your current application status for each.</p>
      </InfoBox>

      {/* GP Connect */}
      <div className="rounded-xl border border-[#E8E8E8] p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-[#0057FF]" />
          <span className="text-sm font-semibold text-[#111827]">GP Connect</span>
          <span className="text-xs text-[#6B7280]">— Access Record: Structured</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Application status">
            <Select<ApiStatus>
              value={(data.gp_connect_status as ApiStatus) ?? "not_applied"}
              onChange={(v) => set("gp_connect_status", v)}
              options={API_STATUS_LABELS}
            />
          </Field>
          <Field label="App / client ID (if applicable)">
            <Input
              value={data.gp_connect_app_id ?? ""}
              onChange={(e) => set("gp_connect_app_id", e.target.value)}
              placeholder="e.g. GPCA-0042"
            />
          </Field>
        </div>
        <a href="https://digital.nhs.uk/services/gp-connect" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-[#0057FF] hover:underline">
          <ExternalLink className="h-3.5 w-3.5" />Apply for GP Connect access
        </a>
      </div>

      {/* PDS */}
      <div className="rounded-xl border border-[#E8E8E8] p-4 space-y-3">
        <div className="flex items-center gap-2">
          <ScrollText className="h-4 w-4 text-[#0057FF]" />
          <span className="text-sm font-semibold text-[#111827]">PDS — Personal Demographics Service</span>
          <span className="text-xs text-[#6B7280]">— FHIR R4</span>
        </div>
        <Field label="Current environment">
          <Select<PdsEnvironment>
            value={(data.pds_environment as PdsEnvironment) ?? "not_started"}
            onChange={(v) => set("pds_environment", v)}
            options={PDS_ENV_LABELS}
          />
        </Field>
        <a href="https://digital.nhs.uk/developer/api-catalogue/personal-demographics-service-fhir" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-[#0057FF] hover:underline">
          <ExternalLink className="h-3.5 w-3.5" />PDS FHIR API catalogue
        </a>
      </div>

      {/* CIS2 */}
      <div className="rounded-xl border border-[#E8E8E8] p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-[#0057FF]" />
          <span className="text-sm font-semibold text-[#111827]">NHS CIS2</span>
          <span className="text-xs text-[#6B7280]">— Clinician identity &amp; authentication</span>
        </div>
        <Field label="CIS2 integration status">
          <Select<ApiStatus>
            value={(data.cis2_status as ApiStatus) ?? "not_applied"}
            onChange={(v) => set("cis2_status", v)}
            options={API_STATUS_LABELS}
          />
        </Field>
        <a href="https://digital.nhs.uk/services/care-identity-service" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-[#0057FF] hover:underline">
          <ExternalLink className="h-3.5 w-3.5" />Apply for CIS2 integration
        </a>
      </div>

      {/* NHS Login */}
      <div className="rounded-xl border border-[#E8E8E8] p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-[#0057FF]" />
          <span className="text-sm font-semibold text-[#111827]">NHS Login</span>
          <span className="text-xs text-[#6B7280]">— Patient Portal (P9 identity assurance)</span>
        </div>
        <Field label="NHS Login status">
          <Select<ApiStatus>
            value={(data.nhs_login_status as ApiStatus) ?? "not_applied"}
            onChange={(v) => set("nhs_login_status", v)}
            options={API_STATUS_LABELS}
          />
        </Field>
        <a href="https://digital.nhs.uk/services/nhs-login" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-[#0057FF] hover:underline">
          <ExternalLink className="h-3.5 w-3.5" />Apply for NHS Login
        </a>
      </div>
    </div>
  );
}

// ── Summary ───────────────────────────────────────────────────────────────────

function SummaryRow({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-[#F3F4F6] last:border-0">
      <span className="text-xs text-[#6B7280] shrink-0">{label}</span>
      <span className={cn("text-xs font-semibold text-right", warn ? "text-amber-600" : "text-[#111827]")}>{value}</span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const EMPTY: Partial<OrgCompliance> = {
  org_name: "", org_ods_code: "", org_type: "nhs_trust",
  caldicott_name: "", caldicott_email: "", caldicott_approval_date: "", caldicott_reference: "", caldicott_principles_acknowledged: false,
  dpo_name: "", dpo_email: "", dpia_ref: "", dpia_date: "", gdpr_acknowledged: false,
  dsp_status: "not_started", dsp_submission_id: "", dsp_date: "", dsp_lead: "",
  cso_name: "", cso_email: "", dcb0129_acknowledged: false, dcb0160_acknowledged: false, hazard_log_ref: "",
  gp_connect_status: "not_applied", gp_connect_app_id: "", pds_environment: "not_started", cis2_status: "not_applied", nhs_login_status: "not_applied",
};

const STEP_VALID: ((d: Partial<OrgCompliance>) => boolean)[] = [
  (d) => !!(d.org_name?.trim() && d.org_ods_code?.trim() && d.org_type),
  (d) => !!(d.caldicott_name?.trim() && d.caldicott_email?.trim() && d.caldicott_approval_date && d.caldicott_reference?.trim() && d.caldicott_principles_acknowledged),
  (d) => !!(d.dpo_name?.trim() && d.dpo_email?.trim() && d.dpia_ref?.trim() && d.dpia_date && d.gdpr_acknowledged),
  (d) => !!(d.dsp_lead?.trim() && d.dsp_status),
  (d) => !!(d.cso_name?.trim() && d.cso_email?.trim() && d.dcb0129_acknowledged && d.dcb0160_acknowledged),
  (_d) => true, // API step always valid — status can be "not_applied"
];

export default function OnboardingPage() {
  const router = useRouter();
  const { activeClinician, completeOnboarding } = useClinician();
  const { saveCompliance, logEvent } = useCompliance();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<Partial<OrgCompliance>>({ ...EMPTY });
  const [submitting, setSubmitting] = useState(false);

  function set(k: keyof OrgCompliance, v: string) {
    setData((d) => ({ ...d, [k]: v }));
  }
  function setb(k: keyof OrgCompliance, v: boolean) {
    setData((d) => ({ ...d, [k]: v }));
  }

  const isValid = STEP_VALID[step - 1](data);
  const allDone = STEP_VALID.every((fn) => fn(data));

  function handleNext() {
    if (step < STEPS.length) setStep(step + 1);
  }
  function handleBack() {
    if (step > 1) setStep(step - 1);
  }

  function handleFinish() {
    if (!activeClinician) return;
    setSubmitting(true);
    const compliance: OrgCompliance = {
      clinician_id: activeClinician.id,
      org_name: data.org_name ?? "",
      org_ods_code: data.org_ods_code ?? "",
      org_type: (data.org_type as OrgType) ?? "nhs_trust",
      caldicott_name: data.caldicott_name ?? "",
      caldicott_email: data.caldicott_email ?? "",
      caldicott_approval_date: data.caldicott_approval_date ?? "",
      caldicott_reference: data.caldicott_reference ?? "",
      caldicott_principles_acknowledged: data.caldicott_principles_acknowledged ?? false,
      dpo_name: data.dpo_name ?? "",
      dpo_email: data.dpo_email ?? "",
      dpia_ref: data.dpia_ref ?? "",
      dpia_date: data.dpia_date ?? "",
      gdpr_acknowledged: data.gdpr_acknowledged ?? false,
      dsp_status: (data.dsp_status as DspStatus) ?? "not_started",
      dsp_submission_id: data.dsp_submission_id ?? "",
      dsp_date: data.dsp_date ?? "",
      dsp_lead: data.dsp_lead ?? "",
      cso_name: data.cso_name ?? "",
      cso_email: data.cso_email ?? "",
      dcb0129_acknowledged: data.dcb0129_acknowledged ?? false,
      dcb0160_acknowledged: data.dcb0160_acknowledged ?? false,
      hazard_log_ref: data.hazard_log_ref ?? "",
      gp_connect_status: (data.gp_connect_status as ApiStatus) ?? "not_applied",
      gp_connect_app_id: data.gp_connect_app_id ?? "",
      pds_environment: (data.pds_environment as PdsEnvironment) ?? "not_started",
      cis2_status: (data.cis2_status as ApiStatus) ?? "not_applied",
      nhs_login_status: (data.nhs_login_status as ApiStatus) ?? "not_applied",
      completed_at: new Date().toISOString(),
    };
    saveCompliance(compliance);
    completeOnboarding(activeClinician.id);
    logEvent({
      clinician_id: activeClinician.id,
      clinician_name: activeClinician.name,
      event_type: "onboarding_complete",
      description: `Compliance onboarding completed for ${compliance.org_name}`,
    });
    router.push("/cdss");
  }

  const stepProps = { data, set, setb };
  const currentStep = STEPS[step - 1];
  const StepIcon = currentStep.icon;

  return (
    <div className="min-h-screen bg-[#F0F4F8]">
      {/* Header */}
      <header className="bg-white border-b border-[#E8E8E8] px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-[#0057FF] flex items-center justify-center">
            <Stethoscope className="h-4 w-4 text-white" />
          </div>
          <span className="font-display text-base font-bold text-[#111827]">EndoLink</span>
          <span className="hidden sm:block text-[#9CA3AF]">/</span>
          <span className="hidden sm:block text-sm text-[#6B7280] font-medium">Compliance Setup</span>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-3.5 w-3.5 text-[#0057FF]" />
          <span className="text-xs font-semibold text-[#6B7280]">Step {step} of {STEPS.length}</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center gap-1 mb-4">
            {STEPS.map((s, i) => {
              const done = i + 1 < step;
              const active = i + 1 === step;
              const StepIco = s.icon;
              return (
                <div key={s.id} className="flex items-center flex-1">
                  <button
                    onClick={() => { if (done || active) setStep(s.id); }}
                    disabled={i + 1 > step}
                    className={cn(
                      "flex flex-col items-center gap-1 flex-1 group",
                      i + 1 > step ? "cursor-not-allowed opacity-40" : "cursor-pointer"
                    )}
                  >
                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center border-2 transition-colors",
                      done   ? "bg-[#0057FF] border-[#0057FF]" :
                      active ? "bg-white border-[#0057FF]" :
                               "bg-white border-[#E8E8E8]"
                    )}>
                      {done ? (
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      ) : (
                        <StepIco className={cn("h-3.5 w-3.5", active ? "text-[#0057FF]" : "text-[#9CA3AF]")} />
                      )}
                    </div>
                    <span className={cn(
                      "text-[10px] font-semibold hidden sm:block",
                      active ? "text-[#0057FF]" : done ? "text-[#374151]" : "text-[#9CA3AF]"
                    )}>
                      {s.short}
                    </span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div className={cn("h-0.5 flex-1 mx-1 rounded transition-colors", done ? "bg-[#0057FF]" : "bg-[#E8E8E8]")} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step card */}
        <div className="bg-white rounded-2xl border border-[#E8E8E8] shadow-sm overflow-hidden">
          {/* Step header */}
          <div className="px-6 py-5 border-b border-[#F3F4F6] flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#EEF4FF] flex items-center justify-center shrink-0">
              <StepIcon className="h-5 w-5 text-[#0057FF]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-widest">Step {step} of {STEPS.length}</p>
              <h1 className="font-display text-xl font-bold text-[#111827]">{currentStep.label}</h1>
            </div>
          </div>

          {/* Step body */}
          <div className="px-6 py-6">
            {step === 1 && <Step1 {...stepProps} />}
            {step === 2 && <Step2 {...stepProps} />}
            {step === 3 && <Step3 {...stepProps} />}
            {step === 4 && <Step4 {...stepProps} />}
            {step === 5 && <Step5 {...stepProps} />}
            {step === 6 && (
              <>
                <Step6 {...stepProps} />
                {/* Summary on last step */}
                <div className="mt-6 rounded-xl border border-[#E8E8E8] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="h-4 w-4 text-[#6B7280]" />
                    <span className="text-sm font-semibold text-[#111827]">Setup Summary</span>
                  </div>
                  <SummaryRow label="Organisation" value={data.org_name || "—"} />
                  <SummaryRow label="ODS code" value={data.org_ods_code || "—"} />
                  <SummaryRow label="Caldicott Guardian" value={data.caldicott_name || "—"} />
                  <SummaryRow label="DPO" value={data.dpo_name || "—"} />
                  <SummaryRow label="DPIA reference" value={data.dpia_ref || "—"} />
                  <SummaryRow label="DSP Toolkit" value={DSP_STATUS_LABELS[data.dsp_status as DspStatus ?? "not_started"]} warn={data.dsp_status === "not_started" || data.dsp_status === "in_progress"} />
                  <SummaryRow label="Clinical Safety Officer" value={data.cso_name || "—"} />
                  <SummaryRow label="GP Connect" value={API_STATUS_LABELS[data.gp_connect_status as ApiStatus ?? "not_applied"]} />
                  <SummaryRow label="PDS environment" value={PDS_ENV_LABELS[data.pds_environment as PdsEnvironment ?? "not_started"]} />
                </div>
              </>
            )}
          </div>

          {/* Navigation */}
          <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#F3F4F6] flex items-center justify-between gap-4">
            <Button
              variant="outline"
              onClick={step === 1 ? () => router.push("/login") : handleBack}
              className="gap-1.5 border-[#E8E8E8]"
            >
              <ArrowLeft className="h-4 w-4" />
              {step === 1 ? "Back to login" : "Previous"}
            </Button>

            {step < STEPS.length ? (
              <Button
                onClick={handleNext}
                disabled={!isValid}
                className="gap-1.5 bg-[#0057FF] hover:bg-[#0046D4] text-white"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleFinish}
                disabled={!allDone || submitting}
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCircle2 className="h-4 w-4" />
                {submitting ? "Saving…" : "Complete setup"}
              </Button>
            )}
          </div>
        </div>

        {/* Demo note */}
        <p className="text-center text-xs text-[#9CA3AF] mt-6 leading-relaxed">
          This is a demonstration environment. In production, these records would be validated against NHS systems.
          All data entered here is stored locally in your browser.
        </p>
      </main>
    </div>
  );
}
