'use client'

// Hand-rolled SVG stacked horizontal bar.
//
// Used by Cash Flow to break down income or expense composition. Segments
// are drawn left-to-right with proportional widths; total = sum of values.
// Ratio of sub-segments matters more than absolute size — the bar always
// fills 100% of its width.
//
// Brand defaults for segment colors (no `color` provided): forest-700 →
// forest-400 → forest-200 → ink-200, cycling. Saffron is intentionally
// excluded from defaults (brand caps it at 4% of any screen).

import { useMemo } from 'react'
import { formatINR } from '@/lib/format-currency'

export interface BarSegment {
  label: string
  value: number
  color?: string
}

interface StackedBarProps {
  segments: BarSegment[]
  /** Pixel height of the bar itself. Legend lives below. */
  height?: number
  /** Hide the segment legend (caller renders its own). */
  hideLegend?: boolean
  /** Optional title shown above the bar. */
  title?: string
  className?: string
}

const DEFAULT_COLORS = [
  '#0B3D2E', // forest-700
  '#1D9E75', // forest-400
  '#9DD4BB', // forest-200
  '#0F6E56', // forest-500
  '#5CBFA0', // forest-300
  '#D3D1C7', // ink-200
]

export function StackedBar({
  segments,
  height = 32,
  hideLegend,
  title,
  className = '',
}: StackedBarProps) {
  const total = useMemo(
    () => segments.reduce((acc, s) => acc + Math.max(0, s.value), 0),
    [segments]
  )

  return (
    <div className={className}>
      {title && (
        <div className="flex items-baseline justify-between mb-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-400">
            {title}
          </p>
          <p className="font-data tabular-nums text-forest-700 font-medium">
            ₹{formatINR(total)}
          </p>
        </div>
      )}

      <div
        role="img"
        aria-label={`${title ?? 'Stacked bar'}: ${segments.map((s) => `${s.label} ${formatINR(s.value)}`).join(', ')}`}
        className="w-full overflow-hidden rounded-bk-md bg-ink-100"
        style={{ height }}
      >
        {total > 0 ? (
          <div className="flex h-full w-full">
            {segments.map((seg, i) => {
              const safe = Math.max(0, seg.value)
              const pct = (safe / total) * 100
              if (pct === 0) return null
              return (
                <div
                  key={`${seg.label}-${i}`}
                  className="h-full transition-[width] duration-[280ms] ease-out"
                  style={{
                    width: `${pct}%`,
                    backgroundColor:
                      seg.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length],
                  }}
                  title={`${seg.label}: ₹${formatINR(safe)} (${pct.toFixed(1)}%)`}
                />
              )
            })}
          </div>
        ) : null}
      </div>

      {!hideLegend && segments.length > 0 && (
        <ul className="mt-3 space-y-1.5 text-sm">
          {segments.map((seg, i) => {
            const safe = Math.max(0, seg.value)
            const pct = total === 0 ? 0 : (safe / total) * 100
            return (
              <li key={`${seg.label}-${i}`} className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="w-3 h-3 rounded-sm shrink-0"
                  style={{
                    backgroundColor:
                      seg.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length],
                  }}
                />
                <span className="text-ink-900 flex-1 truncate">{seg.label}</span>
                <span className="font-data tabular-nums text-ink-900">
                  ₹{formatINR(safe)}
                </span>
                <span className="font-data tabular-nums text-ink-400 w-14 text-right">
                  {pct.toFixed(1)}%
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
