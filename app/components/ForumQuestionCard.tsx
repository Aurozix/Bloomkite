'use client'

import { useRouter } from 'next/navigation'
import { ChatBubbleLeftIcon, CalendarIcon } from '@heroicons/react/24/outline'

interface ForumQuestionCardProps {
  id: string
  title: string
  content: string
  answer_count: number
  created_at: string
  author?: {
    id: string
    email: string
    full_name?: string
  }
}

export function ForumQuestionCard({
  id,
  title,
  content,
  answer_count,
  created_at,
  author,
}: ForumQuestionCardProps) {
  const router = useRouter()

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const excerpt = content.length > 150 ? content.substring(0, 150) + '...' : content

  return (
    <div
      className="card p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-blue-500"
      onClick={() => router.push(`/forum/questions/${id}`)}
    >
      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
        {title}
      </h3>

      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
        {excerpt}
      </p>

      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
        {author && (
          <span>
            By <span className="font-semibold text-gray-700">{author.full_name || author.email}</span>
          </span>
        )}

        <div className="flex items-center gap-1">
          <CalendarIcon className="h-4 w-4" />
          {formatDate(created_at)}
        </div>

        <div className="flex items-center gap-1 font-semibold text-blue-600">
          <ChatBubbleLeftIcon className="h-4 w-4" />
          {answer_count} {answer_count === 1 ? 'answer' : 'answers'}
        </div>
      </div>
    </div>
  )
}
