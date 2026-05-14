'use client'

// Pill-group toggle for binary or small-cardinality choices.
//
// Replaces dropdowns where there are 2-4 stable options that benefit from
// being visible at all times: tenure type (Year / Month), income stability
// (Stable / Fluctuating), predictability (Predictable / Unpredictable). One
// tap, no menu, touch-friendly.
//
// Generic over the option string type so callers stay type-safe with their
// own enums.

import * as ToggleGroup from '@radix-ui/react-toggle-group'

interface TogglePillsProps<T extends string> {
  value: T
  onChange: (next: T) => void
  options: ReadonlyArray<{ value: T; label: string; hint?: string }>
  label?: string
  id?: string
}

export function TogglePills<T extends string>({
  value,
  onChange,
  options,
  label,
  id,
}: TogglePillsProps<T>) {
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

      <ToggleGroup.Root
        id={id}
        type="single"
        value={value}
        onValueChange={(v) => {
          // Radix sends '' if the user clicks the active item; ignore that
          // and keep the current value selected (toggles are required, not
          // optional).
          if (v) onChange(v as T)
        }}
        aria-label={label}
        className="inline-flex bg-ink-100 rounded-bk-md p-1 gap-1"
      >
        {options.map((opt) => (
          <ToggleGroup.Item
            key={opt.value}
            value={opt.value}
            title={opt.hint}
            className="px-3 py-1.5 rounded-[6px] text-sm font-semibold transition-colors text-ink-600 hover:text-ink-900 data-[state=on]:bg-paper data-[state=on]:text-forest-700 data-[state=on]:shadow-bk-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-400/40"
          >
            {opt.label}
          </ToggleGroup.Item>
        ))}
      </ToggleGroup.Root>
    </div>
  )
}
