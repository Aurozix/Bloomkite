'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { InboxIcon, ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/outline'

import { useToast } from '@/app/components/toast-context'
import { PageShell } from '@/app/components/PageShell'
import { PageHeader } from '@/app/components/PageHeader'

interface InboxRow {
  id: string
  planId: string
  planName: string | null
  calculatorType: string
  sharedAt: string
  permission: 'VIEW' | 'COMMENT'
  status: 'NEW' | 'VIEWED' | 'REVIEWED' | 'REVOKED'
  message: string | null
  myCommentCount: number
  investor: {
    id: string
    name: string
    city: string | null
    riskProfile: string | null
  }
}

interface ForumTagRow {
  questionId: string
  taggedAt: string
  title: string
  contentPreview: string
  status: string
  answerCount: number
  askerName: string
  askerCity: string | null
  askedAt: string
}

const STATUS_PILL: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-700',
  VIEWED: 'bg-amber-100 text-amber-700',
  REVIEWED: 'bg-green-100 text-green-700',
  REVOKED: 'bg-gray-100 text-gray-500',
}

export default function AdvisorInboxPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [rows, setRows] = useState<InboxRow[]>([])
  const [forumTags, setForumTags] = useState<ForumTagRow[]>([])
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
        const [sharesResp, tagsResp] = await Promise.all([
          fetch('/api/advisor/shared-plans'),
          fetch('/api/advisor/forum-tags'),
        ])
        if (!sharesResp.ok) {
          addToast('Failed to load inbox', 'error')
          return
        }
        const sharesData = await sharesResp.json()
        setRows(sharesData.shares ?? [])
        if (tagsResp.ok) {
          const tagsData = await tagsResp.json()
          setForumTags(tagsData.tags ?? [])
        }
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

  const newCount = rows.filter((r) => r.status === 'NEW').length

  return (
    <PageShell bucket="detail" surface="functional">
      <PageHeader
        eyebrow="Advisor"
        title="Inbox"
        subtitle={
          rows.length === 0 && forumTags.length === 0
            ? 'No shared plans or forum tags yet.'
            : `${rows.length} shared plan${rows.length === 1 ? '' : 's'}${newCount > 0 ? ` · ${newCount} new` : ''} · ${forumTags.length} forum tag${forumTags.length === 1 ? '' : 's'}.`
        }
      />

      {/* Forum tags — BRD §3.4. Shown above shared plans because they're
          generally more time-sensitive and higher-volume. */}
      {forumTags.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-400 mb-3 flex items-center gap-2">
            <ChatBubbleLeftEllipsisIcon className="h-4 w-4" /> Tagged in forum questions
          </h2>
          <div className="space-y-2">
            {forumTags.map((t) => (
              <a
                key={t.questionId}
                href={`/forum/questions/${t.questionId}`}
                className="card p-4 block hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-forest-700 truncate">{t.title}</h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{t.contentPreview}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Asked by <span className="font-medium">{t.askerName}</span>
                      {t.askerCity && ` · ${t.askerCity}`}
                      {' · '}
                      {t.answerCount} answer{t.answerCount === 1 ? '' : 's'}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {new Date(t.taggedAt).toLocaleDateString()}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-400 mb-3 flex items-center gap-2">
        <InboxIcon className="h-4 w-4" /> Shared plans
      </h2>

      {rows.length === 0 ? (
        <div className="card p-12 text-center">
          <InboxIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-600">
            When investors share their financial plans with you, they'll appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <a
              key={r.id}
              href={`/advisor/inbox/${r.id}`}
              className="card p-5 flex items-center justify-between gap-4 hover:shadow-md transition"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${STATUS_PILL[r.status] ?? ''}`}
                  >
                    {r.status}
                  </span>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">
                    {r.calculatorType}
                  </span>
                  {r.permission === 'VIEW' && (
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                      View only
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-forest-700 truncate">
                  {r.planName || 'Untitled plan'}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  From <span className="font-medium">{r.investor.name}</span>
                  {r.investor.city && ` · ${r.investor.city}`}
                  {r.investor.riskProfile && ` · ${r.investor.riskProfile}`}
                </p>
                {r.message && (
                  <p className="text-sm text-gray-500 italic mt-1 truncate">
                    "{r.message}"
                  </p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-gray-500">
                  {new Date(r.sharedAt).toLocaleDateString()}
                </p>
                {r.myCommentCount > 0 && (
                  <p className="text-xs text-green-700 font-semibold mt-1">
                    {r.myCommentCount} reply
                    {r.myCommentCount === 1 ? '' : 'ies'}
                  </p>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </PageShell>
  )
}
