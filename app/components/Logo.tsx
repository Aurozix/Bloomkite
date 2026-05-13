// Bloomkite Logo v1.0 — see docs/branding/logo-system.md
//
// The mark: a 3×3 grid of advisor nodes; eight outlined, one center cell
// filled in Verified Green, with a saffron point extending to the right edge.
// "Of all the advisors on the platform, here is the one verified for you."
//
// `variant` controls the rendering:
//   - 'full'    → outlined nodes on Paper background, Verified center, Saffron point
//   - 'reverse' → outlined nodes on Forest dark surfaces, Verified center, Saffron point
//   - 'mono'    → single-color (color follows currentColor); for print/legal
//
// `size` is the rendered pixel size of the square mark (the wordmark is
// excluded from this size). At ≤24px the surrounding eight nodes lose
// definition; at ≤16px the saffron accent is omitted per the logo system.
//
// `withWordmark` adds the Fraunces wordmark to the right; min mark size 24px.

import React from 'react'

export type LogoVariant = 'full' | 'reverse' | 'mono'

interface LogoProps {
  size?: number
  variant?: LogoVariant
  withWordmark?: boolean
  className?: string
  ariaLabel?: string
}

const FOREST = '#0B3D2E'
const VERIFIED = '#1D9E75'
const SAFFRON = '#D4A437'
const PAPER = '#FAFAF7'

export function Logo({
  size = 40,
  variant = 'full',
  withWordmark = false,
  className = '',
  ariaLabel = 'Bloomkite',
}: LogoProps) {
  // Colour resolution based on variant.
  const strokeOutline =
    variant === 'reverse' ? PAPER : variant === 'mono' ? 'currentColor' : FOREST
  const fillCenter =
    variant === 'mono' ? 'currentColor' : VERIFIED
  const accentColor =
    variant === 'mono' ? 'currentColor' : SAFFRON
  const outlineOpacity = variant === 'reverse' ? 0.45 : 0.4

  // Hide saffron accent at very small sizes (per logo-system §4 sizing audit).
  const showAccent = size >= 18
  // Bump stroke width up at small sizes so outlines stay legible.
  const stroke = size <= 20 ? 5 : size <= 32 ? 3 : size <= 64 ? 2.5 : 2

  const mark = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={withWordmark ? undefined : ariaLabel}
      aria-hidden={withWordmark ? true : undefined}
    >
      {/* Row 1 */}
      <rect x="4"  y="4"  width="20" height="20" rx="3.5" stroke={strokeOutline} strokeWidth={stroke} fill="none" opacity={outlineOpacity} />
      <rect x="30" y="4"  width="20" height="20" rx="3.5" stroke={strokeOutline} strokeWidth={stroke} fill="none" opacity={outlineOpacity} />
      <rect x="56" y="4"  width="20" height="20" rx="3.5" stroke={strokeOutline} strokeWidth={stroke} fill="none" opacity={outlineOpacity} />
      {/* Row 2 — center cell is the verified node */}
      <rect x="4"  y="30" width="20" height="20" rx="3.5" stroke={strokeOutline} strokeWidth={stroke} fill="none" opacity={outlineOpacity} />
      <rect x="30" y="30" width="20" height="20" rx="3.5" fill={fillCenter} />
      <rect x="56" y="30" width="20" height="20" rx="3.5" stroke={strokeOutline} strokeWidth={stroke} fill="none" opacity={outlineOpacity} />
      {/* Row 3 */}
      <rect x="4"  y="56" width="20" height="20" rx="3.5" stroke={strokeOutline} strokeWidth={stroke} fill="none" opacity={outlineOpacity} />
      <rect x="30" y="56" width="20" height="20" rx="3.5" stroke={strokeOutline} strokeWidth={stroke} fill="none" opacity={outlineOpacity} />
      <rect x="56" y="56" width="20" height="20" rx="3.5" stroke={strokeOutline} strokeWidth={stroke} fill="none" opacity={outlineOpacity} />
      {/* Saffron point — the "match", extending from verified node */}
      {showAccent && (
        <>
          <line x1="50" y1="40" x2="68" y2="40" stroke={accentColor} strokeWidth={stroke} strokeLinecap="round" />
          <circle cx="72" cy="40" r={Math.max(stroke + 1, 4)} fill={accentColor} />
        </>
      )}
    </svg>
  )

  if (!withWordmark) {
    return <span className={`inline-flex ${className}`}>{mark}</span>
  }

  // Wordmark Fraunces 500. Color matches variant.
  const wordmarkColor =
    variant === 'reverse'
      ? PAPER
      : variant === 'mono'
      ? 'currentColor'
      : FOREST

  // The wordmark size is ~80% of the mark size (matches the brand file ratio).
  const wordmarkFontSize = Math.round(size * 0.8)

  return (
    <span
      className={`inline-flex items-center gap-2 ${className}`}
      role="img"
      aria-label={ariaLabel}
    >
      {mark}
      <span
        className="font-serif font-medium"
        style={{
          color: wordmarkColor,
          fontSize: `${wordmarkFontSize}px`,
          lineHeight: 1,
          letterSpacing: '-0.015em',
          fontVariationSettings: '"opsz" 144',
        }}
      >
        Bloomkite
      </span>
    </span>
  )
}
