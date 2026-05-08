'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { useToast } from '@/app/components/toast-context'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export default function SignIn() {
  const router = useRouter()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [testLoading, setTestLoading] = useState(false)
  const [supabase, setSupabase] = useState<any>(null)

  useEffect(() => {
    setSupabase(createClient(supabaseUrl, supabaseAnonKey))
  }, [])

  const handleGoogleSignIn = async () => {
    if (!supabase) return

    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error('Sign in error:', error)
      }
    } catch (err) {
      console.error('Unexpected error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleTestLogin = async (role: 'investor' | 'advisor') => {
    setTestLoading(true)
    try {
      const testEmail = `test-${role}@bloomkite.local`
      const response = await fetch('/api/auth/test-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, role }),
      })

      if (!response.ok) {
        throw new Error('Test login failed')
      }

      // Redirect to role selection
      router.push('/auth/role-selection')
    } catch (err) {
      console.error('Test login error:', err)
      addToast('Test login failed. Check console for details.', 'error')
    } finally {
      setTestLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-12">
          <img src="/Bloomkite.png" alt="Bloomkite" className="h-20 w-20 mx-auto mb-6" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Bloomkite
          </h1>
          <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
          <p className="mt-3 text-gray-600 text-lg">
            Start your journey to financial freedom
          </p>
        </div>

        {/* Sign In Card */}
        <div className="card p-8 space-y-6 mb-6">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 c0-3.331,2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.461,2.268,15.365,1.25,12.545,1.25 c-6.343,0-11.5,5.157-11.5,11.5c0,6.343,5.157,11.5,11.5,11.5c11.5,0,11.5-11.5,11.5-11.5" />
                </svg>
                <span>Sign in with Google</span>
              </>
            )}
          </button>

          {process.env.NODE_ENV === 'development' && (
            <div className="space-y-3 bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-yellow-800">
                🧪 Development Mode - Test Login
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleTestLogin('investor')}
                  disabled={testLoading}
                  className="px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition disabled:opacity-50"
                >
                  {testLoading ? 'Loading...' : '👤 Investor'}
                </button>
                <button
                  onClick={() => handleTestLogin('advisor')}
                  disabled={testLoading}
                  className="px-3 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-sm rounded-lg font-semibold hover:from-purple-600 hover:to-purple-700 transition disabled:opacity-50"
                >
                  {testLoading ? 'Loading...' : '💼 Advisor'}
                </button>
              </div>
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white text-gray-500 text-sm font-medium">New here?</span>
            </div>
          </div>

          <button
            onClick={() => router.push('/auth/role-selection')}
            className="btn-primary w-full text-lg"
          >
            Create Account
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600">
          By signing in, you agree to our{' '}
          <a href="#" className="text-blue-600 font-semibold hover:underline">
            Terms
          </a>{' '}
          and{' '}
          <a href="#" className="text-blue-600 font-semibold hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  )
}
