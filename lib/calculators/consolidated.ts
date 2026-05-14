import Decimal from 'decimal.js'

// Consolidated investment calculator. One equation, five variables; the caller
// fixes four and we solve for the fifth.
//
//   FV = PV · G^n + PMT · A · (G^n − (1+s)^n) / (G − (1+s))
//
// where
//   G  = (1 + r_m)^12 = 1 + r    (annual growth factor)
//   r_m = (1 + r)^(1/12) − 1     (effective monthly rate)
//   A  = ((1 + r_m)^12 − 1) / r_m = (G − 1) / r_m
//        (one year's monthly-SIP annuity grown to year-end)
//   s  = step-up rate, annual decimal (0 means flat SIP)
//   n  = tenure in years (can be fractional during bisection)
//
// Monthly compounding is the throughout model. With PMT=0, this collapses to
// PV·(1+r)^n — exact parity with the standalone Future Value calculator.
// With PV=0 and s=0, it collapses to the standard SIP annuity — exact parity
// with the standalone Target Value calculator.
//
// Closed form handles solving for FV / PMT / PV. Rate and tenure use
// bisection when PMT≠0 (no closed form), closed-form otherwise.
//
// Inflation is a *display* concern only — the target FV is always nominal.
// We surface a real-money equivalent (FV / (1+infl)^n) alongside.

export type SolveFor =
  | 'futureValue'
  | 'monthlyInvestment'
  | 'annualRate'
  | 'tenureYears'
  | 'presentValue'

export interface ConsolidatedInput {
  presentValue: number
  monthlyInvestment: number
  annualRate: number       // percent, annual nominal (monthly-compounded)
  tenureYears: number
  targetValue: number      // FV target
  stepUpPercent?: number   // annual SIP step-up, percent (default 0)
  inflationPercent?: number // annual inflation, percent (default 0)
  solveFor: SolveFor
}

export interface YearPoint {
  year: number
  contributions: number   // cumulative PV + sum of PMTs paid through year-end
  balance: number         // nominal balance at year-end
  real: number            // balance / (1+infl)^year
}

export interface SensitivityPoint {
  inputKey: 'presentValue' | 'monthlyInvestment' | 'annualRate' | 'tenureYears' | 'targetValue'
  label: string
  baseline: number
  low: number   // solved value when this input is −10%
  high: number  // solved value when this input is +10%
}

export interface ConsolidatedResult {
  solveFor: SolveFor
  /** The numeric value that was solved for. Unit depends on solveFor:
   *    futureValue / presentValue / monthlyInvestment → ₹
   *    annualRate → percent
   *    tenureYears → years
   */
  computed: number
  /** The complete set of resolved values, after substituting the computed one. */
  resolved: {
    presentValue: number
    monthlyInvestment: number
    annualRate: number
    tenureYears: number
    futureValue: number
  }
  totalContributions: number
  totalReturns: number
  realFutureValue: number
  effectiveMonthlyRate: number  // percent
  yearly: YearPoint[]
  sensitivity: SensitivityPoint[]
}

// Cap precision for stability; decimals.js defaults to 20.
Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP })

const ZERO = new Decimal(0)
const ONE = new Decimal(1)
const TWELVE = new Decimal(12)

// ---- Core formula -----------------------------------------------------------

interface FvArgs {
  pv: Decimal
  pmt: Decimal
  rAnnual: Decimal     // decimal, e.g. 0.10 for 10%
  years: Decimal
  stepUp: Decimal      // decimal
}

function annualGrowthFactor(rAnnual: Decimal): Decimal {
  return ONE.plus(rAnnual)
}

function monthlyRate(rAnnual: Decimal): Decimal {
  if (rAnnual.isZero()) return ZERO
  return ONE.plus(rAnnual).pow(ONE.dividedBy(TWELVE)).minus(ONE)
}

/** A = one year of monthly-SIP contributions grown to year-end at rm. */
function annuityFactor(rAnnual: Decimal): Decimal {
  if (rAnnual.isZero()) return TWELVE  // 12 monthly contributions, no growth
  const rm = monthlyRate(rAnnual)
  return annualGrowthFactor(rAnnual).minus(ONE).dividedBy(rm)
}

