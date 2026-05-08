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
} from '@heroicons/react/24/outline'
import { ArrowRightIcon } from '@heroicons/react/24/solid'

interface User {
  id: string
  email: string
  roles: string[]
  investor_profile?: any
  advisor_profile?: any
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin">
          <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const isInvestor = user.roles?.includes('investor')
  const isAdvisor = user.roles?.includes('advisor')
  const isAdmin = user.roles?.includes('admin')

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-b border-blue-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img src="/Bloomkite.png" alt="Bloomkite" className="h-12 w-12" />
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
        <div className="card p-8 mb-12 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Your Account</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{user.email}</p>
              <div className="flex gap-2 mt-4">
                {user.roles?.map((role) => (
                  <span
                    key={role}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-semibold capitalize"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>
            <UserIcon className="h-20 w-20 text-blue-600" />
          </div>
        </div>

        {/* Role-based Content */}
        <div className="space-y-12">
          {/* Investor Dashboard */}
          {isInvestor && (
            <section>
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <UserGroupIcon className="h-8 w-8 text-blue-600" />
                Investor Tools
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <a href="/calculators" className="card p-8 hover:shadow-xl group cursor-pointer">
                  <CalculatorIcon className="h-16 w-16 text-blue-600 mb-4 group-hover:scale-110 transition transform" />
                  <h3 className="text-2xl font-bold mb-3">Financial Calculators</h3>
                  <p className="text-gray-600 mb-6">
                    Access 15 powerful calculators to plan your goals, analyze cash flow, and make smart investment decisions
                  </p>
                  <div className="flex items-center gap-2 text-blue-600 font-semibold group-hover:gap-3 transition">
                    Explore Calculators <ArrowRightIcon className="h-5 w-5" />
                  </div>
                </a>

                <a href="/advisors" className="card p-8 hover:shadow-xl group cursor-pointer">
                  <ShieldCheckIcon className="h-16 w-16 text-blue-600 mb-4 group-hover:scale-110 transition transform" />
                  <h3 className="text-2xl font-bold mb-3">Find Advisors</h3>
                  <p className="text-gray-600 mb-6">
                    Discover verified financial advisors, compare their expertise, and get personalized recommendations
                  </p>
                  <div className="flex items-center gap-2 text-blue-600 font-semibold group-hover:gap-3 transition">
                    Browse Advisors <ArrowRightIcon className="h-5 w-5" />
                  </div>
                </a>
              </div>
            </section>
          )}

          {/* Advisor Dashboard */}
          {isAdvisor && (
            <section>
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <BriefcaseIcon className="h-8 w-8 text-purple-600" />
                Advisor Tools
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="card p-8 border-2 border-purple-200">
                  <UserIcon className="h-16 w-16 text-purple-600 mb-4" />
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
                  <a href="/profile" className="text-blue-600 font-semibold hover:underline flex items-center gap-2">
                    Edit Profile <ArrowRightIcon className="h-4 w-4" />
                  </a>
                </div>

                <div className="card p-8 border-2 border-orange-200">
                  <PencilSquareIcon className="h-16 w-16 text-orange-600 mb-4" />
                  <h3 className="text-2xl font-bold mb-3">Publish Articles</h3>
                  <p className="text-gray-600 mb-6">
                    Share your expertise and build authority with the Bloomkite community
                  </p>
                  <a href="/articles/create" className="text-blue-600 font-semibold hover:underline flex items-center gap-2">
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
                <ShieldCheckIcon className="h-8 w-8 text-red-600" />
                Admin Panel
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="card p-8 border-2 border-red-200">
                  <ShieldCheckIcon className="h-12 w-12 text-red-600 mb-4" />
                  <h3 className="text-xl font-bold mb-2">Moderation</h3>
                  <p className="text-gray-600 text-sm">
                    Approve content and maintain community standards
                  </p>
                </div>

                <div className="card p-8 border-2 border-indigo-200">
                  <UsersIcon className="h-12 w-12 text-indigo-600 mb-4" />
                  <h3 className="text-xl font-bold mb-2">User Management</h3>
                  <p className="text-gray-600 text-sm">
                    Manage accounts, roles, and user permissions
                  </p>
                </div>

                <div className="card p-8 border-2 border-cyan-200">
                  <ChartBarIcon className="h-12 w-12 text-cyan-600 mb-4" />
                  <h3 className="text-xl font-bold mb-2">Analytics</h3>
                  <p className="text-gray-600 text-sm">
                    View platform metrics and performance insights
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}
