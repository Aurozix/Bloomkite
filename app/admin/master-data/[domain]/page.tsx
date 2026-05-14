'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { PencilIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

import { PageShell } from '@/app/components/PageShell'
import { PageHeader } from '@/app/components/PageHeader'
import { useToast } from '@/app/components/toast-context'

interface Row {
  id: string
  slug: string
  name: string
  description: string | null
  sortOrder: number
  isActive: boolean
}

const slugify = (s: string): string =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

export default function AdminMasterDataDomainPage() {
  const params = useParams<{ domain: string }>()
  const domain = params.domain
  const { addToast } = useToast()

  const [label, setLabel] = useState<string>('')
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<{
    name: string
    description: string
    sortOrder: string
  }>({ name: '', description: '', sortOrder: '' })

  // New-row form
  const [newSlug, setNewSlug] = useState('')
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newSortOrder, setNewSortOrder] = useState('0')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const resp = await fetch(`/api/admin/master-data/${domain}`)
      const json = await resp.json()
      if (!resp.ok) {
        addToast(json.error || 'Failed to load', 'error')
        return
      }
      setLabel(json.label || domain)
      setRows(json.data ?? [])
    } finally {
      setLoading(false)
    }
  }, [domain, addToast])

  useEffect(() => {
    load()
  }, [load])

  const onCreate = async () => {
    if (!newName.trim()) {
      addToast('Name is required', 'error')
      return
    }
    setBusy(true)
    try {
      const resp = await fetch(`/api/admin/master-data/${domain}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: (newSlug.trim() || slugify(newName)).slice(0, 80),
          name: newName.trim(),
          description: newDescription.trim() || undefined,
          sortOrder: parseInt(newSortOrder, 10) || 0,
        }),
      })
      const json = await resp.json()
      if (!resp.ok) {
        addToast(json.error || 'Create failed', 'error')
        return
      }
      addToast('Row added', 'success')
      setNewSlug('')
      setNewName('')
      setNewDescription('')
      setNewSortOrder('0')
      await load()
    } finally {
      setBusy(false)
    }
  }

  const beginEdit = (row: Row) => {
    setEditingId(row.id)
    setEditDraft({
      name: row.name,
      description: row.description ?? '',
      sortOrder: String(row.sortOrder),
    })
  }

  const onPatch = async (id: string) => {
    setBusy(true)
    try {
      const resp = await fetch(`/api/admin/master-data/${domain}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editDraft.name.trim(),
          description: editDraft.description.trim() || null,
          sortOrder: parseInt(editDraft.sortOrder, 10) || 0,
        }),
      })
      const json = await resp.json()
      if (!resp.ok) {
        addToast(json.error || 'Update failed', 'error')
        return
      }
      addToast('Row updated', 'success')
      setEditingId(null)
      await load()
    } finally {
      setBusy(false)
    }
  }

  const onDeactivate = async (id: string) => {
    if (!confirm('Deactivate this row? It will disappear from picker dropdowns; existing references stay intact.')) return
    setBusy(true)
    try {
      const resp = await fetch(`/api/admin/master-data/${domain}/${id}`, { method: 'DELETE' })
      if (!resp.ok) {
        addToast('Deactivate failed', 'error')
        return
      }
      addToast('Row deactivated', 'success')
      await load()
    } finally {
      setBusy(false)
    }
  }

  const onReactivate = async (id: string) => {
    setBusy(true)
    try {
      const resp = await fetch(`/api/admin/master-data/${domain}/${id}?action=reactivate`, {
        method: 'POST',
      })
      if (!resp.ok) {
        addToast('Reactivate failed', 'error')
        return
      }
      addToast('Row reactivated', 'success')
      await load()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <PageShell bucket="index" surface="list">
        <Link
          href="/admin/master-data"
          className="text-sm text-forest-500 font-semibold hover:underline inline-block mb-6"
        >
          ← Back to master data
        </Link>
        <PageHeader
          eyebrow="Admin / Master data"
          title={label || domain}
          subtitle="Edit names and sort order. Slugs are immutable from the UI — code may hard-code them."
        />

        {/* Create form */}
        <section className="card p-5 mb-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-ink-400 mb-3">
            Add row
          </h3>
          <div className="grid md:grid-cols-[1.5fr_2fr_3fr_0.6fr_auto] gap-2 items-end">
            <div>
              <label className="block text-xs text-ink-500 mb-1">Slug</label>
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
                placeholder="Display name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-ink-500 mb-1">Description (optional)</label>
              <input
                className="input-modern w-full text-sm"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-ink-500 mb-1">Sort</label>
              <input
                type="number"
                className="input-modern w-full text-sm"
                value={newSortOrder}
                onChange={(e) => setNewSortOrder(e.target.value)}
              />
            </div>
            <button onClick={onCreate} disabled={busy} className="btn-primary px-4 py-2 text-sm">
              Add
            </button>
          </div>
        </section>

        {loading ? (
          <p className="text-center text-ink-400 py-12">Loading…</p>
        ) : rows.length === 0 ? (
          <div className="card p-12 text-center text-ink-400">No rows yet.</div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-ink-100 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold text-ink-600">Sort</th>
                  <th className="px-4 py-3 font-semibold text-ink-600">Slug</th>
                  <th className="px-4 py-3 font-semibold text-ink-600">Name</th>
                  <th className="px-4 py-3 font-semibold text-ink-600">Description</th>
                  <th className="px-4 py-3 font-semibold text-ink-600">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const editing = editingId === r.id
                  return (
                    <tr key={r.id} className={`border-t border-ink-200 ${!r.isActive ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3 w-16">
                        {editing ? (
                          <input
                            type="number"
                            className="input-modern w-16 text-sm"
                            value={editDraft.sortOrder}
                            onChange={(e) => setEditDraft({ ...editDraft, sortOrder: e.target.value })}
                          />
                        ) : (
                          <span className="font-data">{r.sortOrder}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-data text-xs text-ink-600">{r.slug}</td>
                      <td className="px-4 py-3">
                        {editing ? (
                          <input
                            className="input-modern w-full text-sm"
                            value={editDraft.name}
                            onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
                          />
                        ) : (
                          <span className="font-medium text-ink-900">{r.name}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-ink-600">
                        {editing ? (
                          <input
                            className="input-modern w-full text-sm"
                            value={editDraft.description}
                            onChange={(e) => setEditDraft({ ...editDraft, description: e.target.value })}
                          />
                        ) : (
                          r.description || <span className="text-ink-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {r.isActive ? (
                          <span className="badge-approved">active</span>
                        ) : (
                          <span className="badge bg-ink-100 text-ink-600">inactive</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {editing ? (
                          <>
                            <button
                              onClick={() => onPatch(r.id)}
                              disabled={busy}
                              className="btn-primary px-3 py-1 text-xs mr-2"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="btn-outline px-3 py-1 text-xs"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => beginEdit(r)}
                              className="text-forest-500 hover:bg-ink-100 p-2 rounded"
                              title="Edit"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            {r.isActive ? (
                              <button
                                onClick={() => onDeactivate(r.id)}
                                disabled={busy}
                                className="text-red-600 hover:bg-red-50 p-2 rounded"
                                title="Deactivate"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => onReactivate(r.id)}
                                disabled={busy}
                                className="text-green-600 hover:bg-green-50 p-2 rounded"
                                title="Reactivate"
                              >
                                <ArrowPathIcon className="h-4 w-4" />
                              </button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </PageShell>
    </div>
  )
}
