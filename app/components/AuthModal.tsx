'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Modal } from './Modal'
import { useAuthModal } from './auth-modal-context'
import { useToast } from './toast-context'

// AuthModal — the primary surface for sign-in and sign-up across the app.
// Brand-aligned from the start (uses globals.css .input-modern, .btn-primary,
// brand tokens for colors/radii). The legacy /auth/signin and /auth/signup
// pages remain as fallback surfaces for email-verification deep links and
// middleware-redirected gated routes; they will be cleaned up in a separate
// pass. See docs/layout/standard.md for layout standards.

const TITLE_ID = 'auth-modal-title'

export function AuthModal() {
  const { open, mode, openModal, closeModal } = useAuthModal()
  const router = useRouter()
  const { addToast } = useToast()

  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')

  // Reset form state when the modal opens so reopening doesn't show stale
  // values. We intentionally don't reset when closing — animations get the
  // freedom to run cleanly.
  useEffect(() => {
    if (open) {
      setEmail('')
      setPassword('')
      setName('')
      setDateOfBirth('')
      setLoading(false)
    }
  }, [open, mode])

  const isSignIn = mode === 'signin'

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
        addToast(messageForAuthError(result.error), 'error')
        return
      }
      closeModal()
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const handleEmailSignUp = async () => {
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
        body: JSON.stringify({
          name,
          email,
          password,
          ...(dateOfBirth ? { dateOfBirth } : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        addToast(data.error || 'Sign-up failed', 'error')
        return
      }
      closeModal()
      router.push('/auth/verify-email?email=' + encodeURIComponent(email))
    } catch {
      addToast('An unexpected error occurred', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    // signIn navigates the browser to Google and returns via the auth callback;
    // we don't need to closeModal() here — the page transitions away.
    await signIn('google', { callbackUrl: window.location.pathname })
  }

  const handleSubmit = isSignIn ? handleEmailSignIn : handleEmailSignUp

  return (
    <Modal open={open} onClose={closeModal} labelledBy={TITLE_ID}>
      <button
        onClick={closeModal}
        aria-label="Close"
        className="absolute top-4 right-4 p-1 rounded-bk-sm text-ink-400 hover:text-ink-900 hover:bg-ink-100 transition-colors"
      >
        <XMarkIcon className="h-5 w-5" />
      </button>

      <div className="p-8">
        <h2
          id={TITLE_ID}
          className="font-serif text-2xl md:text-3xl font-medium text-forest-700 leading-tight tracking-tight mb-1"
        >
          {isSignIn ? 'Welcome back' : 'Create your account'}
        </h2>
        <p className="text-sm text-ink-600 mb-6">
          {isSignIn
            ? 'Sign in to manage your advisors and calculators.'
            : 'Bloomkite is for adults — 18 or older.'}
        </p>

        <div className="space-y-3">
          {!isSignIn && (
            <input
              type="text"
              placeholder="Full name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              className="input-modern"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            autoComplete={isSignIn ? 'email' : 'email'}
            className="input-modern"
          />
          <input
            type="password"
            placeholder={isSignIn ? 'Password' : 'Password (min 8 characters)'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            autoComplete={isSignIn ? 'current-password' : 'new-password'}
            className="input-modern"
          />
          {!isSignIn && (
            <div>
              <label className="block text-xs font-semibold text-ink-600 mb-1">
                Date of birth (optional — required to activate your profile)
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                disabled={loading}
                max={new Date().toISOString().split('T')[0]}
                className="input-modern"
              />
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary w-full disabled:opacity-60"
          >
            {loading
              ? isSignIn
                ? 'Signing in…'
                : 'Creating account…'
              : isSignIn
              ? 'Sign in'
              : 'Create account'}
          </button>

          {isSignIn && (
            <div className="text-right">
              <a
                href="/auth/forgot-password"
                onClick={closeModal}
                className="text-sm text-forest-500 font-semibold hover:underline"
              >
                Forgot password?
              </a>
            </div>
          )}
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-ink-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-white text-ink-400 text-xs font-medium uppercase tracking-wider">
              or
            </span>
          </div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="btn-outline w-full flex items-center justify-center gap-3 disabled:opacity-60"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span>{isSignIn ? 'Sign in with Google' : 'Sign up with Google'}</span>
        </button>

        <p className="text-center text-sm text-ink-600 mt-6">
          {isSignIn ? (
            <>
              New to Bloomkite?{' '}
              <button
                type="button"
                onClick={() => openModal('signup')}
                className="text-forest-500 font-semibold hover:underline"
              >
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => openModal('signin')}
                className="text-forest-500 font-semibold hover:underline"
              >
                Sign in
              </button>
            </>
          )}
        </p>

        {!isSignIn && (
          <p className="text-center text-xs text-ink-400 mt-4">
            By creating an account, you agree to our{' '}
            <a href="/legal/terms" className="hover:underline">
              Terms
            </a>{' '}
            and{' '}
            <a href="/legal/privacy" className="hover:underline">
              Privacy Policy
            </a>
            .
          </p>
        )}
      </div>
    </Modal>
  )
}

// Mirrors the mapping in app/auth/signin/page.tsx. When that page is retired
// or refactored to share form code with the modal, consolidate this into a
// single shared helper.
function messageForAuthError(code: string): string {
  switch (code) {
    case 'CredentialsSignin':
      return 'Email or password is incorrect.'
    case 'AccessDenied':
      return 'Account is disabled or email is not verified. Check your inbox.'
    case 'Configuration':
      return 'Auth is misconfigured on this server.'
    case 'Verification':
      return 'Verification token is invalid or expired.'
    case 'MissingCSRF':
      return 'Your session is stale. Clear site cookies and try again.'
    default:
      return `Sign-in failed (${code}).`
  }
}
