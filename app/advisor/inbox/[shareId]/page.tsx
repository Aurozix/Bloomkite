'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

import { useToast } from '@/app/components/toast-context'
import { PageShell } from '@/app/components/PageShell'
import { PageHeader } from '@/app/components/PageHeader'

interface Comment {
  id: string
  body: string
  createdAt: string
}

interface SharedPlan {
  share: {
    id: string
    permission: 'VIEW' | 'COMMENT'
    status: string
    message: string | null
    sharedAt: string
  }
  plan: {
    id: string
    name: string | null
    calculatorType: string
    inputs: Record<string, unknown>
    results: Record<string, unknown>
    savedAt: string
  }
  investor: {
    id: string
    name: string
    city: string | null
    state: string | null
    riskProfile: string | null
  }
  comments: Comment[]
}

export default function AdvisorSharedPlanPage() {
  const router = useRouter()
  const params = useParams()
  const shareId = params.shareId as string
  const { addToast } = useToast()

  const [data, setData] = useState<SharedPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState('')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const sessionResp = await fetch('/api/auth/session')
        const sessionData = await sessionResp.json()
        if (!sessionData.user) {
          router.push('/auth/signin')
          return
        }
        const resp = await fetch(`/api/advisor/shared-plans/${shareId}`)
        if (!resp.ok) {
          const json = await resp.json().catch(() => ({}))
          setError(json.error || 'Failed to load')
          return
        }
        const json = await resp.json()
        setData(json)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [shareId, router])

  const handlePost = async () => {
    const body = draft.trim()
    if (!body) return
    setPosting(true)
    try {
      const resp = await fetch(`/api/advisor/shared-plans/${shareId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      })
      const json = await resp.json()
      if (!resp.ok) {
        addToast(json.error || 'Failed to post', 'error')
        return
      }
      setData((prev) =>
        prev
          ? {
              ...prev,
              comments: [...prev.comments, json.comment],
              share: { ...prev.share, status: 'REVIEWED' },
            }
          : prev,
      )
      setDraft('')
      addToast('Feedback sent', 'success')
    } finally {
      setPosting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-gray-300 border-t-forest-600 rounded-full" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <PageShell bucket="detail" surface="functional">
        <a href="/advisor/inbox" className="text-forest-700 hover:underline text-sm font-medium">
          ← Back to inbox
        </a>
        <p className="text-center text-gray-500 py-16">{error || 'Not found.'}</p>
      </PageShell>
    )
  }

  return (
    <PageShell bucket="detail" surface="functional">
      <a
        href="/advisor/inbox"
        className="text-forest-700 hover:underline text-sm font-medium mb-4 inline-block"
      >
        ← Back to inbox
      </a>

      <PageHeader
        eyebrow={data.plan.calculatorType}
        title={data.plan.name || 'Untitled plan'}
        subtitle={`Shared by ${data.investor.name}${
          data.investor.city ? ` · ${data.investor.city}` : ''
        }${data.investor.riskProfile ? ` · ${data.investor.riskProfile}` : ''}.`}
      />

      {data.share.message && (
        <div
          className="rounded-lg p-4 mb-6 border"
          style={{
            background: 'var(--bk-forest-25, #f8fafc)',
            borderColor: 'var(--bk-forest-100, #e5e7eb)',
          }}
        >
          <p className="text-xs uppercase tracking-wider text-ink-400 mb-1">
            Message from investor
          </p>
          <p className="text-gray-800">{data.share.message}</p>
        </div>
      )}

      <section className="card p-6 mb-6">
        <h2 className="text-lg font-semibold text-forest-700 mb-4">Plan details</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xs uppercase tracking-wider text-ink-400 mb-2">Inputs</h3>
            <dl className="space-y-1 text-sm">
              {Object.entries(data.plan.inputs).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b border-gray-100 py-1">
                  <dt className="text-gray-600">{k}</dt>
                  <dd className="text-gray-900 font-medium text-right">{formatValue(v)}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-wider text-ink-400 mb-2">Results</h3>
            <dl className="space-y-1 text-sm">
              {Object.entries(data.plan.results).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b border-gray-100 py-1">
                  <dt className="text-gray-600">{k}</dt>
                  <dd className="text-gray-900 font-medium text-right">{formatValue(v)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold text-forest-700 mb-4">Your feedback</h2>

        {data.comments.length === 0 ? (
          <p className="text-sm text-gray-400 italic mb-4">
            No comments yet. Add your first one below.
          </p>
        ) : (
          <div className="space-y-3 mb-6">
            {data.comments.map((c) => (
              <div
                key={c.id}
                className="text-sm text-gray-800 whitespace-pre-wrap p-3 rounded-lg border border-gray-200"
              >
                <p>{c.body}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(c.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}

        {data.share.permission === 'COMMENT' ? (
          <>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={4}
              maxLength={10000}
              placeholder="Write a recommendation, ask a clarifying question, or note an area of concern…"
              className="input-modern w-full mb-3"
            />
            <button
              onClick={handlePost}
              disabled={posting || draft.trim().length === 0}
              className="btn-primary px-6 py-2 disabled:opacity-50"
            >
              {posting ? 'Posting…' : data.comments.length === 0 ? 'Send feedback' : 'Add comment'}
            </button>
            <p className="text-xs text-gray-500 mt-3">
              The investor will see this. Other advisors who also received this plan will not.
            </p>
          </>
        ) : (
          <div className="rounded-lg p-4 bg-gray-50 border border-gray-200">
            <p className="text-sm text-gray-600">
              You have view-only access to this plan. The investor hasn't enabled commenting.
            </p>
          </div>
        )}
      </section>
    </PageShell>
  )
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'number') return v.toLocaleString('en-IN')
  if (typeof v === 'string') return v
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  return JSON.stringify(v)
}
