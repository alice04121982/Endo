// Brand illustration vocabulary — abstract organic shapes that suggest
// pelvic-health imagery without being literal. Built as inline SVG so they
// inherit colour from the surrounding palette (warm patient tokens by
// default; clinician palette via CSS variables).

interface ShapeProps {
  className?: string;
  ariaLabel?: string;
}

// Soft layered petal — used as hero centrepiece.
export function PetalBloom({ className, ariaLabel }: ShapeProps) {
  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      role="img"
      aria-label={ariaLabel ?? "Decorative bloom"}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <radialGradient id="bloom-clay" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="var(--color-brand-clay)" stopOpacity="0.85" />
          <stop offset="100%" stopColor="var(--color-brand-clay-deep)" stopOpacity="1" />
        </radialGradient>
        <radialGradient id="bloom-plum" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="var(--color-brand-plum)" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#5F3450" stopOpacity="1" />
        </radialGradient>
        <radialGradient id="bloom-blush" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="var(--color-brand-blush)" stopOpacity="1" />
          <stop offset="100%" stopColor="#E7B59B" stopOpacity="1" />
        </radialGradient>
      </defs>
      {/* outermost soft petals */}
      <g opacity="0.95">
        <ellipse cx="200" cy="120" rx="78" ry="120" fill="url(#bloom-blush)" transform="rotate(0 200 200)" />
        <ellipse cx="200" cy="120" rx="78" ry="120" fill="url(#bloom-blush)" transform="rotate(72 200 200)" />
        <ellipse cx="200" cy="120" rx="78" ry="120" fill="url(#bloom-blush)" transform="rotate(144 200 200)" />
        <ellipse cx="200" cy="120" rx="78" ry="120" fill="url(#bloom-blush)" transform="rotate(216 200 200)" />
        <ellipse cx="200" cy="120" rx="78" ry="120" fill="url(#bloom-blush)" transform="rotate(288 200 200)" />
      </g>
      {/* middle plum petals */}
      <g opacity="0.85">
        <ellipse cx="200" cy="140" rx="52" ry="92" fill="url(#bloom-plum)" transform="rotate(36 200 200)" />
        <ellipse cx="200" cy="140" rx="52" ry="92" fill="url(#bloom-plum)" transform="rotate(108 200 200)" />
        <ellipse cx="200" cy="140" rx="52" ry="92" fill="url(#bloom-plum)" transform="rotate(180 200 200)" />
        <ellipse cx="200" cy="140" rx="52" ry="92" fill="url(#bloom-plum)" transform="rotate(252 200 200)" />
        <ellipse cx="200" cy="140" rx="52" ry="92" fill="url(#bloom-plum)" transform="rotate(324 200 200)" />
      </g>
      {/* clay centre */}
      <circle cx="200" cy="200" r="46" fill="url(#bloom-clay)" />
      <circle cx="200" cy="200" r="20" fill="var(--color-brand-cream)" opacity="0.9" />
    </svg>
  );
}

// Looping ribbon — used in hero corners and section dividers.
export function RibbonLoop({ className, ariaLabel }: ShapeProps) {
  return (
    <svg
      viewBox="0 0 600 300"
      className={className}
      role="img"
      aria-label={ariaLabel ?? "Decorative ribbon"}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="ribbon-warm" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-brand-clay)" stopOpacity="0.6" />
          <stop offset="100%" stopColor="var(--color-brand-plum)" stopOpacity="0.7" />
        </linearGradient>
      </defs>
      <path
        d="M 0 160 C 120 60, 240 260, 360 160 S 600 60, 600 160"
        stroke="url(#ribbon-warm)"
        strokeWidth="42"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />
      <path
        d="M 0 200 C 120 100, 240 300, 360 200 S 600 100, 600 200"
        stroke="var(--color-brand-blush)"
        strokeWidth="22"
        strokeLinecap="round"
        fill="none"
        opacity="0.9"
      />
    </svg>
  );
}

// Soft grid of organic dots — calming texture.
export function DotField({ className, ariaLabel }: ShapeProps) {
  const dots = [];
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 8; c++) {
      const cx = c * 56 + 30;
      const cy = r * 56 + 30;
      const radius = 4 + ((r * c) % 5);
      const fill = (r + c) % 3 === 0 ? "var(--color-brand-clay)" : (r + c) % 3 === 1 ? "var(--color-brand-plum)" : "var(--color-brand-sand)";
      dots.push(<circle key={`${r}-${c}`} cx={cx} cy={cy} r={radius} fill={fill} opacity="0.55" />);
    }
  }
  return (
    <svg
      viewBox="0 0 480 360"
      className={className}
      role="img"
      aria-label={ariaLabel ?? "Decorative pattern"}
    >
      {dots}
    </svg>
  );
}

// Cycle wave — used on journal / quality pages.
export function CycleWave({ className, ariaLabel }: ShapeProps) {
  return (
    <svg
      viewBox="0 0 600 200"
      className={className}
      role="img"
      aria-label={ariaLabel ?? "Cycle wave"}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="cycle-wave" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--color-brand-blush)" stopOpacity="0.7" />
          <stop offset="50%" stopColor="var(--color-brand-clay)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--color-brand-plum)" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <path
        d="M 0 120 Q 75 40 150 120 T 300 120 T 450 120 T 600 120 L 600 200 L 0 200 Z"
        fill="url(#cycle-wave)"
      />
    </svg>
  );
}

// Linked circles — used on share / consent pages.
export function LinkedCircles({ className, ariaLabel }: ShapeProps) {
  return (
    <svg
      viewBox="0 0 400 200"
      className={className}
      role="img"
      aria-label={ariaLabel ?? "Linked circles"}
    >
      <circle cx="120" cy="100" r="70" fill="var(--color-brand-blush)" opacity="0.7" />
      <circle cx="280" cy="100" r="70" fill="var(--color-brand-clay)" opacity="0.7" />
      <circle cx="200" cy="100" r="42" fill="var(--color-brand-plum)" opacity="0.85" />
    </svg>
  );
}

// Layered arches — abstract pelvic anatomy nod, very soft.
export function Arches({ className, ariaLabel }: ShapeProps) {
  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      role="img"
      aria-label={ariaLabel ?? "Soft arches"}
    >
      <defs>
        <linearGradient id="arch-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-brand-blush)" />
          <stop offset="100%" stopColor="var(--color-brand-clay)" stopOpacity="0.7" />
        </linearGradient>
      </defs>
      <path
        d="M 50 350 Q 200 80 350 350 Z"
        fill="url(#arch-grad)"
        opacity="0.7"
      />
      <path
        d="M 100 350 Q 200 150 300 350 Z"
        fill="var(--color-brand-plum)"
        opacity="0.55"
      />
      <path
        d="M 150 350 Q 200 220 250 350 Z"
        fill="var(--color-brand-cream)"
        opacity="1"
      />
    </svg>
  );
}
