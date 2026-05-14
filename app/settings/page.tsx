'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { PageShell } from '@/app/components/PageShell'
import { PageHeader } from '@/app/components/PageHeader'
import { useToast } from '@/app/components/toast-context'

interface KycRecord {
  id: string
  panLast4: string
  aadhaarLast4: string | null
  fullNameOnPan: string | null
  status: 'PENDING' | 'VERIFIED' | 'REJECTED'
  rejectionReason: string | null
  createdAt: string
  updatedAt: string
  verifiedAt: string | null
}

interface DeletionRequest {
  id: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED'
  reason: string | null
  reviewerNote: string | null
  createdAt: string
  reviewedAt: string | null
  completedAt: string | null
}

const KYC_STATUS_PILL: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  VERIFIED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
}

const DEL_STATUS_PILL: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  REJECTED: 'bg-gray-100 text-gray-700',
  COMPLETED: 'bg-red-100 text-red-800',
}

export default function SettingsPage() {
  const router = useRouter()
  const { addToast } = useToast()

  const [loading, setLoading] = useState(true)
  const [kyc, setKyc] = useState<KycRecord | null>(null)
  const [deletionRequests, setDeletionRequests] = useState<DeletionRequest[]>([])

  // KYC form state
  const [pan, setPan] = useState('')
  const [aadhaar, setAadhaar] = useState('')
  const [fullName, setFullName] = useState('')
  const [submittingKyc, setSubmittingKyc] = useState(false)

  // Deletion request state
  const [deletionReason, setDeletionReason] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [submittingDelete, setSubmittingDelete] = useState(false)

  const load = useCallback(async () => {
    try {
      const sessionResp = await fetch('/api/auth/session')
      const sessionData = await sessionResp.json()
      if (!sessionData.user) {
        router.push('/auth/signin')
        return
      }
      const [kycResp, delResp] = await Promise.all([
        fetch('/api/settings/kyc'),
        fetch('/api/settings/data-deletion'),
      ])
      if (kycResp.ok) {
        const j = await kycResp.json()
        setKyc(j.record)
      }
      if (delResp.ok) {
        const j = await delResp.json()
        setDeletionRequests(j.requests ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    load()
  }, [load])

  const submitKyc = async () => {
    if (!pan.trim()) {
      addToast('PAN is required', 'error')
      return
    }
    setSubmittingKyc(true)
    try {
      const r = await fetch('/api/settings/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pan: pan.trim(),
          aadhaar: aadhaar.trim() || undefined,
          fullNameOnPan: fullName.trim() || undefined,
        }),
      })
      const j = await r.json()
      if (!r.ok) {
        addToast(j.error || 'KYC submission failed', 'error')
        return
      }
      addToast('KYC submitted — awaiting admin verification', 'success')
      setPan('')
      setAadhaar('')
      setFullName('')
      await load()
    } finally {
      setSubmittingKyc(false)
    }
  }

  const submitDeletionRequest = async () => {
    if (!confirmDelete) {
      addToast('Tick the confirmation box first', 'error')
      return
    }
    setSubmittingDelete(true)
    try {
      const r = await fetch('/api/settings/data-deletion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: deletionReason.trim() || undefined }),
      })
      const j = await r.json()
      if (!r.ok) {
        addToast(j.error || 'Failed to submit request', 'error')
        return
      }
      addToast('Deletion request submitted — an admin will review.', 'success')
      setDeletionReason('')
      setConfirmDelete(false)
      await load()
    } finally {
      setSubmittingDelete(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-gray-300 border-t-forest-600 rounded-full" />
      </div>
    )
  }

  const pendingDeletion = deletionRequests.find((r) => r.status === 'PENDING')

  return (
    <PageShell bucket="reading" surface="functional">
      <PageHeader
        eyebrow="Account"
        title="Settings"
        subtitle="Manage your KYC status and account deletion requests."
      />

      {/* KYC section — BRD §12.4 */}
      <section className="card p-6 mb-8">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-serif text-2xl text-forest-700">KYC verification</h2>
          {kyc && (
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded ${KYC_STATUS_PILL[kyc.status]}`}
            >
              {kyc.status}
            </span>
          )}
        </div>

        {kyc ? (
          <div className="mb-4">
            <p className="text-sm text-ink-600 mb-2">
              On file: PAN ending in <code className="font-data">{kyc.panLast4}</code>
              {kyc.aadhaarLast4 && (
                <>
                  {' '}· Aadhaar ending in{' '}
                  <code className="font-data">{kyc.aadhaarLast4}</code>
                </>
              )}
              {kyc.fullNameOnPan && <> · {kyc.fullNameOnPan}</>}
            </p>
            {kyc.status === 'REJECTED' && kyc.rejectionReason && (
              <p className="text-sm text-red-700 mt-2">
                Rejected: {kyc.rejectionReason}. Re-submit to try again.
              </p>
            )}
            {kyc.status === 'VERIFIED' && (
              <p className="text-sm text-green-700 mt-2">
                Verified {new Date(kyc.verifiedAt!).toLocaleDateString()}.
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-ink-500 italic mb-4">
            No KYC on file. Required for premium tier (BRD §12.4); optional otherwise.
          </p>
        )}

        <details className="border border-ink-200 rounded p-4">
          <summary className="cursor-pointer text-sm font-semibold text-forest-700">
            {kyc ? 'Update KYC' : 'Submit KYC'}
          </summary>

          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-ink-500 mb-1">
                PAN (10 chars, e.g. ABCDE1234F)
              </label>
              <input
                type="text"
                value={pan}
                onChange={(e) => setPan(e.target.value)}
                className="input-modern w-full text-sm font-data uppercase"
                maxLength={20}
                placeholder="ABCDE1234F"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-500 mb-1">
                Aadhaar (12 digits, optional)
              </label>
              <input
                type="text"
                value={aadhaar}
                onChange={(e) => setAadhaar(e.target.value)}
                className="input-modern w-full text-sm font-data"
                maxLength={20}
                placeholder="1234 5678 9012"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-500 mb-1">
                Full name on PAN (optional)
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input-modern w-full text-sm"
              />
            </div>
            <p className="text-xs text-ink-500 leading-relaxed">
              We store SHA-256 hashes of these IDs, plus the last four digits in plain form for
              support-style verification. Full IDs are never persisted in the database.
            </p>
            <button
              onClick={submitKyc}
              disabled={submittingKyc || !pan.trim()}
              className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
            >
              {submittingKyc ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        </details>
      </section>

      {/* Right-to-delete — BRD §13.3 */}
      <section className="card p-6 mb-8 border-2 border-red-200">
        <h2 className="font-serif text-2xl text-red-700 mb-3">Delete my account</h2>
        <p className="text-sm text-ink-700 mb-4">
          You can request permanent deletion of your account and most associated data. An admin
          will review and confirm within 30 days. Tax-relevant rows (invoices, audit log entries)
          are retained per the 7-year window described in our{' '}
          <Link href="/privacy" className="text-forest-700 underline">
            Privacy Policy
          </Link>
          .
        </p>

        {pendingDeletion ? (
          <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm">
            <p className="font-semibold text-amber-900">
              You have a pending deletion request from{' '}
              {new Date(pendingDeletion.createdAt).toLocaleDateString()}.
            </p>
            <p className="text-amber-800 mt-1">An admin will review and respond.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-ink-500 mb-1">
                Reason (optional, helps us improve)
              </label>
              <textarea
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                rows={3}
                className="input-modern w-full text-sm"
              />
            </div>
            <label className="flex items-start gap-2 text-sm text-ink-700">
              <input
                type="checkbox"
                checked={confirmDelete}
                onChange={(e) => setConfirmDelete(e.target.checked)}
                className="mt-1 h-4 w-4"
              />
              I understand my account, profile, saved plans, articles, forum content, ratings,
              and follows will be permanently removed once an admin completes my request. This
              action is irreversible.
            </label>
            <button
              onClick={submitDeletionRequest}
              disabled={submittingDelete || !confirmDelete}
              className="px-4 py-2 rounded-bk-md bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50"
            >
              {submittingDelete ? 'Submitting…' : 'Submit deletion request'}
            </button>
          </div>
        )}

        {deletionRequests.length > 0 && (
          <div className="mt-6 pt-4 border-t border-ink-200">
            <h3 className="text-sm font-semibold text-ink-700 mb-2">Past requests</h3>
            <ul className="space-y-2 text-sm">
              {deletionRequests.map((r) => (
                <li key={r.id} className="flex items-center gap-3">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded ${DEL_STATUS_PILL[r.status]}`}
                  >
                    {r.status}
                  </span>
                  <span className="text-ink-600">
                    Submitted {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                  {r.reviewerNote && (
                    <span className="text-ink-500 italic">— {r.reviewerNote}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Cross-links */}
      <section className="card p-6">
        <h2 className="font-serif text-2xl text-forest-700 mb-3">Other</h2>
        <ul className="text-sm text-ink-700 space-y-2">
          <li>
            <Link href="/privacy" className="text-forest-700 underline">
              Privacy Policy
            </Link>{' '}
            — what we collect and how we handle it.
          </li>
          <li>
            <Link href="/terms" className="text-forest-700 underline">
              Terms of Service
            </Link>
          </li>
          <li>
            <Link href="/support" className="text-forest-700 underline">
              Support / Grievance
            </Link>{' '}
            — file an issue or grievance.
          </li>
        </ul>
      </section>
    </PageShell>
  )
}
