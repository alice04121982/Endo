"use client";

import { useState } from "react";
import { Copy, KeyRound, Shield, Trash2, AlertTriangle, Crown, Pencil, Check, X } from "lucide-react";
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
import { useClinician, ROLE_LABELS, type ClinicianRole, type InviteToken } from "@/lib/clinician-store";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const {
    clinicians,
    activeClinician,
    isAdmin,
    invites,
    switchClinician,
    removeClinician,
    updateClinician,
    generateInvite,
  } = useClinician();

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<ClinicianRole>("consultant_gynaecologist");
  const [editHospital, setEditHospital] = useState("");
  const [latestInvite, setLatestInvite] = useState<InviteToken | null>(null);
  const [copied, setCopied] = useState(false);

  const clinicianToDelete = clinicians.find((c) => c.id === deleteId);

  function startEdit(id: string) {
    const c = clinicians.find((x) => x.id === id);
    if (!c) return;
    setEditId(id);
    setEditName(c.name);
    setEditRole(c.role);
    setEditHospital(c.hospital);
  }

  function saveEdit() {
    if (!editId) return;
    updateClinician(editId, { name: editName.trim(), role: editRole, hospital: editHospital.trim() });
    setEditId(null);
  }

  function handleGenerateInvite() {
    const token = generateInvite();
    setLatestInvite(token);
    setCopied(false);
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const unusedInvites = invites.filter((t) => !t.used);

  return (
    <div className="px-6 lg:px-8 py-6 lg:py-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-[var(--color-brand-midnight)]">
          Account Settings
        </h1>
        <p className="mt-1 text-sm text-[var(--color-brand-muted)]">
          Manage your team, roles, and data handling.
        </p>
      </div>

      {/* ── Team Members ─────────────────────────────────────────────────────── */}
      <Card className="bg-white border-[#E8E8E8] mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-base font-bold text-[var(--color-brand-midnight)]">
            Team Members
          </CardTitle>
          <p className="text-xs text-[var(--color-brand-muted)]">
            {isAdmin
              ? "As admin you can edit roles, promote members, and remove team members."
              : "Contact your team admin to change roles or add new members."}
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          {clinicians.map((c) => (
            <div
              key={c.id}
              className={cn(
                "rounded-xl border px-4 py-3",
                editId === c.id ? "border-[#0057FF]/30 bg-blue-50/30" : "border-[#E8E8E8]"
              )}
            >
              {editId === c.id ? (
                /* ── Edit mode ── */
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-semibold text-[var(--color-brand-muted)]">Full Name</Label>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="mt-1 h-9"
                        autoFocus
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-[var(--color-brand-muted)]">Job Title / Role</Label>
                      <select
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value as ClinicianRole)}
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
                      value={editHospital}
                      onChange={(e) => setEditHospital(e.target.value)}
                      className="mt-1 h-9"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveEdit} className="h-8 text-xs bg-[#0057FF] text-white hover:bg-[#0046D4] gap-1.5">
                      <Check className="h-3.5 w-3.5" /> Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditId(null)} className="h-8 text-xs border-[#E8E8E8] gap-1.5">
                      <X className="h-3.5 w-3.5" /> Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                /* ── View mode ── */
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#0057FF]/10 flex items-center justify-center text-sm font-bold text-[#0057FF] shrink-0">
                    {c.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-[var(--color-brand-midnight)]">{c.name}</span>
                      {activeClinician?.id === c.id && (
                        <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-100">You</Badge>
                      )}
                      {c.is_admin && (
                        <Badge variant="secondary" className="text-xs bg-amber-50 text-amber-700 border-amber-100 gap-1">
                          <Crown className="h-2.5 w-2.5" /> Admin
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-[var(--color-brand-muted)]">{ROLE_LABELS[c.role]}</p>
                    {c.hospital && <p className="text-xs text-[var(--color-brand-muted)] truncate">{c.hospital}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {activeClinician?.id !== c.id && (
                      <Button size="sm" variant="outline" className="h-8 text-xs border-[#E8E8E8]" onClick={() => switchClinician(c.id)}>
                        Switch
                      </Button>
                    )}
                    {isAdmin && (
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0 border-[#E8E8E8] text-[var(--color-brand-muted)] hover:text-[#0057FF] hover:border-blue-200 hover:bg-blue-50" onClick={() => startEdit(c.id)} aria-label="Edit">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {isAdmin && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 border-[#E8E8E8] text-[var(--color-brand-muted)] hover:text-red-600 hover:border-red-200 hover:bg-red-50"
                        onClick={() => setDeleteId(c.id)}
                        disabled={clinicians.length === 1}
                        aria-label="Remove"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ── Invite Team Members (admin only) ─────────────────────────────────── */}
      {isAdmin && (
        <Card className="bg-white border-[#E8E8E8] mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base font-bold text-[var(--color-brand-midnight)] flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-[#0057FF]" />
              Invite Team Members
            </CardTitle>
            <p className="text-xs text-[var(--color-brand-muted)]">
              Generate a single-use invite code and share it with a colleague. They'll use it to create their profile and join this workspace.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              size="sm"
              onClick={handleGenerateInvite}
              className="bg-[#0057FF] text-white hover:bg-[#0046D4] h-8 text-xs font-semibold gap-1.5"
            >
              <KeyRound className="h-3.5 w-3.5" />
              Generate Invite Code
            </Button>

            {latestInvite && (
              <div className="rounded-xl border border-[#0057FF]/20 bg-blue-50/50 px-4 py-3">
                <p className="text-xs font-semibold text-[var(--color-brand-midnight)] mb-2">New invite code</p>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-2xl font-bold tracking-[0.2em] text-[#0057FF]">
                    {latestInvite.code}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs border-[#0057FF]/30 text-[#0057FF] hover:bg-blue-100 gap-1.5"
                    onClick={() => copyCode(latestInvite.code)}
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                </div>
                <p className="text-xs text-[var(--color-brand-muted)] mt-2">
                  Share this code with your colleague. It can only be used once.
                </p>
              </div>
            )}

            {unusedInvites.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[var(--color-brand-muted)] mb-2">
                  Active codes ({unusedInvites.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {unusedInvites.map((t) => (
                    <button
                      key={t.code}
                      onClick={() => copyCode(t.code)}
                      className="font-mono text-sm font-semibold text-[#0057FF] bg-blue-50 border border-blue-100 px-3 py-1 rounded-lg hover:bg-blue-100 transition-colors"
                      title="Click to copy"
                    >
                      {t.code}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Non-admin join notice ─────────────────────────────────────────────── */}
      {!isAdmin && (
        <Card className="bg-white border-[#E8E8E8] mb-4">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-2.5">
              <KeyRound className="h-4 w-4 text-[#9CA3AF] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-[var(--color-brand-midnight)] mb-0.5">Adding team members</p>
                <p className="text-xs text-[var(--color-brand-muted)] leading-relaxed">
                  Only admins can invite new team members. Ask{" "}
                  {clinicians.find((c) => c.is_admin)?.name ?? "your team admin"} to generate an invite code from their Account Settings.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Privacy & Data ────────────────────────────────────────────────────── */}
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
              <span><strong>Local storage only:</strong> All data is stored exclusively in your browser's localStorage. No data is transmitted to any server.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0057FF] mt-1.5 shrink-0" />
              <span><strong>No authentication:</strong> Clinician switching is session-based with no passwords. Do not use on a shared device if any data is present.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0057FF] mt-1.5 shrink-0" />
              <span><strong>GDPR / UK GDPR:</strong> As no real data is processed or transmitted, no personal data controller obligations arise in demonstration use. Full IG compliance required for any real clinical deployment.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0057FF] mt-1.5 shrink-0" />
              <span><strong>Clinical decisions:</strong> Based on NICE NG73. Risk scores are indicative and must not replace clinical judgement.</span>
            </li>
          </ul>

          {isAdmin && (
            <div className="pt-2 border-t border-[#F3F4F6]">
              <p className="text-xs font-semibold text-[var(--color-brand-midnight)] mb-1">Clear all local data</p>
              <p className="text-xs text-[var(--color-brand-muted)] mb-2">
                Permanently deletes all patient records, biomarkers, clinician profiles, and symptom logs from this browser.
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
          )}
        </CardContent>
      </Card>

      {/* ── About ─────────────────────────────────────────────────────────────── */}
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
            <AlertDialogTitle>Remove team member?</AlertDialogTitle>
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
