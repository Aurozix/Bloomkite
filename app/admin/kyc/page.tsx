'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

import { PageShell } from '@/app/components/PageShell'
import { PageHeader } from '@/app/components/PageHeader'
import { useToast } from '@/app/components/toast-context'

interface Row {
  id: string
  userId: string
  panLast4: string
  aadhaarLast4: string | null
  fullNameOnPan: string | null
  status: 'PENDING' | 'VERIFIED' | 'REJECTED'
  rejectionReason: string | null
  createdAt: string
  user: { id: string; email: string; name: string | null }
}

const STATUS_PILL: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  VERIFIED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
}

export default function AdminKycPage() {
  const { addToast } = useToast()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'pending' | 'all'>('pending')
  const [reasonDraft, setReasonDraft] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`/api/admin/kyc?status=${filter}`)
      const j = await r.json()
      if (!r.ok) {
        addToast(j.error || 'Failed to load', 'error')
        return
      }
      setRows(j.records ?? [])
    } finally {
      setLoading(false)
    }
  }, [filter, addToast])

  useEffect(() => {
    load()
  }, [load])

  const act = async (id: string, action: 'verify' | 'reject') => {
    const reason = reasonDraft[id]?.trim()
    if (action === 'reject' && !reason) {
      addToast('Reason required for rejection', 'error')
      return
    }
    setBusyId(id)
    try {
      const r = await fetch(`/api/admin/kyc/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      })
      const j = await r.json()
      if (!r.ok) {
        addToast(j.error || 'Action failed', 'error')
        return
      }
      addToast(`Status: ${j.status}`, 'success')
      await load()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <PageShell bucket="index" surface="list">
        <Link
          href="/admin"
          className="text-sm text-forest-500 font-semibold hover:underline inline-block mb-6"
        >
          ← Back to Admin
        </Link>
        <PageHeader
          eyebrow="Admin"
          title="KYC verification queue"
          subtitle="Verify PAN / Aadhaar submissions (BRD §12.4). We only see hashes + last-4 digits — full IDs are never stored in the DB."
        />

        <div className="mb-4 flex items-center gap-2">
          {(['pending', 'all'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1 text-sm font-semibold rounded ${
                filter === s
                  ? 'bg-forest-400 text-paper'
                  : 'border border-ink-200 text-ink-600 hover:bg-ink-100'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-center text-ink-400 py-12">Loading…</p>
        ) : rows.length === 0 ? (
          <div className="card p-12 text-center text-ink-400">No matching records.</div>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <div key={r.id} className="card p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded ${STATUS_PILL[r.status]}`}
                      >
                        {r.status}
                      </span>
                      <span className="text-xs text-ink-500">
                        Submitted {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="font-semibold text-forest-700">
                      {r.user.name || r.user.email}
                    </p>
                    <p className="text-xs text-ink-500">{r.user.email}</p>
                    <p className="text-sm text-ink-700 mt-2">
                      PAN ending in <code className="font-data">{r.panLast4}</code>
                      {r.aadhaarLast4 && (
                        <>
                          {' '}· Aadhaar ending in{' '}
                          <code className="font-data">{r.aadhaarLast4}</code>
                        </>
                      )}
                      {r.fullNameOnPan && <> · Name: {r.fullNameOnPan}</>}
                    </p>
                    {r.rejectionReason && (
                      <p className="text-sm text-red-700 mt-1">
                        Previously rejected: {r.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>

                {r.status === 'PENDING' && (
                  <div className="mt-3 space-y-2 border-t border-ink-200 pt-3">
                    <input
                      type="text"
                      placeholder="Reason (required if rejecting)"
                      value={reasonDraft[r.id] ?? ''}
                      onChange={(e) => setReasonDraft({ ...reasonDraft, [r.id]: e.target.value })}
                      className="input-modern w-full text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => act(r.id, 'verify')}
                        disabled={busyId === r.id}
                        className="btn-primary px-3 py-1 text-sm"
                      >
                        Verify
                      </button>
                      <button
                        onClick={() => act(r.id, 'reject')}
                        disabled={busyId === r.id}
                        className="btn-outline px-3 py-1 text-sm"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </PageShell>
    </div>
  )
}
