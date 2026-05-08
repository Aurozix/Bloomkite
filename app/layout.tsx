import type { Metadata } from 'next'
import { Nunito } from 'next/font/google'
import './globals.css'
import { ToastProvider } from './components/toast-context'
import { ToastContainer } from './components/toast-container'

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '700'],
})

export const metadata: Metadata = {
  title: 'Bloomkite - Financial Advisory Marketplace',
  description: 'Connect with trusted financial advisors and plan your financial future',
  icons: {
    icon: '/Bloomkite.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={nunito.className}>
        <ToastProvider>
          <div className="min-h-screen flex flex-col">
            <main className="flex-1">
              {children}
            </main>
          </div>
          <ToastContainer />
        </ToastProvider>
      </body>
    </html>
  )
}
