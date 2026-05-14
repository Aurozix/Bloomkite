'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { useToast } from '@/app/components/toast-context'

interface Article {
  id: string
  title: string
  author: {
    id: string
    email: string
    full_name?: string
  }
  created_at: string
  status: string
}

interface Credential {
  id: string
  credential_type: string
  issuer: string
  license_number: string
  advisor: {
    id: string
    display_name: string
    email: string
  }
  created_at: string
  status: string
  file_url?: string
}

export default function ContentModeration() {
  const router = useRouter()
  const { addToast } = useToast()

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'articles' | 'credentials'>('articles')

  const [articles, setArticles] = useState<Article[]>([])
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState<Record<string, string>>({})

  // Bulk moderation state. Selection is per-id Set; bulk reject prompts for
  // a single shared rejection reason that applies to every selected article.
  const [selectedArticleIds, setSelectedArticleIds] = useState<Set<string>>(new Set())
  const [bulkRejecting, setBulkRejecting] = useState(false)
  const [bulkProcessing, setBulkProcessing] = useState(false)
  const [bulkRejectReason, setBulkRejectReason] = useState('')

  const toggleSelect = (id: string) => {
    setSelectedArticleIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedArticleIds.size === articles.length) {
      setSelectedArticleIds(new Set())
    } else {
      setSelectedArticleIds(new Set(articles.map((a) => a.id)))
    }
  }

  const bulkApprove = async () => {
    if (selectedArticleIds.size === 0) return
    setBulkProcessing(true)
    try {
      const ids = Array.from(selectedArticleIds)
      const resp = await fetch('/api/admin/articles/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', ids }),
      })
      const json = await resp.json()
      if (!resp.ok) {
        addToast(json.error || 'Bulk approve failed', 'error')
        return
      }
      addToast(`Approved ${json.processed} of ${json.requested}`, 'success')
      setArticles((prev) => prev.filter((a) => !selectedArticleIds.has(a.id)))
      setSelectedArticleIds(new Set())
    } finally {
      setBulkProcessing(false)
    }
  }

  const bulkReject = async () => {
    if (selectedArticleIds.size === 0) return
    if (!bulkRejectReason.trim()) {
      addToast('Provide a rejection reason', 'error')
      return
    }
    setBulkProcessing(true)
    try {
      const ids = Array.from(selectedArticleIds)
      const resp = await fetch('/api/admin/articles/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          ids,
          rejectionReason: bulkRejectReason.trim(),
        }),
      })
      const json = await resp.json()
      if (!resp.ok) {
        addToast(json.error || 'Bulk reject failed', 'error')
        return
      }
      addToast(`Rejected ${json.processed} of ${json.requested}`, 'success')
      setArticles((prev) => prev.filter((a) => !selectedArticleIds.has(a.id)))
      setSelectedArticleIds(new Set())
      setBulkRejecting(false)
      setBulkRejectReason('')
    } finally {
      setBulkProcessing(false)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sessionResponse = await fetch('/api/auth/session')
        const sessionData = await sessionResponse.json()

        if (!sessionData.user || sessionData.user.current_role !== 'admin') {
          addToast('Admin access required', 'error')
          router.push('/dashboard')
          return
        }

        setUser(sessionData.user)

        // Fetch pending articles
        const articlesResponse = await fetch('/api/admin/articles')
        if (articlesResponse.ok) {
          const articlesData = await articlesResponse.json()
          setArticles(articlesData.data || [])
        }

        // Fetch pending credentials
        const credentialsResponse = await fetch('/api/admin/credentials')
        if (credentialsResponse.ok) {
          const credentialsData = await credentialsResponse.json()
          setCredentials(credentialsData.data || [])
        }
      } catch (error) {
        console.error('Error fetching moderation data:', error)
        addToast('Error loading moderation panel', 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router, addToast])

  const handleApproveArticle = async (articleId: string) => {
    setProcessingId(articleId)
    try {
      const response = await fetch(`/api/admin/articles/${articleId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        addToast('Failed to approve article', 'error')
        return
      }

      setArticles(articles.filter((a) => a.id !== articleId))
      addToast('Article approved', 'success')
    } catch (error) {
      console.error('Approve error:', error)
      addToast('Error approving article', 'error')
    } finally {
      setProcessingId(null)
    }
  }

  const handleRejectArticle = async (articleId: string) => {
    const reason = rejectionReason[articleId]?.trim() || ''

    if (!reason) {
      addToast('Please provide a rejection reason', 'error')
      return
    }

    setProcessingId(articleId)
    try {
      const response = await fetch(`/api/admin/articles/${articleId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejection_reason: reason }),
      })

      if (!response.ok) {
        addToast('Failed to reject article', 'error')
        return
      }

      setArticles(articles.filter((a) => a.id !== articleId))
      setRejectionReason({ ...rejectionReason, [articleId]: '' })
      addToast('Article rejected', 'success')
    } catch (error) {
      console.error('Reject error:', error)
      addToast('Error rejecting article', 'error')
    } finally {
      setProcessingId(null)
    }
  }

  const handleApproveCredential = async (credentialId: string) => {
    setProcessingId(credentialId)
    try {
      const response = await fetch(`/api/admin/credentials/${credentialId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        addToast('Failed to approve credential', 'error')
        return
      }

      setCredentials(credentials.filter((c) => c.id !== credentialId))
      addToast('Credential approved', 'success')
    } catch (error) {
      console.error('Approve error:', error)
      addToast('Error approving credential', 'error')
    } finally {
      setProcessingId(null)
    }
  }

  const handleRejectCredential = async (credentialId: string) => {
    const reason = rejectionReason[credentialId]?.trim() || ''

    if (!reason) {
      addToast('Please provide a rejection reason', 'error')
      return
    }

    setProcessingId(credentialId)
    try {
      const response = await fetch(`/api/admin/credentials/${credentialId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejection_reason: reason }),
      })

      if (!response.ok) {
        addToast('Failed to reject credential', 'error')
        return
      }

      setCredentials(credentials.filter((c) => c.id !== credentialId))
      setRejectionReason({ ...rejectionReason, [credentialId]: '' })
      addToast('Credential rejected', 'success')
    } catch (error) {
      console.error('Reject error:', error)
      addToast('Error rejecting credential', 'error')
    } finally {
      setProcessingId(null)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-gray-300 border-t-blue-500 rounded-full"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <a href="/admin" className="text-blue-600 hover:text-blue-700 font-semibold mb-6 inline-block">
          ← Back to Admin
        </a>

        <h1 className="text-4xl font-bold text-gray-900 mb-2">Content Moderation</h1>
        <p className="text-xl text-gray-600 mb-8">Review and approve pending content</p>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          <button
            onClick={() => setTab('articles')}
            className={`px-4 py-3 font-semibold border-b-2 transition ${
              tab === 'articles'
                ? 'text-blue-600 border-b-blue-600'
                : 'text-gray-600 border-b-transparent hover:text-gray-900'
            }`}
          >
            Pending Articles ({articles.length})
          </button>
          <button
            onClick={() => setTab('credentials')}
            className={`px-4 py-3 font-semibold border-b-2 transition ${
              tab === 'credentials'
                ? 'text-blue-600 border-b-blue-600'
                : 'text-gray-600 border-b-transparent hover:text-gray-900'
            }`}
          >
            Pending Credentials ({credentials.length})
          </button>
        </div>

        {/* Articles Tab */}
        {tab === 'articles' && (
          <div className="space-y-4">
            {articles.length > 0 && (
              <div className="card p-3 sticky top-0 z-10 bg-paper border-2 border-forest-200 flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-semibold text-forest-700">
                  <input
                    type="checkbox"
                    checked={selectedArticleIds.size === articles.length && articles.length > 0}
                    onChange={toggleSelectAll}
                    className="h-4 w-4"
                  />
                  Select all ({selectedArticleIds.size}/{articles.length})
                </label>
                {selectedArticleIds.size > 0 && (
                  <>
                    <button
                      onClick={bulkApprove}
                      disabled={bulkProcessing}
                      className="btn-primary px-4 py-1.5 text-sm disabled:opacity-50"
                    >
                      Approve {selectedArticleIds.size}
                    </button>
                    <button
                      onClick={() => setBulkRejecting((v) => !v)}
                      disabled={bulkProcessing}
                      className="btn-outline px-4 py-1.5 text-sm disabled:opacity-50"
                    >
                      Reject {selectedArticleIds.size}…
                    </button>
                    <button
                      onClick={() => setSelectedArticleIds(new Set())}
                      className="text-sm text-ink-600 hover:underline ml-auto"
                    >
                      Clear
                    </button>
                  </>
                )}
                {bulkRejecting && selectedArticleIds.size > 0 && (
                  <div className="w-full mt-2 flex gap-2">
                    <input
                      type="text"
                      placeholder="Shared rejection reason (applies to all selected)…"
                      value={bulkRejectReason}
                      onChange={(e) => setBulkRejectReason(e.target.value)}
                      className="input-modern flex-1 text-sm"
                    />
                    <button
                      onClick={bulkReject}
                      disabled={bulkProcessing || !bulkRejectReason.trim()}
                      className="btn-outline px-4 py-1.5 text-sm disabled:opacity-50"
                    >
                      Confirm reject
                    </button>
                  </div>
                )}
              </div>
            )}
            {articles.length > 0 ? (
              articles.map((article) => (
                <div key={article.id} className="card p-6">
                  <div className="mb-4 flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedArticleIds.has(article.id)}
                      onChange={() => toggleSelect(article.id)}
                      className="h-4 w-4 mt-1.5 flex-shrink-0"
                    />
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{article.title}</h3>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                        <span>By {article.author.full_name || article.author.email}</span>
                        <span>Submitted {formatDate(article.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Rejection Reason (if rejecting)
                    </label>
                    <textarea
                      value={rejectionReason[article.id] || ''}
                      onChange={(e) =>
                        setRejectionReason({ ...rejectionReason, [article.id]: e.target.value })
                      }
                      placeholder="Explain why the article is being rejected..."
                      className="input-modern w-full h-20 resize-none"
                      disabled={processingId === article.id}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApproveArticle(article.id)}
                      disabled={processingId === article.id}
                      className="flex items-center gap-2 btn-primary px-4 py-2 font-semibold disabled:opacity-50"
                    >
                      <CheckCircleIcon className="h-5 w-5" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectArticle(article.id)}
                      disabled={processingId === article.id}
                      className="flex items-center gap-2 btn-outline px-4 py-2 font-semibold disabled:opacity-50"
                    >
                      <XCircleIcon className="h-5 w-5" />
                      Reject
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="card p-8 text-center text-gray-600">
                <p>No pending articles to review</p>
              </div>
            )}
          </div>
        )}

        {/* Credentials Tab */}
        {tab === 'credentials' && (
          <div className="space-y-4">
            {credentials.length > 0 ? (
              credentials.map((credential) => (
                <div key={credential.id} className="card p-6">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {credential.advisor.display_name}
                    </h3>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                      <span>{credential.credential_type}</span>
                      <span>Issuer: {credential.issuer}</span>
                      <span>License: {credential.license_number}</span>
                      <span>Submitted {formatDate(credential.created_at)}</span>
                    </div>
                    {credential.file_url && (
                      <a
                        href={credential.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 font-semibold text-sm mt-2 inline-block"
                      >
                        View Document →
                      </a>
                    )}
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Rejection Reason (if rejecting)
                    </label>
                    <textarea
                      value={rejectionReason[credential.id] || ''}
                      onChange={(e) =>
                        setRejectionReason({ ...rejectionReason, [credential.id]: e.target.value })
                      }
                      placeholder="Explain why the credential is being rejected..."
                      className="input-modern w-full h-20 resize-none"
                      disabled={processingId === credential.id}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApproveCredential(credential.id)}
                      disabled={processingId === credential.id}
                      className="flex items-center gap-2 btn-primary px-4 py-2 font-semibold disabled:opacity-50"
                    >
                      <CheckCircleIcon className="h-5 w-5" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectCredential(credential.id)}
                      disabled={processingId === credential.id}
                      className="flex items-center gap-2 btn-outline px-4 py-2 font-semibold disabled:opacity-50"
                    >
                      <XCircleIcon className="h-5 w-5" />
                      Reject
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="card p-8 text-center text-gray-600">
                <p>No pending credentials to review</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
