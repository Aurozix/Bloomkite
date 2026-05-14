'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

import { PageShell } from '@/app/components/PageShell'
import { PageHeader } from '@/app/components/PageHeader'
import { useToast } from '@/app/components/toast-context'

interface AuditRow {
  id: string
  action: string
  target_type: string | null
  target_id: string | null
  metadata: unknown
  created_at: string
  actor: { id: string; email: string; name: string | null } | null
}

interface Pagination {
  page: number
  limit: number
  total: number
  total_pages: number
}

const KNOWN_ACTIONS = [
  '',
  'user.disable',
  'user.enable',
  'user.role.add',
  'user.role.remove',
  'user.delete',
  'master_data.create',
  'master_data.update',
  'master_data.deactivate',
  'master_data.reactivate',
  'plan.create',
  'plan.update',
  'plan.delete',
  'forum.question.lock',
  'forum.question.unlock',
  'forum.question.delete',
  'forum.answer.delete',
  'article.bulk_approve',
  'article.bulk_reject',
  'ai_feature.create',
  'ai_feature.toggle',
] as const

const KNOWN_TARGET_TYPES = [
  '',
  'user',
  'plan',
  'master_data',
  'forum_question',
  'forum_answer',
  'article',
  'ai_feature',
] as const

export default function AdminAuditLogPage() {
  const { addToast } = useToast()
  const [rows, setRows] = useState<AuditRow[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  // Filters
  const [actor, setActor] = useState('')
  const [action, setAction] = useState('')
  const [targetType, setTargetType] = useState('')
  const [targetId, setTargetId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (actor.trim()) params.set('actor', actor.trim())
      if (action) params.set('action', action)
      if (targetType) params.set('targetType', targetType)
      if (targetId.trim()) params.set('targetId', targetId.trim())
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      params.set('page', String(page))
      params.set('limit', '50')

      const resp = await fetch(`/api/admin/audit?${params.toString()}`)
      const json = await resp.json()
      if (!resp.ok) {
        addToast(json.error || 'Failed to load audit log', 'error')
        return
      }
      setRows(json.data ?? [])
      setPagination(json.pagination ?? null)
    } finally {
      setLoading(false)
    }
  }, [actor, action, targetType, targetId, from, to, page, addToast])

  useEffect(() => {
    load()
  }, [load])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    load()
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
          title="Audit log"
          subtitle="Append-only record of every admin mutation. Required by BRD §8.5 + §13.2."
        />

        <form onSubmit={onSubmit} className="card p-4 mb-6 grid md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-400 mb-1">
              Actor user-id
            </label>
            <input
              className="input-modern w-full text-sm font-data"
              value={actor}
              onChange={(e) => setActor(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-400 mb-1">
              Action
            </label>
            <select
              className="input-modern w-full text-sm"
              value={action}
              onChange={(e) => setAction(e.target.value)}
            >
              {KNOWN_ACTIONS.map((a) => (
                <option key={a} value={a}>
                  {a || 'any'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-400 mb-1">
              Target type
            </label>
            <select
              className="input-modern w-full text-sm"
              value={targetType}
              onChange={(e) => setTargetType(e.target.value)}
            >
              {KNOWN_TARGET_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t || 'any'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-400 mb-1">
              Target id
            </label>
            <input
              className="input-modern w-full text-sm font-data"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-400 mb-1">
              From
            </label>
            <input
              type="date"
              className="input-modern w-full text-sm"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-400 mb-1">
              To (exclusive)
            </label>
            <input
              type="date"
              className="input-modern w-full text-sm"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div className="md:col-span-3">
            <button type="submit" className="btn-primary px-4 py-2 text-sm">
              Apply filters
            </button>
          </div>
        </form>

        {loading ? (
          <p className="text-center text-ink-400 py-12">Loading…</p>
        ) : rows.length === 0 ? (
          <div className="card p-12 text-center text-ink-400">No audit entries match.</div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-ink-100 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold text-ink-600 w-44">When</th>
                  <th className="px-4 py-3 font-semibold text-ink-600">Action</th>
                  <th className="px-4 py-3 font-semibold text-ink-600">Actor</th>
                  <th className="px-4 py-3 font-semibold text-ink-600">Target</th>
                  <th className="px-4 py-3 font-semibold text-ink-600 w-28">Metadata</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const expanded = expandedId === r.id
                  return (
                    <tr key={r.id} className="border-t border-ink-200 align-top">
                      <td className="px-4 py-3 text-xs text-ink-500 font-data whitespace-nowrap">
                        {new Date(r.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-xs font-data text-forest-700">{r.action}</code>
                      </td>
                      <td className="px-4 py-3 text-ink-700">
                        {r.actor?.email || <span className="text-ink-400">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {r.target_type ? (
                          <span className="text-xs text-ink-600">
                            {r.target_type}
                            {r.target_id && (
                              <code className="block text-xs font-data text-ink-500 mt-1 truncate max-w-[200px]">
                                {r.target_id}
                              </code>
                            )}
                          </span>
                        ) : (
                          <span className="text-ink-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {r.metadata != null ? (
                          <button
                            onClick={() => setExpandedId(expanded ? null : r.id)}
                            className="text-xs text-forest-500 hover:underline"
                          >
                            {expanded ? 'Hide' : 'Show'}
                          </button>
                        ) : (
                          <span className="text-ink-400">—</span>
                        )}
                        {expanded && r.metadata != null && (
                          <pre className="text-xs font-data text-ink-600 mt-2 whitespace-pre-wrap bg-ink-50 p-2 rounded max-w-[400px] overflow-x-auto">
                            {JSON.stringify(r.metadata, null, 2)}
                          </pre>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {pagination && pagination.total_pages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <span className="text-xs text-ink-400">
              Page {pagination.page} of {pagination.total_pages} · {pagination.total} entries
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="btn-outline px-3 py-1 text-sm disabled:opacity-50"
              >
                Prev
              </button>
              <button
                disabled={page >= pagination.total_pages}
                onClick={() => setPage((p) => p + 1)}
                className="btn-outline px-3 py-1 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </PageShell>
    </div>
  )
}
