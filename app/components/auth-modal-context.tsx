'use client'

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

// Global state for the auth modal. Any client component can call useAuthModal()
// and open the modal in either 'signin' or 'signup' mode without prop drilling.
// The provider is mounted in app/providers.tsx and the modal itself is mounted
// near the root so it stacks correctly above page content.

type Mode = 'signin' | 'signup'

interface AuthModalState {
  open: boolean
  mode: Mode
  openModal: (mode: Mode) => void
  closeModal: () => void
}

const AuthModalContext = createContext<AuthModalState | null>(null)

export function useAuthModal(): AuthModalState {
  const ctx = useContext(AuthModalContext)
  if (!ctx) {
    throw new Error('useAuthModal must be used inside <AuthModalProvider>')
  }
  return ctx
}

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>('signin')

  const openModal = useCallback((m: Mode) => {
    setMode(m)
    setOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setOpen(false)
  }, [])

  return (
    <AuthModalContext.Provider value={{ open, mode, openModal, closeModal }}>
      {children}
    </AuthModalContext.Provider>
  )
}
