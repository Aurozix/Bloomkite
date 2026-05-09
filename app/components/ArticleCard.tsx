'use client'

import { useRouter } from 'next/navigation'
import { CalendarIcon, TagIcon } from '@heroicons/react/24/outline'

interface ArticleCardProps {
  id: string
  title: string
  featured_image_url?: string
  category?: string
  tags?: string[]
  published_at?: string
  author?: {
    id: string
    email: string
    full_name?: string
  }
}

export function ArticleCard({
  id,
  title,
  featured_image_url,
  category,
  tags,
  published_at,
  author,
}: ArticleCardProps) {
  const router = useRouter()

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div
      className="card overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => router.push(`/articles/${id}`)}
    >
      {featured_image_url && (
        <img
          src={featured_image_url}
          alt={title}
          className="w-full h-48 object-cover"
        />
      )}

      <div className="p-6">
        <div className="flex items-center gap-2 mb-2">
          {category && (
            <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700">
              {category}
            </span>
          )}
          {published_at && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <CalendarIcon className="h-4 w-4" />
              {formatDate(published_at)}
            </div>
          )}
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
          {title}
        </h3>

        {author && (
          <p className="text-sm text-gray-600 mb-4">
            By <span className="font-semibold">{author.full_name || author.email}</span>
          </p>
        )}

        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 text-xs text-gray-600"
              >
                <TagIcon className="h-3 w-3" />
                {tag}
              </span>
            ))}
            {tags.length > 2 && (
              <span className="text-xs text-gray-500">+{tags.length - 2} more</span>
            )}
          </div>
        )}

        <div className="text-sm font-semibold" style={{ color: 'var(--primary-600)' }}>
          Read Article →
        </div>
      </div>
    </div>
  )
}
