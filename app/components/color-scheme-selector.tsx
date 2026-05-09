'use client'

import { useContext } from 'react'
import { ColorSchemeContext, type ColorScheme } from './color-scheme-context'

const schemes: Array<{ value: ColorScheme; label: string; color: string }> = [
  { value: 'azure', label: '🔵 Azure', color: 'from-blue-600 to-purple-600' },
  { value: 'emerald', label: '💚 Emerald', color: 'from-emerald-600 to-cyan-600' },
  { value: 'twilight', label: '🌌 Twilight', color: 'from-indigo-600 to-blue-600' },
  { value: 'sunrise', label: '🌅 Sunrise', color: 'from-orange-600 to-red-600' },
]

export function ColorSchemeSelector() {
  const context = useContext(ColorSchemeContext)

  if (!context) {
    return null
  }

  const { scheme, setScheme } = context

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-gray-600">Theme:</span>
      <div className="flex gap-2">
        {schemes.map((s) => (
          <button
            key={s.value}
            onClick={() => setScheme(s.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 border-2 ${
              scheme === s.value
                ? `border-current bg-gradient-to-r ${s.color} text-white shadow-lg`
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
            title={s.label}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}
