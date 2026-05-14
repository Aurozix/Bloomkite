'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useToast } from '@/app/components/toast-context'
import { MAX_TAGGED_ADVISORS_PER_QUESTION } from '@/lib/advisor-engagement'

interface AdvisorRow {
  id: string
  user_id: string
  display_name: string | null
  company_name: string | null
}

export default function AskQuestion() {
  const router = useRouter()
  const { addToast } = useToast()

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  // Advisor tagging state — BRD §3.4. Up to 5 advisors per question (cap
  // shared via MAX_TAGGED_ADVISORS_PER_QUESTION).
  const [advisorCatalog, setAdvisorCatalog] = useState<AdvisorRow[]>([])
  const [advisorSearch, setAdvisorSearch] = useState('')
  const [taggedIds, setTaggedIds] = useState<string[]>([])

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/session')
        const data = await response.json()
        if (!data.user) {
          addToast('Please sign in to ask questions', 'info')
          router.push('/auth/signin')
          return
        }
        setUser(data.user)
        // Lazy-load the advisor list once the user is in. 100 cap matches
        // the picker capacity; refine search filter is client-side.
        const advResp = await fetch('/api/advisors/search?limit=100')
        const advJson = await advResp.json()
        setAdvisorCatalog(advJson.data ?? [])
      } catch (error) {
        console.error('Error fetching user:', error)
        addToast('Error loading user session', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [router, addToast])

  const filteredAdvisors = useMemo(() => {
    const q = advisorSearch.trim().toLowerCase()
    return advisorCatalog
      .filter((a) => !taggedIds.includes(a.user_id))
      .filter((a) => {
        if (!q) return true
        const hay = `${a.display_name ?? ''} ${a.company_name ?? ''}`.toLowerCase()
        return hay.includes(q)
      })
      .slice(0, 8)
  }, [advisorCatalog, advisorSearch, taggedIds])

  const taggedAdvisors = useMemo(
    () =>
      taggedIds
        .map((id) => advisorCatalog.find((a) => a.user_id === id))
        .filter((a): a is AdvisorRow => Boolean(a)),
    [taggedIds, advisorCatalog],
  )

  const addTag = (id: string) => {
    if (taggedIds.length >= MAX_TAGGED_ADVISORS_PER_QUESTION) {
      addToast(`At most ${MAX_TAGGED_ADVISORS_PER_QUESTION} advisors per question`, 'error')
      return
    }
    setTaggedIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
    setAdvisorSearch('')
  }

  const removeTag = (id: string) => {
    setTaggedIds((prev) => prev.filter((x) => x !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      addToast('Please enter a question title', 'error')
      return
    }
    if (!content.trim()) {
      addToast('Please describe your question', 'error')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/forum/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          taggedAdvisorIds: taggedIds,
        }),
      })

      if (!response.ok) {
        const json = await response.json().catch(() => ({}))
        addToast(json.error || 'Failed to post question', 'error')
        return
      }

      const data = await response.json()
      addToast('Question posted successfully', 'success')
      router.push(`/forum/questions/${data.data.id}`)
    } catch (error) {
      console.error('Submit error:', error)
      addToast('Error posting question', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-gray-300 border-t-blue-500 rounded-full"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <a href="/forum" className="text-blue-600 hover:text-blue-700 font-semibold mb-6 inline-block">
          ← Back to Forum
        </a>

        <h1 className="text-4xl font-bold text-gray-900 mb-2">Ask a Question</h1>
        <p className="text-xl text-gray-600 mb-8">
          Get expert advice from our community of financial advisors
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Question Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What do you want to ask?"
              className="input-modern w-full"
              disabled={submitting}
            />
            <p className="text-xs text-gray-500 mt-1">Be specific and clear</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Description</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Provide more details about your question..."
              className="input-modern w-full h-40 resize-none"
              disabled={submitting}
            />
            <p className="text-xs text-gray-500 mt-1">Include any relevant context</p>
          </div>

          {/* Tag advisors — BRD §3.4 */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Tag advisors{' '}
              <span className="text-xs font-normal text-gray-500">
                (optional, up to {MAX_TAGGED_ADVISORS_PER_QUESTION})
              </span>
            </label>

            {taggedAdvisors.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {taggedAdvisors.map((a) => (
                  <span
                    key={a.user_id}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold"
                  >
                    {a.display_name || 'Advisor'}
                    <button
                      type="button"
                      onClick={() => removeTag(a.user_id)}
                      className="hover:bg-blue-100 rounded-full p-0.5"
                      aria-label="Remove tag"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {taggedIds.length < MAX_TAGGED_ADVISORS_PER_QUESTION && (
              <>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search advisors by name or company…"
                    value={advisorSearch}
                    onChange={(e) => setAdvisorSearch(e.target.value)}
                    className="input-modern w-full pl-9 text-sm"
                    disabled={submitting}
                  />
                </div>

                {advisorSearch.trim() && filteredAdvisors.length > 0 && (
                  <div className="mt-2 border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-56 overflow-y-auto">
                    {filteredAdvisors.map((a) => (
                      <button
                        key={a.user_id}
                        type="button"
                        onClick={() => addTag(a.user_id)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 flex flex-col"
                      >
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {a.display_name || 'Unnamed advisor'}
                        </span>
                        {a.company_name && (
                          <span className="text-xs text-gray-500 truncate">{a.company_name}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Tagged advisors will see your question in their inbox.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full py-3 text-lg font-semibold disabled:opacity-50"
          >
            {submitting ? 'Posting...' : 'Post Question'}
          </button>
        </form>

        <div className="mt-12 card p-6 bg-blue-50">
          <h3 className="font-semibold text-gray-900 mb-3">Tips for Great Questions:</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>✓ Be specific about what you're asking</li>
            <li>✓ Include relevant details (age, income level, goals, etc.)</li>
            <li>✓ Mention what you've already tried or researched</li>
            <li>✓ Tag a few advisors who specialise in your topic</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
