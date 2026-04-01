"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Moon,
  Bell,
  Calendar,
  Shield,
  Heart,
  Activity,
  Download,
} from "lucide-react";

const SETTINGS_KEY = "endo_settings";

interface AppSettings {
  displayName: string;
  cycleMode: "regular" | "cycle_agnostic";
  diagnosisStage: string;
  hormoneTherapy: string;
  providerName: string;
  notifications: boolean;
  dailyReminder: boolean;
  darkMode: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  displayName: "",
  cycleMode: "regular",
  diagnosisStage: "suspected",
  hormoneTherapy: "",
  providerName: "",
  notifications: true,
  dailyReminder: true,
  darkMode: false,
};

function loadSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings: AppSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* storage full */
  }
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  function update(patch: Partial<AppSettings>) {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      return next;
    });
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Personalise your Endo experience. All settings stay on your device.
          </p>
        </div>
        {saved && (
          <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs animate-in fade-in">
            Saved
          </Badge>
        )}
      </div>

      {/* Profile */}
      <Card className="card-soft border-0 rounded-3xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <User className="h-4 w-4 text-[var(--color-brand-blue)]" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={settings.displayName}
              onChange={(e) => update({ displayName: e.target.value })}
              placeholder="How you'd like to be addressed"
              className="w-full rounded-xl border border-[#D4DCE6] bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--color-brand-blue)] transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
              Provider / Doctor Name
            </label>
            <input
              type="text"
              value={settings.providerName}
              onChange={(e) => update({ providerName: e.target.value })}
              placeholder="For your generated reports"
              className="w-full rounded-xl border border-[#D4DCE6] bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--color-brand-blue)] transition-colors"
            />
          </div>
        </CardContent>
      </Card>

      {/* Health Profile */}
      <Card className="card-soft border-0 rounded-3xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Heart className="h-4 w-4 text-[var(--color-brand-lavender)]" />
            Health Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
              Diagnosis Stage
            </label>
            <select
              value={settings.diagnosisStage}
              onChange={(e) => update({ diagnosisStage: e.target.value })}
              className="w-full rounded-xl border border-[#D4DCE6] bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--color-brand-blue)] transition-colors"
            >
              <option value="suspected">Suspected / Undiagnosed</option>
              <option value="stage_i">Stage I (Minimal)</option>
              <option value="stage_ii">Stage II (Mild)</option>
              <option value="stage_iii">Stage III (Moderate)</option>
              <option value="stage_iv">Stage IV (Severe)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
              Cycle Tracking Mode
            </label>
            <div className="flex gap-2">
              {(["regular", "cycle_agnostic"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => update({ cycleMode: mode })}
                  className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                    settings.cycleMode === mode
                      ? "bg-[var(--color-brand-blue)] text-white"
                      : "bg-[var(--color-brand-smoke)] text-[var(--color-brand-muted)] hover:bg-white"
                  }`}
                >
                  {mode === "regular" ? "Regular Cycle" : "Agnostic (GnRH / BC)"}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Choose &ldquo;Agnostic&rdquo; if you&apos;re on continuous hormonal therapy and don&apos;t track cycle phases.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
              Current Hormone Therapy
            </label>
            <input
              type="text"
              value={settings.hormoneTherapy}
              onChange={(e) => update({ hormoneTherapy: e.target.value })}
              placeholder="e.g. Dienogest, Lupron, combined OCP, none"
              className="w-full rounded-xl border border-[#D4DCE6] bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--color-brand-blue)] transition-colors"
            />
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card className="card-soft border-0 rounded-3xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4 text-[var(--color-brand-orange)]" />
            Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Daily Tracking Reminder</p>
              <p className="text-[11px] text-muted-foreground">
                Get a gentle nudge to log your symptoms each day
              </p>
            </div>
            <Switch
              checked={settings.dailyReminder}
              onCheckedChange={(checked: boolean) => update({ dailyReminder: checked })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Push Notifications</p>
              <p className="text-[11px] text-muted-foreground">
                Receive alerts for insight updates and community activity
              </p>
            </div>
            <Switch
              checked={settings.notifications}
              onCheckedChange={(checked: boolean) => update({ notifications: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="card-soft border-0 rounded-3xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4 text-[var(--color-brand-blue)]" />
            Data Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl bg-[var(--color-brand-smoke)] p-4">
            <div className="flex items-start gap-3">
              <Download className="h-5 w-5 text-[var(--color-brand-muted)] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Export Your Data</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Download all your symptom entries as a JSON file. Your data, your control.
                </p>
                <button
                  onClick={() => {
                    try {
                      const raw = localStorage.getItem("endo_logged_entries") ?? "[]";
                      const blob = new Blob([raw], { type: "application/json" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `endo-export-${new Date().toISOString().split("T")[0]}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    } catch {
                      /* ignore */
                    }
                  }}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold text-[var(--color-brand-midnight)] hover:bg-[var(--color-brand-blue)] hover:text-white transition-colors border border-[#D4DCE6]"
                >
                  <Download className="h-3 w-3" />
                  Export JSON
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">Clear Local Data</p>
            <p className="text-[11px] text-red-600 mt-0.5">
              Permanently delete all locally stored symptom entries. This cannot be undone.
            </p>
            <button
              onClick={() => {
                if (window.confirm("Are you sure? This will delete all your logged entries.")) {
                  localStorage.removeItem("endo_logged_entries");
                  localStorage.removeItem(SETTINGS_KEY);
                  window.location.reload();
                }
              }}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-red-100 px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-200 transition-colors"
            >
              Clear All Data
            </button>
          </div>
        </CardContent>
      </Card>

      {/* App info */}
      <div className="text-center pb-8">
        <p className="text-xs text-muted-foreground">
          Endo v0.1.0 &middot; All data stored locally on your device
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">
          Built with care for the endo community
        </p>
      </div>
    </div>
  );
}
