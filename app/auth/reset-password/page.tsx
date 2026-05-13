'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Logo } from '@/app/components/Logo'
import { useToast } from '@/app/components/toast-context'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addToast } = useToast()
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!token) {
      addToast('Missing reset token', 'error')
      return
    }
    if (password.length < 8) {
      addToast('Password must be at least 8 characters', 'error')
      return
    }
    if (password !== confirm) {
      addToast('Passwords do not match', 'error')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        addToast(data.error || 'Reset failed', 'error')
        return
      }
      router.push('/auth/signin?reset=1')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid reset link</h1>
          <a href="/auth/forgot-password" className="btn-outline">
            Request a new link
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Logo size={56} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Set a new password</h1>
        </div>

        <div className="card p-8 space-y-4">
          <input
            type="password"
            placeholder="New password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition disabled:bg-gray-100"
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={loading}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition disabled:bg-gray-100"
          />
          <button
            onClick={handleSubmit}
            disabled={loading || !password || !confirm}
            className="btn-primary w-full py-3 text-lg"
          >
            {loading ? 'Updating...' : 'Update password'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ResetPassword() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  )
}
