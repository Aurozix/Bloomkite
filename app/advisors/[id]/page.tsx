'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { CheckBadgeIcon, UserIcon } from '@heroicons/react/24/outline'
import { StarIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'
import { useToast } from '@/app/components/toast-context'
import { RATING_MAX } from '@/lib/advisor-engagement'

interface Credential {
  id: string
  credential_type: string
  issuer: string
  license_number: string
  expiry_date: string
  file_url?: string
}

interface Advisor {
  id: string
  display_name: string
  company_name?: string
  bio?: string
  profile_image_url?: string
  is_verified: boolean
  city?: string
  state?: string
  website_url?: string
  phone_number?: string
  follower_count: number
  expertise: string[]
  credentials: Credential[]
  is_following?: boolean
}

interface ReviewRow {
  id: string
  stars: number
  reviewBody: string | null
  createdAt: string
  updatedAt: string
  investorId: string
  investorName: string
  investorCity: string | null
}

interface RatingPayload {
  summary: { ratingCount: number; ratingAverage: number | null }
  ratings: ReviewRow[]
  myRating: { id: string; stars: number; reviewBody: string | null; updatedAt: string } | null
}

export default function AdvisorProfile() {
  const router = useRouter()
  const params = useParams()
  const { addToast } = useToast()

  const [user, setUser] = useState<any>(null)
  const [advisor, setAdvisor] = useState<Advisor | null>(null)
  const [loading, setLoading] = useState(true)
  const [following, setFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  const [ratings, setRatings] = useState<RatingPayload | null>(null)
  const [draftStars, setDraftStars] = useState<number>(0)
  const [draftReview, setDraftReview] = useState('')
  const [submittingRating, setSubmittingRating] = useState(false)

  const advisorId = params.id as string

  const refreshRatings = async () => {
    const r = await fetch(`/api/advisors/${advisorId}/ratings`)
    if (r.ok) {
      const json = (await r.json()) as RatingPayload
      setRatings(json)
      if (json.myRating) {
        setDraftStars(json.myRating.stars)
        setDraftReview(json.myRating.reviewBody ?? '')
      } else {
        setDraftStars(0)
        setDraftReview('')
      }
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sessionResponse = await fetch('/api/auth/session')
        const sessionData = await sessionResponse.json()
        setUser(sessionData.user || null)

        const advisorResponse = await fetch(`/api/advisors/${advisorId}`)
        if (!advisorResponse.ok) {
          addToast('Advisor not found', 'error')
          router.push('/advisors')
          return
        }

        const advisorData = await advisorResponse.json()
        setAdvisor(advisorData.data)
        setFollowing(advisorData.data.is_following || false)

        await refreshRatings()
      } catch (error) {
        console.error('Error fetching data:', error)
        addToast('Error loading advisor profile', 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advisorId, router, addToast])

  const submitRating = async () => {
    if (!user) {
      addToast('Sign in to leave a review', 'info')
      router.push('/auth/signin')
      return
    }
    if (draftStars < 1) {
      addToast('Pick a star rating first', 'error')
      return
    }
    setSubmittingRating(true)
    try {
      const r = await fetch(`/api/advisors/${advisorId}/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stars: draftStars,
          reviewBody: draftReview.trim() || undefined,
        }),
      })
      const json = await r.json()
      if (!r.ok) {
        addToast(json.error || 'Failed to submit', 'error')
        return
      }
      addToast(ratings?.myRating ? 'Review updated' : 'Review submitted', 'success')
      await refreshRatings()
    } finally {
      setSubmittingRating(false)
    }
  }

  const deleteRating = async () => {
    if (!ratings?.myRating) return
    setSubmittingRating(true)
    try {
      const r = await fetch(`/api/advisors/${advisorId}/ratings`, { method: 'DELETE' })
      if (!r.ok) {
        addToast('Failed to remove', 'error')
        return
      }
      addToast('Review removed', 'success')
      await refreshRatings()
    } finally {
      setSubmittingRating(false)
    }
  }

  const handleFollow = async () => {
    if (!user) {
      addToast('Please sign in to follow advisors', 'info')
      router.push('/auth/signin')
      return
    }

    setFollowLoading(true)
    try {
      const method = following ? 'DELETE' : 'POST'
      const response = await fetch(`/api/advisors/${advisorId}/follow`, { method })

      if (!response.ok) {
        addToast(following ? 'Failed to unfollow' : 'Failed to follow', 'error')
        return
      }

      setFollowing(!following)
      if (advisor) {
        setAdvisor({
          ...advisor,
          follower_count: following ? advisor.follower_count - 1 : advisor.follower_count + 1,
        })
      }
      addToast(following ? 'Unfollowed' : 'Now following this advisor', 'success')
    } catch (error) {
      console.error('Error toggling follow:', error)
      addToast('Error updating follow status', 'error')
    } finally {
      setFollowLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-gray-300 border-t-blue-500 rounded-full"></div>
      </div>
    )
  }

  if (!advisor) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <a href="/advisors" className="text-blue-600 hover:text-blue-700 font-semibold mb-6 inline-block">
          ← Back to Advisors
        </a>

        {/* Profile Card */}
        <div className="card p-8 mb-8">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Profile Image & Basic Info */}
            <div className="md:col-span-1 text-center md:text-left">
              {advisor.profile_image_url ? (
                <img
                  src={advisor.profile_image_url}
                  alt={advisor.display_name}
                  className="w-32 h-32 rounded-full object-cover mx-auto md:mx-0 mb-4"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center mx-auto md:mx-0 mb-4">
                  <UserIcon className="h-16 w-16 text-gray-400" />
                </div>
              )}

              <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{advisor.display_name}</h1>
                {advisor.is_verified && (
                  <CheckBadgeIcon className="h-7 w-7 text-green-500" title="Verified Advisor" />
                )}
              </div>

              {advisor.company_name && (
                <p className="text-gray-600 font-semibold mb-1">{advisor.company_name}</p>
              )}

              {(advisor.city || advisor.state) && (
                <p className="text-gray-600 mb-4">
                  {advisor.city && advisor.state ? `${advisor.city}, ${advisor.state}` : advisor.city || advisor.state}
                </p>
              )}

              <p className="text-sm text-gray-600 mb-6">{advisor.follower_count} followers</p>

              <button
                onClick={handleFollow}
                disabled={followLoading}
                className={`w-full py-2 px-4 rounded-lg font-semibold transition ${
                  following
                    ? 'btn-outline'
                    : 'btn-primary'
                }`}
              >
                {followLoading ? 'Loading...' : following ? 'Following ✓' : 'Follow Advisor'}
              </button>
            </div>

            {/* Details */}
            <div className="md:col-span-2">
              {advisor.bio && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">About</h3>
                  <p className="text-gray-600">{advisor.bio}</p>
                </div>
              )}

              {advisor.expertise.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Expertise</h3>
                  <div className="flex flex-wrap gap-2">
                    {advisor.expertise.map((spec) => (
                      <span
                        key={spec}
                        className="inline-block px-3 py-1 text-sm font-semibold rounded-full bg-blue-50 text-blue-700"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(advisor.website_url || advisor.phone_number) && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Contact</h3>
                  <div className="space-y-2">
                    {advisor.website_url && (
                      <p>
                        <a
                          href={advisor.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {advisor.website_url}
                        </a>
                      </p>
                    )}
                    {advisor.phone_number && <p className="text-gray-600">{advisor.phone_number}</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Credentials */}
        {advisor.credentials.length > 0 && (
          <div className="card p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Credentials & Certifications</h2>
            <div className="space-y-4">
              {advisor.credentials.map((cred) => (
                <div key={cred.id} className="border-l-4 border-blue-500 pl-4 py-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-gray-900">{cred.credential_type}</p>
                      <p className="text-gray-600 text-sm">{cred.issuer}</p>
                      <p className="text-gray-500 text-sm">License: {cred.license_number}</p>
                      {cred.expiry_date && (
                        <p className="text-gray-500 text-sm">Expires: {new Date(cred.expiry_date).toLocaleDateString()}</p>
                      )}
                    </div>
                    {cred.file_url && (
                      <a href={cred.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm font-semibold">
                        View Certificate
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ratings & Reviews — BRD §7.1 */}
        <div className="card p-8">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Ratings & Reviews</h2>
            {ratings && ratings.summary.ratingCount > 0 && (
              <div className="flex items-center gap-2">
                <StarSolid className="h-6 w-6 text-amber-500" />
                <span className="text-2xl font-bold text-gray-900">
                  {ratings.summary.ratingAverage?.toFixed(1)}
                </span>
                <span className="text-sm text-gray-500">
                  ({ratings.summary.ratingCount} review{ratings.summary.ratingCount === 1 ? '' : 's'})
                </span>
              </div>
            )}
          </div>

          {/* Write/edit your own review (gated on signed-in + not-self) */}
          {user && user.id !== advisor.id && (
            <div className="mb-6 p-5 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">
                {ratings?.myRating ? 'Your review' : 'Leave a review'}
              </h3>
              <StarPicker value={draftStars} onChange={setDraftStars} />
              <textarea
                value={draftReview}
                onChange={(e) => setDraftReview(e.target.value)}
                rows={3}
                maxLength={4000}
                placeholder="What was your experience like? (optional)"
                className="input-modern w-full mt-3 text-sm"
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={submitRating}
                  disabled={submittingRating || draftStars < 1}
                  className="btn-primary px-5 py-2 text-sm disabled:opacity-50"
                >
                  {submittingRating
                    ? 'Saving…'
                    : ratings?.myRating
                      ? 'Update review'
                      : 'Submit review'}
                </button>
                {ratings?.myRating && (
                  <button
                    onClick={deleteRating}
                    disabled={submittingRating}
                    className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded font-semibold"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Reviews list */}
          {ratings && ratings.ratings.length > 0 ? (
            <div className="space-y-4">
              {ratings.ratings.map((r) => (
                <div key={r.id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center gap-3 mb-1">
                    <StarsRow stars={r.stars} />
                    <span className="text-sm font-semibold text-gray-900">{r.investorName}</span>
                    {r.investorCity && (
                      <span className="text-xs text-gray-500">· {r.investorCity}</span>
                    )}
                    <span className="text-xs text-gray-400 ml-auto">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {r.reviewBody && (
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.reviewBody}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No reviews yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function StarsRow({ stars }: { stars: number }) {
  return (
    <div className="flex">
      {Array.from({ length: RATING_MAX }, (_, i) =>
        i < stars ? (
          <StarSolid key={i} className="h-4 w-4 text-amber-500" />
        ) : (
          <StarIcon key={i} className="h-4 w-4 text-gray-300" />
        ),
      )}
    </div>
  )
}

function StarPicker({
  value,
  onChange,
}: {
  value: number
  onChange: (n: number) => void
}) {
  const [hover, setHover] = useState(0)
  const display = hover || value
  return (
    <div
      className="flex gap-1"
      onMouseLeave={() => setHover(0)}
      role="radiogroup"
      aria-label="Star rating"
    >
      {Array.from({ length: RATING_MAX }, (_, i) => {
        const n = i + 1
        const filled = n <= display
        return (
          <button
            type="button"
            key={n}
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n === 1 ? '' : 's'}`}
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            className="p-1 hover:scale-110 transition-transform"
          >
            {filled ? (
              <StarSolid className="h-7 w-7 text-amber-500" />
            ) : (
              <StarIcon className="h-7 w-7 text-gray-300" />
            )}
          </button>
        )
      })}
    </div>
  )
}
