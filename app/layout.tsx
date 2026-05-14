import type { Metadata } from 'next'
import { Fraunces, Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { ToastProvider } from './components/toast-context'
import { ToastContainer } from './components/toast-container'
import { ColorSchemeProvider } from './components/color-scheme-context'
import { Navbar } from './components/Navbar'
import { Footer } from './components/Footer'
import { CookieConsent } from './components/CookieConsent'
import { Providers } from './providers'
import { AuthModal } from './components/AuthModal'

// Bloomkite Brand v1.0 typography — see docs/branding/brand.md §6.
// Fraunces handles display/editorial, Inter handles body/UI, JetBrains Mono
// handles tabular financial data. Each is exposed as a CSS variable so the
// Tailwind config and globals.css can opt in via `var(--font-*)` chains.
const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-fraunces',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains',
  display: 'swap',
})

// SEO defaults (BRD §13). Per-route metadata extends these via per-section
// or per-resource layouts; metadataBase makes relative og:image paths
// resolve against the canonical origin without each page repeating it.
import { DEFAULT_OG_IMAGE, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/seo'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Verified financial advisors`,
    // Per-page metadata sets `title: 'Foo'` and the template renders
    // "Foo · Bloomkite" automatically. Pages can opt out by setting
    // `title: { absolute: '...' }`.
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Verified financial advisors`,
    description: SITE_DESCRIPTION,
    locale: 'en_IN',
    url: SITE_URL,
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Verified financial advisors`,
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  // BRD §12 — we are an educational platform, not a regulated broker. Mark
  // the site as "noai" until we have a position on AI training; remove if
  // we decide to allow it.
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans bg-paper text-ink-900 antialiased">
        <Providers>
          <ColorSchemeProvider>
            <ToastProvider>
              <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-1">{children}</main>
                <Footer />
              </div>
              <CookieConsent />
              <ToastContainer />
              <AuthModal />
            </ToastProvider>
          </ColorSchemeProvider>
        </Providers>
      </body>
    </html>
  )
}
