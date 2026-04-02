"use client";

import { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ── Menstrual cycle chart ─────────────────────────────────────────────────────

function CycleChart() {
  const phases = [
    { name: "Menstrual", days: "Days 1–5", color: "#E8416C", width: "14%", description: "Uterine lining sheds. Period bleeding occurs." },
    { name: "Follicular", days: "Days 1–13", color: "#F59E0B", width: "37%", description: "Oestrogen rises. Follicle matures in the ovary." },
    { name: "Ovulation", days: "Day 14", color: "#10B981", width: "8%", description: "Egg is released. LH surge triggers ovulation." },
    { name: "Luteal", days: "Days 15–28", color: "#8B5CF6", width: "41%", description: "Progesterone rises. Lining thickens for possible implantation." },
  ];

  const [active, setActive] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      <p className="text-xs text-[#6B7280] leading-relaxed">
        A typical cycle lasts <strong>21–35 days</strong> (day 1 = first day of bleeding). Tap each phase to learn more.
      </p>

      {/* Phase bar */}
      <div className="flex rounded-lg overflow-hidden h-10 border border-[#E8E8E8]">
        {phases.map((p, i) => (
          <button
            key={p.name}
            type="button"
            onClick={() => setActive(active === i ? null : i)}
            style={{ width: p.width, backgroundColor: p.color }}
            className={cn(
              "flex items-center justify-center transition-opacity",
              active !== null && active !== i ? "opacity-40" : "opacity-100"
            )}
          >
            <span className="text-white text-[10px] font-bold leading-none text-center px-1 hidden sm:block">
              {p.name}
            </span>
          </button>
        ))}
      </div>

      {/* Day labels */}
      <div className="flex text-[10px] text-[#9CA3AF] px-0.5">
        <span>Day 1</span>
        <span className="ml-auto">Day 28</span>
      </div>

      {/* Phase detail */}
      {active !== null && (
        <div className="rounded-lg border px-3 py-2.5 text-sm" style={{ borderColor: phases[active].color + "40", backgroundColor: phases[active].color + "08" }}>
          <p className="font-semibold text-[#111827] mb-0.5" style={{ color: phases[active].color }}>
            {phases[active].name} phase · {phases[active].days}
          </p>
          <p className="text-xs text-[#374151]">{phases[active].description}</p>
        </div>
      )}

      {/* Phase legend */}
      <div className="grid grid-cols-2 gap-1.5">
        {phases.map((p, i) => (
          <button key={p.name} type="button" onClick={() => setActive(active === i ? null : i)}
            className={cn("flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors",
              active === i ? "bg-[#F3F4F6]" : "hover:bg-[#F8F9FA]")}>
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
            <span className="text-xs font-medium text-[#374151]">{p.name}</span>
            <span className="text-xs text-[#9CA3AF] ml-auto">{p.days}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Hormone chart ─────────────────────────────────────────────────────────────

function HormoneChart() {
  // Simplified hormone curves over 28-day cycle (normalised 0–100)
  const days = Array.from({ length: 28 }, (_, i) => i + 1);

  function oestrogen(d: number): number {
    // Peaks around day 12–13
    return Math.max(0, 80 * Math.exp(-((d - 12.5) ** 2) / 18) + 15 * Math.exp(-((d - 21) ** 2) / 10));
  }
  function progesterone(d: number): number {
    // Peaks around day 21
    return Math.max(0, 75 * Math.exp(-((d - 21) ** 2) / 14));
  }
  function lh(d: number): number {
    // Spike around day 13–14
    return Math.max(0, 95 * Math.exp(-((d - 13.5) ** 2) / 2));
  }

  const W = 300;
  const H = 120;
  const pad = { t: 8, b: 24, l: 8, r: 8 };
  const chartW = W - pad.l - pad.r;
  const chartH = H - pad.t - pad.b;

  function toPath(fn: (d: number) => number): string {
    return days
      .map((d, i) => {
        const x = pad.l + (i / (days.length - 1)) * chartW;
        const y = pad.t + chartH - (fn(d) / 100) * chartH;
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }

  const hormones = [
    { label: "Oestrogen", color: "#E8416C", path: toPath(oestrogen) },
    { label: "Progesterone", color: "#8B5CF6", path: toPath(progesterone) },
    { label: "LH surge", color: "#F59E0B", path: toPath(lh) },
  ];

  // Phase background regions
  const phaseRegions = [
    { start: 0, end: 5 / 28, color: "#E8416C" },
    { start: 5 / 28, end: 13 / 28, color: "#F59E0B" },
    { start: 13 / 28, end: 15 / 28, color: "#10B981" },
    { start: 15 / 28, end: 1, color: "#8B5CF6" },
  ];

  return (
    <div className="space-y-2">
      <p className="text-xs text-[#6B7280] leading-relaxed">
        These hormones rise and fall throughout your cycle, controlling ovulation and the uterine lining.
      </p>
      <div className="rounded-lg border border-[#E8E8E8] bg-[#FAFAFA] p-3 overflow-hidden">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
          {/* Phase background */}
          {phaseRegions.map((r, i) => (
            <rect
              key={i}
              x={pad.l + r.start * chartW}
              y={pad.t}
              width={(r.end - r.start) * chartW}
              height={chartH}
              fill={r.color}
              opacity={0.06}
            />
          ))}
          {/* Hormone curves */}
          {hormones.map((h) => (
            <path key={h.label} d={h.path} stroke={h.color} strokeWidth="2" fill="none" strokeLinejoin="round" />
          ))}
          {/* Day axis labels */}
          {[1, 7, 14, 21, 28].map((d) => {
            const x = pad.l + ((d - 1) / (days.length - 1)) * chartW;
            return (
              <text key={d} x={x} y={H - 4} textAnchor="middle" fontSize="8" fill="#9CA3AF">
                {d}
              </text>
            );
          })}
        </svg>
        <div className="flex items-center gap-4 mt-1 justify-center flex-wrap">
          {hormones.map((h) => (
            <div key={h.label} className="flex items-center gap-1.5">
              <span className="h-2.5 w-5 rounded-sm block" style={{ backgroundColor: h.color }} />
              <span className="text-[10px] text-[#6B7280]">{h.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── What is endometriosis ─────────────────────────────────────────────────────

function EndoExplainer() {
  return (
    <div className="space-y-3">
      <p className="text-xs text-[#374151] leading-relaxed">
        Endometriosis is a condition where tissue similar to the lining of the uterus
        grows in other places — most commonly on the ovaries, fallopian tubes, and
        the tissue lining the pelvis.
      </p>

      {/* SVG diagram — simplified pelvic anatomy */}
      <div className="rounded-lg border border-[#E8E8E8] bg-[#FAFAFA] p-4 flex justify-center">
        <svg viewBox="0 0 240 180" className="w-full max-w-[240px]">
          {/* Uterus body */}
          <path d="M95,90 Q100,60 120,58 Q140,60 145,90 Q148,110 120,120 Q92,110 95,90Z"
            fill="#FECDD3" stroke="#E8416C" strokeWidth="1.5" />
          {/* Uterus label */}
          <text x="120" y="94" textAnchor="middle" fontSize="7" fill="#9F1239" fontWeight="600">Uterus</text>

          {/* Left fallopian tube */}
          <path d="M97,80 Q70,72 55,78 Q45,82 42,90" fill="none" stroke="#FDA4AF" strokeWidth="1.5" strokeLinecap="round" />
          {/* Right fallopian tube */}
          <path d="M143,80 Q170,72 185,78 Q195,82 198,90" fill="none" stroke="#FDA4AF" strokeWidth="1.5" strokeLinecap="round" />

          {/* Left ovary */}
          <ellipse cx="42" cy="94" rx="10" ry="8" fill="#FED7AA" stroke="#EA580C" strokeWidth="1.5" />
          <text x="42" y="97" textAnchor="middle" fontSize="5.5" fill="#7C2D12">Ovary</text>

          {/* Right ovary */}
          <ellipse cx="198" cy="94" rx="10" ry="8" fill="#FED7AA" stroke="#EA580C" strokeWidth="1.5" />
          <text x="198" y="97" textAnchor="middle" fontSize="5.5" fill="#7C2D12">Ovary</text>

          {/* Endometriosis patches */}
          <ellipse cx="58" cy="108" rx="9" ry="6" fill="#E8416C" opacity="0.5" />
          <ellipse cx="180" cy="70" rx="7" ry="5" fill="#E8416C" opacity="0.5" />
          <ellipse cx="135" cy="130" rx="8" ry="5" fill="#E8416C" opacity="0.5" />
          <ellipse cx="90" cy="125" rx="6" ry="4" fill="#E8416C" opacity="0.4" />

          {/* Endo label */}
          <line x1="58" y1="114" x2="58" y2="130" stroke="#E8416C" strokeWidth="0.8" strokeDasharray="2,2" />
          <text x="58" y="140" textAnchor="middle" fontSize="6" fill="#E8416C" fontWeight="600">Endo</text>
          <text x="58" y="148" textAnchor="middle" fontSize="6" fill="#E8416C">lesions</text>

          {/* Cervix */}
          <rect x="114" y="118" width="12" height="14" rx="3" fill="#FECDD3" stroke="#E8416C" strokeWidth="1" />
          <text x="120" y="130" textAnchor="middle" fontSize="5.5" fill="#9F1239">Cervix</text>

          {/* Normal lining indicator */}
          <text x="120" y="20" textAnchor="middle" fontSize="6.5" fill="#6B7280">Endometriosis — tissue outside the uterus</text>

          {/* Legend dot */}
          <circle cx="78" cy="163" r="5" fill="#E8416C" opacity="0.5" />
          <text x="86" y="166" fontSize="6" fill="#6B7280">Endometriosis lesions (misplaced tissue)</text>
        </svg>
      </div>

      <div className="space-y-2">
        {[
          { title: "Why does it cause pain?", body: "Endometriosis tissue responds to your hormones just like the uterine lining — it bleeds during your period, but the blood has nowhere to go, causing inflammation and pain." },
          { title: "What causes it?", body: "The exact cause is unknown. Leading theories include retrograde menstruation (period blood flowing backwards), immune system differences, and genetic factors." },
          { title: "How common is it?", body: "1 in 10 women and people with a uterus have endometriosis. It affects around 1.5 million in the UK alone. Diagnosis is often delayed 7–10 years." },
        ].map(({ title, body }) => (
          <div key={title} className="rounded-lg bg-[#F8F9FA] px-3 py-2.5">
            <p className="text-xs font-semibold text-[#111827] mb-1">{title}</p>
            <p className="text-xs text-[#6B7280] leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Topic definitions ─────────────────────────────────────────────────────────

const TOPICS = [
  {
    id: "cycle",
    title: "Your menstrual cycle",
    subtitle: "Phases, hormones & what's normal",
    icon: "🔄",
    content: <CycleChart />,
  },
  {
    id: "hormones",
    title: "Hormones & your cycle",
    subtitle: "Oestrogen, progesterone & LH",
    icon: "📈",
    content: <HormoneChart />,
  },
  {
    id: "endo",
    title: "Understanding endometriosis",
    subtitle: "What it is, where it grows & why it hurts",
    icon: "🫀",
    content: <EndoExplainer />,
  },
];

// ── Main export ───────────────────────────────────────────────────────────────

export function EducationSection() {
  const [openTopic, setOpenTopic] = useState<string | null>(null);

  return (
    <Card className="bg-white border-[#E8E8E8]">
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-base font-bold text-[var(--color-brand-midnight)] flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-[var(--color-brand-primary)]" />
          Understanding your body
        </CardTitle>
        <p className="text-xs text-[var(--color-brand-muted)]">
          Learn how your reproductive system works and what endometriosis means for you.
        </p>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {TOPICS.map((topic) => {
          const isOpen = openTopic === topic.id;
          return (
            <div key={topic.id} className="rounded-xl border border-[#E8E8E8] overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenTopic(isOpen ? null : topic.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F8F9FA] transition-colors text-left"
              >
                <span className="text-xl shrink-0">{topic.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#111827]">{topic.title}</p>
                  <p className="text-xs text-[#6B7280]">{topic.subtitle}</p>
                </div>
                {isOpen
                  ? <ChevronUp className="h-4 w-4 text-[#6B7280] shrink-0" />
                  : <ChevronDown className="h-4 w-4 text-[#6B7280] shrink-0" />}
              </button>
              {isOpen && (
                <div className="px-4 pb-4 border-t border-[#F3F4F6] pt-3">
                  {topic.content}
                </div>
              )}
            </div>
          );
        })}

        <p className="text-xs text-[#9CA3AF] pt-1 leading-relaxed text-center">
          Based on NICE NG73 · Information reviewed by specialist gynaecologists
        </p>
      </CardContent>
    </Card>
  );
}
