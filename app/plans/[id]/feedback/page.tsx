'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'

import { useToast } from '@/app/components/toast-context'
import { PageShell } from '@/app/components/PageShell'
import { PageHeader } from '@/app/components/PageHeader'

interface Comment {
  id: string
  body: string
  createdAt: string
}

interface AdvisorFeedback {
  shareId: string
  advisorId: string
  advisorName: string
  advisorCompany: string | null
  advisorImage: string | null
  permission: 'VIEW' | 'COMMENT'
  status: 'NEW' | 'VIEWED' | 'REVIEWED' | 'REVOKED'
  sharedAt: string
  viewedAt: string | null
  reviewedAt: string | null
  revokedAt: string | null
  comments: Comment[]
}

interface FeedbackResponse {
  plan: {
    id: string
    name: string | null
    calculatorType: string
    inputs: Record<string, unknown>
    results: Record<string, unknown>
  }
  advisors: AdvisorFeedback[]
}

const STATUS_LABEL: Record<string, string> = {
  NEW: 'Awaiting view',
  VIEWED: 'Viewed, no comment yet',
  REVIEWED: 'Responded',
  REVOKED: 'Revoked',
}

const STATUS_DOT: Record<string, string> = {
  NEW: 'bg-blue-400',
  VIEWED: 'bg-amber-400',
  REVIEWED: 'bg-green-500',
  REVOKED: 'bg-gray-300',
}

export default function CompareFeedbackPage() {
  const router = useRouter()
  const params = useParams()
  const planId = params.id as string
  const { addToast } = useToast()

  const [data, setData] = useState<FeedbackResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const sessionResp = await fetch('/api/auth/session')
        const sessionData = await sessionResp.json()
        if (!sessionData.user) {
          router.push('/auth/signin')
          return
        }
        const resp = await fetch(`/api/financial-plans/${planId}/feedback`)
        if (!resp.ok) {
          addToast(resp.status === 404 ? 'Plan not found' : 'Failed to load', 'error')
          return
        }
        const json = await resp.json()
        setData(json)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [planId, router, addToast])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-gray-300 border-t-forest-600 rounded-full" />
      </div>
    )
  }

  if (!data) {
    return (
      <PageShell bucket="detail" surface="functional">
        <p className="text-center text-gray-500 py-16">Plan not found.</p>
      </PageShell>
    )
  }

  const respondedCount = data.advisors.filter((a) => a.comments.length > 0).length

  return (
    <PageShell bucket="index" surface="functional">
      <a
        href="/plans"
        className="text-forest-700 hover:underline text-sm font-medium mb-4 inline-block"
      >
        ← Back to your plans
      </a>

      <PageHeader
        eyebrow={data.plan.calculatorType}
        title={data.plan.name || 'Untitled plan'}
        subtitle={`Shared with ${data.advisors.length} advisor${data.advisors.length === 1 ? '' : 's'} · ${respondedCount} responded.`}
      />

      {data.advisors.length === 0 ? (
        <div className="card p-12 text-center">
          <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-600">This plan hasn't been shared with anyone yet.</p>
          <a href="/plans" className="btn-primary inline-block mt-4 px-6 py-3">
            Back to plans
          </a>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {data.advisors.map((adv) => (
            <article
              key={adv.shareId}
              className={`card p-6 flex flex-col ${
                adv.status === 'REVOKED' ? 'opacity-60' : ''
              }`}
            >
              <header className="flex items-start gap-3 mb-4 pb-4 border-b border-gray-100">
                <div className="h-10 w-10 rounded-full bg-forest-100 flex items-center justify-center text-forest-700 font-semibold flex-shrink-0">
                  {adv.advisorName.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-forest-700 truncate">
                    {adv.advisorName}
                  </h3>
                  {adv.advisorCompany && (
                    <p className="text-xs text-gray-500 truncate">{adv.advisorCompany}</p>
                  )}
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-600">
                    <span className={`h-2 w-2 rounded-full ${STATUS_DOT[adv.status]}`} />
                    {STATUS_LABEL[adv.status]}
                    <span className="text-gray-400">·</span>
                    {adv.permission === 'VIEW' ? 'View only' : 'Can comment'}
                  </div>
                </div>
              </header>

              {adv.comments.length === 0 ? (
                <p className="text-sm text-gray-400 italic flex-1 flex items-center justify-center min-h-[80px]">
                  {adv.status === 'REVOKED'
                    ? 'You revoked this share.'
                    : adv.permission === 'VIEW'
                      ? 'View-only access — no feedback expected.'
                      : 'No feedback yet.'}
                </p>
              ) : (
                <div className="space-y-3 flex-1">
                  {adv.comments.map((c) => (
                    <div
                      key={c.id}
                      className="text-sm text-gray-800 whitespace-pre-wrap p-3 bg-forest-25 rounded-lg border border-forest-100"
                      style={{
                        background: 'var(--bk-forest-25, #f8fafc)',
                        borderColor: 'var(--bk-forest-100, #e5e7eb)',
                      }}
                    >
                      <p>{c.body}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(c.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </PageShell>
  )
}
