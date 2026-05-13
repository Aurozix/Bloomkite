import type { Config } from 'tailwindcss'

// Bloomkite Brand v1.0 — see docs/branding/brand.md
// Tailwind exposes the primitive scales as `forest-*`, `saffron-*`, `ink-*`,
// plus the named neutrals `paper` and the status colors. Components should
// prefer Tailwind brand classes (e.g. `bg-forest-700`, `text-saffron-400`)
// over hardcoded blue/purple, which are explicitly off-brand.

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#F2FAF6',
          100: '#D6EEDF',
          200: '#9DD4BB',
          300: '#5CBFA0',
          400: '#1D9E75',
          500: '#0F6E56',
          600: '#0B5544',
          700: '#0B3D2E',
          900: '#062520',
        },
        saffron: {
          50: '#FDF6E3',
          100: '#F8E5B8',
          200: '#F0CC7A',
          300: '#E5B654',
          400: '#D4A437',
          500: '#B0851F',
          600: '#8C6814',
          700: '#6B4D0E',
          900: '#4A2E08',
        },
        paper: '#FAFAF7',
        ink: {
          100: '#F1EFE8',
          200: '#D3D1C7',
          400: '#888780',
          600: '#5F5E5A',
          900: '#1A1A18',
        },
        // Status — semantic, not part of the brand ramps.
        success: '#0F6E56',
        warning: '#BA7517',
        danger: '#A32D2D',
        info: '#185FA5',
      },
      fontFamily: {
        // The fonts are loaded as CSS variables by next/font in app/layout.tsx.
        serif: ['var(--font-fraunces)', 'Fraunces', 'Georgia', 'serif'],
        sans: [
          'var(--font-inter)',
          'Inter',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
        data: [
          'var(--font-jetbrains)',
          'JetBrains Mono',
          'SF Mono',
          'Consolas',
          'monospace',
        ],
        devanagari: ['Noto Serif Devanagari', 'serif'],
      },
      borderRadius: {
        'bk-sm': '6px',
        'bk-md': '10px',
        'bk-lg': '16px',
        'bk-xl': '20px',
      },
      boxShadow: {
        'bk-sm': '0 1px 2px rgba(11, 61, 46, 0.05)',
        'bk-md': '0 4px 12px rgba(11, 61, 46, 0.08)',
        'bk-lg': '0 12px 32px rgba(11, 61, 46, 0.12)',
      },
    },
  },
  plugins: [],
}
export default config
