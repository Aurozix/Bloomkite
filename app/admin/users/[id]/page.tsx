'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { PageShell } from '@/app/components/PageShell'
import { PageHeader } from '@/app/components/PageHeader'
import { useToast } from '@/app/components/toast-context'

interface UserDetail {
  id: string
  email: string
  name: string | null
  email_verified: string | null
  disabled_at: string | null
  disabled_by: string | null
  created_at: string | null
  updated_at: string | null
  roles: Array<{ id: string; name: string; description: string | null; assigned_at: string | null }>
  investor_profile: {
    displayName: string | null
    phoneNumber: string | null
    city: string | null
    state: string | null
    riskProfile: string | null
  } | null
  advisor_profile: {
    displayName: string | null
    companyName: string | null
    designation: string | null
    workflowStatus: string | null
    isVerified: boolean | null
    followerCount: number | null
  } | null
  recent_audits: Array<{
    id: string
    action: string
    metadata: unknown
    created_at: string | null
    actor: { id: string; email: string; name: string | null } | null
  }>
}

const ALL_ROLES = ['investor', 'advisor', 'admin', 'moderator'] as const

export default function AdminUserDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const { addToast } = useToast()

  const [user, setUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [confirmDisable, setConfirmDisable] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string>('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const resp = await fetch(`/api/admin/users/${params.id}`)
      if (resp.status === 401 || resp.status === 403) {
        addToast('Admin access required', 'error')
        router.push('/dashboard')
        return
      }
      const json = await resp.json()
      if (!resp.ok) {
        addToast(json.error ?? 'Failed to load user', 'error')
        if (resp.status === 404) router.push('/admin/users')
        return
      }
      setUser(json.data)
    } catch (err) {
      console.error('admin/users detail load', err)
      addToast('Failed to load user', 'error')
    } finally {
      setLoading(false)
    }
  }, [params.id, router, addToast])

  useEffect(() => {
    load()
  }, [load])

  const toggleDisable = async () => {
    if (!user) return
    setBusy(true)
    try {
      const enable = user.disabled_at != null
      const resp = await fetch(`/api/admin/users/${user.id}/disable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enable }),
      })
      const json = await resp.json()
      if (!resp.ok) {
        addToast(json.error ?? 'Action failed', 'error')
        return
      }
      addToast(json.message ?? 'Done', 'success')
      setConfirmDisable(false)
      await load()
    } finally {
      setBusy(false)
    }
  }

  const deleteUser = async () => {
    if (!user) return
    if (confirmDelete !== user.email) {
      addToast('Type the email to confirm', 'error')
      return
    }
    setBusy(true)
    try {
      const resp = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' })
      const json = await resp.json()
      if (!resp.ok) {
        addToast(json.error ?? 'Delete failed', 'error')
        return
      }
      addToast(json.message ?? 'User deleted', 'success')
      router.push('/admin/users')
    } finally {
      setBusy(false)
    }
  }

  const toggleRole = async (action: 'add' | 'remove', roleName: string) => {
    if (!user) return
    setBusy(true)
    try {
      const resp = await fetch(`/api/admin/users/${user.id}/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, roleName }),
      })
      const json = await resp.json()
      if (!resp.ok) {
        addToast(json.error ?? 'Action failed', 'error')
        return
      }
      addToast(json.message ?? 'Done', 'success')
      await load()
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-ink-200 border-t-forest-400 rounded-full" />
      </div>
    )
  }

  if (!user) return null

  const userRoleNames = new Set(user.roles.map((r) => r.name))
  const isDisabled = user.disabled_at != null

  return (
    <div className="min-h-screen bg-paper">
      <PageShell bucket="detail" surface="list">
        <Link
          href="/admin/users"
          className="text-sm text-forest-500 font-semibold hover:underline inline-block mb-6"
        >
          ← Back to Users
        </Link>
        <PageHeader
          eyebrow="Admin / Users"
          title={user.name || user.email}
          subtitle={user.name ? user.email : undefined}
        />

        {/* Status + headline actions */}
        <section className="card p-6 mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {isDisabled ? (
              <span className="badge bg-ink-100 text-ink-600">disabled</span>
            ) : user.email_verified ? (
              <span className="badge-approved">active</span>
            ) : (
              <span className="badge-pending">email unverified</span>
            )}
            {user.created_at && (
              <span className="text-xs text-ink-400">
                Joined {new Date(user.created_at).toLocaleDateString()}
              </span>
            )}
          </div>

          {confirmDisable ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-ink-600">
                {isDisabled ? 'Re-enable this account?' : 'Disable this account?'}
              </span>
              <button
                onClick={toggleDisable}
                disabled={busy}
                className="btn-primary px-3 py-1 text-sm"
              >
                {isDisabled ? 'Enable' : 'Disable'}
              </button>
              <button
                onClick={() => setConfirmDisable(false)}
                disabled={busy}
                className="btn-outline px-3 py-1 text-sm"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDisable(true)}
              className="btn-outline px-3 py-1 text-sm"
            >
              {isDisabled ? 'Enable account' : 'Disable account'}
            </button>
          )}
        </section>

        {/* Roles */}
        <section className="card p-6 mb-8">
          <h2 className="font-serif text-2xl font-medium text-forest-700 mb-4">Roles</h2>
          <div className="flex flex-wrap gap-3">
            {ALL_ROLES.map((r) => {
              const assigned = userRoleNames.has(r)
              return (
                <button
                  key={r}
                  onClick={() => toggleRole(assigned ? 'remove' : 'add', r)}
                  disabled={busy}
                  className={`px-3 py-1.5 rounded-bk-md text-sm font-semibold transition-colors disabled:opacity-50 ${
                    assigned
                      ? 'bg-forest-400 text-paper hover:bg-forest-500'
                      : 'border border-ink-200 text-ink-600 hover:bg-ink-100'
                  }`}
                >
                  {assigned ? `${r} ✓` : `+ ${r}`}
                </button>
              )
            })}
          </div>
          <p className="text-xs text-ink-400 mt-3">
            Click to toggle. Removing the last admin is blocked by the server.
          </p>
        </section>

        {/* Profile */}
        {(user.investor_profile || user.advisor_profile) && (
          <section className="card p-6 mb-8">
            <h2 className="font-serif text-2xl font-medium text-forest-700 mb-4">Profile</h2>
            {user.investor_profile && (
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <ProfileRow label="Display name" value={user.investor_profile.displayName} />
                <ProfileRow label="Phone" value={user.investor_profile.phoneNumber} />
                <ProfileRow label="City" value={user.investor_profile.city} />
                <ProfileRow label="State" value={user.investor_profile.state} />
                <ProfileRow label="Risk profile" value={user.investor_profile.riskProfile} />
              </dl>
            )}
            {user.advisor_profile && (
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <ProfileRow label="Display name" value={user.advisor_profile.displayName} />
                <ProfileRow label="Company" value={user.advisor_profile.companyName} />
                <ProfileRow label="Designation" value={user.advisor_profile.designation} />
                <ProfileRow label="Workflow status" value={user.advisor_profile.workflowStatus} />
                <ProfileRow
                  label="Verified"
                  value={user.advisor_profile.isVerified ? 'Yes' : 'No'}
                />
                <ProfileRow
                  label="Followers"
                  value={String(user.advisor_profile.followerCount ?? 0)}
                />
              </dl>
            )}
          </section>
        )}

        {/* Danger zone */}
        <section className="card p-6 mb-8 border-2 border-red-200">
          <h2 className="font-serif text-2xl font-medium text-red-700 mb-2">
            Danger zone
          </h2>
          <p className="text-sm text-ink-600 mb-4">
            Hard-deleting a user removes their account and all owned content (articles,
            forum posts, plans, ratings). Most relations cascade. This is for genuine
            data-deletion requests (BRD §13.3 right-to-delete) — for routine offenders,
            disable instead.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              className="input-modern flex-1 min-w-[240px]"
              placeholder={`Type ${user.email} to confirm`}
              value={confirmDelete}
              onChange={(e) => setConfirmDelete(e.target.value)}
            />
            <button
              onClick={deleteUser}
              disabled={busy || confirmDelete !== user.email}
              className="px-4 py-2 rounded-bk-md bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50"
            >
              Permanently delete
            </button>
          </div>
        </section>

        {/* Audit log */}
        <section className="card p-6">
          <h2 className="font-serif text-2xl font-medium text-forest-700 mb-4">
            Recent admin actions
          </h2>
          {user.recent_audits.length === 0 ? (
            <p className="text-sm text-ink-400">No admin actions recorded for this user.</p>
          ) : (
            <ul className="divide-y divide-ink-200">
              {user.recent_audits.map((a) => (
                <li key={a.id} className="py-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <div>
                      <code className="text-xs font-data text-forest-700">{a.action}</code>
                      <span className="text-ink-600 ml-2">
                        by {a.actor?.email ?? 'unknown'}
                      </span>
                    </div>
                    <span className="text-xs text-ink-400">
                      {a.created_at ? new Date(a.created_at).toLocaleString() : '—'}
                    </span>
                  </div>
                  {a.metadata != null && (
                    <pre className="text-xs text-ink-600 mt-1 whitespace-pre-wrap font-data">
                      {JSON.stringify(a.metadata, null, 2)}
                    </pre>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </PageShell>
    </div>
  )
}

function ProfileRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <>
      <dt className="text-ink-400 text-xs uppercase tracking-[0.1em]">{label}</dt>
      <dd className="text-ink-900">{value ?? <span className="text-ink-400">—</span>}</dd>
    </>
  )
}
