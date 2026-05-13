'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PageShell } from '@/app/components/PageShell'
import { PageHeader } from '@/app/components/PageHeader'
import { useToast } from '@/app/components/toast-context'

interface UserRow {
  id: string
  email: string
  name: string | null
  email_verified: string | null
  disabled_at: string | null
  created_at: string | null
  roles: string[]
}

interface Pagination {
  page: number
  limit: number
  total: number
  total_pages: number
}

const ROLE_FILTERS = ['', 'investor', 'advisor', 'admin', 'moderator'] as const

export default function AdminUsersPage() {
  const router = useRouter()
  const { addToast } = useToast()

  const [users, setUsers] = useState<UserRow[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [role, setRole] = useState<string>('')
  const [status, setStatus] = useState<'active' | 'disabled'>('active')
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q.trim()) params.set('q', q.trim())
      if (role) params.set('role', role)
      params.set('status', status)
      params.set('page', String(page))
      params.set('limit', '25')

      const resp = await fetch(`/api/admin/users?${params.toString()}`)
      if (resp.status === 401 || resp.status === 403) {
        addToast('Admin access required', 'error')
        router.push('/dashboard')
        return
      }
      const json = await resp.json()
      if (!resp.ok) {
        addToast(json.error ?? 'Failed to load users', 'error')
        return
      }
      setUsers(json.data ?? [])
      setPagination(json.pagination ?? null)
    } catch (err) {
      console.error('admin/users load', err)
      addToast('Failed to load users', 'error')
    } finally {
      setLoading(false)
    }
  }, [q, role, status, page, router, addToast])

  useEffect(() => {
    load()
  }, [load])

  const onSubmitSearch = (e: React.FormEvent) => {
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
          title="Users"
          subtitle="Search by email or name, filter by role, view detail to assign roles or disable accounts."
        />

        {/* Filters */}
        <form onSubmit={onSubmitSearch} className="card p-4 mb-6 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-ink-400 mb-2">
              Search
            </label>
            <input
              type="text"
              className="input-modern w-full"
              placeholder="Email or name…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-ink-400 mb-2">
              Role
            </label>
            <select
              className="input-modern"
              value={role}
              onChange={(e) => {
                setRole(e.target.value)
                setPage(1)
              }}
            >
              {ROLE_FILTERS.map((r) => (
                <option key={r} value={r}>
                  {r === '' ? 'Any role' : r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-ink-400 mb-2">
              Status
            </label>
            <div className="flex rounded-bk-md border border-ink-200 overflow-hidden">
              {(['active', 'disabled'] as const).map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => {
                    setStatus(s)
                    setPage(1)
                  }}
                  className={`px-3 py-2 text-sm font-semibold transition-colors ${
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

        {/* Results */}
        {loading ? (
          <div className="card p-12 text-center text-ink-400">Loading…</div>
        ) : users.length === 0 ? (
          <div className="card p-12 text-center text-ink-600">No users match these filters.</div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-ink-100 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold text-ink-600">User</th>
                  <th className="px-4 py-3 font-semibold text-ink-600">Roles</th>
                  <th className="px-4 py-3 font-semibold text-ink-600">Status</th>
                  <th className="px-4 py-3 font-semibold text-ink-600">Joined</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-ink-200 hover:bg-ink-100/40">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-ink-900">
                        {u.name || u.email}
                      </div>
                      {u.name && (
                        <div className="text-xs text-ink-400">{u.email}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.length === 0 ? (
                          <span className="text-xs text-ink-400">no roles</span>
                        ) : (
                          u.roles.map((r) => (
                            <span
                              key={r}
                              className="text-xs font-semibold uppercase tracking-wider text-forest-500 bg-forest-50 px-2 py-0.5 rounded-full"
                            >
                              {r}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {u.disabled_at ? (
                        <span className="badge bg-ink-100 text-ink-600">disabled</span>
                      ) : u.email_verified ? (
                        <span className="badge-approved">active</span>
                      ) : (
                        <span className="badge-pending">unverified</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-400 text-xs">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="text-forest-500 font-semibold hover:underline text-xs"
                      >
                        Open →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.total_pages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <span className="text-xs text-ink-400">
              Page {pagination.page} of {pagination.total_pages} · {pagination.total} users
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
