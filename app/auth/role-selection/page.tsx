'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import { WalletIcon, BriefcaseIcon } from '@heroicons/react/24/outline'

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
    }

    getUser()
  }, [router])

  const handleRoleSelect = async () => {
    if (!selectedRole || !supabase || !user) return

    setLoading(true)
    try {
      // Get the role ID
      const { data: role } = await supabase
        .from('roles')
        .select('id')
        .eq('name', selectedRole)
        .single()

      if (!role) {
        console.error('Role not found')
        return
      }

      // Create user_roles entry
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role_id: role.id,
        })

      if (roleError) {
        console.error('Error assigning role:', roleError)
        return
      }

      // Create profile based on role
      if (selectedRole === 'investor') {
        const { error: profileError } = await supabase
          .from('investor_profiles')
          .insert({
            user_id: user.id,
            display_name: user.user_metadata?.full_name || '',
          })

        if (profileError) {
          console.error('Error creating investor profile:', profileError)
          return
        }
      } else if (selectedRole === 'advisor') {
        const { error: profileError } = await supabase
          .from('advisor_profiles')
          .insert({
            user_id: user.id,
            display_name: user.user_metadata?.full_name || '',
            workflow_status: 'pending',
          })

        if (profileError) {
          console.error('Error creating advisor profile:', profileError)
          return
        }
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
          <img src="/Bloomkite.png" alt="Bloomkite" className="h-20 w-20 mx-auto mb-6" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
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
                ? 'ring-2 ring-blue-600 shadow-lg'
                : 'hover:shadow-lg'
            }`}
          >
            <WalletIcon className="h-16 w-16 text-blue-600 mb-4" />
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
                ? 'ring-2 ring-purple-600 shadow-lg'
                : 'hover:shadow-lg'
            }`}
          >
            <BriefcaseIcon className="h-16 w-16 text-purple-600 mb-4" />
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
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
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
