/**
 * Brand-consistent SVG illustrations that replace external stock images.
 * Uses the Endo palette: midnight, blue, lavender, orange, smoke.
 */

/* ── Shared colour tokens ── */
const C = {
  midnight: "#0E3D68",
  blue: "#4791FF",
  blueLight: "#A3C4FF",
  lavender: "#FBBFEC",
  orange: "#FF6833",
  smoke: "#F1F3F6",
  white: "#FFFFFF",
  sage: "#B4D4C0",
  coral: "#FFB299",
  lemon: "#FFF1C0",
} as const;

/* ── Hero — abstract wellness illustration ── */
export function IllustrationHero({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 480 560" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Background gradient circle */}
      <circle cx="240" cy="280" r="240" fill={C.smoke} />
      <circle cx="240" cy="280" r="180" fill={C.white} opacity="0.6" />

      {/* Abstract body silhouette */}
      <ellipse cx="240" cy="200" rx="48" ry="52" fill={C.blueLight} opacity="0.3" />
      <circle cx="240" cy="142" r="32" fill={C.blueLight} opacity="0.4" />

      {/* Heart / life symbol */}
      <path d="M220 190 C210 170 190 170 190 190 C190 210 220 230 240 250 C260 230 290 210 290 190 C290 170 270 170 260 190 L240 210 Z" fill={C.lavender} opacity="0.5" />
      <path d="M224 196 C218 182 204 182 204 196 C204 210 224 224 240 240 C256 224 276 210 276 196 C276 182 262 182 256 196 L240 214 Z" fill={C.lavender} opacity="0.7" />

      {/* Orbiting dots — pathways */}
      <circle cx="160" cy="240" r="10" fill={C.blue} opacity="0.6" />
      <circle cx="140" cy="300" r="7" fill={C.lavender} opacity="0.5" />
      <circle cx="320" cy="240" r="10" fill={C.orange} opacity="0.5" />
      <circle cx="340" cy="300" r="7" fill={C.sage} opacity="0.5" />
      <circle cx="200" cy="340" r="8" fill={C.coral} opacity="0.5" />
      <circle cx="280" cy="340" r="8" fill={C.blue} opacity="0.4" />

      {/* Connecting lines */}
      <line x1="160" y1="240" x2="200" y2="260" stroke={C.blue} strokeWidth="1" opacity="0.3" strokeDasharray="4 3" />
      <line x1="320" y1="240" x2="280" y2="260" stroke={C.orange} strokeWidth="1" opacity="0.3" strokeDasharray="4 3" />
      <line x1="200" y1="340" x2="240" y2="310" stroke={C.coral} strokeWidth="1" opacity="0.3" strokeDasharray="4 3" />
      <line x1="280" y1="340" x2="240" y2="310" stroke={C.blue} strokeWidth="1" opacity="0.3" strokeDasharray="4 3" />

      {/* Data / tracking visualization */}
      <rect x="170" y="380" width="140" height="80" rx="16" fill={C.white} opacity="0.9" />
      <rect x="186" y="430" width="16" height="18" rx="3" fill={C.blue} opacity="0.6" />
      <rect x="210" y="420" width="16" height="28" rx="3" fill={C.lavender} opacity="0.7" />
      <rect x="234" y="424" width="16" height="24" rx="3" fill={C.orange} opacity="0.5" />
      <rect x="258" y="416" width="16" height="32" rx="3" fill={C.sage} opacity="0.6" />
      <rect x="282" y="426" width="16" height="22" rx="3" fill={C.coral} opacity="0.5" />

      {/* Chart label dots */}
      <circle cx="194" cy="396" r="3" fill={C.blue} />
      <circle cx="218" cy="396" r="3" fill={C.lavender} />
      <circle cx="242" cy="396" r="3" fill={C.orange} />
      <text x="186" y="408" fill={C.midnight} fontSize="7" opacity="0.5">Your patterns</text>

      {/* Sparkle accents */}
      <path d="M340 160 l3 8 8 3 -8 3 -3 8 -3-8 -8-3 8-3z" fill={C.orange} opacity="0.4" />
      <path d="M140 160 l2 6 6 2 -6 2 -2 6 -2-6 -6-2 6-2z" fill={C.blue} opacity="0.3" />
      <path d="M360 340 l2 6 6 2 -6 2 -2 6 -2-6 -6-2 6-2z" fill={C.lavender} opacity="0.4" />
    </svg>
  );
}

