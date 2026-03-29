"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { PainZone, PainQuality, PainZoneEntry } from "@/lib/types/database";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

const PAIN_ZONES: {
  id: PainZone;
  label: string;
  x: number;
  y: number;
  r: number;
}[] = [
  { id: "upper_abdomen_left", label: "Upper Abdomen L", x: 58, y: 22, r: 10 },
  { id: "upper_abdomen_right", label: "Upper Abdomen R", x: 42, y: 22, r: 10 },
  { id: "lower_abdomen_left", label: "Lower Abdomen L", x: 60, y: 38, r: 10 },
  { id: "lower_abdomen_right", label: "Lower Abdomen R", x: 40, y: 38, r: 10 },
  { id: "pelvic_left", label: "Pelvic L", x: 60, y: 54, r: 11 },
  { id: "pelvic_right", label: "Pelvic R", x: 40, y: 54, r: 11 },
  { id: "pelvic_center", label: "Pelvic Center", x: 50, y: 52, r: 10 },
  { id: "bladder", label: "Bladder", x: 50, y: 62, r: 8 },
  { id: "vaginal", label: "Vaginal", x: 50, y: 72, r: 7 },
  { id: "rectum", label: "Rectum", x: 50, y: 80, r: 7 },
  { id: "perineal", label: "Perineal", x: 50, y: 88, r: 7 },
  { id: "lower_back_left", label: "Lower Back L", x: 72, y: 42, r: 9 },
  { id: "lower_back_right", label: "Lower Back R", x: 28, y: 42, r: 9 },
  { id: "sacral", label: "Sacral", x: 50, y: 46, r: 9 },
];

const PAIN_QUALITIES: { value: PainQuality; label: string; emoji: string }[] = [
  { value: "sharp", label: "Sharp", emoji: "\u26A1" },
  { value: "dull", label: "Dull", emoji: "\uD83D\uDE36\u200D\uD83C\uDF2B\uFE0F" },
  { value: "burning", label: "Burning", emoji: "\uD83D\uDD25" },
  { value: "cramping", label: "Cramping", emoji: "\uD83C\uDF00" },
  { value: "throbbing", label: "Throbbing", emoji: "\uD83D\uDC9C" },
  { value: "stabbing", label: "Stabbing", emoji: "\uD83D\uDCA2" },
  { value: "pressure", label: "Pressure", emoji: "\u2B07\uFE0F" },
  { value: "radiating", label: "Radiating", emoji: "\u2728" },
];

function intensityColor(intensity: number): string {
  if (intensity <= 2) return "oklch(0.88 0.08 300 / 0.4)";
  if (intensity <= 4) return "oklch(0.78 0.14 300 / 0.5)";
  if (intensity <= 6) return "oklch(0.72 0.18 350 / 0.55)";
  if (intensity <= 8) return "oklch(0.65 0.22 350 / 0.65)";
  return "oklch(0.6 0.22 25 / 0.75)";
}

function intensityStroke(intensity: number): string {
  if (intensity <= 4) return "oklch(0.65 0.16 300)";
  if (intensity <= 7) return "oklch(0.65 0.2 350)";
  return "oklch(0.6 0.22 25)";
}

interface PainBodyMapProps {
  zones: PainZoneEntry[];
  onChange: (zones: PainZoneEntry[]) => void;
}

