'use client'

import { useState } from 'react'
import { Logo } from '@/app/components/Logo'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async () => {
    if (!email) return
    setLoading(true)
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setSubmitted(true)
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
          <h1 className="text-3xl font-bold text-gray-900">Reset your password</h1>
        </div>

        <div className="card p-8 space-y-6">
          {submitted ? (
            <>
              <p className="text-gray-700">
                If an account exists for <strong>{email}</strong>, we&apos;ve sent a
                password reset link. Check your email.
              </p>
              <a href="/auth/signin" className="btn-outline w-full text-center">
                Back to sign in
              </a>
            </>
          ) : (
            <>
              <p className="text-gray-600">
                Enter your account email and we&apos;ll send you a link to reset your
                password.
              </p>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition disabled:bg-gray-100"
              />
              <button
                onClick={handleSubmit}
                disabled={loading || !email}
                className="btn-primary w-full py-3 text-lg"
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
              <a
                href="/auth/signin"
                className="block text-center text-sm text-blue-600 font-semibold hover:underline"
              >
                Back to sign in
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
