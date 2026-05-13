'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PageShell } from '@/app/components/PageShell'
import { PageHeader } from '@/app/components/PageHeader'
import { useToast } from '@/app/components/toast-context'

interface Feature {
  slug: string
  category: string
  name: string
  description: string
  is_enabled: boolean
  updated_at: string | null
}

const CATEGORY_LABELS: Record<string, string> = {
  'investor-support': 'Investor support',
  'advisor-tools': 'Advisor tools',
  'content-moderation': 'Content moderation',
  'calculators': 'Calculators',
  'nri': 'NRI surface',
}

export default function AdminAIFeaturesPage() {
  const router = useRouter()
  const { addToast } = useToast()

  const [features, setFeatures] = useState<Feature[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [adding, setAdding] = useState(false)

  // Add-feature form state
  const [newSlug, setNewSlug] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const resp = await fetch('/api/admin/ai-features')
      if (resp.status === 401 || resp.status === 403) {
        addToast('Admin access required', 'error')
        router.push('/dashboard')
        return
      }
      const json = await resp.json()
      if (!resp.ok) {
        addToast(json.error ?? 'Failed to load features', 'error')
        return
      }
      setFeatures(json.data ?? [])
    } catch (err) {
      console.error('admin/ai-features load', err)
      addToast('Failed to load features', 'error')
    } finally {
      setLoading(false)
    }
  }, [router, addToast])

  useEffect(() => {
    load()
  }, [load])

  const toggle = async (slug: string, currentlyEnabled: boolean) => {
    setBusy(slug)
    try {
      const resp = await fetch(`/api/admin/ai-features/${slug}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !currentlyEnabled }),
      })
      const json = await resp.json()
      if (!resp.ok) {
        addToast(json.error ?? 'Toggle failed', 'error')
        return
      }
      addToast(json.message ?? 'Done', 'success')
      // Optimistic update
      setFeatures((prev) =>
        prev.map((f) =>
          f.slug === slug ? { ...f, is_enabled: !currentlyEnabled } : f
        )
      )
    } finally {
      setBusy(null)
    }
  }

  const submitAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdding(true)
    try {
      const resp = await fetch('/api/admin/ai-features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: newSlug,
          category: newCategory,
          name: newName,
          description: newDescription,
        }),
      })
      const json = await resp.json()
      if (!resp.ok) {
        addToast(json.error ?? 'Failed to add feature', 'error')
        return
      }
      addToast('Feature added (disabled)', 'success')
      setNewSlug('')
      setNewCategory('')
      setNewName('')
      setNewDescription('')
      setShowAdd(false)
      await load()
    } finally {
      setAdding(false)
    }
  }

  // Group features by category client-side.
  const grouped: Record<string, Feature[]> = {}
  for (const f of features) {
    if (!grouped[f.category]) grouped[f.category] = []
    grouped[f.category].push(f)
  }
  const categories = Object.keys(grouped).sort()

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
          title="AI features"
          subtitle="Toggle AI-shaped product features on or off. Every feature lands disabled by default; flip it on only after compliance and brand checks pass."
        />

        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowAdd((s) => !s)}
            className="btn-outline px-3 py-1.5 text-sm"
          >
            {showAdd ? 'Cancel' : '+ Register new feature'}
          </button>
        </div>

        {showAdd && (
          <form onSubmit={submitAdd} className="card p-6 mb-8 grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-ink-400 mb-2">
                Slug <span className="text-ink-600 normal-case">(lowercase, hyphens)</span>
              </label>
              <input
                type="text"
                className="input-modern w-full font-data"
                placeholder="nri-tax-explainer"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-ink-400 mb-2">
                Category
              </label>
              <input
                type="text"
                className="input-modern w-full"
                placeholder="investor-support"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-ink-400 mb-2">
                Display name
              </label>
              <input
                type="text"
                className="input-modern w-full"
                placeholder="NRI tax-context explainer"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-ink-400 mb-2">
                Description
              </label>
              <textarea
                className="input-modern w-full h-20"
                placeholder="One-sentence description shown in the admin UI…"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                required
              />
            </div>
            <div className="md:col-span-2">
              <button type="submit" disabled={adding} className="btn-primary disabled:opacity-50">
                {adding ? 'Adding…' : 'Add feature (disabled)'}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="card p-12 text-center text-ink-400">Loading…</div>
        ) : categories.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-ink-600 mb-2">No AI features registered yet.</p>
            <p className="text-xs text-ink-400">
              Use the button above to register the first one — every new feature lands disabled by default.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {categories.map((cat) => (
              <section key={cat}>
                <h2 className="font-serif text-2xl font-medium text-forest-700 mb-3">
                  {CATEGORY_LABELS[cat] ?? cat}
                </h2>
                <div className="card divide-y divide-ink-200">
                  {grouped[cat].map((f) => (
                    <div key={f.slug} className="p-4 flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-ink-900">{f.name}</h3>
                          <code className="text-xs font-data text-ink-400">{f.slug}</code>
                        </div>
                        <p className="text-sm text-ink-600">{f.description}</p>
                        {f.updated_at && (
                          <p className="text-xs text-ink-400 mt-2">
                            Updated {new Date(f.updated_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <ToggleSwitch
                        enabled={f.is_enabled}
                        busy={busy === f.slug}
                        onClick={() => toggle(f.slug, f.is_enabled)}
                      />
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </PageShell>
    </div>
  )
}

function ToggleSwitch({
  enabled,
  busy,
  onClick,
}: {
  enabled: boolean
  busy: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      aria-pressed={enabled}
      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 transition-colors disabled:opacity-50 ${
        enabled ? 'bg-forest-400 border-forest-500' : 'bg-ink-100 border-ink-200'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-paper shadow ring-0 transition-transform mt-[1px] ${
          enabled ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}