/** Closed-form FV for {PV, PMT, r, n, step-up}. */
function futureValueOf({ pv, pmt, rAnnual, years, stepUp }: FvArgs): Decimal {
  if (years.isZero() || years.isNegative()) return pv
  const G = annualGrowthFactor(rAnnual)
  const Gn = G.pow(years)

  const lumpsumComponent = pv.times(Gn)

  if (pmt.isZero()) return lumpsumComponent

  // SIP component
  const A = annuityFactor(rAnnual)
  const one_plus_s = ONE.plus(stepUp)
  const one_plus_s_n = one_plus_s.pow(years)

  let geomSum: Decimal
  if (G.minus(one_plus_s).abs().lessThan('1e-12')) {
    // G ≈ (1+s): degenerate case → n * G^(n-1)
    geomSum = years.times(G.pow(years.minus(ONE)))
  } else {
    geomSum = Gn.minus(one_plus_s_n).dividedBy(G.minus(one_plus_s))
  }

  const sipComponent = pmt.times(A).times(geomSum)
  return lumpsumComponent.plus(sipComponent)
}

/** Total nominal contributions through year `years` (PV + cumulative PMT). */
function contributionsOf({ pv, pmt, years, stepUp }: Omit<FvArgs, 'rAnnual'>): Decimal {
  if (years.isZero() || years.isNegative()) return pv
  if (pmt.isZero()) return pv

  const monthsPerYear = TWELVE
  if (stepUp.isZero()) {
    return pv.plus(pmt.times(monthsPerYear).times(years))
  }
  // sum_{k=0..n-1} 12·PMT·(1+s)^k = 12·PMT·((1+s)^n − 1)/s
  const one_plus_s = ONE.plus(stepUp)
  const series = one_plus_s.pow(years).minus(ONE).dividedBy(stepUp)
  return pv.plus(pmt.times(monthsPerYear).times(series))
}

// ---- Solvers ----------------------------------------------------------------

function solveForFV(args: FvArgs): Decimal {
  return futureValueOf(args)
}

function solveForPMT(args: FvArgs & { fv: Decimal }): Decimal {
  const { pv, rAnnual, years, stepUp, fv } = args
  if (years.isZero() || years.isNegative()) return ZERO

  const G = annualGrowthFactor(rAnnual)
  const Gn = G.pow(years)
  const remaining = fv.minus(pv.times(Gn))
  if (remaining.lessThanOrEqualTo(0)) return ZERO

  const A = annuityFactor(rAnnual)
  const one_plus_s = ONE.plus(stepUp)
  const one_plus_s_n = one_plus_s.pow(years)

  let geomSum: Decimal
  if (G.minus(one_plus_s).abs().lessThan('1e-12')) {
    geomSum = years.times(G.pow(years.minus(ONE)))
  } else {
    geomSum = Gn.minus(one_plus_s_n).dividedBy(G.minus(one_plus_s))
  }

  if (geomSum.isZero()) return ZERO
  return remaining.dividedBy(A.times(geomSum))
}

function solveForPV(args: FvArgs & { fv: Decimal }): Decimal {
  const { pmt, rAnnual, years, stepUp, fv } = args
  if (years.isZero() || years.isNegative()) return fv

  const G = annualGrowthFactor(rAnnual)
  const Gn = G.pow(years)

  if (pmt.isZero()) return fv.dividedBy(Gn)

  const A = annuityFactor(rAnnual)
  const one_plus_s = ONE.plus(stepUp)
  const one_plus_s_n = one_plus_s.pow(years)

  let geomSum: Decimal
  if (G.minus(one_plus_s).abs().lessThan('1e-12')) {
    geomSum = years.times(G.pow(years.minus(ONE)))
  } else {
    geomSum = Gn.minus(one_plus_s_n).dividedBy(G.minus(one_plus_s))
  }

  const sipComponent = pmt.times(A).times(geomSum)
  return fv.minus(sipComponent).dividedBy(Gn)
}

