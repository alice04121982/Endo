import { ehpScores } from "@/lib/mock/patient";

const SCALES = [
  { key: "pain", label: "Pain", colour: "var(--color-brand-clay)" },
  { key: "control", label: "Control & powerlessness", colour: "var(--color-brand-plum)" },
  { key: "emotional", label: "Emotional well-being", colour: "var(--color-brand-aubergine)" },
  { key: "social", label: "Social support", colour: "var(--color-brand-sage)" },
  { key: "selfImage", label: "Self-image", colour: "var(--color-brand-amber)" },
] as const;

export default function QualityPage() {
  const max = 100;
  const months = ehpScores.map((s) => s.monthLabel);
  const w = 100; // viewBox width per month
  const h = 100; // viewBox height
  const innerW = (months.length - 1) * w;

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-10 py-12 lg:py-16">
      <p className="text-sm uppercase tracking-[0.18em] text-[var(--color-brand-stone)] mb-2">
        Quality of life
      </p>
      <h1 className="font-display font-extrabold text-[var(--color-brand-aubergine)] tracking-[-0.02em] leading-[1.05] mb-3" style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)" }}>
        Your quality of life
      </h1>
      <p className="text-[var(--color-brand-stone)] max-w-2xl mb-2">
        EHP-30 is the standard endometriosis quality-of-life questionnaire.
        You&apos;ve filled it in once a month for the last six months.
      </p>
      <p className="text-sm text-[var(--color-brand-stone)] mb-8">
        Each scale runs 0–100. Higher scores mean you&apos;re finding it
        harder. Your clinician sees the same numbers when you share access.
      </p>

      <section className="bg-white border border-[var(--color-brand-sand)] rounded-[14px] p-6 mb-8">
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-brand-stone)] mb-4">
          Last 6 months
        </p>

        <svg
          viewBox={`-30 -10 ${innerW + 60} ${h + 30}`}
          className="w-full h-72"
          aria-label="EHP-30 trend line chart"
        >
          {/* Y-axis gridlines */}
          {[0, 25, 50, 75, 100].map((y) => {
            const py = h - (y / max) * h;
            return (
              <g key={y}>
                <line
                  x1={0}
                  x2={innerW}
                  y1={py}
                  y2={py}
                  stroke="var(--color-brand-sand)"
                  strokeWidth="0.5"
                />
                <text
                  x={-6}
                  y={py + 3}
                  textAnchor="end"
                  fontSize="8"
                  fill="var(--color-brand-stone)"
                >
                  {y}
                </text>
              </g>
            );
          })}
          {/* X-axis labels */}
          {months.map((m, i) => (
            <text
              key={m}
              x={i * w}
              y={h + 14}
              textAnchor="middle"
              fontSize="9"
              fill="var(--color-brand-stone)"
            >
              {m}
            </text>
          ))}
          {/* Lines */}
          {SCALES.map((scale) => {
            const points = ehpScores
              .map((s, i) => {
                const v = s[scale.key];
                return `${i * w},${h - (v / max) * h}`;
              })
              .join(" ");
            return (
              <g key={scale.key}>
                <polyline
                  points={points}
                  fill="none"
                  stroke={scale.colour}
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {ehpScores.map((s, i) => (
                  <circle
                    key={i}
                    cx={i * w}
                    cy={h - (s[scale.key] / max) * h}
                    r="2.5"
                    fill={scale.colour}
                  />
                ))}
              </g>
            );
          })}
        </svg>

        <ul className="grid sm:grid-cols-2 gap-2 mt-6">
          {SCALES.map((scale) => {
            const last = ehpScores[ehpScores.length - 1][scale.key];
            const prev = ehpScores[ehpScores.length - 2][scale.key];
            const delta = last - prev;
            return (
              <li
                key={scale.key}
                className="flex items-center justify-between bg-[var(--color-brand-cream)] rounded-[8px] px-3 py-2"
              >
                <span className="inline-flex items-center gap-2 text-sm">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: scale.colour }}
                  />
                  {scale.label}
                </span>
                <span className="text-sm font-semibold text-[var(--color-brand-aubergine)]">
                  {last}
                  <span className="text-xs text-[var(--color-brand-stone)] ml-1.5">
                    ({delta > 0 ? "+" : ""}
                    {delta} vs Apr)
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="bg-white border border-[var(--color-brand-sand)] rounded-[14px] p-6">
        <h2 className="font-display text-lg font-bold text-[var(--color-brand-aubergine)] mb-2">
          May questionnaire
        </h2>
        <p className="text-sm text-[var(--color-brand-stone)] mb-4">
          You completed your May EHP-30 on 3 May 2026. Your next one is due
          around 3 June.
        </p>
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] bg-[var(--color-brand-cream)] text-[var(--color-brand-stone)] font-semibold cursor-not-allowed"
        >
          Next questionnaire — 3 June
        </button>
      </div>
    </div>
  );
}
