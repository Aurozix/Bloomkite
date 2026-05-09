'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/app/components/toast-context'

export default function AskQuestion() {
  const router = useRouter()
  const { addToast } = useToast()

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

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
      } catch (error) {
        console.error('Error fetching user:', error)
        addToast('Error loading user session', 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [router, addToast])

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
        }),
      })

      if (!response.ok) {
        addToast('Failed to post question', 'error')
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
        {/* Header */}
        <a href="/forum" className="text-blue-600 hover:text-blue-700 font-semibold mb-6 inline-block">
          ← Back to Forum
        </a>

        <h1 className="text-4xl font-bold text-gray-900 mb-2">Ask a Question</h1>
        <p className="text-xl text-gray-600 mb-8">
          Get expert advice from our community of financial advisors
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Question Title
            </label>
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

          {/* Content */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Description
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Provide more details about your question..."
              className="input-modern w-full h-40 resize-none"
              disabled={submitting}
            />
            <p className="text-xs text-gray-500 mt-1">Include any relevant context</p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full py-3 text-lg font-semibold disabled:opacity-50"
          >
            {submitting ? 'Posting...' : 'Post Question'}
          </button>
        </form>

        {/* Tips */}
        <div className="mt-12 card p-6 bg-blue-50">
          <h3 className="font-semibold text-gray-900 mb-3">Tips for Great Questions:</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>✓ Be specific about what you're asking</li>
            <li>✓ Include relevant details (age, income level, goals, etc.)</li>
            <li>✓ Mention what you've already tried or researched</li>
            <li>✓ Use clear language and proper grammar</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
