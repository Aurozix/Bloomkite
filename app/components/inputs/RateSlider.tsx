'use client'

// Slider for percentage inputs (interest rate, growth rate, expected return,
// inflation). Bounded by min/max with a numeric readout in JetBrains Mono.
// Step defaults to 0.1 — matches how rates are typically quoted.

import * as Slider from '@radix-ui/react-slider'

interface RateSliderProps {
  value: number
  onChange: (next: number) => void
  min?: number
  max?: number
  step?: number
  label?: string
  ariaLabel?: string
  /** Suffix shown after the readout. Defaults to "%". */
  suffix?: string
  id?: string
}

export function RateSlider({
  value,
  onChange,
  min = 0,
  max = 30,
  step = 0.1,
  label,
  ariaLabel,
  suffix = '%',
  id,
}: RateSliderProps) {
  return (
    <div>
      {label && (
        <div className="flex items-center justify-between mb-2">
          <label
            htmlFor={id}
            className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-400"
          >
            {label}
          </label>
          <span className="font-data tabular-nums text-forest-700 font-medium">
            {value.toFixed(step < 1 ? 1 : 0)}
            {suffix}
          </span>
        </div>
      )}

      <Slider.Root
        id={id}
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

      <div className="flex justify-between mt-1 text-xs text-ink-400 font-data tabular-nums">
        <span>
          {min}
          {suffix}
        </span>
        <span>
          {max}
          {suffix}
        </span>
      </div>
    </div>
  )
}
