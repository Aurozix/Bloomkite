'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import RemarkGfm from 'remark-gfm'
import { UserIcon, CheckBadgeIcon } from '@heroicons/react/24/outline'
import { useToast } from '@/app/components/toast-context'
import { FinancialDisclaimer } from '@/app/components/FinancialDisclaimer'

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

interface Advisor {
  id: string
  display_name: string
  company_name?: string
  profile_image_url?: string
  is_verified: boolean
}

export default function ArticlePage() {
  const router = useRouter()
  const params = useParams()
  const { addToast } = useToast()

  const [user, setUser] = useState<any>(null)
  const [article, setArticle] = useState<Article | null>(null)
  const [advisor, setAdvisor] = useState<Advisor | null>(null)
  const [following, setFollowing] = useState(false)
  const [loading, setLoading] = useState(true)

  const articleId = params.id as string

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user session
        const sessionResponse = await fetch('/api/auth/session')
        const sessionData = await sessionResponse.json()
        setUser(sessionData.user || null)

        // Fetch article
        const articleResponse = await fetch(`/api/articles/${articleId}`)
        if (!articleResponse.ok) {
          addToast('Article not found', 'error')
          router.push('/articles')
          return
        }

        const articleData = await articleResponse.json()
        setArticle(articleData.data)

        // Fetch author advisor profile
        if (articleData.data?.author?.id) {
          const advisorResponse = await fetch(`/api/advisors/${articleData.data.author.id}`)
          if (advisorResponse.ok) {
            const advisorData = await advisorResponse.json()
            setAdvisor(advisorData.data)
            setFollowing(advisorData.data?.is_following || false)
          }
        }
      } catch (error) {
        console.error('Error fetching article:', error)
        addToast('Error loading article', 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [articleId, router, addToast])

  const handleFollow = async () => {
    if (!user || !advisor) {
      addToast('Please sign in to follow advisors', 'info')
      router.push('/auth/signin')
      return
    }

    try {
      const method = following ? 'DELETE' : 'POST'
      const response = await fetch(`/api/advisors/${advisor.id}/follow`, { method })

      if (!response.ok) {
        addToast(following ? 'Failed to unfollow' : 'Failed to follow', 'error')
        return
      }

      setFollowing(!following)
      addToast(following ? 'Unfollowed' : 'Now following this advisor', 'success')
    } catch (error) {
      console.error('Error toggling follow:', error)
      addToast('Error updating follow status', 'error')
    }
  }

  const handleCopyLink = () => {
    const url = `${window.location.origin}/articles/${articleId}`
    navigator.clipboard.writeText(url)
    addToast('Link copied to clipboard', 'success')
  }

  const handleShare = (platform: string) => {
    const url = `${window.location.origin}/articles/${articleId}`
    const title = article?.title || 'Check this article'

    let shareUrl = ''
    if (platform === 'linkedin') {
      shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
    } else if (platform === 'twitter') {
      shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-gray-300 border-t-blue-500 rounded-full"></div>
      </div>
    )
  }

  if (!article) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Back Link */}
        <a href="/articles" className="text-blue-600 hover:text-blue-700 font-semibold mb-6 inline-block">
          ← Back to Articles
        </a>

        {/* BRD §8.3 / §12.2 — required disclaimer above any financial content. */}
        <FinancialDisclaimer variant="article" />

        {/* Featured Image */}
        {article.featured_image_url && (
          <img
            src={article.featured_image_url}
            alt={article.title}
            className="w-full h-96 object-cover rounded-2xl mb-8"
          />
        )}

        {/* Article Header */}
        <div className="card p-8 mb-8">
          <div className="mb-4 flex items-center gap-2">
            {article.category && (
              <span className="inline-block px-3 py-1 text-sm font-semibold rounded-full bg-blue-50 text-blue-700">
                {article.category}
              </span>
            )}
            {article.published_at && (
              <span className="text-sm text-gray-500">
                {new Date(article.published_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            )}
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">{article.title}</h1>

          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {article.tags.map((tag) => (
                <span key={tag} className="inline-block px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-700">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Share Buttons */}
          <div className="flex gap-2">
            <button onClick={handleCopyLink} className="btn-secondary px-4 py-2 text-sm">
              Copy Link
            </button>
            <button onClick={() => handleShare('twitter')} className="btn-secondary px-4 py-2 text-sm">
              Twitter
            </button>
            <button onClick={() => handleShare('linkedin')} className="btn-secondary px-4 py-2 text-sm">
              LinkedIn
            </button>
          </div>
        </div>

        {/* Article Content */}
        <div className="card p-8 mb-8 prose prose-sm max-w-none">
          <ReactMarkdown remarkPlugins={[RemarkGfm]}>{article.content}</ReactMarkdown>
        </div>

        {/* Author Card */}
        {advisor && (
          <div className="card p-8">
            <div className="flex items-start gap-6">
              {advisor.profile_image_url ? (
                <img
                  src={advisor.profile_image_url}
                  alt={advisor.display_name}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                  <UserIcon className="h-10 w-10 text-gray-400" />
                </div>
              )}

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold text-gray-900">{advisor.display_name}</h3>
                  {advisor.is_verified && (
                    <CheckBadgeIcon className="h-5 w-5 text-green-500" title="Verified Advisor" />
                  )}
                </div>

                {advisor.company_name && (
                  <p className="text-gray-600 mb-4">{advisor.company_name}</p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/advisors/${advisor.id}`)}
                    className="btn-outline px-4 py-2 text-sm"
                  >
                    View Profile
                  </button>
                  <button
                    onClick={handleFollow}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
                      following
                        ? 'btn-outline'
                        : 'btn-primary'
                    }`}
                  >
                    {following ? 'Following ✓' : 'Follow'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
