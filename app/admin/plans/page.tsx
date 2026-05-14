'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { PencilIcon } from '@heroicons/react/24/outline'

import { PageShell } from '@/app/components/PageShell'
import { PageHeader } from '@/app/components/PageHeader'
import { useToast } from '@/app/components/toast-context'

interface Plan {
  id: string
  slug: string
  name: string
  priceInrPaise: number
  billingPeriod: 'monthly' | 'yearly'
  features: Record<string, unknown>
  isActive: boolean
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

export default function AdminPlansPage() {
  const { addToast } = useToast()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<{
    name: string
    priceInrRupees: string
    billingPeriod: 'monthly' | 'yearly'
    features: string
  }>({ name: '', priceInrRupees: '', billingPeriod: 'monthly', features: '{}' })

  const [newSlug, setNewSlug] = useState('')
  const [newName, setNewName] = useState('')
  const [newPriceRupees, setNewPriceRupees] = useState('0')
  const [newPeriod, setNewPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [newFeatures, setNewFeatures] = useState('{}')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const resp = await fetch('/api/admin/plans')
      const json = await resp.json()
      if (!resp.ok) {
        addToast(json.error || 'Failed to load plans', 'error')
        return
      }
      setPlans(json.data ?? [])
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    load()
  }, [load])