function solveForRate(args: Omit<FvArgs, 'rAnnual'> & { fv: Decimal }): Decimal {
  const { pv, pmt, years, stepUp, fv } = args

  // Closed-form when PMT=0: r = (FV/PV)^(1/n) − 1
  if (pmt.isZero() && pv.greaterThan(0) && years.greaterThan(0)) {
    return fv.dividedBy(pv).pow(ONE.dividedBy(years)).minus(ONE)
  }

  // Bisection over r ∈ [−0.5, 5.0] (decimal). FV is monotonically
  // increasing in r when PMT ≥ 0, so bisection is valid.
  let lo = new Decimal('-0.5')
  let hi = new Decimal('5.0')

  const fAt = (r: Decimal) =>
    futureValueOf({ pv, pmt, rAnnual: r, years, stepUp }).minus(fv)

  if (fAt(lo).greaterThan(0)) return lo  // even at −50% we overshoot → return floor
  if (fAt(hi).lessThan(0)) return hi      // even at 500% we undershoot → return ceiling

  for (let i = 0; i < 80; i++) {
    const mid = lo.plus(hi).dividedBy(2)
    const v = fAt(mid)
    if (v.abs().lessThan('1e-8')) return mid
    if (v.isNegative()) lo = mid
    else hi = mid
  }
  return lo.plus(hi).dividedBy(2)
}

function solveForTenure(args: Omit<FvArgs, 'years'> & { fv: Decimal }): Decimal {
  const { pv, pmt, rAnnual, stepUp, fv } = args

  // Closed-form when PMT=0: n = ln(FV/PV) / ln(1+r)
  if (pmt.isZero() && pv.greaterThan(0) && rAnnual.greaterThan(0)) {
    return fv.dividedBy(pv).ln().dividedBy(annualGrowthFactor(rAnnual).ln())
  }

  // Already there?
  if (pv.greaterThanOrEqualTo(fv)) return ZERO

  // Bisection over n ∈ [0, 100] years.
  let lo = new Decimal(0)
  let hi = new Decimal(100)

  const fAt = (n: Decimal) =>
    futureValueOf({ pv, pmt, rAnnual, years: n, stepUp }).minus(fv)

  if (fAt(hi).lessThan(0)) return hi  // unreachable within 100 years

  for (let i = 0; i < 80; i++) {
    const mid = lo.plus(hi).dividedBy(2)
    const v = fAt(mid)
    if (v.abs().lessThan('1e-6')) return mid
    if (v.isNegative()) lo = mid
    else hi = mid
  }
  return lo.plus(hi).dividedBy(2)
}

// ---- Public entry -----------------------------------------------------------

interface InnerResult {
  computed: Decimal
  resolved: { pv: Decimal; pmt: Decimal; rAnnual: Decimal; years: Decimal; fv: Decimal }
}

/** The core solve — no sensitivity or projection, just the unknown's value.
 *  Extracted so `computeSensitivity` can re-solve under perturbations without
 *  re-entering the sensitivity loop. */
function solveInner(input: ConsolidatedInput): InnerResult {
  const pv = new Decimal(input.presentValue || 0)
  const pmt = new Decimal(input.monthlyInvestment || 0)
  const rAnnual = new Decimal(input.annualRate || 0).dividedBy(100)
  const years = new Decimal(input.tenureYears || 0)
  const fv = new Decimal(input.targetValue || 0)
  const stepUp = new Decimal(input.stepUpPercent ?? 0).dividedBy(100)

  switch (input.solveFor) {
    case 'futureValue': {
      const out = solveForFV({ pv, pmt, rAnnual, years, stepUp })
      return { computed: out, resolved: { pv, pmt, rAnnual, years, fv: out } }
    }
    case 'monthlyInvestment': {
      const out = solveForPMT({ pv, pmt: ZERO, rAnnual, years, stepUp, fv })
      return { computed: out, resolved: { pv, pmt: out, rAnnual, years, fv } }
    }
    case 'presentValue': {
      const out = solveForPV({ pv: ZERO, pmt, rAnnual, years, stepUp, fv })
      return { computed: out, resolved: { pv: out, pmt, rAnnual, years, fv } }
    }
    case 'annualRate': {
      const out = solveForRate({ pv, pmt, years, stepUp, fv })
      return { computed: out.times(100), resolved: { pv, pmt, rAnnual: out, years, fv } }
    }
    case 'tenureYears': {
      const out = solveForTenure({ pv, pmt, rAnnual, stepUp, fv })
      return { computed: out, resolved: { pv, pmt, rAnnual, years: out, fv } }
    }
  }
}

