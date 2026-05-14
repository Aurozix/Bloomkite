// SEO + sitemap shared constants (BRD §13).
//
// Single source of truth for the canonical site URL — used by metadataBase
// in the root layout, by the sitemap generator, by robots.ts, and by every
// per-resource generateMetadata. Reads from NEXT_PUBLIC_APP_URL so the
// production deploy can override; falls back to a placeholder for local dev
// so the build never breaks on a fresh checkout.

const RAW = process.env.NEXT_PUBLIC_APP_URL?.trim() || 'https://bloomkite.app'

/// Canonical origin without trailing slash. e.g. "https://bloomkite.app".
export const SITE_URL = RAW.replace(/\/+$/, '')

export const SITE_NAME = 'Bloomkite'

export const SITE_DESCRIPTION =
  'A verified advisor marketplace for India and the NRI diaspora. Find an advisor on merit, not memory.'

/// Brand-default OG image. Static asset — same across all pages until we add
/// per-resource generated cards (Phase 3).
export const DEFAULT_OG_IMAGE = '/og-default.png'

/// Build a fully-qualified URL from a path (e.g. canonicalUrl('/advisors')).
export function canonicalUrl(path: string): string {
  if (!path.startsWith('/')) path = `/${path}`
  return `${SITE_URL}${path}`
}

/// Truncate a long body to a meta-description-friendly length without
/// breaking words. Used by article + forum-question page metadata.
export function truncateForMeta(text: string, max = 160): string {
  const stripped = text.replace(/\s+/g, ' ').trim()
  if (stripped.length <= max) return stripped
  const cut = stripped.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > max - 30 ? cut.slice(0, lastSpace) : cut) + '…'
}
