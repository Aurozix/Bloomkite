'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { CheckBadgeIcon, UserIcon } from '@heroicons/react/24/outline'
import { useToast } from '@/app/components/toast-context'

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

export default function AdvisorProfile() {
  const router = useRouter()
  const params = useParams()
  const { addToast } = useToast()

  const [user, setUser] = useState<any>(null)
  const [advisor, setAdvisor] = useState<Advisor | null>(null)
  const [loading, setLoading] = useState(true)
  const [following, setFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  const advisorId = params.id as string

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user session
        const sessionResponse = await fetch('/api/auth/session')
        const sessionData = await sessionResponse.json()
        setUser(sessionData.user || null)

        // Fetch advisor profile
        const advisorResponse = await fetch(`/api/advisors/${advisorId}`)
        if (!advisorResponse.ok) {
          addToast('Advisor not found', 'error')
          router.push('/advisors')
          return
        }

        const advisorData = await advisorResponse.json()
        setAdvisor(advisorData.data)
        setFollowing(advisorData.data.is_following || false)
      } catch (error) {
        console.error('Error fetching data:', error)
        addToast('Error loading advisor profile', 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [advisorId, router, addToast])

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
          <div className="card p-8">
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
      </div>
    </div>
  )
}
