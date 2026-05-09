'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { ForumQuestionCard } from '@/app/components/ForumQuestionCard'
import { useToast } from '@/app/components/toast-context'

interface Question {
  id: string
  title: string
  content: string
  status: string
  answer_count: number
  created_at: string
  author?: {
    id: string
    email: string
    full_name?: string
  }
}

export default function Forum() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addToast } = useToast()

  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'))
  const [totalPages, setTotalPages] = useState(1)

  const handleSearch = async (newPage = 1, query = searchQuery) => {
    setSearching(true)
    try {
      const params = new URLSearchParams()
      params.append('page', newPage.toString())
      params.append('limit', '20')
      if (query) params.append('q', query)

      const response = await fetch(`/api/forum/questions?${params}`)
      const data = await response.json()

      if (!response.ok) {
        addToast('Failed to fetch questions', 'error')
        return
      }

      setQuestions(data.data || [])
      setTotalPages(data.pagination?.total_pages || 1)
      setPage(newPage)

      // Update URL
      const newParams = new URLSearchParams()
      if (query) newParams.append('q', query)
      newParams.append('page', newPage.toString())
      router.push(`?${newParams.toString()}`)
    } catch (error) {
      console.error('Search error:', error)
      addToast('Error fetching questions', 'error')
    } finally {
      setSearching(false)
    }
  }

  useEffect(() => {
    handleSearch(1, searchQuery)
  }, [])

  const handleSearchInput = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch(1, searchQuery)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <a href="/dashboard" className="text-blue-600 hover:text-blue-700 font-semibold mb-6 inline-block">
            ← Back to Dashboard
          </a>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Community Q&A</h1>
          <p className="text-xl text-gray-600">
            Ask questions and learn from expert advisors
          </p>
        </div>

        {/* Search & Action Bar */}
        <div className="mb-8 flex gap-4">
          <form onSubmit={handleSearchInput} className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions..."
              className="input-modern w-full pl-10"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </form>
          <button
            onClick={() => router.push('/forum/ask')}
            className="btn-primary px-6 py-2 font-semibold"
          >
            Ask Question
          </button>
        </div>

        {/* Questions List */}
        {questions.length > 0 ? (
          <>
            <div className="space-y-4 mb-8">
              {questions.map((question) => (
                <ForumQuestionCard key={question.id} {...question} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => handleSearch(page - 1, searchQuery)}
                  disabled={page === 1 || searching}
                  className="btn-outline px-4 py-2 disabled:opacity-50"
                >
                  ← Previous
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => handleSearch(p, searchQuery)}
                      disabled={searching}
                      className={`px-3 py-2 rounded-lg font-semibold transition ${
                        p === page
                          ? 'btn-primary'
                          : 'border-2 border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handleSearch(page + 1, searchQuery)}
                  disabled={page === totalPages || searching}
                  className="btn-outline px-4 py-2 disabled:opacity-50"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        ) : (
          !searching && (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No questions found.</p>
              <button
                onClick={() => router.push('/forum/ask')}
                className="text-blue-600 hover:text-blue-700 font-semibold mt-4"
              >
                Be the first to ask a question →
              </button>
            </div>
          )
        )}
      </div>
    </div>
  )
}
