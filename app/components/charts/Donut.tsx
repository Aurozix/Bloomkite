'use client'

// Hand-rolled SVG donut. No chart library, no canvas — pure SVG arcs painted
// with brand tokens directly. Used by Risk Profiler (allocation) and any
// other surface that wants a 2-4 segment percentage breakdown.
//
// Why hand-rolled and not Recharts: a 3-segment donut is ~30 lines of SVG
// once the arc-path math is in place. Adding a 30KB library to draw three
// arcs is the wrong trade. Recharts comes in for time-series.
//
// Inputs are an array of `{ label, value, color }` segments. Values can be
// percentages (sum to 100) or raw counts (we normalize). Order matters —
// segments are drawn clockwise from 12 o'clock.
//
// Brand: pass colors via the `color` field. Defaults if omitted: forest-700,
// forest-400, forest-200, ink-200 (in segment order). Saffron is intentionally
// not in the default palette — the brand caps it at 4% of any screen and a
// donut segment is always more than that.

import { useMemo } from 'react'

export interface DonutSegment {
  label: string
  value: number
  color?: string
}

interface DonutProps {
  segments: DonutSegment[]
  /** Render size in px. The donut is square; legend lives below. */
  size?: number
  /** Stroke width as a fraction of the radius. 0.35 = ~donut feel. */
  thickness?: number
  /** Optional centered label inside the donut hole (e.g., risk category). */
  centerLabel?: string
  /** Optional smaller line under centerLabel (e.g., "Risk score: 28"). */
  centerSubLabel?: string
  /** Hide the legend; for compact uses where the parent renders its own. */
  hideLegend?: boolean
  className?: string
}

const DEFAULT_COLORS = [
  '#0B3D2E', // forest-700
  '#1D9E75', // forest-400
  '#9DD4BB', // forest-200
  '#D3D1C7', // ink-200 (catch-all overflow)
]

export function Donut({
  segments,
  size = 240,
  thickness = 0.35,
  centerLabel,
  centerSubLabel,
  hideLegend,
  className = '',
}: DonutProps) {
  const total = useMemo(
    () => segments.reduce((acc, s) => acc + Math.max(0, s.value), 0),
    [segments]
  )

  // Geometry. Radius is half the size minus a hair so the stroke doesn't
  // clip at the edges. The strokeWidth IS the donut's thickness.
  const radius = size / 2 - 6
  const strokeWidth = radius * thickness
  const innerRadius = radius - strokeWidth / 2
  const circumference = 2 * Math.PI * innerRadius

  // Each segment is a circle with the same radius, dashed so only its slice
  // shows, then rotated. This is the textbook SVG donut trick — much cleaner
  // than computing arc paths by hand and avoids the circular-arc-degenerate
  // case (a single 100% segment).
  let cumulativeOffset = 0
  const arcs = segments.map((seg, i) => {
    const safeValue = Math.max(0, seg.value)
    const fraction = total === 0 ? 0 : safeValue / total
    const dashLen = fraction * circumference
    const dashGap = circumference - dashLen
    const rotation = (cumulativeOffset / circumference) * 360 - 90 // -90 starts at 12 o'clock
    cumulativeOffset += dashLen
    return {
      key: `${seg.label}-${i}`,
      stroke: seg.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length],
      strokeDasharray: `${dashLen} ${dashGap}`,
      transform: `rotate(${rotation} ${size / 2} ${size / 2})`,
    }
  })

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          viewBox={`0 0 ${size} ${size}`}
          width={size}
          height={size}
          role="img"
          aria-label={`Donut chart: ${segments.map((s) => `${s.label} ${pct(s.value, total)}%`).join(', ')}`}
        >
          {/* Background ring — gives the donut a neutral track when total is
              zero (e.g., during initial render). */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={innerRadius}
            fill="none"
            stroke="#F1EFE8"
            strokeWidth={strokeWidth}
          />
          {arcs.map((arc) => (
            <circle
              key={arc.key}
              cx={size / 2}
              cy={size / 2}
              r={innerRadius}
              fill="none"
              stroke={arc.stroke}
              strokeWidth={strokeWidth}
              strokeDasharray={arc.strokeDasharray}
              transform={arc.transform}
              style={{
                transition: 'stroke-dasharray 280ms cubic-bezier(0.2, 0.8, 0.2, 1)',
              }}
            />
          ))}
        </svg>

        {(centerLabel || centerSubLabel) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            {centerLabel && (
              <p className="font-serif font-medium text-forest-700 text-xl leading-tight">
                {centerLabel}
              </p>
            )}
            {centerSubLabel && (
              <p className="font-data tabular-nums text-ink-400 text-xs mt-1">
                {centerSubLabel}
              </p>
            )}
          </div>
        )}
      </div>

      {!hideLegend && (
        <ul className="mt-6 grid gap-2 w-full" style={{ maxWidth: size + 60 }}>
          {segments.map((seg, i) => (
            <li key={`${seg.label}-${i}`} className="flex items-center gap-3 text-sm">
              <span
                aria-hidden="true"
                className="w-3 h-3 rounded-sm shrink-0"
                style={{
                  backgroundColor: seg.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length],
                }}
              />
              <span className="text-ink-900 flex-1">{seg.label}</span>
              <span className="font-data tabular-nums text-ink-900 font-medium">
                {pct(seg.value, total)}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function pct(value: number, total: number): number {
  if (total === 0) return 0
  return Math.round((Math.max(0, value) / total) * 100)
}
