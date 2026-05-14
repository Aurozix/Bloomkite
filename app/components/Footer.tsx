// Site-wide footer. Surfaces the §11 compliance pages (Terms, Privacy,
// Support) so they're reachable from every screen — required by BRD §12.5
// pre-launch checklist (grievance contact mechanism must be visible) and
// by general consumer-protection norms.

import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-ink-200 bg-paper py-8 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="text-xs text-ink-500">
            © {new Date().getFullYear()} Bloomkite. Educational platform — not personalised
            financial advice.
          </p>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-ink-600">
            <Link href="/terms" className="hover:text-forest-700">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-forest-700">
              Privacy
            </Link>
            <Link href="/support" className="hover:text-forest-700">
              Support / Grievance
            </Link>
            <Link href="/settings" className="hover:text-forest-700">
              Settings
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
