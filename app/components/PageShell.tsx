import { type ReactNode } from 'react'

// PageShell — the canonical content container for every customer-facing page.
// See docs/layout/standard.md §3 (width buckets), §4 (vertical rhythm), §7
// (page shell). The bucket prop maps to a brand-approved max-width; the surface
// prop maps to a brand-approved vertical section padding. Together they
// guarantee every page lands inside the standard.
//
// Banned widths (max-w-2xl, max-w-4xl, max-w-6xl as outer containers) are
// unreachable through this component by construction.

type Bucket = 'form' | 'reading' | 'detail' | 'index'
type Surface = 'marketing' | 'functional' | 'list'

const BUCKET_WIDTH: Record<Bucket, string> = {
  form: 'max-w-md',
  reading: 'max-w-3xl',
  detail: 'max-w-5xl',
  index: 'max-w-7xl',
}

const SURFACE_PADDING: Record<Surface, string> = {
  marketing: 'py-24',
  functional: 'py-16',
  list: 'py-12',
}

interface PageShellProps {
  bucket: Bucket
  surface: Surface
  className?: string
  children: ReactNode
}

export function PageShell({
  bucket,
  surface,
  className = '',
  children,
}: PageShellProps) {
  return (
    <div
      className={`${BUCKET_WIDTH[bucket]} mx-auto px-4 sm:px-6 lg:px-8 ${SURFACE_PADDING[surface]} ${className}`}
    >
      {children}
    </div>
  )
}
