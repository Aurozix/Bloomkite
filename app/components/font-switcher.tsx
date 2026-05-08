'use client'

import { useState, useEffect } from 'react'

const fonts = [
  { label: 'Noto Sans', value: 'noto-sans' },
  { label: 'Fira Sans', value: 'fira-sans' },
  { label: 'Roboto', value: 'roboto' },
  { label: 'Nunito', value: 'nunito' },
  { label: 'Ubuntu', value: 'ubuntu' },
  { label: 'SN Pro', value: 'sn-pro' },
]

export function FontSwitcher() {
  const [selectedFont, setSelectedFont] = useState<string>('noto-sans')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('bloomkite-font') || 'noto-sans'
    setSelectedFont(saved)
    applyFont(saved)
  }, [])

  const applyFont = (fontValue: string) => {
    document.documentElement.setAttribute('data-font', fontValue)
  }

  const handleFontChange = (fontValue: string) => {
    setSelectedFont(fontValue)
    localStorage.setItem('bloomkite-font', fontValue)
    applyFont(fontValue)
  }

  if (!mounted) return null

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-full shadow-lg border border-gray-200 p-2 z-50">
      <div className="flex gap-2 items-center">
        <span className="text-xs font-semibold text-gray-600 ml-2">Font:</span>
        <div className="flex gap-1 flex-wrap max-w-xs">
          {fonts.map((font) => (
            <button
              key={font.value}
              onClick={() => handleFontChange(font.value)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                selectedFont === font.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {font.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
