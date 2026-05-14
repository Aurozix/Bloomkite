'use client'

import { useRouter } from 'next/navigation'
import { UserIcon, CheckBadgeIcon, StarIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'

interface AdvisorCardProps {
  id: string
  display_name: string
  company_name?: string
  bio?: string
  profile_image_url?: string
  is_verified: boolean
  follower_count: number
  expertise: string[]
  rating_average?: number | null
  rating_count?: number
}

export function AdvisorCard({
  id,
  display_name,
  company_name,
  bio,
  profile_image_url,
  is_verified,
  follower_count,
  expertise,
  rating_average,
  rating_count = 0,
}: AdvisorCardProps) {
  const router = useRouter()

  return (
    <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push(`/advisors/${id}`)}>
      <div className="flex items-start gap-4 mb-4">
        {profile_image_url ? (
          <img src={profile_image_url} alt={display_name} className="w-14 h-14 rounded-full object-cover" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center">
            <UserIcon className="h-8 w-8 text-gray-400" />
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-gray-900">{display_name}</h3>
            {is_verified && (
              <CheckBadgeIcon className="h-5 w-5 text-green-500" title="Verified Advisor" />
            )}
          </div>
          {company_name && <p className="text-sm text-gray-600">{company_name}</p>}
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
            <span>{follower_count} followers</span>
            {rating_count > 0 && rating_average !== null && rating_average !== undefined && (
              <span className="inline-flex items-center gap-1 text-amber-600">
                <StarSolid className="h-3.5 w-3.5" />
                <span className="font-semibold">{rating_average.toFixed(1)}</span>
                <span className="text-gray-500">({rating_count})</span>
              </span>
            )}
            {rating_count === 0 && (
              <span className="inline-flex items-center gap-1 text-gray-400">
                <StarIcon className="h-3.5 w-3.5" />
                Unrated
              </span>
            )}
          </div>
        </div>
      </div>

      {bio && <p className="text-sm text-gray-600 mb-4 line-clamp-2">{bio}</p>}

      {expertise.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {expertise.slice(0, 3).map((spec) => (
            <span
              key={spec}
              className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700"
            >
              {spec}
            </span>
          ))}
          {expertise.length > 3 && (
            <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
              +{expertise.length - 3} more
            </span>
          )}
        </div>
      )}

      <div className="text-sm font-semibold" style={{ color: 'var(--primary-600)' }}>
        View Profile →
      </div>
    </div>
  )
}
