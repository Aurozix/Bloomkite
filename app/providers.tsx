'use client'

import { SessionProvider } from 'next-auth/react'
import { AuthModalProvider } from './components/auth-modal-context'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthModalProvider>{children}</AuthModalProvider>
    </SessionProvider>
  )
}
