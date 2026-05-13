'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowRightOnRectangleIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { Logo } from './Logo'

interface SessionUser {
  id: string
  email: string
  roles: string[]
  current_role: string | null
}

// Routes where the Navbar should NOT render. Auth screens get their own layout.
const HIDDEN_ON: ReadonlyArray<string> = [
  '/auth/signin',
  '/auth/role-selection',
  '/auth/callback',
]

// Public-facing links shown to everyone (signed in or not).
const PUBLIC_LINKS: Array<{ label: string; href: string }> = [
  { label: 'Advisors', href: '/advisors' },
  { label: 'Articles', href: '/articles' },
  { label: 'Forum', href: '/forum' },
]

// Role-specific links shown only to authenticated users in that role.
const ROLE_LINKS: Record<string, Array<{ label: string; href: string }>> = {
  investor: [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Calculators', href: '/calculators' },
  ],
  advisor: [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'My Profile', href: '/profile' },
    { label: 'Write Article', href: '/articles/create' },
  ],
  admin: [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Admin', href: '/admin' },
  ],
}

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()

  const [user, setUser] = useState<SessionUser | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [switching, setSwitching] = useState(false)

  // Fetch the session whenever the route changes. Cheap GET, returns null user
  // when unauthenticated, so it doubles as the gate for which links to show.
  useEffect(() => {
    let cancelled = false
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then(({ user }) => {
        if (!cancelled) setUser(user ?? null)
      })
      .catch(() => {
        if (!cancelled) setUser(null)
      })
    return () => {
      cancelled = true
    }
  }, [pathname])

  if (HIDDEN_ON.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return null
  }

  const roleLinks =
    user?.current_role && ROLE_LINKS[user.current_role]
      ? ROLE_LINKS[user.current_role]
      : []

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    setMenuOpen(false)
    router.push('/')
  }

  const handleSwitchRole = async (newRole: string) => {
    if (!user || switching || newRole === user.current_role) return
    setSwitching(true)
    try {
      const resp = await fetch('/api/auth/switch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      if (resp.ok) setUser({ ...user, current_role: newRole })
    } finally {
      setSwitching(false)
      setMenuOpen(false)
    }
  }

  return (
    <nav className="bg-paper/85 backdrop-blur-sm border-b border-ink-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
        <a
          href={user ? '/dashboard' : '/'}
          className="flex items-center hover:opacity-90 transition-opacity"
        >
          <Logo size={32} withWordmark />
        </a>

        <div className="hidden md:flex items-center gap-6">
          {PUBLIC_LINKS.map((l) => (
            <NavLink key={l.href} href={l.href} active={pathname === l.href}>
              {l.label}
            </NavLink>
          ))}
          {roleLinks.map((l) => (
            <NavLink key={l.href} href={l.href} active={pathname === l.href}>
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                  {user.email.split('@')[0]}
                </span>
                {user.current_role && (
                  <span className="text-xs font-semibold uppercase tracking-wider text-forest-500 bg-forest-50 px-2 py-0.5 rounded-full">
                    {user.current_role}
                  </span>
                )}
                <ChevronDownIcon className="h-4 w-4 text-gray-500" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm text-gray-500">Signed in as</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {user.email}
                    </p>
                  </div>
                  {user.roles.length > 1 && (
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-xs uppercase text-gray-500 mb-2">
                        Switch role
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {user.roles.map((r) => (
                          <button
                            key={r}
                            onClick={() => handleSwitchRole(r)}
                            disabled={switching || r === user.current_role}
                            className={`text-xs px-2 py-1 rounded ${
                              r === user.current_role
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            } disabled:opacity-60`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <a
              href="/auth/signin"
              className="text-sm font-semibold text-paper bg-forest-400 hover:bg-forest-500 px-4 py-2 rounded-bk-md transition-colors"
            >
              Sign in
            </a>
          )}
        </div>
      </div>
    </nav>
  )
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      className={`text-sm font-medium transition-colors ${
        active
          ? 'text-forest-700'
          : 'text-ink-600 hover:text-ink-900'
      }`}
    >
      {children}
    </a>
  )
}
