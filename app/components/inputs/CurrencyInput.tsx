'use client'

// Brand-painted INR-formatted number input.
//
// Renders a static ₹ prefix and a text input that displays the value with
// Indian-locale grouping (formatINR) when the field is NOT focused. While the
// user is typing we show their raw input so cursor position doesn't jump on
// every keystroke; we re-format on blur. Parses through parseINR.
//
// `value` is a number (or null when empty). `onChange` fires with the parsed
// number, or null if the field is empty / unparseable.

import { useEffect, useState } from 'react'
import { formatINR, parseINR } from '@/lib/format-currency'

interface CurrencyInputProps {
  value: number | null
  onChange: (next: number | null) => void
  min?: number
  max?: number
  placeholder?: string
  ariaLabel?: string
  className?: string
  id?: string
}

export function CurrencyInput({
  value,
  onChange,
  min,
  max,
  placeholder,
  ariaLabel,
  className = '',
  id,
}: CurrencyInputProps) {
  const [text, setText] = useState<string>(value == null ? '' : formatINR(value))
  const [focused, setFocused] = useState(false)

  // When the parent updates `value` (e.g., a paired slider moved), reflect it.
  // Don't fight the user mid-type: only sync when not focused.
  useEffect(() => {
    if (focused) return
    setText(value == null ? '' : formatINR(value))
  }, [value, focused])

  return (
    <div
      className={`flex items-center bg-paper rounded-bk-md border border-ink-200 focus-within:border-forest-400 focus-within:ring-2 focus-within:ring-forest-400/20 transition-colors ${className}`}
    >
      <span className="pl-3 pr-2 text-ink-400 select-none font-data" aria-hidden="true">
        ₹
      </span>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        aria-label={ariaLabel}
        placeholder={placeholder}
        value={text}
        onFocus={(e) => {
          setFocused(true)
          // On focus, drop the formatting so the user can edit cleanly.
          if (value != null) setText(String(value))
          // Defer caret-to-end until after the value swap renders.
          requestAnimationFrame(() => {
            const el = e.target
            const len = el.value.length
            try {
              el.setSelectionRange(len, len)
            } catch {
              /* ignore */
            }
          })
        }}
        onBlur={() => {
          setFocused(false)
          const parsed = parseINR(text)
          if (Number.isFinite(parsed)) {
            const clamped = clamp(parsed, min, max)
            setText(formatINR(clamped))
            if (clamped !== value) onChange(clamped)
          } else {
            setText(value == null ? '' : formatINR(value))
            if (text === '' && value != null) onChange(null)
          }
        }}
        onChange={(e) => {
          const raw = e.target.value
          setText(raw)
          // Push partial parses upstream so live recalc keeps up with typing.
          // The blur handler does the final clamp + reformat.
          const parsed = parseINR(raw)
          if (Number.isFinite(parsed)) onChange(clamp(parsed, min, max))
          else if (raw === '') onChange(null)
        }}
        className="flex-1 py-2.5 pr-3 bg-transparent outline-none font-data text-ink-900 placeholder:text-ink-400"
      />
    </div>
  )
}

function clamp(n: number, min?: number, max?: number): number {
  if (typeof min === 'number' && n < min) return min
  if (typeof max === 'number' && n > max) return max
  return n
}
