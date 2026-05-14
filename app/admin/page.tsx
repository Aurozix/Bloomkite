'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ShieldCheckIcon,
  UsersIcon,
  DocumentTextIcon,
  ClockIcon,
  SparklesIcon,
  TableCellsIcon,
  CurrencyRupeeIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentListIcon,
  TrashIcon,
  IdentificationIcon,
  LifebuoyIcon,
  ArrowPathIcon,
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
            <AdminCard
              href="/admin/content"
              icon={<DocumentTextIcon className="h-12 w-12" />}
              title="Content moderation"
              body="Review pending articles (with bulk approve/reject) and advisor credentials."
            />
            <AdminCard
              href="/admin/users"
              icon={<UsersIcon className="h-12 w-12" />}
              title="User management"
              body="Search, assign or remove roles, disable accounts, hard-delete on request."
            />
            <AdminCard
              href="/admin/master-data"
              icon={<TableCellsIcon className="h-12 w-12" />}
              title="Master data"
              body="Edit the lookup tables behind profile pickers, calculators, and search facets."
            />
            <AdminCard
              href="/admin/plans"
              icon={<CurrencyRupeeIcon className="h-12 w-12" />}
              title="Membership plans"
              body="Create, edit, deactivate subscription plans (replaces SQL-seeded plans)."
            />
            <AdminCard
              href="/admin/forum"
              icon={<ChatBubbleLeftRightIcon className="h-12 w-12" />}
              title="Forum moderation"
              body="Lock or delete questions and answers. Locks preserve history; deletes cascade."
            />
            <AdminCard
              href="/admin/audit-log"
              icon={<ClipboardDocumentListIcon className="h-12 w-12" />}
              title="Audit log"
              body="Append-only compliance trail of every admin action (BRD §8.5 + §13.2)."
            />
            <AdminCard
              href="/admin/data-deletion"
              icon={<TrashIcon className="h-12 w-12" />}
              title="Right-to-delete"
              body="Review user-initiated deletion requests (BRD §13.3)."
            />
            <AdminCard
              href="/admin/kyc"
              icon={<IdentificationIcon className="h-12 w-12" />}
              title="KYC verification"
              body="Verify PAN / Aadhaar submissions. Hashes + last-4 only — full IDs never stored."
            />
            <AdminCard
              href="/admin/support"
              icon={<LifebuoyIcon className="h-12 w-12" />}
              title="Support / grievance"
              body="Triage user-submitted requests (BRD §12.5)."
            />
            <AdminCard
              href="/admin/retention"
              icon={<ArrowPathIcon className="h-12 w-12" />}
              title="Retention jobs"
              body="Manual triggers for the BRD §13.3 purge jobs (OTP / closed-forum / deleted-account residual)."
            />
            <AdminCard
              href="/admin/ai-features"
              icon={<SparklesIcon className="h-12 w-12" />}
              title="AI features"
              body="Toggle individual AI features. Every feature is opt-in, off by default."
            />
          </div>
        </section>
      </main>
    </div>
  )
}

function AdminCard({
  href,
  icon,
  title,
  body,
}: {
  href: string
  icon: React.ReactNode
  title: string
  body: string
}) {
  return (
    <a href={href} className="card p-6 hover:shadow-xl transition cursor-pointer group">
      <div className="text-forest-500 group-hover:scale-110 transition-transform mb-3">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm mb-4">{body}</p>
      <div className="text-sm font-semibold text-forest-500 group-hover:gap-2 inline-flex items-center gap-1 transition-all">
        Open →
      </div>
    </a>
  )
}
