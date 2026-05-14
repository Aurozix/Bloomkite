'use client'

// A bound CurrencyInput + Radix slider pair. The slider gives quick
// exploration; the text input gives precision. They're two views of the
// same `value`. Radix Slider handles the keyboard a11y (arrow keys, page
// up/down, home/end) and pointer drag; we paint it with brand tokens.
//
// Use for amount inputs with a meaningful bounded range (loan amount,
// target amount, current savings). For unbounded amounts (cash flow line
// items where any number is plausible), use CurrencyInput alone.

import * as Slider from '@radix-ui/react-slider'
import { CurrencyInput } from './CurrencyInput'
import { formatINRCompact } from '@/lib/format-currency'

interface CurrencySliderProps {
  value: number
  onChange: (next: number) => void
  min: number
  max: number
  step?: number
  /** Optional preset milestones to render as ticks below the slider. */
  ticks?: number[]
  label?: string
  ariaLabel?: string
  id?: string
}

export function CurrencySlider({
  value,
  onChange,
  min,
  max,
  step = 1000,
  ticks,
  label,
  ariaLabel,
  id,
}: CurrencySliderProps) {
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

      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1">
          <CurrencyInput
            id={id}
            value={value}
            onChange={(n) => onChange(typeof n === 'number' ? n : min)}
            min={min}
            max={max}
            ariaLabel={ariaLabel ?? label}
          />
        </div>
        <span className="text-xs text-ink-400 font-data tabular-nums whitespace-nowrap">
          {formatINRCompact(min)}–{formatINRCompact(max)}
        </span>
      </div>

      <Slider.Root
        value={[value]}
        onValueChange={(vals) => onChange(vals[0])}
        min={min}
        max={max}
        step={step}
        aria-label={ariaLabel ?? label}
        className="relative flex items-center select-none touch-none w-full h-5"
      >
        <Slider.Track className="bg-ink-100 relative grow rounded-full h-1.5">
          <Slider.Range className="absolute bg-forest-400 rounded-full h-full" />
        </Slider.Track>
        <Slider.Thumb
          className="block w-5 h-5 bg-paper border-2 border-forest-400 rounded-full shadow-bk-sm hover:shadow-bk-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-400/40 transition-shadow"
          aria-label={ariaLabel ?? label}
        />
      </Slider.Root>

      {ticks && ticks.length > 0 && (
        <div className="relative h-4 mt-2">
          {ticks.map((t) => {
            const pct = ((t - min) / (max - min)) * 100
            return (
              <button
                key={t}
                type="button"
                onClick={() => onChange(t)}
                className="absolute -translate-x-1/2 text-xs text-ink-400 hover:text-forest-500 font-data tabular-nums"
                style={{ left: `${pct}%` }}
              >
                {formatINRCompact(t)}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
