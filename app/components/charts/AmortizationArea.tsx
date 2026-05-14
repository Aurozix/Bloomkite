'use client'

// Stacked area chart of an amortization schedule, grouped by year.
//
// The EMI calculator and friends emit a month-by-month schedule. A 240-month
// schedule plotted at month resolution is hostile to a 600px-wide chart, so
// we roll up to year level: principal vs. interest paid each year. The user
// can see at a glance how the principal share grows across the loan life.
//
// Recharts is used here (vs. hand-rolled SVG) because tooltips, axes, and the
// area gradients add up. The only Recharts-imported chart in the app — keep
// this the only place that touches the dependency.
//
// Brand: forest-700 for principal (the part that actually goes against the
// loan) and forest-200 for interest (the cost). Saffron is reserved for
// milestone moments, not a recurring chart series.

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { formatINR, formatINRCompact } from '@/lib/format-currency'

export interface AmortizationMonthRow {
  monthNumber: number
  date: string
  interest: string
  principal: string
}

interface AmortizationAreaProps {
  rows: AmortizationMonthRow[]
  height?: number
  className?: string
}

interface YearlyPoint {
  year: string
  principal: number
  interest: number
}

const FOREST_700 = '#0B3D2E'
const FOREST_200 = '#9DD4BB'

export function AmortizationArea({ rows, height = 280, className = '' }: AmortizationAreaProps) {
  const yearly = rollUpByYear(rows)

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-400">
          Principal vs interest paid (per year)
        </p>
        <div className="flex items-center gap-4 text-xs text-ink-600">
          <span className="inline-flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm" style={{ background: FOREST_700 }} />
            Principal
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm" style={{ background: FOREST_200 }} />
            Interest
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={yearly} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="principalGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={FOREST_700} stopOpacity={0.7} />
              <stop offset="100%" stopColor={FOREST_700} stopOpacity={0.2} />
            </linearGradient>
            <linearGradient id="interestGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={FOREST_200} stopOpacity={0.7} />
              <stop offset="100%" stopColor={FOREST_200} stopOpacity={0.2} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8E5DC" vertical={false} />
          <XAxis
            dataKey="year"
            stroke="#7A786E"
            tick={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}
            tickLine={false}
          />
          <YAxis
            stroke="#7A786E"
            tick={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}
            tickLine={false}
            tickFormatter={(v) => formatINRCompact(v)}
            width={60}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FAF8F0',
              border: '1px solid #D3D1C7',
              borderRadius: 8,
              fontFamily: 'Inter, sans-serif',
            }}
            labelStyle={{ color: '#1A1A18', fontWeight: 600 }}
            formatter={(value, name) => [
              `₹${formatINR(typeof value === 'number' ? value : Number(value) || 0)}`,
              name === 'principal' ? 'Principal' : 'Interest',
            ]}
            labelFormatter={(label) => `Year ${label}`}
          />
          <Area
            type="monotone"
            dataKey="principal"
            stackId="1"
            stroke={FOREST_700}
            strokeWidth={2}
            fill="url(#principalGrad)"
          />
          <Area
            type="monotone"
            dataKey="interest"
            stackId="1"
            stroke={FOREST_200}
            strokeWidth={2}
            fill="url(#interestGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function rollUpByYear(rows: AmortizationMonthRow[]): YearlyPoint[] {
  const buckets = new Map<string, YearlyPoint>()
  rows.forEach((row) => {
    const year = extractYear(row.date) ?? `M${row.monthNumber}`
    const cur = buckets.get(year) ?? { year, principal: 0, interest: 0 }
    cur.principal += parseFloat(row.principal) || 0
    cur.interest += parseFloat(row.interest) || 0
    buckets.set(year, cur)
  })
  return Array.from(buckets.values())
}

function extractYear(date: string): string | null {
  // dates come in as MMM-yyyy (e.g., "Jan-2024"); fall back to whatever
  // looks like a 4-digit year anywhere in the string.
  const match = date.match(/(\d{4})/)
  return match ? match[1] : null
}