export function PainBodyMap({ zones, onChange }: PainBodyMapProps) {
  const [selectedZoneId, setSelectedZoneId] = useState<PainZone | null>(null);

  const selectedEntry = zones.find((z) => z.zone === selectedZoneId);

  function toggleZone(zoneId: PainZone) {
    const exists = zones.find((z) => z.zone === zoneId);
    if (exists) {
      setSelectedZoneId(zoneId);
    } else {
      const newEntry: PainZoneEntry = {
        zone: zoneId,
        intensity: 5,
        quality: "dull",
      };
      onChange([...zones, newEntry]);
      setSelectedZoneId(zoneId);
    }
  }

  function updateZone(zoneId: PainZone, updates: Partial<PainZoneEntry>) {
    onChange(
      zones.map((z) => (z.zone === zoneId ? { ...z, ...updates } : z))
    );
  }

  function removeZone(zoneId: PainZone) {
    onChange(zones.filter((z) => z.zone !== zoneId));
    if (selectedZoneId === zoneId) setSelectedZoneId(null);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Body map SVG */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-3">
          Tap a zone to record pain
        </p>
        <div className="relative aspect-[3/4] rounded-2xl bg-secondary/50 border border-border p-4 overflow-hidden">
          <svg
            viewBox="0 0 100 100"
            className="absolute inset-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)]"
          >
            {/* Pelvic region outline */}
            <ellipse
              cx="50"
              cy="50"
              rx="30"
              ry="40"
              fill="none"
              stroke="oklch(0.85 0.04 300)"
              strokeWidth="0.5"
            />
            <ellipse
              cx="50"
              cy="50"
              rx="20"
              ry="25"
              fill="none"
              stroke="oklch(0.88 0.03 300)"
              strokeWidth="0.3"
              strokeDasharray="2 2"
            />
            {/* Center line */}
            <line
              x1="50"
              y1="5"
              x2="50"
              y2="95"
              stroke="oklch(0.88 0.03 300)"
              strokeWidth="0.3"
              strokeDasharray="1 3"
            />

            {/* Pain zone dots */}
            {PAIN_ZONES.map((zone) => {
              const entry = zones.find((z) => z.zone === zone.id);
              const isSelected = selectedZoneId === zone.id;
              const isActive = !!entry;

              return (
                <g key={zone.id}>
                  <circle
                    cx={zone.x}
                    cy={zone.y}
                    r={isSelected ? zone.r * 1.3 : zone.r}
                    fill={
                      isActive
                        ? intensityColor(entry!.intensity)
                        : "oklch(0.93 0.03 300 / 0.5)"
                    }
                    stroke={
                      isSelected
                        ? "oklch(0.55 0.18 300)"
                        : isActive
                          ? intensityStroke(entry!.intensity)
                          : "oklch(0.85 0.04 300)"
                    }
                    strokeWidth={isSelected ? "1.2" : "0.5"}
                    className="cursor-pointer transition-all duration-200"
                    onClick={() => toggleZone(zone.id)}
                  >
                    <title>
                      {zone.label}
                      {entry
                        ? ` \u2014 VAS ${entry.intensity}/10, ${entry.quality}`
                        : " \u2014 Tap to mark pain"}
                    </title>
                  </circle>
                  {isActive && (
                    <text
                      x={zone.x}
                      y={zone.y + 1.5}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="pointer-events-none select-none"
                      style={{
                        fontSize: "4px",
                        fontWeight: 700,
                        fill: entry!.intensity >= 7 ? "white" : "oklch(0.3 0.1 290)",
                      }}
                    >
                      {entry!.intensity}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[9px] text-muted-foreground/50 font-medium">
            <span>L</span>
            <span>ANTERIOR VIEW</span>
            <span>R</span>
          </div>
        </div>
      </div>

      {/* Zone detail editor */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-3">
          Zone detail
        </p>

        {selectedZoneId && selectedEntry ? (
          <div className="space-y-5 rounded-2xl bg-white border border-border p-5 card-soft">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">
                {PAIN_ZONES.find((z) => z.id === selectedZoneId)?.label}
              </h3>
              <button
                onClick={() => removeZone(selectedZoneId)}
                className="text-muted-foreground hover:text-destructive transition-colors rounded-lg p-1 hover:bg-destructive/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Intensity slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">
                  Pain Intensity
                </label>
                <span className="text-lg font-bold text-primary">
                  {selectedEntry.intensity}/10
                </span>
              </div>
              <Slider
                value={[selectedEntry.intensity]}
                onValueChange={(val) =>
                  updateZone(selectedZoneId, {
                    intensity: Array.isArray(val) ? val[0] : val,
                  })
                }
                min={0}
                max={10}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground/60">
                <span>No pain</span>
                <span>Worst imaginable</span>
              </div>
            </div>

            {/* Pain quality */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                How does it feel?
              </label>
              <Select
                value={selectedEntry.quality}
                onValueChange={(val) => {
                  if (val) updateZone(selectedZoneId, { quality: val as PainQuality });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAIN_QUALITIES.map((q) => (
                    <SelectItem key={q.value} value={q.value}>
                      {q.emoji} {q.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground leading-relaxed bg-secondary/50 rounded-lg px-3 py-2">
                {selectedEntry.quality === "throbbing" &&
                  "\uD83D\uDC9C Throbbing pain correlates with VEGF-driven vascularization (Smith pathway)"}
                {selectedEntry.quality === "sharp" &&
                  "\u26A1 Sharp pain suggests nerve fiber involvement (PGP9.5+ density)"}
                {selectedEntry.quality === "burning" &&
                  "\uD83D\uDD25 Burning may indicate central sensitization / neuropathic component"}
                {selectedEntry.quality === "cramping" &&
                  "\uD83C\uDF00 Cramping correlates with prostaglandin-mediated activity"}
                {selectedEntry.quality === "stabbing" &&
                  "\uD83D\uDCA2 Stabbing pain is a key indicator for deep infiltrating endometriosis"}
                {selectedEntry.quality === "pressure" &&
                  "\u2B07\uFE0F Pressure may indicate adhesions or nodules"}
                {selectedEntry.quality === "radiating" &&
                  "\u2728 Radiating pain suggests neural pathway involvement"}
                {selectedEntry.quality === "dull" &&
                  "\uD83D\uDE36\u200D\uD83C\uDF2B\uFE0F Dull pain is consistent with visceral referral patterns"}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-secondary/30 border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Tap a zone on the body map
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground/60">
              Each zone captures intensity and pain quality
            </p>
          </div>
        )}

        {/* Active zones summary */}
        {zones.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Active zones ({zones.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {zones.map((entry) => {
                const zone = PAIN_ZONES.find((z) => z.id === entry.zone);
                return (
                  <Badge
                    key={entry.zone}
                    variant="secondary"
                    className={cn(
                      "cursor-pointer text-xs transition-all",
                      selectedZoneId === entry.zone && "ring-2 ring-primary ring-offset-1"
                    )}
                    onClick={() => setSelectedZoneId(entry.zone)}
                  >
                    {zone?.label} &middot; {entry.intensity}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
