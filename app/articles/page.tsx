'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { ArticleCard } from '@/app/components/ArticleCard'
import { useToast } from '@/app/components/toast-context'

interface Article {
  id: string
  title: string
  content: string
  category?: string
  tags?: string[]
  featured_image_url?: string
  published_at: string
  author?: {
    id: string
    email: string
    full_name?: string
  }
}

const CATEGORIES = ['All', 'Investment', 'Tax', 'Retirement', 'Insurance', 'Budgeting']

function ArticlesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addToast } = useToast()

  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All')
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'))
  const [totalPages, setTotalPages] = useState(1)

  // Fetch articles
  const handleSearch = async (newPage = 1) => {
    setSearching(true)
    try {
      const params = new URLSearchParams()
      if (selectedCategory !== 'All') params.append('category', selectedCategory)
      params.append('page', newPage.toString())
      params.append('limit', '12')

      const response = await fetch(`/api/articles?${params}`)
      const data = await response.json()

      if (!response.ok) {
        addToast('Failed to fetch articles', 'error')
        return
      }

      setArticles(data.data || [])
      setTotalPages(data.pagination?.total_pages || 1)
      setPage(newPage)

      // Update URL
      const newParams = new URLSearchParams()
      if (searchQuery) newParams.append('q', searchQuery)
      if (selectedCategory !== 'All') newParams.append('category', selectedCategory)
      newParams.append('page', newPage.toString())
      router.push(`?${newParams.toString()}`)
    } catch (error) {
      console.error('Search error:', error)
      addToast('Error fetching articles', 'error')
    } finally {
      setSearching(false)
    }
  }

  useEffect(() => {
    handleSearch(1)
  }, [selectedCategory])

  useEffect(() => {
    handleSearch(1)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <a href="/dashboard" className="text-blue-600 hover:text-blue-700 font-semibold mb-6 inline-block">
            ← Back to Dashboard
          </a>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Financial Articles</h1>
          <p className="text-xl text-gray-600">
            Learn from expert advisors and stay informed about financial planning
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-8 flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full font-semibold transition ${
                selectedCategory === cat
                  ? 'btn-primary'
                  : 'border-2 border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Articles Grid */}
        {articles.length > 0 ? (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {articles.map((article) => (
                <ArticleCard key={article.id} {...article} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => handleSearch(page - 1)}
                  disabled={page === 1 || searching}
                  className="btn-outline px-4 py-2 disabled:opacity-50"
                >
                  ← Previous
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => handleSearch(p)}
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
                  onClick={() => handleSearch(page + 1)}
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
              <p className="text-gray-600 text-lg">No articles found.</p>
            </div>
          )
        )}
      </div>
    </div>
  )
}

export default function Articles() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin h-12 w-12 border-4 border-gray-300 border-t-blue-500 rounded-full"></div>
        </div>
      }
    >
      <ArticlesContent />
    </Suspense>
  )
}
