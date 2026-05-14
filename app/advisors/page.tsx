'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline'
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
  rating_average?: number | null
  rating_count?: number
}

interface FacetRow {
  id: string
  slug: string
  name: string
}

const FACET_DOMAINS = [
  { key: 'product', label: 'Products', domain: 'products' },
  { key: 'service', label: 'Services', domain: 'services' },
  { key: 'brand', label: 'Brands', domain: 'brands' },
] as const

function AdvisorsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addToast } = useToast()

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [advisors, setAdvisors] = useState<Advisor[]>([])

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || '')
  const [selectedSpec, setSelectedSpec] = useState(searchParams.get('specialization') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'rating')
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'))
  const [totalPages, setTotalPages] = useState(1)

  // Faceted filter state. Each Set holds the master-data UUIDs the user has
  // ticked. Initialised from URL so deep links render in the right state.
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set(searchParams.getAll('product')),
  )
  const [selectedServices, setSelectedServices] = useState<Set<string>>(
    new Set(searchParams.getAll('service')),
  )
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(
    new Set(searchParams.getAll('brand')),
  )

  const [facetCatalogs, setFacetCatalogs] = useState<{
    product: FacetRow[]
    service: FacetRow[]
    brand: FacetRow[]
  }>({ product: [], service: [], brand: [] })

  const buildSearchParams = useCallback(
    (newPage: number) => {
      const p = new URLSearchParams()
      if (searchQuery) p.append('q', searchQuery)
      if (selectedCity) p.append('city', selectedCity)
      if (selectedSpec) p.append('specialization', selectedSpec)
      for (const id of selectedProducts) p.append('product', id)
      for (const id of selectedServices) p.append('service', id)
      for (const id of selectedBrands) p.append('brand', id)
      p.append('sort', sortBy)
      p.append('page', String(newPage))
      p.append('limit', '20')
      return p
    },
    [
      searchQuery,
      selectedCity,
      selectedSpec,
      selectedProducts,
      selectedServices,
      selectedBrands,
      sortBy,
    ],
  )

  const handleSearch = useCallback(
    async (newPage = 1) => {
      setSearching(true)
      try {
        const params = buildSearchParams(newPage)
        const response = await fetch(`/api/advisors/search?${params.toString()}`)
        const data = await response.json()
        if (!response.ok) {
          addToast('Failed to search advisors', 'error')
          return
        }
        setAdvisors(data.data || [])
        setTotalPages(data.pagination?.total_pages || 1)
        setPage(newPage)
        // Mirror state to URL (without `limit`, that's a paging detail).
        const urlParams = new URLSearchParams(params)
        urlParams.delete('limit')
        router.push(`?${urlParams.toString()}`)
      } catch (error) {
        console.error('Search error:', error)
        addToast('Error searching advisors', 'error')
      } finally {
        setSearching(false)
      }
    },
    [buildSearchParams, router, addToast],
  )

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

  // Lazy-load the facet catalogs once the user is signed in. One batched
  // pass; cached for the lifetime of the page.
  useEffect(() => {
    if (!user) return
    const loadCatalogs = async () => {
      try {
        const [pResp, sResp, bResp] = await Promise.all([
          fetch('/api/master-data/products'),
          fetch('/api/master-data/services'),
          fetch('/api/master-data/brands'),
        ])
        const [p, s, b] = await Promise.all([pResp.json(), sResp.json(), bResp.json()])
        setFacetCatalogs({
          product: p.data ?? [],
          service: s.data ?? [],
          brand: b.data ?? [],
        })
      } catch (err) {
        console.error('facet catalog load failed', err)
      }
    }
    loadCatalogs()
  }, [user])

  // Auto-search whenever a facet flips. Uses a debounce-y approach via the
  // sets identity; runs after the catalogs load too so initial deep-links
  // produce a fetch.
  useEffect(() => {
    if (!loading && user) {
      handleSearch(1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, selectedProducts, selectedServices, selectedBrands, sortBy])

  const toggleSetItem = (setter: typeof setSelectedProducts, id: string) => {
    setter((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const clearAllFilters = () => {
    setSearchQuery('')
    setSelectedCity('')
    setSelectedSpec('')
    setSelectedProducts(new Set())
    setSelectedServices(new Set())
    setSelectedBrands(new Set())
    setSortBy('rating')
  }

  const activeFacetCount = useMemo(
    () =>
      selectedProducts.size +
      selectedServices.size +
      selectedBrands.size +
      (selectedCity ? 1 : 0) +
      (selectedSpec ? 1 : 0) +
      (searchQuery ? 1 : 0),
    [selectedProducts, selectedServices, selectedBrands, selectedCity, selectedSpec, searchQuery],
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-gray-300 border-t-blue-500 rounded-full"></div>
      </div>
    )
  }

  const setterFor = (key: 'product' | 'service' | 'brand') =>
    key === 'product' ? setSelectedProducts : key === 'service' ? setSelectedServices : setSelectedBrands

  const selectedFor = (key: 'product' | 'service' | 'brand') =>
    key === 'product' ? selectedProducts : key === 'service' ? selectedServices : selectedBrands

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <a href="/dashboard" className="text-blue-600 hover:text-blue-700 font-semibold mb-6 inline-block">
          ← Back to Dashboard
        </a>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Find Advisors</h1>
        <p className="text-xl text-gray-600 mb-10">
          Filter by expertise, products, services, or brands to find advisors that match what you need.
        </p>

        <div className="grid lg:grid-cols-[280px_1fr] gap-8">
          {/* Faceted filter sidebar */}
          <aside className="lg:sticky lg:top-6 lg:self-start space-y-6">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-700 flex items-center gap-2">
                  <FunnelIcon className="h-4 w-4" /> Filters
                </h3>
                {activeFacetCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-xs text-red-600 hover:text-red-700 font-semibold inline-flex items-center gap-1"
                  >
                    <XMarkIcon className="h-3 w-3" /> Clear all ({activeFacetCount})
                  </button>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Search</label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Name, company, bio…"
                    className="input-modern w-full pl-8 text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch(1)}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-600 mb-1">City</label>
                <input
                  type="text"
                  placeholder="Mumbai…"
                  className="input-modern w-full text-sm"
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(1)}
                />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Specialization</label>
                <input
                  type="text"
                  placeholder="Retirement planning…"
                  className="input-modern w-full text-sm"
                  value={selectedSpec}
                  onChange={(e) => setSelectedSpec(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(1)}
                />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Sort by</label>
                <select
                  className="input-modern w-full text-sm"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="rating">Top rated</option>
                  <option value="followers">Most followers</option>
                  <option value="newest">Newest</option>
                </select>
              </div>

              <button
                onClick={() => handleSearch(1)}
                disabled={searching}
                className="btn-primary w-full text-sm py-2"
              >
                {searching ? 'Searching…' : 'Apply text filters'}
              </button>
            </div>

            {FACET_DOMAINS.map(({ key, label }) => {
              const catalog = facetCatalogs[key]
              const selected = selectedFor(key)
              return (
                <div key={key} className="card p-5">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-700 mb-3">
                    {label}
                    {selected.size > 0 && (
                      <span className="ml-2 text-xs text-blue-600 font-bold">({selected.size})</span>
                    )}
                  </h3>
                  {catalog.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">Loading…</p>
                  ) : (
                    <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                      {catalog.map((row) => (
                        <label
                          key={row.id}
                          className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:text-gray-900"
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded"
                            checked={selected.has(row.id)}
                            onChange={() => toggleSetItem(setterFor(key), row.id)}
                          />
                          <span className="truncate">{row.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </aside>

          {/* Results */}
          <section>
            {advisors.length > 0 ? (
              <>
                <div className="mb-4 text-sm text-gray-600">
                  {searching ? 'Searching…' : `Found ${advisors.length} advisor${advisors.length !== 1 ? 's' : ''}`}
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  {advisors.map((advisor) => (
                    <AdvisorCard key={advisor.id} {...advisor} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 flex-wrap">
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
                <div className="card p-12 text-center">
                  <p className="text-gray-600 text-lg mb-2">No advisors found.</p>
                  <p className="text-gray-500 text-sm">
                    Try clearing some filters{' '}
                    {activeFacetCount > 0 && (
                      <button
                        onClick={clearAllFilters}
                        className="text-blue-600 hover:text-blue-700 font-semibold"
                      >
                        — clear all
                      </button>
                    )}
                  </p>
                </div>
              )
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

export default function Advisors() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin h-12 w-12 border-4 border-gray-300 border-t-blue-500 rounded-full"></div>
        </div>
      }
    >
      <AdvisorsContent />
    </Suspense>
  )
}