  const onCreate = async () => {
    if (!newName.trim()) {
      addToast('Name is required', 'error')
      return
    }
    let parsedFeatures: Record<string, unknown> = {}
    try {
      parsedFeatures = JSON.parse(newFeatures || '{}')
    } catch {
      addToast('features must be valid JSON', 'error')
      return
    }
    setBusy(true)
    try {
      const resp = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: (newSlug.trim() || slugify(newName)).slice(0, 50),
          name: newName.trim(),
          priceInrPaise: Math.max(0, Math.round(parseFloat(newPriceRupees) * 100)),
          billingPeriod: newPeriod,
          features: parsedFeatures,
        }),
      })
      const json = await resp.json()
      if (!resp.ok) {
        addToast(json.error || 'Failed', 'error')
        return
      }
      addToast('Plan created', 'success')
      setNewSlug('')
      setNewName('')
      setNewPriceRupees('0')
      setNewFeatures('{}')
      await load()
    } finally {
      setBusy(false)
    }
  }

  const beginEdit = (plan: Plan) => {
    setEditingId(plan.id)
    setEditDraft({
      name: plan.name,
      priceInrRupees: String(plan.priceInrPaise / 100),
      billingPeriod: plan.billingPeriod,
      features: JSON.stringify(plan.features ?? {}, null, 2),
    })
  }

  const onPatch = async (id: string) => {
    let parsedFeatures: Record<string, unknown> = {}
    try {
      parsedFeatures = JSON.parse(editDraft.features || '{}')
    } catch {
      addToast('features must be valid JSON', 'error')
      return
    }
    setBusy(true)
    try {
      const resp = await fetch(`/api/admin/plans/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editDraft.name.trim(),
          priceInrPaise: Math.max(0, Math.round(parseFloat(editDraft.priceInrRupees) * 100)),
          billingPeriod: editDraft.billingPeriod,
          features: parsedFeatures,
        }),
      })
      const json = await resp.json()
      if (!resp.ok) {
        addToast(json.error || 'Update failed', 'error')
        return
      }
      addToast('Plan saved', 'success')
      setEditingId(null)
      await load()
    } finally {
      setBusy(false)
    }
  }

  const onToggleActive = async (plan: Plan) => {
    setBusy(true)
    try {
      const resp = await fetch(`/api/admin/plans/${plan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !plan.isActive }),
      })
      if (!resp.ok) {
        addToast('Toggle failed', 'error')
        return
      }
      await load()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <PageShell bucket="detail" surface="list">
        <Link
          href="/admin"
          className="text-sm text-forest-500 font-semibold hover:underline inline-block mb-6"
        >
          ← Back to Admin
        </Link>
        <PageHeader
          eyebrow="Admin"
          title="Membership plans"
          subtitle="Edit pricing, billing period, and feature set. Inactive plans disappear from the public pricing page; existing subscribers keep their plan via the FK."
        />

        <section className="card p-5 mb-8">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-400 mb-3">
            New plan
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-ink-500 mb-1">Slug (kebab-case)</label>
              <input
                className="input-modern w-full text-sm font-data"
                placeholder="auto from name"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-ink-500 mb-1">Name</label>
              <input
                className="input-modern w-full text-sm"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-ink-500 mb-1">Price (₹)</label>
              <input
                type="number"
                step="0.01"
                className="input-modern w-full text-sm"
                value={newPriceRupees}
                onChange={(e) => setNewPriceRupees(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-ink-500 mb-1">Billing period</label>
              <select
                className="input-modern w-full text-sm"
                value={newPeriod}
                onChange={(e) => setNewPeriod(e.target.value as 'monthly' | 'yearly')}
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-ink-500 mb-1">
                Features (JSON, e.g. {'{"unlimitedSharing":true,"prioritySupport":true}'})
              </label>
              <textarea
                rows={3}
                className="input-modern w-full text-sm font-data"
                value={newFeatures}
                onChange={(e) => setNewFeatures(e.target.value)}
              />
            </div>
          </div>
          <button onClick={onCreate} disabled={busy} className="btn-primary mt-3 px-4 py-2 text-sm">
            Create plan
          </button>
        </section>

        {loading ? (
          <p className="text-center text-ink-400 py-12">Loading…</p>
        ) : plans.length === 0 ? (
          <div className="card p-12 text-center text-ink-400">No plans yet.</div>
        ) : (
          <div className="space-y-3">
            {plans.map((p) => {
              const editing = editingId === p.id
              return (
                <div key={p.id} className={`card p-5 ${!p.isActive ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="min-w-0">
                      {editing ? (
                        <input
                          className="input-modern w-full text-base font-semibold mb-2"
                          value={editDraft.name}
                          onChange={(e) =>
                            setEditDraft({ ...editDraft, name: e.target.value })
                          }
                        />
                      ) : (
                        <h3 className="text-lg font-semibold text-forest-700">{p.name}</h3>
                      )}
                      <p className="text-xs font-data text-ink-500 mt-1">{p.slug}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.isActive ? (
                        <span className="badge-approved">active</span>
                      ) : (
                        <span className="badge bg-ink-100 text-ink-600">inactive</span>
                      )}
                      <button
                        onClick={() => onToggleActive(p)}
                        disabled={busy}
                        className="text-xs text-forest-500 hover:underline ml-2"
                      >
                        {p.isActive ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </div>
                  </div>

                  {editing ? (
                    <div className="grid md:grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs text-ink-500 mb-1">Price (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          className="input-modern w-full text-sm"
                          value={editDraft.priceInrRupees}
                          onChange={(e) =>
                            setEditDraft({ ...editDraft, priceInrRupees: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-ink-500 mb-1">Billing period</label>
                        <select
                          className="input-modern w-full text-sm"
                          value={editDraft.billingPeriod}
                          onChange={(e) =>
                            setEditDraft({
                              ...editDraft,
                              billingPeriod: e.target.value as 'monthly' | 'yearly',
                            })
                          }
                        >
                          <option value="monthly">Monthly</option>
                          <option value="yearly">Yearly</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs text-ink-500 mb-1">Features (JSON)</label>
                        <textarea
                          rows={5}
                          className="input-modern w-full text-sm font-data"
                          value={editDraft.features}
                          onChange={(e) =>
                            setEditDraft({ ...editDraft, features: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-3 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-ink-400">Price</p>
                        <p className="font-data text-ink-900">
                          ₹{(p.priceInrPaise / 100).toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-ink-400">Period</p>
                        <p className="text-ink-900">{p.billingPeriod}</p>
                      </div>
                      <div className="md:col-span-1">
                        <p className="text-xs uppercase tracking-wider text-ink-400">Features</p>
                        <pre className="text-xs font-data text-ink-600 whitespace-pre-wrap">
                          {JSON.stringify(p.features ?? {}, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    {editing ? (
                      <>
                        <button
                          onClick={() => onPatch(p.id)}
                          disabled={busy}
                          className="btn-primary px-4 py-1 text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="btn-outline px-4 py-1 text-sm"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => beginEdit(p)}
                        className="text-sm text-forest-500 inline-flex items-center gap-1 hover:underline"
                      >
                        <PencilIcon className="h-4 w-4" /> Edit
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </PageShell>
    </div>
  )
}