export function solve(input: ConsolidatedInput): ConsolidatedResult {
  const stepUp = new Decimal(input.stepUpPercent ?? 0).dividedBy(100)
  const infl = new Decimal(input.inflationPercent ?? 0).dividedBy(100)

  const { computed, resolved } = solveInner(input)

  // Year-by-year projection using the resolved values.
  const totalYears = Math.max(0, Math.ceil(resolved.years.toNumber()))
  const yearly: YearPoint[] = []
  for (let k = 0; k <= totalYears; k++) {
    const kDec = new Decimal(k)
    const cappedK = kDec.greaterThan(resolved.years) ? resolved.years : kDec
    const bal = futureValueOf({
      pv: resolved.pv,
      pmt: resolved.pmt,
      rAnnual: resolved.rAnnual,
      years: cappedK,
      stepUp,
    })
    const cont = contributionsOf({
      pv: resolved.pv,
      pmt: resolved.pmt,
      years: cappedK,
      stepUp,
    })
    const real = infl.isZero()
      ? bal
      : bal.dividedBy(ONE.plus(infl).pow(cappedK))
    yearly.push({
      year: k,
      contributions: toNumber(cont),
      balance: toNumber(bal),
      real: toNumber(real),
    })
  }

  // Total contributions + returns at maturity
  const finalContributions = contributionsOf({
    pv: resolved.pv,
    pmt: resolved.pmt,
    years: resolved.years,
    stepUp,
  })
  const finalReturns = resolved.fv.minus(finalContributions)
  const realFV = infl.isZero()
    ? resolved.fv
    : resolved.fv.dividedBy(ONE.plus(infl).pow(resolved.years))

  // Sensitivity: ±10% on each input that wasn't solved for. Re-solve and
  // report the delta in the computed value (so the chart always answers "how
  // brittle is the unknown?").
  const sensitivity = computeSensitivity(input, toNumber(computed))

  return {
    solveFor: input.solveFor,
    computed: toNumber(computed),
    resolved: {
      presentValue: toNumber(resolved.pv),
      monthlyInvestment: toNumber(resolved.pmt),
      annualRate: toNumber(resolved.rAnnual.times(100)),
      tenureYears: toNumber(resolved.years),
      futureValue: toNumber(resolved.fv),
    },
    totalContributions: toNumber(finalContributions),
    totalReturns: toNumber(finalReturns),
    realFutureValue: toNumber(realFV),
    effectiveMonthlyRate: toNumber(monthlyRate(resolved.rAnnual).times(100)),
    yearly,
    sensitivity,
  }
}

const SENSITIVITY_KEYS: Array<{
  key: 'presentValue' | 'monthlyInvestment' | 'annualRate' | 'tenureYears' | 'targetValue'
  label: string
}> = [
  { key: 'presentValue', label: 'Lumpsum (PV)' },
  { key: 'monthlyInvestment', label: 'Monthly SIP' },
  { key: 'annualRate', label: 'Annual rate' },
  { key: 'tenureYears', label: 'Tenure' },
  { key: 'targetValue', label: 'Target' },
]

function computeSensitivity(input: ConsolidatedInput, baseline: number): SensitivityPoint[] {
  // Don't perturb the variable being solved for, and don't bother showing a
  // bar for an input the user left at zero — perturbation of 0 is still 0.
  const solveKey = solveForToInputKey(input.solveFor)
  return SENSITIVITY_KEYS.filter((sk) => sk.key !== solveKey)
    .map(({ key, label }) => {
      const base = (input as any)[inputKey(key)] as number
      if (!base) return null
      const lowInner = solveInner({ ...input, [inputKey(key)]: base * 0.9 })
      const highInner = solveInner({ ...input, [inputKey(key)]: base * 1.1 })
      return {
        inputKey: key,
        label,
        baseline,
        low: toNumber(lowInner.computed),
        high: toNumber(highInner.computed),
      }
    })
    .filter((p): p is SensitivityPoint => p !== null)
}

function solveForToInputKey(s: SolveFor): SensitivityPoint['inputKey'] {
  switch (s) {
    case 'futureValue': return 'targetValue'
    case 'monthlyInvestment': return 'monthlyInvestment'
    case 'presentValue': return 'presentValue'
    case 'annualRate': return 'annualRate'
    case 'tenureYears': return 'tenureYears'
  }
}

function inputKey(k: SensitivityPoint['inputKey']): keyof ConsolidatedInput {
  switch (k) {
    case 'presentValue': return 'presentValue'
    case 'monthlyInvestment': return 'monthlyInvestment'
    case 'annualRate': return 'annualRate'
    case 'tenureYears': return 'tenureYears'
    case 'targetValue': return 'targetValue'
  }
}

function toNumber(d: Decimal): number {
  if (d.isNaN() || !d.isFinite()) return 0
  return Number(d.toFixed(6))
}
