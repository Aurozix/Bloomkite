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
    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/select-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole }),
      })
      if (!res.ok) {
        const err = await res.json()
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
          <button
            onClick={handleRoleSelect}
            disabled={!selectedRole || submitting}
            className="btn-primary w-full text-lg"
          >
            {submitting ? 'Setting up your account...' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}
