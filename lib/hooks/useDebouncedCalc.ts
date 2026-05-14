'use client'

// Debounced live recalculation hook for the calculator pages.
//
// Calculations in lib/calculators/ are pure functions over Decimal.js — cheap
// to call but not free. Live recalc on every slider tick would fire 60+/sec.
// This hook fires the calculator at most once per `delay` ms after inputs
// settle. Default 250ms feels instant without thrashing the main thread.
//
// Usage:
//   const result = useDebouncedCalc(
//     () => calculateEMI({ loanAmount, rate, tenure }),
//     [loanAmount, rate, tenure],
//   )
//
// `result` is null until the first calculation completes; check before
// rendering. Errors thrown by the calc are caught — the hook returns null
// for that tick (the previous result stays visible until inputs settle into
// a valid state).

import { useEffect, useRef, useState } from 'react'

export function useDebouncedCalc<T>(
  compute: () => T,
  deps: ReadonlyArray<unknown>,
  delay = 250
): T | null {
  const [result, setResult] = useState<T | null>(null)
  const computeRef = useRef(compute)
  computeRef.current = compute

  useEffect(() => {
    const handle = window.setTimeout(() => {
      try {
        setResult(computeRef.current())
      } catch {
        // Hold the previous result. Calculator pages should already validate
        // inputs at the boundary; this is the last-line guard.
      }
    }, delay)
    return () => window.clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delay])

  return result
}
