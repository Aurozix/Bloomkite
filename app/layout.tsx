import type { Metadata } from 'next'
import { Fraunces, Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { ToastProvider } from './components/toast-context'
import { ToastContainer } from './components/toast-container'
import { ColorSchemeProvider } from './components/color-scheme-context'
import { Navbar } from './components/Navbar'

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

export const metadata: Metadata = {
  title: 'Bloomkite — Verified financial advisors',
  description:
    'A verified advisor marketplace for India and the NRI diaspora. Find an advisor on merit, not memory.',
  icons: {
    icon: '/favicon.svg',
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
        <ColorSchemeProvider>
          <ToastProvider>
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1">{children}</main>
            </div>
            <ToastContainer />
          </ToastProvider>
        </ColorSchemeProvider>
      </body>
    </html>
  )
}
