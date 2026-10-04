import { categoryLabel } from "@/lib/category-labels";
import { geographyOf } from "@/lib/taxonomy";
import type { Opportunity, OpportunityCategory } from "@/lib/types";

export type CoverMotif = "ridge" | "orbit" | "field";

export interface CoverSpec {
  base: string;
  accent: string;
  motif: CoverMotif;
  initial: string;
  variant: number;
}

const PALETTES: Record<string, { base: string; accent: string }> = {
  scholarship: { base: "#123F2A", accent: "#C9A227" },
  fellowship: { base: "#0B3B36", accent: "#F5EFE0" },
  internship: { base: "#16283F", accent: "#3AB7A5" },
  jobs: { base: "#1B2F4B", accent: "#C9A227" },
  hackathon: { base: "#0B3B36", accent: "#2FA37C" },
  competition: { base: "#123F2A", accent: "#3AB7A5" },
  grant: { base: "#16283F", accent: "#F5EFE0" },
  accelerator: { base: "#0E4A3E", accent: "#C9A227" },
  conference: { base: "#1B2F4B", accent: "#2FA37C" },
  "tech-event": { base: "#123F2A", accent: "#3AB7A5" },
  workshop: { base: "#0E4A3E", accent: "#F5EFE0" },
  "research-call": { base: "#16283F", accent: "#2FA37C" },
  "public-challenge": { base: "#123F2A", accent: "#C9A227" },
  other: { base: "#0B3B36", accent: "#F5EFE0" },
};

/**
 * Deterministic visual-cover spec derived only from already-stored fields
 * (category, slug, derived geography). No database column, no network fetch,
 * no external imagery: the same record always renders the same cover.
 *
 * Covers are ILLUSTRATIVE, never documentary. They must never be presented
 * as photographs of a real event, cohort, or place; the authoritative
 * evidence always lives in the source link and evidence section.
 */
export function coverSpecFor(opportunity: Pick<Opportunity, "category" | "slug"> & Partial<Opportunity>): CoverSpec {
  const palette = PALETTES[opportunity.category] ?? PALETTES.other;
  const geography = geographyOf(opportunity as Opportunity);
  const motif: CoverMotif =
    geography === "national" ? "ridge" : geography === "international" ? "orbit" : "field";
  let hash = 0;
  for (let i = 0; i < opportunity.slug.length; i += 1) {
    hash = (hash * 31 + opportunity.slug.charCodeAt(i)) >>> 0;
  }
  const label = categoryLabel(opportunity.category as OpportunityCategory);
  return {
    ...palette,
    motif,
    initial: (label.trim().charAt(0) || "O").toUpperCase(),
    variant: hash % 3,
  };
}

function dots(seed: number, count: number): Array<{ x: number; y: number; r: number; o: number }> {
  const out: Array<{ x: number; y: number; r: number; o: number }> = [];
  let s = seed || 1;
  for (let i = 0; i < count; i += 1) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const a = s / 0x7fffffff;
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const b = s / 0x7fffffff;
    out.push({ x: 20 + a * 360, y: 15 + b * 195, r: 1.5 + b * 2.5, o: 0.15 + a * 0.3 });
  }
  return out;
}

export function OpportunityCover({
  opportunity,
  className,
}: {
  opportunity: Pick<Opportunity, "category" | "slug"> & Partial<Opportunity>;
  className?: string;
}) {
  const spec = coverSpecFor(opportunity);
  const seed = spec.variant * 7919 + 13;
  return (
    <svg
      viewBox="0 0 400 225"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      className={className ?? "h-full w-full"}
    >
      <rect width="400" height="225" fill={spec.base} />
      {spec.motif === "ridge" ? (
        <g opacity="0.5">
          <path
            d={`M0 ${150 + spec.variant * 8} L70 ${105 + spec.variant * 6} L140 ${140 + spec.variant * 4} L230 ${90 + spec.variant * 6} L320 ${135 + spec.variant * 4} L400 ${110 + spec.variant * 6} L400 225 L0 225 Z`}
            fill={spec.accent}
            opacity="0.22"
          />
          <rect y={168 + spec.variant * 5} width="400" height={57 - spec.variant * 5} fill={spec.accent} opacity="0.16" />
        </g>
      ) : null}
      {spec.motif === "orbit" ? (
        <g fill="none" stroke={spec.accent} opacity="0.4">
          <ellipse cx="320" cy="70" rx={60 + spec.variant * 14} ry={30 + spec.variant * 7} strokeWidth="1.5" />
          <ellipse cx="320" cy="70" rx={95 + spec.variant * 10} ry={48 + spec.variant * 6} strokeWidth="1" opacity="0.6" />
          <circle cx={320 + 40 + spec.variant * 8} cy={70 - 12} r="4" fill={spec.accent} stroke="none" opacity="0.9" />
        </g>
      ) : null}
      {spec.motif === "field" ? (
        <g stroke={spec.accent} opacity="0.28">
          {[0, 1, 2].map((i) => (
            <line
              key={i}
              x1={-20 + i * 24 + spec.variant * 8}
              y1="225"
              x2={120 + i * 24 + spec.variant * 8}
              y2="0"
              strokeWidth="1.5"
            />
          ))}
        </g>
      ) : null}
      {dots(seed, 22).map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="#FFFFFF" opacity={d.o * 0.7} />
      ))}
      <circle cx="74" cy="150" r="44" fill={spec.accent} opacity="0.92" />
      <text
        x="74"
        y="150"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="44"
        fontWeight="700"
        fill={spec.base}
        fontFamily="Georgia, 'Times New Roman', serif"
      >
        {spec.initial}
      </text>
    </svg>
  );
}
