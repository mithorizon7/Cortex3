import * as React from "react";
import type { PillarScores } from "@shared/schema";

type Level = 0 | 1 | 2 | 3;
type PillarKey = "C" | "O" | "R" | "T" | "E" | "X";
type Pillar = { key: PillarKey; label?: string; level: Level };

const DEFAULT_PILLARS: Pillar[] = [
  { key: "C", label: "C", level: 2 },
  { key: "O", label: "O", level: 3 },
  { key: "R", label: "R", level: 1 },
  { key: "T", label: "T", level: 3 },
  { key: "E", label: "E", level: 2 },
  { key: "X", label: "X", level: 1 },
];

// Convert PillarScores to internal Pillar format
function convertPillarScoresToPillars(scores: PillarScores): Pillar[] {
  return [
    { key: "C", label: "C", level: Math.max(1, scores.C) as Level },
    { key: "O", label: "O", level: Math.max(1, scores.O) as Level },
    { key: "R", label: "R", level: Math.max(1, scores.R) as Level },
    { key: "T", label: "T", level: Math.max(1, scores.T) as Level },
    { key: "E", label: "E", level: Math.max(1, scores.E) as Level },
    { key: "X", label: "X", level: Math.max(1, scores.X) as Level },
  ];
}

export function ExecutiveCortexHero({
  pillarScores,
  pillars,
  ariaLabel = "Executive CORTEX AI Readiness radar",
  className = "",
}: {
  pillarScores?: PillarScores;
  pillars?: Pillar[];
  ariaLabel?: string;
  className?: string;
}) {
  // Use pillarScores if provided, otherwise fall back to pillars or DEFAULT_PILLARS
  const actualPillars = pillarScores 
    ? convertPillarScoresToPillars(pillarScores)
    : (pillars || DEFAULT_PILLARS);
  // Unique IDs so multiple instances won't collide
  const uid = React.useId();

  // --- Geometry ---
  const VB = 512; // square viewBox (crisp on HiDPI)
  const C = VB / 2; // center
  const RINGS = [86, 144, 202]; // background rings
  const NODE_ORBIT = 180; // where the CORTEX letters sit
  const MIN_R = 88; // spider polygon min
  const MAX_R = 206; // spider polygon max

  // 6 rays at 60° steps, starting at -90° (top)
  const angles = actualPillars.map((_, i) => (i * Math.PI) / 3 - Math.PI / 2);
  const clamp = (n: number, lo = 0, hi = 3) => Math.max(lo, Math.min(hi, n));
  const levelToRadius = (lvl: number) =>
    MIN_R + (clamp(lvl) / 3) * (MAX_R - MIN_R);

  const pointAt = (r: number, a: number) => ({
    x: C + r * Math.cos(a),
    y: C + r * Math.sin(a),
  });

  const polygonPoints = actualPillars
    .map((p, i) => {
      const r = levelToRadius(p.level);
      const { x, y } = pointAt(r, angles[i]);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  const nodePositions = angles.map((a) => pointAt(NODE_ORBIT, a));

  // Maturity color ramp (neutral → amber → emerald)
  const MATURITY_COLORS = [
    "hsl(220, 15%, 60%)",
    "hsl(38, 92%, 50%)",
    "hsl(158, 64%, 52%)",
  ];

  return (
    <div className={`relative ${className}`}>
      {/* MOBILE: simplified badge preview */}
      <div className="md:hidden">
        <div className="rounded-2xl border border-border/30 bg-gradient-to-br from-background via-muted/40 to-primary/10 p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="text-sm uppercase tracking-widest text-muted-foreground">
              Executive
            </div>
            <div className="text-xs text-muted-foreground">AI Readiness</div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            {actualPillars.map((p, i) => {
              const idx = Math.max(0, Math.min(2, p.level - 1));
              const color = MATURITY_COLORS[idx] ?? MATURITY_COLORS[0];
              return (
                <span
                  key={p.key + i}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/40 bg-background/60 backdrop-blur-sm shadow"
                  style={{
                    boxShadow: `0 0 0.5rem ${color}22 inset, 0 0 0.35rem ${color}44`,
                  }}
                >
                  <span className="text-sm font-bold">{p.key}</span>
                </span>
              );
            })}
            <span className="ml-auto rounded-md px-2 py-1 text-[10px] font-semibold tracking-wider text-primary/90 ring-1 ring-primary/40">
              CORTEX
            </span>
          </div>
        </div>
      </div>

      {/* DESKTOP / TABLET: hero canvas */}
      <div
        className="relative hidden overflow-hidden rounded-2xl border border-border/30 bg-gradient-to-br from-background via-muted/30 to-primary/10 shadow-2xl md:block"
        data-testid="visual-honeycomb-preview"
        role="img"
        aria-label={ariaLabel}
      >
        {/* Aspect control: cinematic but flexible */}
        <div className="aspect-[4/3]">
          {/* Grain + conic sweep layers (CSS) */}
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
          >
            {/* Soft conic radar sweep */}
            <div
              className="absolute inset-0 [mask-image:radial-gradient(70%_70%_at_50%_50%,black,transparent)]"
            >
              <div 
                className="absolute inset-0 animate-[spin_60s_linear_infinite] motion-reduce:animate-none"
                style={{
                  background:
                    "conic-gradient(from 0deg, hsla(var(--primary),0.18), transparent 35%, transparent 85%, hsla(var(--primary),0.18))",
                  transformOrigin: "50% 50%",
                }}
              />
            </div>
            {/* Fine film grain */}
            <svg className="absolute inset-0 h-full w-full opacity-[0.06]" viewBox="0 0 100 100" preserveAspectRatio="none">
              <filter id={`grain-${uid}`}>
                <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch" />
                <feColorMatrix type="saturate" values="0"/>
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.45" />
                </feComponentTransfer>
              </filter>
              <rect width="100" height="100" filter={`url(#grain-${uid})`} />
            </svg>
          </div>

          {/* Core SVG */}
          <svg viewBox={`0 0 ${VB} ${VB}`} className="h-full w-full">
            <defs>
              {/* Hex background pattern */}
              <pattern
                id={`hex-${uid}`}
                patternUnits="userSpaceOnUse"
                width="48"
                height="41.5692"
                patternTransform="scale(1.25) translate(0,0)"
              >
                <polygon
                  points="24,4 44,15.7846 44,33.7846 24,45.5692 4,33.7846 4,15.7846"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.8"
                  opacity="0.45"
                />
              </pattern>

              {/* Radial fade for masking the pattern */}
              <radialGradient id={`fadeGrad-${uid}`} cx="50%" cy="50%" r="65%">
                <stop offset="0%" stopColor="white" stopOpacity="0.0" />
                <stop offset="45%" stopColor="white" stopOpacity="1.0" />
                <stop offset="100%" stopColor="white" stopOpacity="0.05" />
              </radialGradient>
              <mask id={`fadeMask-${uid}`}>
                <rect width="100%" height="100%" fill={`url(#fadeGrad-${uid})`} />
              </mask>

              {/* Ring gradient */}
              <linearGradient id={`ring-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--border))" stopOpacity="0.65" />
                <stop offset="100%" stopColor="hsl(var(--border))" stopOpacity="0.2" />
              </linearGradient>

              {/* Center well gradient */}
              <radialGradient id={`center-${uid}`} cx="50%" cy="50%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.25" />
                <stop offset="70%" stopColor="hsl(var(--primary))" stopOpacity="0.10" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.04" />
              </radialGradient>

              {/* Polygon stroke gradient */}
              <linearGradient id={`poly-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.35" />
              </linearGradient>

              {/* Badge rim gradient for separation */}
              <linearGradient id={`badge-rim-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="0.2" />
                <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity="0.05" />
              </linearGradient>

              {/* Soft glow */}
              <filter id={`soft-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="1.25" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Stronger outer glow */}
              <filter id={`glow-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="g" />
                <feMerge>
                  <feMergeNode in="g" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Subtle hex background - dialed back */}
            <g opacity="0.04" mask={`url(#fadeMask-${uid})`}>
              <rect width={VB} height={VB} fill={`url(#hex-${uid})`} />
            </g>

            {/* Concentric rings (measured, not busy) - crisper */}
            <g>
              {RINGS.map((r, i) => (
                <circle
                  key={r}
                  cx={C}
                  cy={C}
                  r={r}
                  fill="none"
                  stroke={`url(#ring-${uid})`}
                  strokeWidth={i === RINGS.length - 1 ? 1.5 : 1}
                  vectorEffect="non-scaling-stroke"
                  shapeRendering="geometricPrecision"
                  opacity={i === 0 ? 0.6 : i === 1 ? 0.45 : 0.35}
                />
              ))}
            </g>

            {/* Spokes */}
            <g opacity="0.28" filter={`url(#soft-${uid})`}>
              {angles.map((a, i) => {
                const { x, y } = pointAt(RINGS[RINGS.length - 1], a);
                return (
                  <line
                    key={i}
                    x1={C}
                    y1={C}
                    x2={x}
                    y2={y}
                    stroke={`url(#ring-${uid})`}
                    strokeWidth="1"
                  />
                );
              })}
            </g>

            {/* Readiness polygon (data-driven) - crisper with glass edge */}
            <g>
              <polygon
                points={polygonPoints}
                fill="hsl(var(--primary) / 0.12)"
                stroke={`url(#poly-${uid})`}
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
                shapeRendering="geometricPrecision"
              />
              {/* Glass edge inner highlight */}
              <polygon
                points={polygonPoints}
                fill="none"
                stroke="white"
                strokeOpacity="0.12"
                strokeWidth="0.6"
                vectorEffect="non-scaling-stroke"
              />
              {/* Subtle outer halo */}
              <polygon
                points={polygonPoints}
                fill="none"
                stroke="hsl(var(--primary) / 0.35)"
                strokeWidth="6"
                opacity="0.12"
                filter={`url(#soft-${uid})`}
              />
            </g>

            {/* Ring scale labels (tiny, at top for clarity) */}
            <g aria-hidden="true">
              {[1, 2, 3].map((n, idx) => {
                const r = RINGS[idx];
                return (
                  <text
                    key={n}
                    x={C}
                    y={C - r - 8}
                    textAnchor="middle"
                    className="text-[10px] font-medium"
                    style={{ 
                      fill: "hsl(var(--muted-foreground))", 
                      opacity: 0.6,
                      letterSpacing: "0.5px"
                    }}
                  >
                    {n}
                  </text>
                );
              })}
            </g>

            {/* Nodes for C O R T E X */}
            {actualPillars.map((p, i) => {
              const pos = nodePositions[i];
              const idx = Math.max(0, Math.min(2, p.level - 1));
              const color = MATURITY_COLORS[idx] ?? MATURITY_COLORS[0];

              return (
                <g key={`${p.key}-${i}`}>
                  {/* subtle pulse to imply "live" - slower and trimmed */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="26"
                    className="animate-[pulse_7s_ease-in-out_infinite] motion-reduce:animate-none"
                    fill={color}
                    fillOpacity="0.08"
                    stroke={color}
                    strokeWidth="1.5"
                    style={{ filter: `url(#soft-${uid})` }}
                  />
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="17.5"
                    fill={color}
                    fillOpacity="0.23"
                    style={{ filter: `url(#glow-${uid})` }}
                  />
                  <text
                    x={pos.x}
                    y={pos.y + 6}
                    textAnchor="middle"
                    className="text-base font-bold"
                    style={{
                      fontFamily: "var(--font-heading)",
                      fill: "hsl(var(--foreground))",
                      filter: `url(#soft-${uid})`,
                      letterSpacing: "0.5px",
                    }}
                  >
                    {p.key}
                  </text>
                </g>
              );
            })}

            {/* Center badge - strengthened */}
            <g>
              <circle
                cx={C}
                cy={C}
                r="40"
                fill={`url(#center-${uid})`}
                stroke="hsl(var(--primary))"
                strokeWidth="1.5"
                opacity="0.95"
                style={{ filter: `url(#soft-${uid})` }}
              />
              {/* Micro-gradient rim for separation */}
              <circle
                cx={C}
                cy={C}
                r="40"
                fill="none"
                stroke={`url(#badge-rim-${uid})`}
                strokeWidth="1"
                opacity="0.4"
              />
              <text
                x={C}
                y={C + 6}
                textAnchor="middle"
                className="text-base font-bold"
                style={{
                  fontFamily: "var(--font-heading)",
                  letterSpacing: "0.75px",
                  fill: "hsl(var(--foreground))",
                }}
              >
                CORTEX
              </text>
            </g>
          </svg>
        </div>

        {/* Screen-reader description (concise) */}
        <p className="sr-only">
          Radar with six pillars labeled C, O, R, T, E, X. Concentric rings
          show maturity levels, connected by a polygon indicating current
          readiness.
        </p>
      </div>
    </div>
  );
}