"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ClipboardList,
  Database,
  Download,
  FlaskConical,
  LogIn,
  LogOut,
  Search,
  Shield,
  Trash2,
  User,
  UserPlus,
  XCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useCompliance,
  AUDIT_EVENT_LABELS,
  type AuditEventType,
} from "@/lib/compliance-store";
import { useClinician } from "@/lib/clinician-store";
import { cn } from "@/lib/utils";

// ── Config ────────────────────────────────────────────────────────────────────

const EVENT_ICONS: Record<AuditEventType, typeof Activity> = {
  login:               LogIn,
  logout:              LogOut,
  patient_view:        User,
  patient_create:      UserPlus,
  patient_delete:      Trash2,
  biomarker_add:       FlaskConical,
  gp_connect_request:  Database,
  pds_lookup:          Search,
  symptom_log_view:    ClipboardList,
  record_export:       Download,
  onboarding_complete: Shield,
};

const EVENT_COLORS: Record<AuditEventType, string> = {
  login:               "bg-emerald-100 text-emerald-700",
  logout:              "bg-slate-100 text-slate-600",
  patient_view:        "bg-blue-100 text-blue-700",
  patient_create:      "bg-indigo-100 text-indigo-700",
  patient_delete:      "bg-red-100 text-red-700",
  biomarker_add:       "bg-purple-100 text-purple-700",
  gp_connect_request:  "bg-orange-100 text-orange-700",
  pds_lookup:          "bg-cyan-100 text-cyan-700",
  symptom_log_view:    "bg-pink-100 text-pink-700",
  record_export:       "bg-amber-100 text-amber-700",
  onboarding_complete: "bg-teal-100 text-teal-700",
};

const HIGH_SENSITIVITY: AuditEventType[] = ["gp_connect_request", "pds_lookup", "record_export", "patient_delete"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTs(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AuditPage() {
  const { auditLog, clearAuditLog } = useCompliance();
  const { activeClinician } = useClinician();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<AuditEventType | "all">("all");
  const [confirmClear, setConfirmClear] = useState(false);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return auditLog.filter((e) => {
      if (typeFilter !== "all" && e.event_type !== typeFilter) return false;
      if (!q) return true;
      return (
        e.clinician_name.toLowerCase().includes(q) ||
        (e.patient_name ?? "").toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q)
      );
    });
  }, [auditLog, query, typeFilter]);

  const mySensitiveCount = useMemo(() =>
    auditLog.filter((e) =>
      e.clinician_id === activeClinician?.id &&
      HIGH_SENSITIVITY.includes(e.event_type)
    ).length,
  [auditLog, activeClinician]);

  return (
    <div className="px-6 lg:px-8 py-6 lg:py-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--color-brand-midnight)]">
            Audit Log
          </h1>
          <p className="mt-1 text-sm text-[var(--color-brand-muted)]">
            Caldicott-compliant access trail — all data access events recorded in this session.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setConfirmClear(true)}
          disabled={auditLog.length === 0}
          className="shrink-0 border-[#E8E8E8] text-[var(--color-brand-muted)] hover:text-red-600 hover:border-red-200 hover:bg-red-50 gap-1.5"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear log
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total events",     value: auditLog.length,    color: "text-[#111827]" },
          { label: "Patient views",    value: auditLog.filter(e => e.event_type === "patient_view").length, color: "text-blue-700" },
          { label: "GP Connect requests", value: auditLog.filter(e => e.event_type === "gp_connect_request").length, color: "text-orange-700" },
          { label: "High-sensitivity (you)", value: mySensitiveCount, color: mySensitiveCount > 0 ? "text-amber-700" : "text-[#111827]" },
        ].map((s) => (
          <Card key={s.label} className="bg-white border-[#E8E8E8]">
            <CardContent className="px-4 py-3">
              <p className={cn("text-2xl font-bold font-display", s.color)}>{s.value}</p>
              <p className="text-xs text-[var(--color-brand-muted)] mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Caldicott notice */}
      <div className="flex gap-3 rounded-xl bg-blue-50 border border-blue-200 p-4 mb-5">
        <Shield className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-800 leading-relaxed">
          <strong>Caldicott Principle 3 — Use minimum necessary data.</strong> This log records every access to patient data in accordance with NHS Data Security Standard 6. In production, logs are immutable and retained for 8 years per NHS Records Management Code of Practice. High-sensitivity events (GP Connect, PDS lookups, exports) are flagged for Caldicott Guardian review.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-brand-muted)]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clinician, patient or description…"
            className="pl-10 bg-white border-[#E8E8E8] h-10 text-sm"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as AuditEventType | "all")}
          className="h-10 rounded-md border border-[#E8E8E8] bg-white px-3 text-sm text-[#111827] shrink-0"
        >
          <option value="all">All event types</option>
          {(Object.entries(AUDIT_EVENT_LABELS) as [AuditEventType, string][]).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Log */}
      {filtered.length === 0 ? (
        <Card className="bg-white border-[#E8E8E8]">
          <CardContent className="py-14 text-center">
            <Activity className="h-10 w-10 text-[var(--color-brand-muted)]/30 mx-auto mb-3" />
            <p className="text-sm text-[var(--color-brand-muted)]">
              {auditLog.length === 0 ? "No events recorded yet." : "No events match your filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((event) => {
            const Icon = EVENT_ICONS[event.event_type] ?? Activity;
            const colorClass = EVENT_COLORS[event.event_type] ?? "bg-slate-100 text-slate-600";
            const isSensitive = HIGH_SENSITIVITY.includes(event.event_type);

            return (
              <div
                key={event.id}
                className={cn(
                  "bg-white rounded-xl border px-4 py-3 flex items-start gap-3",
                  isSensitive ? "border-amber-200" : "border-[#E8E8E8]"
                )}
              >
                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5", colorClass)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-[#111827]">
                      {AUDIT_EVENT_LABELS[event.event_type]}
                    </span>
                    {isSensitive && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                        <AlertTriangle className="h-3 w-3" />
                        High sensitivity
                      </span>
                    )}
                    {event.patient_name && (
                      <span className="text-xs text-[#6B7280]">
                        — {event.patient_name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#6B7280] mt-0.5">{event.description}</p>
                  {event.access_reason && (
                    <p className="text-xs text-[#374151] mt-0.5">
                      <span className="font-semibold">Reason:</span> {event.access_reason}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold text-[#111827]">{event.clinician_name}</p>
                  <p className="text-xs text-[var(--color-brand-muted)] mt-0.5">{formatTs(event.timestamp)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Clear dialog */}
      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear audit log?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all {auditLog.length} audit events from this browser session.
              In a production system, audit logs are immutable and cannot be deleted. This action is only available in demo mode.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { clearAuditLog(); setConfirmClear(false); }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Clear log
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
