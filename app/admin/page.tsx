'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ShieldCheckIcon,
  UsersIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import { ColorSchemeSelector } from '@/app/components/color-scheme-selector'
import { useToast } from '@/app/components/toast-context'
import { Logo } from '@/app/components/Logo'

interface AdminStats {
  totalUsers: number
  totalAdvisors: number
  pendingCredentials: number
  pendingArticles: number
}

export default function AdminPage() {
  const router = useRouter()
  const { addToast } = useToast()

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalAdvisors: 0,
    pendingCredentials: 0,
    pendingArticles: 0,
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sessionResponse = await fetch('/api/auth/session')
        const sessionData = await sessionResponse.json()

        // Auth.js session shape: roles array + camelCase currentRole. Allow
        // any user who holds the 'admin' role regardless of current_role, so
        // multi-role admins don't have to switch context first.
        const roles: string[] = sessionData?.user?.roles ?? []
        if (!sessionData?.user || !roles.includes('admin')) {
          addToast('Admin access required', 'error')
          router.push('/dashboard')
          return
        }

        setUser(sessionData.user)

        // Fetch stats
        const statsResponse = await fetch('/api/admin/stats')
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setStats(statsData.data)
        }
      } catch (error) {
        console.error('Error fetching admin data:', error)
        addToast('Error loading admin panel', 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router, addToast])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-gray-300 border-t-blue-500 rounded-full"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="text-white border-b" style={{ background: 'var(--hero-gradient)', borderColor: 'var(--primary-700)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Logo size={40} variant="reverse" />
            <div>
              <h1 className="text-4xl font-bold">Admin Panel</h1>
              <p className="text-blue-100 mt-1">Content Moderation & System Management</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ColorSchemeSelector />
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold transition border border-white/30"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="card p-6 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
              </div>
              <UsersIcon className="h-12 w-12 text-blue-500" />
            </div>
          </div>

          <div className="card p-6 border-l-4 border-l-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Verified Advisors</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalAdvisors}</p>
              </div>
              <ShieldCheckIcon className="h-12 w-12 text-green-500" />
            </div>
          </div>

          <div className="card p-6 border-l-4 border-l-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Pending Credentials</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingCredentials}</p>
              </div>
              <ClockIcon className="h-12 w-12 text-yellow-500" />
            </div>
          </div>

          <div className="card p-6 border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Pending Articles</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingArticles}</p>
              </div>
              <DocumentTextIcon className="h-12 w-12 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Operations</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <a
              href="/admin/content"
              className="card p-8 hover:shadow-xl transition cursor-pointer group"
            >
              <DocumentTextIcon className="h-16 w-16 mb-4 group-hover:scale-110 transition transform" style={{ color: 'var(--primary-600)' }} />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Content Moderation</h3>
              <p className="text-gray-600 mb-6">
                Review and approve pending articles and verify advisor credentials
              </p>
              <div className="flex items-center gap-2 font-semibold group-hover:gap-3 transition" style={{ color: 'var(--primary-600)' }}>
                Review Content →
              </div>
            </a>

            <a
              href="/admin/users"
              className="card p-8 hover:shadow-xl transition cursor-pointer group"
            >
              <UsersIcon className="h-16 w-16 mb-4 group-hover:scale-110 transition transform text-saffron-500" />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">User Management</h3>
              <p className="text-gray-600 mb-6">
                Search users, assign or remove roles, disable accounts, and review the audit trail.
              </p>
              <div className="flex items-center gap-2 font-semibold group-hover:gap-3 transition text-forest-500">
                Manage Users →
              </div>
            </a>

            <a
              href="/admin/ai-features"
              className="card p-8 hover:shadow-xl transition cursor-pointer group"
            >
              <SparklesIcon className="h-16 w-16 mb-4 group-hover:scale-110 transition transform text-forest-500" />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">AI Features</h3>
              <p className="text-gray-600 mb-6">
                Toggle individual AI features on or off. Every feature is opt-in and ships disabled by default.
              </p>
              <div className="flex items-center gap-2 font-semibold group-hover:gap-3 transition text-forest-500">
                Manage Toggles →
              </div>
            </a>
          </div>
        </section>
      </main>
    </div>
  )
}
