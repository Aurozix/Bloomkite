'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

import { PageShell } from '@/app/components/PageShell'
import { PageHeader } from '@/app/components/PageHeader'
import { useToast } from '@/app/components/toast-context'

interface Row {
  id: string
  contactName: string
  contactEmail: string
  category: string
  subject: string
  body: string
  status: 'OPEN' | 'RESOLVED'
  resolverNote: string | null
  createdAt: string
  resolvedAt: string | null
  user: { id: string; email: string; name: string | null } | null
  resolver: { id: string; email: string; name: string | null } | null
}

const STATUS_PILL: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-800',
  RESOLVED: 'bg-green-100 text-green-800',
}

export default function AdminSupportPage() {
  const { addToast } = useToast()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'open' | 'all'>('open')
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({})
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`/api/admin/support?status=${filter}`)
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

  const act = async (id: string, action: 'resolve' | 'reopen') => {
    setBusyId(id)
    try {
      const r = await fetch(`/api/admin/support/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note: noteDraft[id]?.trim() }),
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
          title="Support / grievance queue"
          subtitle="Triage user-submitted requests (BRD §12.5)."
        />

        <div className="mb-4 flex items-center gap-2">
          {(['open', 'all'] as const).map((s) => (
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
            {rows.map((r) => {
              const isOpen = expanded[r.id]
              return (
                <div key={r.id} className="card p-5">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded ${STATUS_PILL[r.status]}`}
                        >
                          {r.status}
                        </span>
                        <span className="text-xs text-ink-500 font-data">{r.category}</span>
                        <span className="text-xs text-ink-500">
                          {new Date(r.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="font-semibold text-forest-700">{r.subject}</p>
                      <p className="text-xs text-ink-500">
                        {r.contactName} · <a href={`mailto:${r.contactEmail}`} className="underline">{r.contactEmail}</a>
                        {r.user && <> · signed-in user</>}
                      </p>
                    </div>
                    <button
                      onClick={() => setExpanded({ ...expanded, [r.id]: !isOpen })}
                      className="text-xs text-forest-500 hover:underline"
                    >
                      {isOpen ? 'Hide' : 'Show'} body
                    </button>
                  </div>
                  {isOpen && (
                    <pre className="text-sm text-ink-700 whitespace-pre-wrap bg-ink-50 p-3 rounded mt-2">
                      {r.body}
                    </pre>
                  )}
                  {r.resolverNote && (
                    <p className="text-sm text-ink-500 italic mt-2">
                      Resolved by {r.resolver?.email}: {r.resolverNote}
                    </p>
                  )}
                  {r.status === 'OPEN' && (
                    <div className="mt-3 border-t border-ink-200 pt-3 space-y-2">
                      <input
                        type="text"
                        placeholder="Resolution note (optional)"
                        value={noteDraft[r.id] ?? ''}
                        onChange={(e) => setNoteDraft({ ...noteDraft, [r.id]: e.target.value })}
                        className="input-modern w-full text-sm"
                      />
                      <button
                        onClick={() => act(r.id, 'resolve')}
                        disabled={busyId === r.id}
                        className="btn-primary px-3 py-1 text-sm"
                      >
                        Mark resolved
                      </button>
                    </div>
                  )}
                  {r.status === 'RESOLVED' && (
                    <div className="mt-3 border-t border-ink-200 pt-3">
                      <button
                        onClick={() => act(r.id, 'reopen')}
                        disabled={busyId === r.id}
                        className="btn-outline px-3 py-1 text-sm"
                      >
                        Reopen
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </PageShell>
    </div>
  )
}
