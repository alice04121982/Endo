"use client";

import { useState } from "react";
import { Shield, Trash2, UserCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { useClinician, ROLE_LABELS, type ClinicianRole } from "@/lib/clinician-store";

export default function SettingsPage() {
  const { clinicians, activeClinician, switchClinician, addClinician, removeClinician } = useClinician();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<ClinicianRole>("consultant_gynaecologist");
  const [newHospital, setNewHospital] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [addError, setAddError] = useState("");

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) { setAddError("Name is required."); return; }
    if (!accepted) { setAddError("You must accept the data handling notice."); return; }
    addClinician({ name: newName.trim(), role: newRole, hospital: newHospital.trim() });
    setNewName(""); setNewHospital(""); setAccepted(false); setShowAdd(false); setAddError("");
  }

  const clinicianToDelete = clinicians.find((c) => c.id === deleteId);

  return (
    <div className="px-6 lg:px-8 py-6 lg:py-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-[var(--color-brand-midnight)]">
          Account Settings
        </h1>
        <p className="mt-1 text-sm text-[var(--color-brand-muted)]">
          Manage clinician profiles and review data handling practices.
        </p>
      </div>

      {/* Clinicians */}
      <Card className="bg-white border-[#E8E8E8] mb-4">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="font-display text-base font-bold text-[var(--color-brand-midnight)]">
            Clinician Profiles
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs font-semibold border-[#E8E8E8] gap-1.5"
            onClick={() => setShowAdd((v) => !v)}
          >
            {showAdd ? "Cancel" : "+ Add Clinician"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {clinicians.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 rounded-xl border border-[#E8E8E8] px-4 py-3"
            >
              <div className="h-10 w-10 rounded-full bg-[#0057FF]/10 flex items-center justify-center text-sm font-bold text-[#0057FF] shrink-0">
                {c.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-[var(--color-brand-midnight)]">{c.name}</span>
                  {activeClinician?.id === c.id && (
                    <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-100">Active</Badge>
                  )}
                </div>
                <p className="text-xs text-[var(--color-brand-muted)]">{ROLE_LABELS[c.role]}</p>
                {c.hospital && <p className="text-xs text-[var(--color-brand-muted)] truncate">{c.hospital}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {activeClinician?.id !== c.id && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs border-[#E8E8E8]"
                    onClick={() => switchClinician(c.id)}
                  >
                    Switch
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0 border-[#E8E8E8] text-[var(--color-brand-muted)] hover:text-red-600 hover:border-red-200 hover:bg-red-50"
                  onClick={() => setDeleteId(c.id)}
                  disabled={clinicians.length === 1}
                  aria-label="Remove clinician"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}

          {/* Add clinician form */}
          {showAdd && (
            <form onSubmit={handleAdd} className="rounded-xl border border-dashed border-[#D1D5DB] px-4 py-4 space-y-3">
              <p className="text-sm font-semibold text-[var(--color-brand-midnight)]">New Clinician</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-[var(--color-brand-muted)]">Full Name *</Label>
                  <Input
                    value={newName}
                    onChange={(e) => { setNewName(e.target.value); setAddError(""); }}
                    placeholder="Dr. Jane Smith"
                    className="mt-1 h-9"
                    autoFocus
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-[var(--color-brand-muted)]">Role *</Label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as ClinicianRole)}
                    className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {(Object.entries(ROLE_LABELS) as [ClinicianRole, string][]).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold text-[var(--color-brand-muted)]">Hospital / Trust</Label>
                <Input
                  value={newHospital}
                  onChange={(e) => setNewHospital(e.target.value)}
                  placeholder="e.g. King's College Hospital NHS"
                  className="mt-1 h-9"
                />
              </div>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => { setAccepted(e.target.checked); setAddError(""); }}
                  className="mt-0.5 h-3.5 w-3.5 rounded accent-[#0057FF]"
                />
                <span className="text-xs text-[var(--color-brand-muted)]">
                  Demo use only — no real patient data will be entered
                </span>
              </label>
              {addError && <p className="text-xs text-red-600">{addError}</p>}
              <Button
                type="submit"
                size="sm"
                disabled={!newName.trim() || !accepted}
                className="bg-[#0057FF] text-white hover:bg-[#0046D4] h-8 text-xs font-semibold"
              >
                Add Clinician
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Privacy & Data */}
      <Card className="bg-white border-[#E8E8E8] mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-base font-bold text-[var(--color-brand-midnight)] flex items-center gap-2">
            <Shield className="h-4 w-4 text-[#0057FF]" />
            Privacy &amp; Data Handling
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-[var(--color-brand-muted)] leading-relaxed">
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800">
              <p className="font-semibold mb-1">Important — Demo Use Only</p>
              <p>
                EndoLink is a <strong>demonstration and research tool only</strong>. It is not a registered
                medical device and must not be used for real clinical decision-making with identifiable patients.
              </p>
            </div>
          </div>
          <ul className="space-y-2 text-xs">
            <li className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0057FF] mt-1.5 shrink-0" />
              <span><strong>Local storage only:</strong> All data (patient records, biomarkers, clinician profiles) is stored
              exclusively in your browser&apos;s localStorage. No data is transmitted to any server.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0057FF] mt-1.5 shrink-0" />
              <span><strong>No authentication:</strong> Clinician switching is session-based with no passwords.
              Do not use this on a shared or unattended device if any data is present.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0057FF] mt-1.5 shrink-0" />
              <span><strong>GDPR / UK GDPR:</strong> As no real data is processed or transmitted, no personal data
              controller obligations arise in demonstration use. If adapted for real clinical use, full
              Information Governance compliance and NHS DSP Toolkit registration would be required.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0057FF] mt-1.5 shrink-0" />
              <span><strong>Clinical decisions:</strong> Based on NICE NG73: Endometriosis — Diagnosis and Management.
              Risk scores are indicative and must not replace clinical judgement or formal diagnostic criteria.</span>
            </li>
          </ul>

          <div className="pt-2 border-t border-[#F3F4F6]">
            <p className="text-xs font-semibold text-[var(--color-brand-midnight)] mb-1">Clear all local data</p>
            <p className="text-xs text-[var(--color-brand-muted)] mb-2">
              This will permanently delete all patient records, biomarkers, clinician profiles, and symptom logs from this browser.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="text-xs border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 h-8"
              onClick={() => {
                if (confirm("Are you sure? This will permanently erase all data in this browser. This cannot be undone.")) {
                  localStorage.clear();
                  window.location.href = "/cdss";
                }
              }}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Clear all data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card className="bg-white border-[#E8E8E8]">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-base font-bold text-[var(--color-brand-midnight)]">About EndoLink</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-[var(--color-brand-muted)] space-y-1 leading-relaxed">
          <p>EndoLink is a clinical decision support system for endometriosis risk stratification.</p>
          <p>Aligned with <strong>NICE NG73: Endometriosis — Diagnosis and Management</strong>.</p>
          <p>For demonstration and research purposes only. Not a registered medical device.</p>
          <p className="pt-1 text-[#9CA3AF]">Version 0.1.0 · Prototype</p>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove clinician?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove{" "}
              <span className="font-semibold text-[var(--color-brand-midnight)]">
                {clinicianToDelete?.name}
              </span>{" "}
              from EndoLink. Patient data will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deleteId) { removeClinician(deleteId); setDeleteId(null); } }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
