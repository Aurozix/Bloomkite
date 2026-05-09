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
  const [supabase, setSupabase] = useState<any>(null)

  useEffect(() => {
    setSupabase(createClient(supabaseUrl, supabaseAnonKey))
  }, [])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

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

  const handleEmailSignIn = async () => {
    if (!supabase || !email || !password) {
      addToast('Please enter email and password', 'error')
      return
    }

    setLoading(true)
    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Email sign in error:', error)
        addToast(error.message || 'Sign in failed', 'error')
        return
      }

      // Store session in localStorage and cookies
      if (data.session) {
        const projectId = supabaseUrl?.split('.')[0].split('//')[1] || 'local'
        localStorage.setItem(
          `sb-${projectId}-auth-token`,
          JSON.stringify(data.session)
        )

        // Also set cookies for server-side session verification
        await fetch('/api/auth/set-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          }),
        })
      }

      router.push('/auth/role-selection')
    } catch (err) {
      console.error('Unexpected error:', err)
      addToast('An unexpected error occurred', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-12">
          <img src="/Bloomkite.png" alt="Bloomkite" className="h-20 w-20 mx-auto mb-6" />
          <h1 className="text-4xl font-bold gradient-text mb-3">
            Bloomkite
          </h1>
          <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
          <p className="mt-3 text-gray-600 text-lg">
            Start your journey to financial freedom
          </p>
        </div>

        {/* Sign In Card */}
        <div className="card p-8 space-y-6 mb-6">
          <div className="space-y-3">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition disabled:bg-gray-100"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition disabled:bg-gray-100"
              onKeyDown={(e) => e.key === 'Enter' && handleEmailSignIn()}
            />
            <button
              onClick={handleEmailSignIn}
              disabled={loading}
              className="btn-primary w-full py-3 text-lg"
            >
              {loading ? 'Signing in...' : 'Sign In with Email'}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white text-gray-500 text-sm font-medium">or</span>
            </div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-t-transparent rounded-full" style={{ borderColor: 'var(--primary-600)', borderTopColor: 'transparent' }}></div>
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
