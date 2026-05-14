import { type ReactNode } from 'react'

// PageHeader — the canonical eyebrow + title + subtitle block.
// See docs/layout/standard.md §7. Defaults render an h1 at the brand H1 scale
// (text-4xl md:text-5xl) in Fraunces, forest-700 on light surfaces.
//
// level="h2" is for section headers inside multi-section pages (e.g. the home
// page's features / pricing sections). Visual treatment is identical to h1 —
// only the element changes — so the same component covers both.
//
// surface="forest" swaps colors for Forest substrates (paper title, saffron
// eyebrow, forest-200 subtitle).
//
// align="center" centers the block and constrains the subtitle to a centered
// reading column; default left-aligns for functional pages.

type Level = 'h1' | 'h2'
type Surface = 'light' | 'forest'
type Align = 'left' | 'center'

interface PageHeaderProps {
  eyebrow?: string
  title: ReactNode
  subtitle?: ReactNode
  level?: Level
  surface?: Surface
  align?: Align
  className?: string
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  level = 'h1',
  surface = 'light',
  align = 'left',
  className = '',
}: PageHeaderProps) {
  const titleColor = surface === 'forest' ? 'text-paper' : 'text-forest-700'
  const eyebrowColor = surface === 'forest' ? 'text-saffron-300' : 'text-ink-400'
  const subtitleColor = surface === 'forest' ? 'text-forest-200' : 'text-ink-600'
  const alignClass = align === 'center' ? 'text-center' : ''
  const subtitleAlign =
    align === 'center' ? 'max-w-2xl mx-auto' : 'max-w-2xl'

  const titleClass = `font-serif text-4xl md:text-5xl font-medium ${titleColor} leading-tight tracking-tight`
  const titleNode =
    level === 'h2' ? (
      <h2 className={titleClass}>{title}</h2>
    ) : (
      <h1 className={titleClass}>{title}</h1>
    )

  return (
    <header className={`mb-16 ${alignClass} ${className}`}>
      {eyebrow && (
        <p
          className={`text-xs font-semibold uppercase tracking-[0.18em] ${eyebrowColor} mb-3`}
        >
          {eyebrow}
        </p>
      )}
      {titleNode}
      {subtitle && (
        <p className={`${subtitleColor} ${subtitleAlign} mt-3`}>{subtitle}</p>
      )}
    </header>
  )
}
