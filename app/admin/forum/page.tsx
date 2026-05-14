'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  LockClosedIcon,
  LockOpenIcon,
  TrashIcon,
  EyeIcon,
} from '@heroicons/react/24/outline'

import { PageShell } from '@/app/components/PageShell'
import { PageHeader } from '@/app/components/PageHeader'
import { useToast } from '@/app/components/toast-context'

interface QuestionRow {
  id: string
  title: string
  content: string
  status: string
  created_at: string
  answer_count: number
  tagged_advisor_count: number
  author: { id: string; email: string; name: string | null } | null
}

type StatusFilter = 'all' | 'open' | 'closed'

const STATUS_PILL: Record<string, string> = {
  open: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-600',
}

export default function AdminForumPage() {
  const { addToast } = useToast()
  const [rows, setRows] = useState<QuestionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q.trim()) params.set('q', q.trim())
      params.set('status', status)
      params.set('limit', '50')
      const resp = await fetch(`/api/admin/forum/questions?${params.toString()}`)
      const json = await resp.json()
      if (!resp.ok) {
        addToast(json.error || 'Failed to load', 'error')
        return
      }
      setRows(json.data ?? [])
    } finally {
      setLoading(false)
    }
  }, [q, status, addToast])

  useEffect(() => {
    load()
  }, [load])

  const onLock = async (id: string, currentStatus: string) => {
    setBusy(id)
    try {
      const method = currentStatus === 'closed' ? 'DELETE' : 'POST'
      const resp = await fetch(`/api/admin/forum/questions/${id}/lock`, { method })
      if (!resp.ok) {
        addToast('Action failed', 'error')
        return
      }
      addToast(currentStatus === 'closed' ? 'Reopened' : 'Locked', 'success')
      await load()
    } finally {
      setBusy(null)
    }
  }

  const onDelete = async (id: string) => {
    if (!confirm('Permanently delete this question + all its answers?')) return
    setBusy(id)
    try {
      const resp = await fetch(`/api/admin/forum/questions/${id}`, { method: 'DELETE' })
      if (!resp.ok) {
        addToast('Delete failed', 'error')
        return
      }
      addToast('Question deleted', 'success')
      await load()
    } finally {
      setBusy(null)
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
          title="Forum moderation"
          subtitle="Lock off-topic questions (preserves history) or delete (cascades to answers + tags). Locked questions disappear from the public forum."
        />

        <form
          onSubmit={(e) => {
            e.preventDefault()
            load()
          }}
          className="card p-4 mb-6 flex flex-wrap gap-3 items-end"
        >
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-400 mb-2">
              Search
            </label>
            <input
              className="input-modern w-full"
              placeholder="Title or content fragment…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-400 mb-2">
              Status
            </label>
            <div className="flex rounded-bk-md border border-ink-200 overflow-hidden">
              {(['all', 'open', 'closed'] as const).map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`px-3 py-2 text-sm font-semibold ${
                    status === s
                      ? 'bg-forest-400 text-paper'
                      : 'bg-paper text-ink-600 hover:bg-ink-100'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" className="btn-primary">
            Search
          </button>
        </form>

        {loading ? (
          <p className="text-center text-ink-400 py-12">Loading…</p>
        ) : rows.length === 0 ? (
          <div className="card p-12 text-center text-ink-400">No questions match.</div>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <div key={r.id} className="card p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${STATUS_PILL[r.status] ?? ''}`}
                      >
                        {r.status}
                      </span>
                      <span className="text-xs text-ink-400">
                        {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="font-semibold text-forest-700">{r.title}</h3>
                    <p className="text-sm text-ink-600 mt-1 line-clamp-2">{r.content}</p>
                    <p className="text-xs text-ink-500 mt-2">
                      By <span className="font-medium">{r.author?.name || r.author?.email}</span>
                      {' · '}
                      {r.answer_count} answer{r.answer_count === 1 ? '' : 's'}
                      {r.tagged_advisor_count > 0 && (
                        <> · {r.tagged_advisor_count} advisor tag{r.tagged_advisor_count === 1 ? '' : 's'}</>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/forum/questions/${r.id}`}
                      target="_blank"
                      className="text-forest-500 hover:bg-ink-100 p-2 rounded"
                      title="Open public view"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => onLock(r.id, r.status)}
                      disabled={busy === r.id}
                      className="text-amber-700 hover:bg-amber-50 p-2 rounded disabled:opacity-50"
                      title={r.status === 'closed' ? 'Reopen' : 'Lock'}
                    >
                      {r.status === 'closed' ? (
                        <LockOpenIcon className="h-4 w-4" />
                      ) : (
                        <LockClosedIcon className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => onDelete(r.id)}
                      disabled={busy === r.id}
                      className="text-red-600 hover:bg-red-50 p-2 rounded disabled:opacity-50"
                      title="Delete permanently"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </PageShell>
    </div>
  )
}
