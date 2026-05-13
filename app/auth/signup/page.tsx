'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/app/components/toast-context'
import { Logo } from '@/app/components/Logo'

export default function SignUp() {
  const router = useRouter()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async () => {
    if (!email || !password) {
      addToast('Email and password are required', 'error')
      return
    }
    if (password.length < 8) {
      addToast('Password must be at least 8 characters', 'error')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        addToast(data.error || 'Sign-up failed', 'error')
        return
      }

      router.push('/auth/check-email?email=' + encodeURIComponent(email))
    } catch {
      addToast('An unexpected error occurred', 'error')
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
          <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
        </div>

        <div className="card p-8 space-y-6 mb-6">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Full name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition disabled:bg-gray-100"
            />
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
              placeholder="Password (min 8 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition disabled:bg-gray-100"
            />
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary w-full py-3 text-lg"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </div>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <a
              href="/auth/signin"
              className="text-blue-600 font-semibold hover:underline"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
