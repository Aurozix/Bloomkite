'use client'

import { Suspense, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useToast } from '@/app/components/toast-context'
import { Logo } from '@/app/components/Logo'

function SignInContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  const handleGoogleSignIn = async () => {
    setLoading(true)
    await signIn('google', { callbackUrl })
  }

  const handleEmailSignIn = async () => {
    if (!email || !password) {
      addToast('Please enter email and password', 'error')
      return
    }

    setLoading(true)
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        addToast('Invalid email, password, or unverified account', 'error')
        return
      }

      router.push(callbackUrl)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Logo size={56} />
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-3">Bloomkite</h1>
          <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
          <p className="mt-3 text-gray-600 text-lg">
            Start your journey to financial freedom
          </p>
        </div>

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
              onKeyDown={(e) => e.key === 'Enter' && handleEmailSignIn()}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition disabled:bg-gray-100"
            />
            <button
              onClick={handleEmailSignIn}
              disabled={loading}
              className="btn-primary w-full py-3 text-lg"
            >
              {loading ? 'Signing in...' : 'Sign In with Email'}
            </button>
            <div className="text-right">
              <a
                href="/auth/forgot-password"
                className="text-sm text-blue-600 font-semibold hover:underline"
              >
                Forgot password?
              </a>
            </div>
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
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 c0-3.331,2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.461,2.268,15.365,1.25,12.545,1.25 c-6.343,0-11.5,5.157-11.5,11.5c0,6.343,5.157,11.5,11.5,11.5c11.5,0,11.5-11.5,11.5-11.5" />
            </svg>
            <span>Sign in with Google</span>
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
            onClick={() => router.push('/auth/signup')}
            className="btn-primary w-full text-lg"
          >
            Create Account
          </button>
        </div>

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

export default function SignIn() {
  return (
    <Suspense fallback={null}>
      <SignInContent />
    </Suspense>
  )
}
