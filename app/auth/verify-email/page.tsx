'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Logo } from '@/app/components/Logo'
import { useToast } from '@/app/components/toast-context'

const RESEND_COOLDOWN_SECONDS = 30

function VerifyEmailContent() {
  const router = useRouter()
  const { addToast } = useToast()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const initialError = searchParams.get('error')

  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [submitting, setSubmitting] = useState(false)
  const [resendIn, setResendIn] = useState(0)
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    if (initialError === 'link_no_longer_supported') {
      addToast(
        'Verification links are no longer used. Enter the 6-digit code from your latest email below.',
        'info',
      )
    }
  }, [initialError, addToast])

  useEffect(() => {
    if (resendIn <= 0) return
    const t = setTimeout(() => setResendIn((n) => n - 1), 1000)
    return () => clearTimeout(t)
  }, [resendIn])

  const updateDigit = (idx: number, value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 1)
    setDigits((prev) => {
      const next = [...prev]
      next[idx] = cleaned
      return next
    })
    if (cleaned && idx < 5) inputRefs.current[idx + 1]?.focus()
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 0) return
    e.preventDefault()
    const next = ['', '', '', '', '', '']
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i]
    setDigits(next)
    const focusIdx = Math.min(pasted.length, 5)
    inputRefs.current[focusIdx]?.focus()
  }

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus()
    }
    if (e.key === 'Enter') handleSubmit()
  }

  const handleSubmit = async () => {
    const code = digits.join('')
    if (code.length !== 6) {
      addToast('Enter all 6 digits', 'error')
      return
    }
    if (!email) {
      addToast('Missing email. Please sign up again.', 'error')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        addToast('Email verified. Please sign in.', 'success')
        router.push('/auth/signin?verified=1')
        return
      }
      if (data.code === 'no_active_otp') {
        addToast('Code expired. Request a new one below.', 'error')
        setDigits(['', '', '', '', '', ''])
        return
      }
      if (data.code === 'wrong_code' && typeof data.attemptsRemaining === 'number') {
        addToast(
          data.attemptsRemaining > 0
            ? `Incorrect code. ${data.attemptsRemaining} attempt${
                data.attemptsRemaining === 1 ? '' : 's'
              } remaining.`
            : 'Too many wrong attempts. Request a new code.',
          'error',
        )
        return
      }
      addToast(data.error || 'Verification failed', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleResend = async () => {
    if (resendIn > 0 || !email) return
    setResendIn(RESEND_COOLDOWN_SECONDS)
    try {
      await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      addToast('A new code is on its way.', 'success')
      setDigits(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } catch {
      addToast('Could not send a new code. Try again shortly.', 'error')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center mb-6">
          <Logo size={56} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Enter your code</h1>
        <p className="text-gray-600 mb-8">
          {email ? (
            <>
              We sent a 6-digit code to <strong>{email}</strong>. Enter it below to verify
              your email.
            </>
          ) : (
            'We sent you a 6-digit verification code.'
          )}
        </p>

        <div className="card p-8 mb-6">
          <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputRefs.current[i] = el
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={d}
                onChange={(e) => updateDigit(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                disabled={submitting}
                className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
              />
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting || digits.join('').length !== 6}
            className="btn-primary w-full py-3 text-lg mb-3"
          >
            {submitting ? 'Verifying...' : 'Verify'}
          </button>

          <button
            onClick={handleResend}
            disabled={resendIn > 0 || !email}
            className="text-sm text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline"
          >
            {resendIn > 0
              ? `Resend code in ${resendIn}s`
              : "Didn't get it? Send a new code"}
          </button>
        </div>

        <a href="/auth/signin" className="text-sm text-gray-500 hover:text-gray-700">
          Back to sign in
        </a>
      </div>
    </div>
  )
}

export default function VerifyEmail() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  )
}
