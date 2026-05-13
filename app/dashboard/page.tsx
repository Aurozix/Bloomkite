'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CalculatorIcon,
  UserGroupIcon,
  UserIcon,
  PencilSquareIcon,
  ShieldCheckIcon,
  UsersIcon,
  ChartBarIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline'
import { ArrowRightIcon } from '@heroicons/react/24/solid'
import { Logo } from '@/app/components/Logo'

interface User {
  id: string
  email: string
  roles: string[]
  current_role: string
  investor_profile?: any
  advisor_profile?: any
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [switching, setSwitching] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/session')
        const { user } = await response.json()

        if (!user) {
          router.push('/auth/signin')
          return
        }

        setUser(user)
      } catch (err) {
        console.error('Error fetching user:', err)
        router.push('/auth/signin')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [router])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/auth/signin')
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  const handleSwitchRole = async (newRole: string) => {
    if (!user || newRole === user.current_role) return

    setSwitching(true)
    try {
      const response = await fetch('/api/auth/switch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      if (response.ok) {
        setUser({ ...user, current_role: newRole })
      }
    } catch (err) {
      console.error('Role switch error:', err)
    } finally {
      setSwitching(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin">
          <div className="h-12 w-12 border-4 border-t-transparent rounded-full" style={{ borderColor: 'var(--primary-600)', borderTopColor: 'transparent' }}></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const isInvestor = user.current_role === 'investor'
  const isAdvisor = user.current_role === 'advisor'
  const isAdmin = user.current_role === 'admin'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="text-white border-b" style={{ background: 'var(--hero-gradient)', borderColor: 'var(--primary-700)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Logo size={40} variant="reverse" />
            <div>
              <h1 className="text-4xl font-bold">Dashboard</h1>
              <p className="text-blue-100 mt-1">Welcome back, {user.email.split('@')[0]}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold transition border border-white/30 backdrop-blur-sm"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* User Card */}
        <div className="card p-8 mb-12 border" style={{ background: `linear-gradient(to right, var(--primary-50), var(--primary-50))`, borderColor: 'var(--primary-200)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Your Account</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{user.email}</p>
              <div className="flex gap-2 mt-4">
                {user.roles?.map((role) => (
                  <button
                    key={role}
                    onClick={() => handleSwitchRole(role)}
                    disabled={switching}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition ${
                      user.current_role === role
                        ? 'text-white'
                        : 'text-gray-700 bg-gray-200 hover:bg-gray-300'
                    }`}
                    style={user.current_role === role ? { background: `linear-gradient(to right, var(--primary-600), var(--primary-700))` } : {}}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
            <UserIcon className="h-20 w-20" style={{ color: 'var(--primary-600)' }} />
          </div>
        </div>

        {/* Role-based Content */}
        <div className="space-y-12">
          {/* Investor Dashboard */}
          {isInvestor && (
            <section>
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <UserGroupIcon className="h-8 w-8" style={{ color: 'var(--primary-600)' }} />
                Investor Tools
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <a href="/calculators" className="card p-8 hover:shadow-xl group cursor-pointer">
                  <CalculatorIcon className="h-16 w-16 mb-4 group-hover:scale-110 transition transform" style={{ color: 'var(--primary-600)' }} />
                  <h3 className="text-2xl font-bold mb-3">Financial Calculators</h3>
                  <p className="text-gray-600 mb-6">
                    Access 15 powerful calculators to plan your goals, analyze cash flow, and make smart investment decisions
                  </p>
                  <div className="flex items-center gap-2 font-semibold group-hover:gap-3 transition" style={{ color: 'var(--primary-600)' }}>
                    Explore Calculators <ArrowRightIcon className="h-5 w-5" />
                  </div>
                </a>

                <a href="/advisors" className="card p-8 hover:shadow-xl group cursor-pointer">
                  <ShieldCheckIcon className="h-16 w-16 mb-4 group-hover:scale-110 transition transform" style={{ color: 'var(--primary-600)' }} />
                  <h3 className="text-2xl font-bold mb-3">Find Advisors</h3>
                  <p className="text-gray-600 mb-6">
                    Discover verified financial advisors, compare their expertise, and get personalized recommendations
                  </p>
                  <div className="flex items-center gap-2 font-semibold group-hover:gap-3 transition" style={{ color: 'var(--primary-600)' }}>
                    Browse Advisors <ArrowRightIcon className="h-5 w-5" />
                  </div>
                </a>

                <a href="/forum" className="card p-8 hover:shadow-xl group cursor-pointer">
                  <ChartBarIcon className="h-16 w-16 mb-4 group-hover:scale-110 transition transform" style={{ color: 'var(--primary-600)' }} />
                  <h3 className="text-2xl font-bold mb-3">Community Q&A</h3>
                  <p className="text-gray-600 mb-6">
                    Ask questions and get expert advice from our community of verified financial advisors
                  </p>
                  <div className="flex items-center gap-2 font-semibold group-hover:gap-3 transition" style={{ color: 'var(--primary-600)' }}>
                    Ask Question <ArrowRightIcon className="h-5 w-5" />
                  </div>
                </a>
              </div>
            </section>
          )}

          {/* Advisor Dashboard */}
          {isAdvisor && (
            <section>
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <BriefcaseIcon className="h-8 w-8" style={{ color: 'var(--secondary-600)' }} />
                Advisor Tools
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="card p-8 border-2" style={{ borderColor: 'var(--secondary-200)' }}>
                  <UserIcon className="h-16 w-16 mb-4" style={{ color: 'var(--secondary-600)' }} />
                  <h3 className="text-2xl font-bold mb-3">My Profile</h3>
                  <p className="text-gray-600 mb-6">
                    Build and manage your professional profile to attract clients
                  </p>
                  <div className="mb-4">
                    <span
                      className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                        user.advisor_profile?.workflow_status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : user.advisor_profile?.workflow_status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {user.advisor_profile?.workflow_status === 'pending'
                        ? '⏳ Pending Approval'
                        : user.advisor_profile?.workflow_status === 'approved'
                        ? '✓ Approved'
                        : 'Status Unknown'}
                    </span>
                  </div>
                  <a href="/profile" className="font-semibold hover:underline flex items-center gap-2" style={{ color: 'var(--primary-600)' }}>
                    Edit Profile <ArrowRightIcon className="h-4 w-4" />
                  </a>
                </div>

                <div className="card p-8 border-2" style={{ borderColor: 'var(--accent-200)' }}>
                  <PencilSquareIcon className="h-16 w-16 mb-4" style={{ color: 'var(--accent-200)' }} />
                  <h3 className="text-2xl font-bold mb-3">Publish Articles</h3>
                  <p className="text-gray-600 mb-6">
                    Share your expertise and build authority with the Bloomkite community
                  </p>
                  <a href="/articles/create" className="font-semibold hover:underline flex items-center gap-2" style={{ color: 'var(--primary-600)' }}>
                    Create Article <ArrowRightIcon className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </section>
          )}

          {/* Admin Dashboard */}
          {isAdmin && (
            <section>
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <ShieldCheckIcon className="h-8 w-8" style={{ color: 'var(--primary-600)' }} />
                Admin Panel
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <a href="/admin" className="card p-8 hover:shadow-xl group cursor-pointer">
                  <ShieldCheckIcon className="h-16 w-16 mb-4 group-hover:scale-110 transition transform" style={{ color: 'var(--primary-600)' }} />
                  <h3 className="text-2xl font-bold mb-3">Admin Dashboard</h3>
                  <p className="text-gray-600 mb-6">
                    Review pending articles and credentials, view system stats, and manage platform content
                  </p>
                  <div className="flex items-center gap-2 font-semibold group-hover:gap-3 transition" style={{ color: 'var(--primary-600)' }}>
                    Go to Admin <ArrowRightIcon className="h-5 w-5" />
                  </div>
                </a>

                <div className="card p-8 border-2" style={{ borderColor: 'var(--accent-200)' }}>
                  <UsersIcon className="h-16 w-16 mb-4" style={{ color: 'var(--accent-200)' }} />
                  <h3 className="text-2xl font-bold mb-3">User Management</h3>
                  <p className="text-gray-600 mb-6">
                    Coming soon: Manage accounts, roles, and user permissions
                  </p>
                  <div className="inline-block px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm font-semibold">
                    In Development
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}
