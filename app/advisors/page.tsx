'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { AdvisorCard } from '@/app/components/AdvisorCard'
import { useToast } from '@/app/components/toast-context'

interface Advisor {
  id: string
  display_name: string
  company_name?: string
  bio?: string
  profile_image_url?: string
  is_verified: boolean
  city?: string
  state?: string
  follower_count: number
  expertise: string[]
}

export default function Advisors() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addToast } = useToast()

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [advisors, setAdvisors] = useState<Advisor[]>([])

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || '')
  const [selectedSpec, setSelectedSpec] = useState(searchParams.get('spec') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest')
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'))
  const [totalPages, setTotalPages] = useState(1)

  // Fetch user on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/session')
        const data = await response.json()

        if (!data.user) {
          router.push('/auth/signin')
          return
        }

        setUser(data.user)
      } catch (error) {
        console.error('Session error:', error)
        router.push('/auth/signin')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [router])

  // Search advisors
  const handleSearch = async (newPage = 1) => {
    setSearching(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append('q', searchQuery)
      if (selectedCity) params.append('city', selectedCity)
      if (selectedSpec) params.append('specialization', selectedSpec)
      params.append('sort', sortBy)
      params.append('page', newPage.toString())
      params.append('limit', '20')

      const response = await fetch(`/api/advisors/search?${params}`)
      const data = await response.json()

      if (!response.ok) {
        addToast('Failed to search advisors', 'error')
        return
      }

      setAdvisors(data.data || [])
      setTotalPages(data.pagination?.total_pages || 1)
      setPage(newPage)

      // Update URL
      const newParams = new URLSearchParams()
      if (searchQuery) newParams.append('q', searchQuery)
      if (selectedCity) newParams.append('city', selectedCity)
      if (selectedSpec) newParams.append('spec', selectedSpec)
      newParams.append('sort', sortBy)
      newParams.append('page', newPage.toString())
      router.push(`?${newParams.toString()}`)
    } catch (error) {
      console.error('Search error:', error)
      addToast('Error searching advisors', 'error')
    } finally {
      setSearching(false)
    }
  }

  useEffect(() => {
    if (!loading && user) {
      handleSearch(1)
    }
  }, [loading, user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-gray-300 border-t-blue-500 rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <a href="/dashboard" className="text-blue-600 hover:text-blue-700 font-semibold mb-6 inline-block">
            ← Back to Dashboard
          </a>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Find Advisors</h1>
          <p className="text-xl text-gray-600">
            Discover verified financial advisors and build relationships for personalized guidance
          </p>
        </div>

        {/* Search and Filters */}
        <div className="card p-6 mb-8">
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            {/* Search Bar */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Name, company, expertise..."
                  className="input-modern w-full pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch(1)}
                />
              </div>
            </div>

            {/* City Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
              <input
                type="text"
                placeholder="Filter by city..."
                className="input-modern w-full"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(1)}
              />
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Sort By</label>
              <select
                className="input-modern w-full"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value)
                  handleSearch(1)
                }}
              >
                <option value="newest">Newest</option>
                <option value="followers">Most Followers</option>
              </select>
            </div>
          </div>

          {/* Specialization Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Specialization</label>
            <input
              type="text"
              placeholder="Filter by specialization..."
              className="input-modern w-full"
              value={selectedSpec}
              onChange={(e) => setSelectedSpec(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch(1)}
            />
          </div>

          {/* Search Button */}
          <div className="mt-6">
            <button
              onClick={() => handleSearch(1)}
              disabled={searching}
              className="btn-primary w-full py-3 text-lg"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Results */}
        {advisors.length > 0 ? (
          <>
            <div className="mb-4 text-sm text-gray-600">
              Found {advisors.length} advisor{advisors.length !== 1 ? 's' : ''}
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {advisors.map((advisor) => (
                <AdvisorCard key={advisor.id} {...advisor} />
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
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
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
              <p className="text-gray-600 text-lg">No advisors found. Try adjusting your filters.</p>
            </div>
          )
        )}
      </div>
    </div>
  )
}
