'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

import { PageShell } from '@/app/components/PageShell'
import { PageHeader } from '@/app/components/PageHeader'
import { useToast } from '@/app/components/toast-context'

interface Row {
  id: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED'
  reason: string | null
  reviewerNote: string | null
  createdAt: string
  reviewedAt: string | null
  user: { id: string; email: string; name: string | null; createdAt: string }
  reviewer: { id: string; email: string; name: string | null } | null
}

const STATUS_PILL: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  REJECTED: 'bg-gray-100 text-gray-700',
  COMPLETED: 'bg-red-100 text-red-800',
}

export default function AdminDataDeletionPage() {
  const { addToast } = useToast()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'pending' | 'all'>('pending')
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`/api/admin/data-deletion?status=${filter}`)
      const j = await r.json()
      if (!r.ok) {
        addToast(j.error || 'Failed to load', 'error')
        return
      }
      setRows(j.requests ?? [])
    } finally {
      setLoading(false)
    }
  }, [filter, addToast])

  useEffect(() => {
    load()
  }, [load])

  const act = async (id: string, action: 'approve' | 'reject' | 'complete') => {
    const note = noteDraft[id]?.trim()
    if (action === 'reject' && !note) {
      addToast('Note required for rejection', 'error')
      return
    }
    if (action === 'complete' && !confirm('Permanently delete this user account?')) return
    setBusyId(id)
    try {
      const r = await fetch(`/api/admin/data-deletion/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note }),
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
          title="Right-to-delete queue"
          subtitle="Review user-initiated account-deletion requests (BRD §13.3)."
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
          <div className="card p-12 text-center text-ink-400">No matching requests.</div>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <div key={r.id} className="card p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded ${STATUS_PILL[r.status]}`}
                      >
                        {r.status}
                      </span>
                      <span className="text-xs text-ink-500">
                        Submitted {new Date(r.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="font-semibold text-forest-700">
                      {r.user.name || r.user.email}
                    </p>
                    <p className="text-xs text-ink-500">
                      {r.user.email} · joined {new Date(r.user.createdAt).toLocaleDateString()}
                    </p>
                    {r.reason && (
                      <p className="text-sm text-ink-700 mt-2">
                        <span className="font-semibold">Reason:</span> {r.reason}
                      </p>
                    )}
                    {r.reviewerNote && (
                      <p className="text-sm text-ink-500 italic mt-1">
                        Reviewer ({r.reviewer?.email}): {r.reviewerNote}
                      </p>
                    )}
                  </div>
                </div>

                {(r.status === 'PENDING' || r.status === 'APPROVED') && (
                  <div className="mt-3 space-y-2 border-t border-ink-200 pt-3">
                    {r.status === 'PENDING' && (
                      <input
                        type="text"
                        placeholder="Optional note for approve / required for reject"
                        value={noteDraft[r.id] ?? ''}
                        onChange={(e) =>
                          setNoteDraft({ ...noteDraft, [r.id]: e.target.value })
                        }
                        className="input-modern w-full text-sm"
                      />
                    )}
                    <div className="flex gap-2">
                      {r.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => act(r.id, 'approve')}
                            disabled={busyId === r.id}
                            className="btn-primary px-3 py-1 text-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => act(r.id, 'reject')}
                            disabled={busyId === r.id}
                            className="btn-outline px-3 py-1 text-sm"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {r.status === 'APPROVED' && (
                        <button
                          onClick={() => act(r.id, 'complete')}
                          disabled={busyId === r.id}
                          className="px-4 py-1 text-sm rounded-bk-md bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50"
                        >
                          Complete (delete user permanently)
                        </button>
                      )}
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