/* ── Photo-strip style abstract cards ── */
export function IllustrationYoga({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 400" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <rect width="300" height="400" rx="20" fill="#EAF0FB" />
      {/* Sunrise arc */}
      <circle cx="150" cy="340" r="100" fill={C.lemon} opacity="0.4" />
      <circle cx="150" cy="340" r="60" fill={C.orange} opacity="0.15" />
      {/* Yoga figure */}
      <circle cx="150" cy="160" r="18" fill={C.blueLight} opacity="0.6" />
      <path d="M150 178 L150 240" stroke={C.blue} strokeWidth="3" strokeLinecap="round" />
      <path d="M150 200 L120 220" stroke={C.blue} strokeWidth="3" strokeLinecap="round" />
      <path d="M150 200 L180 220" stroke={C.blue} strokeWidth="3" strokeLinecap="round" />
      <path d="M150 240 L125 280" stroke={C.blue} strokeWidth="3" strokeLinecap="round" />
      <path d="M150 240 L175 280" stroke={C.blue} strokeWidth="3" strokeLinecap="round" />
      {/* Ground */}
      <ellipse cx="150" cy="290" rx="60" ry="6" fill={C.sage} opacity="0.3" />
      {/* Sparkle */}
      <path d="M220 140 l2 5 5 2 -5 2 -2 5 -2-5 -5-2 5-2z" fill={C.orange} opacity="0.5" />
    </svg>
  );
}

export function IllustrationMeditation({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 400" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <rect width="300" height="400" rx="20" fill="#F5EBF8" />
      {/* Calm circles */}
      <circle cx="150" cy="200" r="100" fill={C.lavender} opacity="0.1" />
      <circle cx="150" cy="200" r="70" fill={C.lavender} opacity="0.15" />
      <circle cx="150" cy="200" r="40" fill={C.lavender} opacity="0.2" />
      {/* Seated figure */}
      <circle cx="150" cy="160" r="16" fill={C.lavender} opacity="0.5" />
      <path d="M150 176 L150 220" stroke={C.lavender} strokeWidth="3" strokeLinecap="round" opacity="0.7" />
      <path d="M150 195 L122 210" stroke={C.lavender} strokeWidth="3" strokeLinecap="round" opacity="0.6" />
      <path d="M150 195 L178 210" stroke={C.lavender} strokeWidth="3" strokeLinecap="round" opacity="0.6" />
      <path d="M150 220 L125 240 L110 240" stroke={C.lavender} strokeWidth="3" strokeLinecap="round" opacity="0.5" />
      <path d="M150 220 L175 240 L190 240" stroke={C.lavender} strokeWidth="3" strokeLinecap="round" opacity="0.5" />
      {/* Lotus */}
      <ellipse cx="150" cy="248" rx="45" ry="10" fill={C.lavender} opacity="0.15" />
    </svg>
  );
}

export function IllustrationCommunity({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 400" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <rect width="300" height="400" rx="20" fill="#FFF5F0" />
      {/* Three people */}
      <circle cx="110" cy="180" r="16" fill={C.coral} opacity="0.5" />
      <rect x="98" y="200" width="24" height="40" rx="8" fill={C.coral} opacity="0.35" />
      <circle cx="150" cy="170" r="18" fill={C.orange} opacity="0.45" />
      <rect x="136" y="192" width="28" height="44" rx="8" fill={C.orange} opacity="0.3" />
      <circle cx="190" cy="180" r="16" fill={C.lavender} opacity="0.5" />
      <rect x="178" y="200" width="24" height="40" rx="8" fill={C.lavender} opacity="0.35" />
      {/* Hearts */}
      <path d="M142 260 C138 252 130 252 130 260 C130 268 142 276 150 282 C158 276 170 268 170 260 C170 252 162 252 158 260 L150 268 Z" fill={C.coral} opacity="0.3" />
      {/* Connection lines */}
      <line x1="122" y1="210" x2="138" y2="210" stroke={C.orange} strokeWidth="1" opacity="0.3" strokeDasharray="3 2" />
      <line x1="162" y1="210" x2="180" y2="210" stroke={C.lavender} strokeWidth="1" opacity="0.3" strokeDasharray="3 2" />
    </svg>
  );
}

