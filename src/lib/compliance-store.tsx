"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export type OrgType =
  | "nhs_trust"
  | "foundation_trust"
  | "icb"
  | "gp_practice"
  | "private"
  | "university"
  | "other";

export type DspStatus = "not_started" | "in_progress" | "submitted" | "approved";
export type ApiStatus = "not_applied" | "applied" | "testing" | "live";
export type PdsEnvironment = "not_started" | "sandbox" | "integration" | "production";

export const ORG_TYPE_LABELS: Record<OrgType, string> = {
  nhs_trust:        "NHS Trust",
  foundation_trust: "NHS Foundation Trust",
  icb:              "Integrated Care Board (ICB)",
  gp_practice:      "GP Practice",
  private:          "Private Healthcare Organisation",
  university:       "University / Research Institute",
  other:            "Other",
};

export const DSP_STATUS_LABELS: Record<DspStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  submitted:   "Submitted — awaiting review",
  approved:    "Approved",
};

export const API_STATUS_LABELS: Record<ApiStatus, string> = {
  not_applied: "Not yet applied",
  applied:     "Application submitted",
  testing:     "In conformance testing",
  live:        "Live / Production",
};

export const PDS_ENV_LABELS: Record<PdsEnvironment, string> = {
  not_started:  "Not started",
  sandbox:      "Sandbox",
  integration:  "Integration",
  production:   "Production",
};

export interface OrgCompliance {
  clinician_id: string;
  // Step 1: Organisation
  org_name: string;
  org_ods_code: string;
  org_type: OrgType;
  // Step 2: Caldicott Guardian
  caldicott_name: string;
  caldicott_email: string;
  caldicott_approval_date: string;
  caldicott_reference: string;
  caldicott_principles_acknowledged: boolean;
  // Step 3: DPIA
  dpo_name: string;
  dpo_email: string;
  dpia_ref: string;
  dpia_date: string;
  gdpr_acknowledged: boolean;
  // Step 4: DSP Toolkit
  dsp_status: DspStatus;
  dsp_submission_id: string;
  dsp_date: string;
  dsp_lead: string;
  // Step 5: Clinical Safety
  cso_name: string;
  cso_email: string;
  dcb0129_acknowledged: boolean;
  dcb0160_acknowledged: boolean;
  hazard_log_ref: string;
  // Step 6: API Readiness
  gp_connect_status: ApiStatus;
  gp_connect_app_id: string;
  pds_environment: PdsEnvironment;
  cis2_status: ApiStatus;
  nhs_login_status: ApiStatus;
  completed_at: string;
}

export type AuditEventType =
  | "login"
  | "logout"
  | "patient_view"
  | "patient_create"
  | "patient_delete"
  | "biomarker_add"
  | "gp_connect_request"
  | "pds_lookup"
  | "symptom_log_view"
  | "record_export"
  | "onboarding_complete";

export const AUDIT_EVENT_LABELS: Record<AuditEventType, string> = {
  login:               "Login",
  logout:              "Logout",
  patient_view:        "Patient Record Viewed",
  patient_create:      "Patient Created",
  patient_delete:      "Patient Deleted",
  biomarker_add:       "Biomarker Recorded",
  gp_connect_request:  "GP Connect Data Requested",
  pds_lookup:          "PDS Demographics Lookup",
  symptom_log_view:    "Patient Symptom Logs Viewed",
  record_export:       "Record Export",
  onboarding_complete: "Compliance Onboarding Completed",
};

export interface AuditEvent {
  id: string;
  clinician_id: string;
  clinician_name: string;
  event_type: AuditEventType;
  patient_id?: string;
  patient_name?: string;
  description: string;
  access_reason?: string;
  timestamp: string;
}

// ── Context ───────────────────────────────────────────────────────────────────

interface ComplianceContextValue {
  compliance: OrgCompliance | null;
  auditLog: AuditEvent[];
  saveCompliance: (data: OrgCompliance) => void;
  logEvent: (event: Omit<AuditEvent, "id" | "timestamp">) => void;
  clearAuditLog: () => void;
}

const ComplianceContext = createContext<ComplianceContextValue | null>(null);

const COMPLIANCE_KEY = "cdss_compliance";
const AUDIT_KEY     = "cdss_audit_log";

export function ComplianceProvider({ children }: { children: ReactNode }) {
  const [compliance, setCompliance] = useState<OrgCompliance | null>(null);
  const [auditLog, setAuditLog]     = useState<AuditEvent[]>([]);
  const [hydrated, setHydrated]     = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(COMPLIANCE_KEY);
      if (raw) setCompliance(JSON.parse(raw));
      const rawAudit = localStorage.getItem(AUDIT_KEY);
      if (rawAudit) setAuditLog(JSON.parse(rawAudit));
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  const saveCompliance = useCallback((data: OrgCompliance) => {
    setCompliance(data);
    try { localStorage.setItem(COMPLIANCE_KEY, JSON.stringify(data)); } catch { /* storage full */ }
  }, []);

  const logEvent = useCallback((event: Omit<AuditEvent, "id" | "timestamp">) => {
    const entry: AuditEvent = {
      ...event,
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    setAuditLog((prev) => {
      const next = [entry, ...prev].slice(0, 500);
      try { localStorage.setItem(AUDIT_KEY, JSON.stringify(next)); } catch { /* storage full */ }
      return next;
    });
  }, []);

  const clearAuditLog = useCallback(() => {
    setAuditLog([]);
    try { localStorage.removeItem(AUDIT_KEY); } catch { /* ignore */ }
  }, []);

  if (!hydrated) return null;

  return (
    <ComplianceContext.Provider value={{ compliance, auditLog, saveCompliance, logEvent, clearAuditLog }}>
      {children}
    </ComplianceContext.Provider>
  );
}

export function useCompliance() {
  const ctx = useContext(ComplianceContext);
  if (!ctx) throw new Error("useCompliance must be used inside ComplianceProvider");
  return ctx;
}
