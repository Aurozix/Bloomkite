'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ShareIcon,
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'

import { useToast } from '@/app/components/toast-context'
import { PageShell } from '@/app/components/PageShell'
import { PageHeader } from '@/app/components/PageHeader'
import { MAX_ADVISORS_PER_PLAN } from '@/lib/plan-sharing'

interface PlanRow {
  id: string
  name: string | null
  calculatorType: string
  createdAt: string
  activeShareCount: number
  reviewedShareCount: number
}

interface AdvisorRow {
  id: string
  user_id: string
  display_name: string | null
  company_name: string | null
  expertise: string[]
}

interface ShareRow {
  id: string
  advisorId: string
  advisorName: string
  advisorCompany: string | null
  permission: 'VIEW' | 'COMMENT'
  status: 'NEW' | 'VIEWED' | 'REVIEWED' | 'REVOKED'
  commentCount: number
}

const STATUS_BADGE: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-700',
  VIEWED: 'bg-amber-100 text-amber-700',
  REVIEWED: 'bg-green-100 text-green-700',
  REVOKED: 'bg-gray-100 text-gray-500',
}

export default function SavedPlansPage() {
  const router = useRouter()
  const { addToast } = useToast()

  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState<PlanRow[]>([])
  const [shareTarget, setShareTarget] = useState<PlanRow | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const sessionResp = await fetch('/api/auth/session')
        const sessionData = await sessionResp.json()
        if (!sessionData.user) {
          router.push('/auth/signin')
          return
        }

        const resp = await fetch('/api/financial-plans')
        if (!resp.ok) {
          addToast('Failed to load saved plans', 'error')
          return
        }
        const data = await resp.json()
        setPlans(data.plans ?? [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router, addToast])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-gray-300 border-t-forest-600 rounded-full" />
      </div>
    )
  }

  return (
    <PageShell bucket="detail" surface="functional">
      <PageHeader
        eyebrow="Your plans"
        title="Saved financial plans"
        subtitle="Share a plan with up to 5 advisors and compare their guidance side-by-side."
      />

      {plans.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-600 mb-4">You haven't saved any plans yet.</p>
          <a href="/calculators" className="btn-primary inline-block px-6 py-3">
            Open a calculator
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {plans.map((p) => (
            <div key={p.id} className="card p-6 flex items-center justify-between gap-6">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider text-ink-400 mb-1">
                  {p.calculatorType}
                </p>
                <h3 className="text-lg font-semibold text-forest-700 truncate">
                  {p.name || 'Untitled plan'}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Saved {new Date(p.createdAt).toLocaleDateString()}
                  {p.activeShareCount > 0 && (
                    <span className="ml-3 inline-flex items-center gap-1 text-forest-700">
                      <ShareIcon className="h-4 w-4" />
                      Shared with {p.activeShareCount} advisor{p.activeShareCount === 1 ? '' : 's'}
                      {p.reviewedShareCount > 0 && (
                        <span className="ml-2 text-green-700 font-semibold">
                          {p.reviewedShareCount} responded
                        </span>
                      )}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex flex-shrink-0 gap-2">
                <button
                  onClick={() => setShareTarget(p)}
                  className="btn-primary px-4 py-2 inline-flex items-center gap-2"
                >
                  <ShareIcon className="h-4 w-4" /> Share
                </button>
                {p.activeShareCount > 0 && (
                  <a
                    href={`/plans/${p.id}/feedback`}
                    className="px-4 py-2 inline-flex items-center gap-2 rounded-md border border-forest-200 text-forest-700 hover:bg-forest-50"
                  >
                    <ChatBubbleLeftRightIcon className="h-4 w-4" /> Compare feedback
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {shareTarget && (
        <ShareDialog
          plan={shareTarget}
          onClose={() => setShareTarget(null)}
          onChanged={async () => {
            const resp = await fetch('/api/financial-plans')
            if (resp.ok) {
              const data = await resp.json()
              setPlans(data.plans ?? [])
            }
          }}
        />
      )}
    </PageShell>
  )
}

// ---------------------------------------------------------------------------
// ShareDialog — modal for picking advisors + permission. Inlined here because
// it's the only caller; promote to a shared component once a second surface
// (e.g. inline "Share this calculation" button on a calculator page) needs it.
// ---------------------------------------------------------------------------

function ShareDialog({
  plan,
  onClose,
  onChanged,
}: {
  plan: PlanRow
  onClose: () => void
  onChanged: () => Promise<void>
}) {
  const { addToast } = useToast()
  const [advisors, setAdvisors] = useState<AdvisorRow[]>([])
  const [shares, setShares] = useState<ShareRow[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [permission, setPermission] = useState<'VIEW' | 'COMMENT'>('COMMENT')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [advResp, sharesResp] = await Promise.all([
          fetch('/api/advisors/search?limit=100'),
          fetch(`/api/financial-plans/${plan.id}/shares`),
        ])
        const advData = await advResp.json()
        const sharesData = await sharesResp.json()
        setAdvisors(advData.data ?? [])
        setShares(sharesData.shares ?? [])
      } catch (err) {
        console.error(err)
        addToast('Failed to load share dialog', 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [plan.id, addToast])

  const activeShares = useMemo(
    () => shares.filter((s) => s.status !== 'REVOKED'),
    [shares],
  )
  const activeAdvisorIds = useMemo(
    () => new Set(activeShares.map((s) => s.advisorId)),
    [activeShares],
  )
  const remainingSlots = MAX_ADVISORS_PER_PLAN - activeAdvisorIds.size
  const filteredAdvisors = useMemo(() => {
    const q = search.trim().toLowerCase()
    return advisors
      .filter((a) => !activeAdvisorIds.has(a.user_id))
      .filter((a) => {
        if (!q) return true
        const hay = `${a.display_name ?? ''} ${a.company_name ?? ''}`.toLowerCase()
        return hay.includes(q)
      })
  }, [advisors, search, activeAdvisorIds])

  const toggleSelect = (advisorId: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(advisorId)) {
        next.delete(advisorId)
      } else {
        if (next.size + activeAdvisorIds.size >= MAX_ADVISORS_PER_PLAN) {
          addToast(`At most ${MAX_ADVISORS_PER_PLAN} advisors per plan`, 'error')
          return prev
        }
        next.add(advisorId)
      }
      return next
    })
  }

  const handleShare = async () => {
    if (selected.size === 0) {
      addToast('Pick at least one advisor', 'error')
      return
    }
    setSubmitting(true)
    try {
      const resp = await fetch(`/api/financial-plans/${plan.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          advisorIds: Array.from(selected),
          permission,
          message: message.trim() || undefined,
        }),
      })
      const data = await resp.json()
      if (!resp.ok) {
        addToast(data.error || 'Failed to share', 'error')
      } else {
        addToast(`Shared with ${data.shared} advisor${data.shared === 1 ? '' : 's'}`, 'success')
        setSelected(new Set())
        setMessage('')
        const sharesResp = await fetch(`/api/financial-plans/${plan.id}/shares`)
        const sharesData = await sharesResp.json()
        setShares(sharesData.shares ?? [])
        await onChanged()
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleRevoke = async (shareId: string) => {
    const resp = await fetch(`/api/financial-plans/${plan.id}/shares/${shareId}`, {
      method: 'DELETE',
    })
    if (!resp.ok) {
      addToast('Failed to revoke', 'error')
      return
    }
    addToast('Share revoked', 'success')
    const sharesResp = await fetch(`/api/financial-plans/${plan.id}/shares`)
    const sharesData = await sharesResp.json()
    setShares(sharesData.shares ?? [])
    await onChanged()
  }

  const handlePermissionChange = async (shareId: string, perm: 'VIEW' | 'COMMENT') => {
    const resp = await fetch(`/api/financial-plans/${plan.id}/shares/${shareId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permission: perm }),
    })
    if (!resp.ok) {
      addToast('Failed to update permission', 'error')
      return
    }
    setShares((prev) =>
      prev.map((s) => (s.id === shareId ? { ...s, permission: perm } : s)),
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-2xl font-semibold text-forest-700">Share plan</h2>
            <p className="text-sm text-gray-500 mt-1">{plan.name || 'Untitled plan'}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {loading ? (
            <p className="text-gray-500 text-center py-8">Loading…</p>
          ) : (
            <>
              {activeShares.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-400 mb-3">
                    Currently shared with ({activeShares.length}/{MAX_ADVISORS_PER_PLAN})
                  </h3>
                  <div className="space-y-2">
                    {activeShares.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-200"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">
                            {s.advisorName}
                          </p>
                          {s.advisorCompany && (
                            <p className="text-xs text-gray-500 truncate">
                              {s.advisorCompany}
                            </p>
                          )}
                          <span
                            className={`inline-block mt-1 px-2 py-0.5 text-xs rounded ${STATUS_BADGE[s.status] ?? ''}`}
                          >
                            {s.status}
                            {s.commentCount > 0 && ` · ${s.commentCount} comment${s.commentCount === 1 ? '' : 's'}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={s.permission}
                            onChange={(e) =>
                              handlePermissionChange(s.id, e.target.value as 'VIEW' | 'COMMENT')
                            }
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="VIEW">View only</option>
                            <option value="COMMENT">Can comment</option>
                          </select>
                          <button
                            onClick={() => handleRevoke(s.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                            title="Revoke share"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-400 mb-3">
                  Add advisors {remainingSlots > 0 && `(${remainingSlots} slots left)`}
                </h3>

                {remainingSlots === 0 ? (
                  <p className="text-sm text-gray-600 italic">
                    Cap reached. Revoke an existing share to free a slot.
                  </p>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Search by name or company…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="input-modern w-full mb-3"
                    />

                    <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                      {filteredAdvisors.length === 0 ? (
                        <p className="p-4 text-sm text-gray-500 text-center">
                          No advisors match.
                        </p>
                      ) : (
                        filteredAdvisors.map((a) => (
                          <label
                            key={a.user_id}
                            className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                          >
                            <input
                              type="checkbox"
                              checked={selected.has(a.user_id)}
                              onChange={() => toggleSelect(a.user_id)}
                              className="h-4 w-4"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-900 truncate">
                                {a.display_name || 'Unnamed advisor'}
                              </p>
                              {a.company_name && (
                                <p className="text-xs text-gray-500 truncate">
                                  {a.company_name}
                                </p>
                              )}
                            </div>
                          </label>
                        ))
                      )}
                    </div>

                    <div className="mt-4 grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-ink-400 mb-2">
                          Permission
                        </label>
                        <select
                          value={permission}
                          onChange={(e) => setPermission(e.target.value as 'VIEW' | 'COMMENT')}
                          className="input-modern w-full"
                        >
                          <option value="COMMENT">Can comment</option>
                          <option value="VIEW">View only</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-ink-400 mb-2">
                          Selected
                        </label>
                        <div className="px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-700">
                          {selected.size} advisor{selected.size === 1 ? '' : 's'}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-ink-400 mb-2">
                        Message (optional)
                      </label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={3}
                        maxLength={2000}
                        placeholder="Anything specific you'd like advice on?"
                        className="input-modern w-full"
                      />
                    </div>

                    <button
                      onClick={handleShare}
                      disabled={submitting || selected.size === 0}
                      className="btn-primary w-full mt-4 py-3 disabled:opacity-50"
                    >
                      {submitting
                        ? 'Sharing…'
                        : `Share with ${selected.size || 'selected'} advisor${selected.size === 1 ? '' : 's'}`}
                    </button>
                  </>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
