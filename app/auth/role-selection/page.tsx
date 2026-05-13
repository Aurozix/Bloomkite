'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import { WalletIcon, BriefcaseIcon } from '@heroicons/react/24/outline'
import { Logo } from '@/app/components/Logo'
import { useToast } from '@/app/components/toast-context'

export default function RoleSelection() {
  const router = useRouter()
  const { data: session, status, update } = useSession()
  const { addToast } = useToast()
  const [selectedRole, setSelectedRole] = useState<'investor' | 'advisor' | null>(null)
  const [submitting, setSubmitting] = useState(false)
  // BRD §8.1 — Adults Only. DOB may have been entered at signup, in which
  // case the activation API uses what's already on the user record and the
  // form below stays hidden. We reveal it lazily when the server tells us
  // it's missing (`code: 'dob_required'`).
  const [needsDOB, setNeedsDOB] = useState(false)
  const [dateOfBirth, setDateOfBirth] = useState('')

  // BRD §8.1 — Phone OTP. Same lazy-reveal pattern: the server returns
  // `code: 'phone_required'` if there's no verified phone on the user yet,
  // and we expand a phone+OTP block right here on the role-selection page.
  const [needsPhone, setNeedsPhone] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [phoneSent, setPhoneSent] = useState(false)
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [phoneCode, setPhoneCode] = useState('')
  const [phoneBusy, setPhoneBusy] = useState(false)
  const [debugCode, setDebugCode] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
    if (status === 'authenticated' && session.user.roles.length > 0) {
      router.push('/dashboard')
    }
  }, [status, session, router])

  const handleRoleSelect = async () => {
    if (!selectedRole) return
    if (needsDOB && !dateOfBirth) {
      addToast('Date of birth is required', 'error')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/select-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: selectedRole,
          ...(dateOfBirth ? { dateOfBirth } : {}),
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        if (err.code === 'phone_required') {
          setNeedsPhone(true)
          addToast('Please verify your phone number first', 'info')
          return
        }
        if (err.code === 'dob_required') {
          setNeedsDOB(true)
          addToast('Please enter your date of birth', 'info')
          return
        }
        addToast(err.error || 'Failed to assign role', 'error')
        return
      }
      // Refresh JWT so the new role + currentRole land in the session.
      await update({ currentRole: selectedRole })
      router.push('/dashboard')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSendPhoneCode = async () => {
    if (!phoneNumber.trim()) {
      addToast('Enter your phone number', 'error')
      return
    }
    setPhoneBusy(true)
    setDebugCode(null)
    try {
      const res = await fetch('/api/auth/phone-otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        addToast(data.error || 'Could not send code', 'error')
        return
      }
      setPhoneSent(true)
      setPhoneCode('')
      if (data.phoneNumber) setPhoneNumber(data.phoneNumber)
      if (data.debugCode) setDebugCode(data.debugCode)
      addToast('Verification code sent', 'success')
    } finally {
      setPhoneBusy(false)
    }
  }

  const handleVerifyPhoneCode = async () => {
    if (!/^\d{6}$/.test(phoneCode)) {
      addToast('Enter the 6-digit code', 'error')
      return
    }
    setPhoneBusy(true)
    try {
      const res = await fetch('/api/auth/phone-otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: phoneCode }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        addToast(data.error || 'Verification failed', 'error')
        return
      }
      setPhoneVerified(true)
      setDebugCode(null)
      addToast('Phone verified', 'success')
    } finally {
      setPhoneBusy(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-forest-400 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Logo size={56} />
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-3">Welcome to Bloomkite</h1>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Choose Your Role</h2>
          <p className="text-lg text-gray-600">
            Welcome {session?.user.name || 'User'}! Select how you'd like to use Bloomkite.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => setSelectedRole('investor')}
            className={`card p-8 text-left transition-all ${
              selectedRole === 'investor' ? 'shadow-lg' : 'hover:shadow-lg'
            }`}
            style={
              selectedRole === 'investor'
                ? { outline: '2px solid var(--primary-600)', outlineOffset: '-2px' }
                : {}
            }
          >
            <WalletIcon className="h-16 w-16 mb-4" style={{ color: 'var(--primary-600)' }} />
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Investor</h3>
            <p className="text-gray-600 mb-6">
              Seek financial advice, use powerful calculators, and connect with trusted advisors
            </p>
            <ul className="space-y-3">
              {['Access 15 financial calculators', 'Discover verified advisors', 'Share plans for feedback', 'Learn from expert articles'].map((t) => (
                <li key={t} className="flex items-center gap-2 text-gray-700">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </button>

          <button
            onClick={() => setSelectedRole('advisor')}
            className={`card p-8 text-left transition-all ${
              selectedRole === 'advisor' ? 'shadow-lg' : 'hover:shadow-lg'
            }`}
            style={
              selectedRole === 'advisor'
                ? { outline: '2px solid var(--secondary-600)', outlineOffset: '-2px' }
                : {}
            }
          >
            <BriefcaseIcon className="h-16 w-16 mb-4" style={{ color: 'var(--secondary-600)' }} />
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Advisor</h3>
            <p className="text-gray-600 mb-6">
              Build credibility, reach clients, and publish your expertise
            </p>
            <ul className="space-y-3">
              {['Create verified profile', 'Upload credentials', 'Publish articles', 'Receive shared plans'].map((t) => (
                <li key={t} className="flex items-center gap-2 text-gray-700">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </button>
        </div>

        <div className="space-y-3">
          {needsPhone && !phoneVerified && (
            <div className="card p-6 mb-2 border-2" style={{ borderColor: 'var(--primary-200, #cbd5e1)' }}>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Verify your phone number
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                We need a verified mobile number before activating your profile (BRD §8.1).
                You&apos;ll receive a 6-digit code via SMS.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Phone number (with country code)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      disabled={phoneBusy || phoneSent}
                      placeholder="+91 98765 43210"
                      className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition disabled:bg-gray-100"
                    />
                    <button
                      onClick={handleSendPhoneCode}
                      disabled={phoneBusy || phoneSent}
                      className="btn-secondary px-4 py-3 whitespace-nowrap"
                    >
                      {phoneSent ? 'Sent' : 'Send code'}
                    </button>
                  </div>
                  {phoneSent && (
                    <button
                      onClick={() => {
                        setPhoneSent(false)
                        setPhoneCode('')
                        setDebugCode(null)
                      }}
                      className="mt-1 text-xs text-blue-600 hover:underline"
                    >
                      Use a different number
                    </button>
                  )}
                </div>

                {phoneSent && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      6-digit code
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        value={phoneCode}
                        onChange={(e) =>
                          setPhoneCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                        }
                        disabled={phoneBusy}
                        placeholder="123456"
                        className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition text-center text-lg tracking-widest disabled:bg-gray-100"
                      />
                      <button
                        onClick={handleVerifyPhoneCode}
                        disabled={phoneBusy || phoneCode.length !== 6}
                        className="btn-primary px-4 py-3 whitespace-nowrap"
                      >
                        Verify
                      </button>
                    </div>
                    {debugCode && (
                      <p className="mt-2 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
                        Dev mode: code is <strong>{debugCode}</strong>. Real SMS is not wired
                        yet — see lib/sms/provider.ts.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          {needsPhone && phoneVerified && (
            <div className="rounded-lg p-3 mb-2 bg-green-50 border border-green-200 text-sm text-green-800">
              ✓ Phone verified. Pick a role and continue.
            </div>
          )}
          {needsDOB && (
            <div className="card p-6 mb-2 border-2" style={{ borderColor: 'var(--primary-200, #cbd5e1)' }}>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date of birth
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition"
              />
              <p className="mt-2 text-xs text-gray-500">
                Bloomkite is for adults only — you must be 18 or older to activate a profile.
              </p>
            </div>
          )}
          <button
            onClick={handleRoleSelect}
            disabled={
              !selectedRole ||
              submitting ||
              (needsDOB && !dateOfBirth) ||
              (needsPhone && !phoneVerified)
            }
            className="btn-primary w-full text-lg"
          >
            {submitting ? 'Setting up your account...' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}
