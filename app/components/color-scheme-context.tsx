'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

export type ColorScheme = 'azure' | 'emerald' | 'twilight' | 'sunrise'

interface ColorSchemeContextType {
  scheme: ColorScheme
  setScheme: (scheme: ColorScheme) => void
}

export const ColorSchemeContext = createContext<ColorSchemeContextType | undefined>(undefined)

export function ColorSchemeProvider({ children }: { children: React.ReactNode }) {
  const [scheme, setSchemeState] = useState<ColorScheme>('emerald')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('colorScheme') as ColorScheme | null
    const schemeToUse = saved || 'emerald'
    setSchemeState(schemeToUse)
    document.documentElement.setAttribute('data-scheme', schemeToUse)
  }, [])

  const setScheme = (newScheme: ColorScheme) => {
    setSchemeState(newScheme)
    localStorage.setItem('colorScheme', newScheme)
    document.documentElement.setAttribute('data-scheme', newScheme)
  }

  if (!mounted) return <>{children}</>

  return (
    <ColorSchemeContext.Provider value={{ scheme, setScheme }}>
      {children}
    </ColorSchemeContext.Provider>
  )
}

export function useColorScheme() {
  const context = useContext(ColorSchemeContext)
  if (!context) {
    throw new Error('useColorScheme must be used within ColorSchemeProvider')
  }
  return context
}