export function IllustrationNature({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 400" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <rect width="300" height="400" rx="20" fill="#EFF6F0" />
      {/* Hills */}
      <ellipse cx="100" cy="320" rx="120" ry="60" fill={C.sage} opacity="0.3" />
      <ellipse cx="220" cy="330" rx="110" ry="50" fill={C.sage} opacity="0.2" />
      {/* Sun */}
      <circle cx="220" cy="100" r="36" fill={C.lemon} opacity="0.5" />
      <circle cx="220" cy="100" r="24" fill={C.orange} opacity="0.2" />
      {/* Trees */}
      <rect x="90" y="220" width="6" height="60" rx="3" fill={C.sage} opacity="0.5" />
      <circle cx="93" cy="210" r="22" fill={C.sage} opacity="0.35" />
      <rect x="170" y="240" width="5" height="40" rx="2.5" fill={C.sage} opacity="0.4" />
      <circle cx="172" cy="232" r="16" fill={C.sage} opacity="0.3" />
      {/* Path */}
      <path d="M0 360 Q80 320 150 340 Q220 360 300 330" stroke={C.sage} strokeWidth="2" opacity="0.3" />
      {/* Walking figure */}
      <circle cx="150" cy="280" r="10" fill={C.blueLight} opacity="0.5" />
      <path d="M150 290 L150 316" stroke={C.blue} strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <path d="M150 316 L140 340" stroke={C.blue} strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <path d="M150 316 L160 340" stroke={C.blue} strokeWidth="2" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

/* ── Thematic cards for content sections ── */
export function IllustrationPainScience({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <rect width="400" height="200" fill="#EAF0FB" />
      {/* Neural network */}
      <circle cx="200" cy="100" r="20" fill={C.lavender} opacity="0.4" />
      <circle cx="120" cy="60" r="12" fill={C.blue} opacity="0.3" />
      <circle cx="280" cy="60" r="12" fill={C.blue} opacity="0.3" />
      <circle cx="120" cy="140" r="12" fill={C.coral} opacity="0.3" />
      <circle cx="280" cy="140" r="12" fill={C.coral} opacity="0.3" />
      <circle cx="60" cy="100" r="8" fill={C.lavender} opacity="0.2" />
      <circle cx="340" cy="100" r="8" fill={C.lavender} opacity="0.2" />
      <line x1="180" y1="90" x2="132" y2="66" stroke={C.blue} strokeWidth="1" opacity="0.3" />
      <line x1="220" y1="90" x2="268" y2="66" stroke={C.blue} strokeWidth="1" opacity="0.3" />
      <line x1="180" y1="110" x2="132" y2="134" stroke={C.coral} strokeWidth="1" opacity="0.3" />
      <line x1="220" y1="110" x2="268" y2="134" stroke={C.coral} strokeWidth="1" opacity="0.3" />
      <line x1="108" y1="60" x2="68" y2="100" stroke={C.lavender} strokeWidth="1" opacity="0.2" />
      <line x1="292" y1="60" x2="332" y2="100" stroke={C.lavender} strokeWidth="1" opacity="0.2" />
    </svg>
  );
}

export function IllustrationTreatments({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <rect width="400" height="200" fill="#F5EBF8" />
      {/* Pill shapes */}
      <rect x="100" y="70" width="60" height="26" rx="13" fill={C.lavender} opacity="0.4" />
      <rect x="100" y="70" width="30" height="26" rx="13" fill={C.lavender} opacity="0.6" />
      <rect x="240" y="100" width="60" height="26" rx="13" fill={C.sage} opacity="0.4" />
      <rect x="240" y="100" width="30" height="26" rx="13" fill={C.sage} opacity="0.6" />
      {/* Flask */}
      <path d="M190 60 L190 90 L170 140 L210 140 Z" fill={C.blue} opacity="0.15" stroke={C.blue} strokeWidth="1" strokeOpacity="0.3" />
      <rect x="184" y="52" width="12" height="12" rx="2" fill={C.blue} opacity="0.2" />
      {/* Sparkle */}
      <path d="M300 60 l3 8 8 3 -8 3 -3 8 -3-8 -8-3 8-3z" fill={C.orange} opacity="0.3" />
    </svg>
  );
}

export function IllustrationGut({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <rect width="400" height="200" fill="#EFF6F0" />
      {/* Gut shape */}
      <path d="M120 40 C120 40 160 60 160 80 C160 100 100 100 100 120 C100 140 160 140 160 160" stroke={C.sage} strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.5" />
      <path d="M180 40 C180 40 220 60 220 80 C220 100 180 100 180 120 C180 140 220 140 220 160" stroke={C.sage} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.35" />
      {/* Microbiome dots */}
      <circle cx="130" cy="70" r="4" fill={C.sage} opacity="0.5" />
      <circle cx="140" cy="90" r="3" fill={C.lavender} opacity="0.4" />
      <circle cx="110" cy="110" r="3.5" fill={C.blue} opacity="0.3" />
      <circle cx="150" cy="130" r="4" fill={C.sage} opacity="0.4" />
      <circle cx="120" cy="150" r="3" fill={C.coral} opacity="0.3" />
      {/* Arrow cycle */}
      <circle cx="300" cy="100" r="30" fill="none" stroke={C.sage} strokeWidth="1.5" strokeDasharray="5 4" opacity="0.3" />
      <text x="300" y="96" textAnchor="middle" fill={C.midnight} fontSize="8" opacity="0.4">Estro-</text>
      <text x="300" y="107" textAnchor="middle" fill={C.midnight} fontSize="8" opacity="0.4">bolome</text>
    </svg>
  );
}

export function IllustrationFatigue({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <rect width="400" height="200" fill="#FFF8F0" />
      {/* Wave pattern — energy levels */}
      <path d="M40 120 Q100 60 160 100 Q220 140 280 80 Q340 40 400 100" stroke={C.coral} strokeWidth="2" fill="none" opacity="0.3" />
      <path d="M40 140 Q100 100 160 120 Q220 140 280 110 Q340 80 400 120" stroke={C.orange} strokeWidth="1.5" fill="none" opacity="0.2" />
      {/* Battery icon */}
      <rect x="170" y="70" width="60" height="30" rx="6" fill="none" stroke={C.coral} strokeWidth="1.5" opacity="0.4" />
      <rect x="230" y="78" width="6" height="14" rx="2" fill={C.coral} opacity="0.3" />
      <rect x="176" y="76" width="24" height="18" rx="3" fill={C.coral} opacity="0.25" />
      {/* Zzz */}
      <text x="280" y="70" fill={C.midnight} fontSize="14" fontWeight="bold" opacity="0.15">Z</text>
      <text x="296" y="58" fill={C.midnight} fontSize="11" fontWeight="bold" opacity="0.1">z</text>
      <text x="308" y="50" fill={C.midnight} fontSize="9" fontWeight="bold" opacity="0.08">z</text>
    </svg>
  );
}

export function IllustrationDiagnosis({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <rect width="400" height="200" fill={C.lemon} opacity="0.3" />
      <rect width="400" height="200" fill={C.white} opacity="0.5" />
      {/* Magnifying glass */}
      <circle cx="180" cy="90" r="35" fill="none" stroke={C.blue} strokeWidth="2.5" opacity="0.4" />
      <line x1="206" y1="116" x2="230" y2="140" stroke={C.blue} strokeWidth="3" strokeLinecap="round" opacity="0.4" />
      {/* Biomarker dots inside lens */}
      <circle cx="170" cy="80" r="4" fill={C.lavender} opacity="0.5" />
      <circle cx="185" cy="75" r="3" fill={C.blue} opacity="0.4" />
      <circle cx="178" cy="98" r="3.5" fill={C.sage} opacity="0.4" />
      <circle cx="192" cy="92" r="2.5" fill={C.coral} opacity="0.4" />
      {/* Timeline / speedup */}
      <rect x="260" y="75" width="90" height="8" rx="4" fill={C.smoke} />
      <rect x="260" y="75" width="40" height="8" rx="4" fill={C.blue} opacity="0.4" />
      <text x="260" y="100" fill={C.midnight} fontSize="8" opacity="0.3">Faster diagnosis</text>
    </svg>
  );
}

export function IllustrationAdvocacy({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <rect width="400" height="200" fill="#EAF0FB" />
      {/* Clipboard */}
      <rect x="150" y="30" width="100" height="130" rx="10" fill={C.white} opacity="0.9" />
      <rect x="175" y="20" width="50" height="16" rx="8" fill={C.blue} opacity="0.3" />
      {/* Chart lines on clipboard */}
      <rect x="166" y="56" width="68" height="4" rx="2" fill={C.smoke} />
      <rect x="166" y="66" width="50" height="4" rx="2" fill={C.smoke} />
      <rect x="166" y="80" width="68" height="4" rx="2" fill={C.lavender} opacity="0.4" />
      <rect x="166" y="90" width="40" height="4" rx="2" fill={C.lavender} opacity="0.3" />
      {/* Mini bar chart */}
      <rect x="170" y="110" width="10" height="30" rx="2" fill={C.blue} opacity="0.3" />
      <rect x="186" y="118" width="10" height="22" rx="2" fill={C.lavender} opacity="0.4" />
      <rect x="202" y="106" width="10" height="34" rx="2" fill={C.orange} opacity="0.3" />
      <rect x="218" y="114" width="10" height="26" rx="2" fill={C.sage} opacity="0.4" />
      {/* Checkmark */}
      <circle cx="300" cy="80" r="20" fill={C.sage} opacity="0.3" />
      <path d="M290 80 L298 88 L312 72" stroke={C.sage} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
    </svg>
  );
}

/* ── Insights header illustration ── */
export function IllustrationInsightsHeader({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 800 260" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <rect width="800" height="260" fill={C.midnight} />
      {/* Abstract data visualization background */}
      <circle cx="650" cy="130" r="100" fill={C.blue} opacity="0.08" />
      <circle cx="650" cy="130" r="60" fill={C.blue} opacity="0.06" />
      {/* Pathway lines */}
      <path d="M500 40 Q560 80 540 130 Q520 180 580 220" stroke={C.lavender} strokeWidth="1.5" opacity="0.15" />
      <path d="M550 20 Q600 70 590 130 Q580 190 640 240" stroke={C.blue} strokeWidth="1" opacity="0.12" />
      <path d="M600 30 Q640 90 620 140 Q600 190 660 250" stroke={C.coral} strokeWidth="1" opacity="0.1" />
      {/* Floating data points */}
      <circle cx="540" cy="80" r="4" fill={C.lavender} opacity="0.3" />
      <circle cx="580" cy="120" r="3" fill={C.blue} opacity="0.25" />
      <circle cx="560" cy="170" r="5" fill={C.coral} opacity="0.2" />
      <circle cx="620" cy="100" r="3.5" fill={C.sage} opacity="0.2" />
      <circle cx="660" cy="160" r="4" fill={C.lavender} opacity="0.2" />
      {/* Sparkle accents */}
      <path d="M700 50 l2 5 5 2 -5 2 -2 5 -2-5 -5-2 5-2z" fill={C.orange} opacity="0.2" />
      <path d="M720 180 l2 5 5 2 -5 2 -2 5 -2-5 -5-2 5-2z" fill={C.lavender} opacity="0.15" />
    </svg>
  );
}

/* ── Category card illustrations (small, themed) ── */
const categoryIllustrations = {
  journey: ({ className = "" }: { className?: string }) => (
    <svg viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <rect width="320" height="200" fill="#EAF0FB" />
      <path d="M40 160 Q100 100 160 120 Q220 140 280 80" stroke={C.blue} strokeWidth="2" opacity="0.3" strokeDasharray="6 4" />
      <circle cx="160" cy="120" r="20" fill={C.blue} opacity="0.15" />
      <circle cx="160" cy="120" r="8" fill={C.blue} opacity="0.3" />
      <path d="M280 80 l-8-2 2 8" stroke={C.blue} strokeWidth="2" strokeLinecap="round" opacity="0.3" />
    </svg>
  ),
  pain: ({ className = "" }: { className?: string }) => (
    <svg viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <rect width="320" height="200" fill="#F5EBF8" />
      <circle cx="160" cy="100" r="40" fill={C.lavender} opacity="0.15" />
      <circle cx="160" cy="100" r="24" fill={C.lavender} opacity="0.2" />
      <path d="M148 90 l3 8 8 3 -8 3 -3 8 -3-8 -8-3 8-3z" fill={C.lavender} opacity="0.5" />
      <path d="M168 108 l2 5 5 2 -5 2 -2 5 -2-5 -5-2 5-2z" fill={C.lavender} opacity="0.4" />
    </svg>
  ),
  community: ({ className = "" }: { className?: string }) => (
    <svg viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <rect width="320" height="200" fill="#FFF5F0" />
      <circle cx="130" cy="90" r="14" fill={C.coral} opacity="0.3" />
      <circle cx="160" cy="80" r="16" fill={C.orange} opacity="0.25" />
      <circle cx="190" cy="90" r="14" fill={C.lavender} opacity="0.3" />
      <path d="M140 120 C140 110 180 110 180 120 Q160 140 140 120" fill={C.coral} opacity="0.15" />
    </svg>
  ),
  tracking: ({ className = "" }: { className?: string }) => (
    <svg viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <rect width="320" height="200" fill="#EFF6F0" />
      <rect x="80" y="60" width="160" height="80" rx="12" fill={C.white} opacity="0.8" />
      <rect x="100" y="110" width="18" height="20" rx="3" fill={C.sage} opacity="0.5" />
      <rect x="126" y="95" width="18" height="35" rx="3" fill={C.blue} opacity="0.4" />
      <rect x="152" y="100" width="18" height="30" rx="3" fill={C.lavender} opacity="0.5" />
      <rect x="178" y="90" width="18" height="40" rx="3" fill={C.orange} opacity="0.4" />
    </svg>
  ),
  report: ({ className = "" }: { className?: string }) => (
    <svg viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <rect width="320" height="200" fill="#FFF5F0" />
      <rect x="110" y="30" width="100" height="130" rx="10" fill={C.white} opacity="0.9" />
      <rect x="126" y="56" width="68" height="4" rx="2" fill={C.smoke} />
      <rect x="126" y="66" width="50" height="4" rx="2" fill={C.smoke} />
      <rect x="126" y="80" width="68" height="4" rx="2" fill={C.coral} opacity="0.3" />
      <rect x="126" y="90" width="40" height="4" rx="2" fill={C.coral} opacity="0.2" />
      <circle cx="160" cy="130" r="16" fill={C.orange} opacity="0.15" />
      <path d="M154 130 L158 134 L168 124" stroke={C.orange} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    </svg>
  ),
  privacy: ({ className = "" }: { className?: string }) => (
    <svg viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <rect width="320" height="200" fill="#EAF0FB" />
      <path d="M160 50 L200 70 L200 120 C200 150 160 170 160 170 C160 170 120 150 120 120 L120 70 Z" fill={C.blue} opacity="0.15" stroke={C.blue} strokeWidth="1.5" strokeOpacity="0.5" />
      <circle cx="160" cy="100" r="12" fill={C.blue} opacity="0.2" />
      <rect x="156" y="95" width="8" height="10" rx="2" fill={C.blue} opacity="0.3" />
    </svg>
  ),
};

export { categoryIllustrations };
