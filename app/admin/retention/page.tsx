'use client'

import { useState } from 'react'
import Link from 'next/link'

import { PageShell } from '@/app/components/PageShell'
import { PageHeader } from '@/app/components/PageHeader'
import { useToast } from '@/app/components/toast-context'

const JOBS: Array<{
  slug: 'purge-otps' | 'purge-closed-forum' | 'purge-deleted-accounts'
  title: string
  description: string
  window: string
}> = [
  {
    slug: 'purge-otps',
    title: 'Purge expired OTPs',
    description:
      'Removes email + phone OTP rows past their expiry. Safe to run frequently.',
    window: '24 hours',
  },
  {
    slug: 'purge-closed-forum',
    title: 'Purge closed-forum content',
    description:
      'Hard-deletes admin-locked forum questions older than 90 days. Cascades to answers + tags. Open questions are never auto-purged regardless of age.',
    window: '90 days',
  },
  {
    slug: 'purge-deleted-accounts',
    title: 'Purge old deleted-account residual',
    description:
      'Future-proof safety net for the 7-year window. Currently a no-op since the COMPLETE deletion path hard-deletes immediately; will activate when the soft-delete-then-hard-purge two-stage flow lands.',
    window: '7 years',
  },
]

export default function AdminRetentionPage() {
  const { addToast } = useToast()
  const [busyJob, setBusyJob] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, unknown>>({})

  const run = async (slug: string) => {
    if (!confirm(`Run "${slug}" now? This deletes data.`)) return
    setBusyJob(slug)
    try {
      const r = await fetch(`/api/admin/retention/${slug}`, { method: 'POST' })
      const j = await r.json()
      if (!r.ok) {
        addToast(j.error || 'Job failed', 'error')
        return
      }
      addToast('Job complete', 'success')
      setResults({ ...results, [slug]: j.result })
    } finally {
      setBusyJob(null)
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
          title="Data-retention purge jobs"
          subtitle="Manual triggers for the BRD §13.3 retention windows. Production should schedule scripts/purge-retention.ts via cron; this page is the human fallback."
        />

        <div className="space-y-4">
          {JOBS.map((j) => (
            <div key={j.slug} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="font-semibold text-forest-700">{j.title}</h3>
                  <p className="text-xs text-ink-400 font-data mt-1">{j.slug}</p>
                  <p className="text-sm text-ink-700 mt-2">{j.description}</p>
                  <p className="text-xs text-ink-500 mt-1">
                    Retention window: <strong>{j.window}</strong>
                  </p>
                </div>
                <button
                  onClick={() => run(j.slug)}
                  disabled={busyJob === j.slug}
                  className="btn-primary px-4 py-2 text-sm"
                >
                  {busyJob === j.slug ? 'Running…' : 'Run now'}
                </button>
              </div>
              {results[j.slug] !== undefined && (
                <pre className="mt-3 text-xs font-data text-ink-600 bg-ink-50 p-2 rounded">
                  {JSON.stringify(results[j.slug], null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>

        <p className="text-xs text-ink-500 mt-6">
          Every run writes an admin_audit row with affected counts in metadata. Cron-style
          invocations bypass the audit log (no actor); use scripts/purge-retention.ts for those.
        </p>
      </PageShell>
    </div>
  )
}
