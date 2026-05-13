'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import { WalletIcon, BriefcaseIcon } from '@heroicons/react/24/outline'
import { Logo } from '@/app/components/Logo'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export default function RoleSelection() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<'investor' | 'advisor' | null>(null)
  const [loading, setLoading] = useState(false)
  const [supabase, setSupabase] = useState<any>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const client = createClient(supabaseUrl, supabaseAnonKey)
    setSupabase(client)

    const getUser = async () => {
      const {
        data: { user },
      } = await client.auth.getUser()
      if (!user) {
        router.push('/auth/signin')
        return
      }
      setUser(user)

      // Check if user already has a role
      const { data: userRoles } = await client
        .from('user_roles')
        .select('role:roles(name)')
        .eq('user_id', user.id)

      if (userRoles && userRoles.length > 0) {
        // User already has a role, go to dashboard
        router.push('/dashboard')
        return
      }
    }

    getUser()
  }, [router])

  const handleRoleSelect = async () => {
    if (!selectedRole || !user) return

    setLoading(true)
    try {
      const response = await fetch('/api/auth/select-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: selectedRole,
          userId: user.id,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Error assigning role:', error)
        return
      }

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err) {
      console.error('Unexpected error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Logo size={56} />
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-3">
            Welcome to Bloomkite
          </h1>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Choose Your Role</h2>
          <p className="text-lg text-gray-600">
            Welcome {user?.user_metadata?.full_name || 'User'}! Select how you'd like to use Bloomkite.
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Investor */}
          <button
            onClick={() => setSelectedRole('investor')}
            className={`card p-8 text-left transition-all ${
              selectedRole === 'investor'
                ? 'shadow-lg'
                : 'hover:shadow-lg'
            }`}
            style={selectedRole === 'investor' ? { outline: '2px solid var(--primary-600)', outlineOffset: '-2px' } : {}}
          >
            <WalletIcon className="h-16 w-16 mb-4" style={{ color: 'var(--primary-600)' }} />
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Investor</h3>
            <p className="text-gray-600 mb-6">
              Seek financial advice, use powerful calculators, and connect with trusted advisors
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-gray-700">
                <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>Access 15 financial calculators</span>
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>Discover verified advisors</span>
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>Share plans for feedback</span>
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>Learn from expert articles</span>
              </li>
            </ul>
          </button>

          {/* Advisor */}
          <button
            onClick={() => setSelectedRole('advisor')}
            className={`card p-8 text-left transition-all ${
              selectedRole === 'advisor'
                ? 'shadow-lg'
                : 'hover:shadow-lg'
            }`}
            style={selectedRole === 'advisor' ? { outline: '2px solid var(--secondary-600)', outlineOffset: '-2px' } : {}}
          >
            <BriefcaseIcon className="h-16 w-16 mb-4" style={{ color: 'var(--secondary-600)' }} />
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Advisor</h3>
            <p className="text-gray-600 mb-6">
              Build credibility, reach clients, and publish your expertise
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-gray-700">
                <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>Create verified profile</span>
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>Upload credentials</span>
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>Publish articles</span>
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>Receive shared plans</span>
              </li>
            </ul>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleRoleSelect}
            disabled={!selectedRole || loading}
            className="btn-primary w-full text-lg"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" style={{ borderTopColor: 'transparent' }}></div>
                Setting up your account...
              </div>
            ) : (
              'Continue'
            )}
          </button>

          <button
            onClick={() => router.push('/auth/signin')}
            className="btn-outline w-full text-lg"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  )
}
