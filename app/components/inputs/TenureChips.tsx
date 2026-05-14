'use client'

// Tenure picker — preset chip group + a "custom" chip that reveals a
// numeric input. Covers ~95% of real-world tenures (5/10/15/20/25/30 years
// for loans + goal planning) without forcing the user to type. Custom
// remains for the long-tail.
//
// `value` is the tenure in the unit indicated by `unit` (defaults to years).

import { useState } from 'react'

interface TenureChipsProps {
  value: number
  onChange: (next: number) => void
  presets?: number[]
  unit?: 'years' | 'months'
  min?: number
  max?: number
  label?: string
  id?: string
}

const DEFAULT_PRESETS = [5, 10, 15, 20, 25, 30]

export function TenureChips({
  value,
  onChange,
  presets = DEFAULT_PRESETS,
  unit = 'years',
  min = 1,
  max = 50,
  label,
  id,
}: TenureChipsProps) {
  const isCustom = !presets.includes(value)
  const [showCustom, setShowCustom] = useState(isCustom)

  return (
    <div>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold uppercase tracking-[0.12em] text-ink-400 mb-2"
        >
          {label}
        </label>
      )}

      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {presets.map((preset) => {
          const active = !isCustom && preset === value
          return (
            <button
              key={preset}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => {
                setShowCustom(false)
                onChange(preset)
              }}
              className={`px-3 py-1.5 rounded-bk-md text-sm font-semibold font-data tabular-nums transition-colors ${
                active
                  ? 'bg-forest-400 text-paper'
                  : 'bg-paper border border-ink-200 text-ink-600 hover:border-forest-200 hover:bg-forest-50'
              }`}
            >
              {preset}
            </button>
          )
        })}
        <button
          type="button"
          role="radio"
          aria-checked={showCustom || isCustom}
          onClick={() => setShowCustom(true)}
          className={`px-3 py-1.5 rounded-bk-md text-sm font-semibold transition-colors ${
            showCustom || isCustom
              ? 'bg-forest-400 text-paper'
              : 'bg-paper border border-ink-200 text-ink-600 hover:border-forest-200 hover:bg-forest-50'
          }`}
        >
          Custom
        </button>
        <span className="self-center text-xs text-ink-400 ml-1">{unit}</span>
      </div>

      {showCustom && (
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value}
          onChange={(e) => {
            const n = Number(e.target.value)
            if (Number.isFinite(n)) onChange(Math.min(Math.max(n, min), max))
          }}
          className="mt-3 w-32 px-3 py-2 bg-paper border border-ink-200 rounded-bk-md font-data tabular-nums text-ink-900 focus:outline-none focus:border-forest-400 focus:ring-2 focus:ring-forest-400/20"
          aria-label={`Custom ${unit}`}
        />
      )}
    </div>
  )
}
