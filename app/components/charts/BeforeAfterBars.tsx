'use client'

// Hand-rolled SVG before/after bars.
//
// Used by Partial Payment / EMI Change / Rate Change to visualize what
// changed when the user applies a what-if scenario. Each metric (e.g.,
// "Tenure", "Total interest") gets two horizontal bars stacked vertically:
// the original value (ink-200, neutral) and the revised value (forest-400,
// "this is the new state"). The shorter bar wins.
//
// Saving / reduction is implied by the difference, but the caller can pass
// a `delta` string to render alongside the new bar (e.g., "−₹8,00,000",
// "−2y 3m"). Saffron is used here intentionally for the delta highlight —
// this is the "milestone moment" the brand reserves saffron for, and the
// delta is a single small accent (well under 4% of screen).

import { formatINRCompact } from '@/lib/format-currency'

export interface BeforeAfterMetric {
  label: string
  /** Numeric value in some unit (months, rupees, percent). Used for bar scaling. */
  before: number
  after: number
  /** How to render the value next to its bar. Defaults to compact INR. */
  format?: (n: number) => string
  /** Override the highlight: `improvement` (smaller-is-better) or `regression`. Default infers from sign. */
  betterDirection?: 'lower' | 'higher'
}

interface BeforeAfterBarsProps {
  metrics: BeforeAfterMetric[]
  className?: string
}

const NEUTRAL = '#D3D1C7' // ink-200
const IMPROVED = '#1D9E75' // forest-400
const REGRESSED = '#A32D2D' // danger
const ACCENT = '#D4A437' // saffron-400, for the delta tag only

export function BeforeAfterBars({ metrics, className = '' }: BeforeAfterBarsProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {metrics.map((m, i) => {
        const fmt = m.format ?? formatINRCompact
        const max = Math.max(Math.abs(m.before), Math.abs(m.after), 1)
        const beforePct = (Math.abs(m.before) / max) * 100
        const afterPct = (Math.abs(m.after) / max) * 100
        const delta = m.after - m.before
        const direction = m.betterDirection ?? 'lower'
        const better =
          direction === 'lower' ? delta < 0 : delta > 0
        const afterColor = delta === 0 ? NEUTRAL : better ? IMPROVED : REGRESSED

        return (
          <div key={`${m.label}-${i}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-400 mb-3">
              {m.label}
            </p>

            {/* BEFORE */}
            <div className="flex items-center gap-3 mb-2">
              <span className="w-16 shrink-0 text-xs text-ink-400">Before</span>
              <div className="flex-1 h-5 bg-ink-100 rounded-bk-sm overflow-hidden">
                <div
                  className="h-full transition-[width] duration-[280ms] ease-out"
                  style={{ width: `${beforePct}%`, backgroundColor: NEUTRAL }}
                />
              </div>
              <span className="font-data tabular-nums text-ink-600 w-24 text-right">
                {fmt(m.before)}
              </span>
            </div>

            {/* AFTER */}
            <div className="flex items-center gap-3">
              <span className="w-16 shrink-0 text-xs text-ink-900 font-semibold">After</span>
              <div className="flex-1 h-5 bg-ink-100 rounded-bk-sm overflow-hidden">
                <div
                  className="h-full transition-[width,background-color] duration-[280ms] ease-out"
                  style={{ width: `${afterPct}%`, backgroundColor: afterColor }}
                />
              </div>
              <span
                className="font-data tabular-nums w-24 text-right font-semibold"
                style={{ color: afterColor === NEUTRAL ? '#1A1A18' : afterColor }}
              >
                {fmt(m.after)}
              </span>
            </div>

            {/* DELTA TAG */}
            {delta !== 0 && (
              <div className="flex justify-end mt-2">
                <span
                  className="inline-flex items-center gap-1 text-xs font-data tabular-nums px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: better ? '#FDF6E3' : '#FCEBEB',
                    color: better ? ACCENT : REGRESSED,
                  }}
                >
                  {delta > 0 ? '+' : ''}
                  {fmt(delta)}
                </span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
