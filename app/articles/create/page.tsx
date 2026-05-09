'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import RemarkGfm from 'remark-gfm'
import { DocumentTextIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useToast } from '@/app/components/toast-context'

const CATEGORIES = ['Investment', 'Tax', 'Retirement', 'Insurance', 'Budgeting']

export default function CreateArticle() {
  const router = useRouter()
  const { addToast } = useToast()

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Investment')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [featuredImageUrl, setFeaturedImageUrl] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/session')
        const data = await response.json()

        if (!data.user) {
          addToast('Please sign in to create articles', 'info')
          router.push('/auth/signin')
          return
        }

        setUser(data.user)
      } catch (error) {
        console.error('Error fetching user:', error)
        addToast('Error loading user session', 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [router, addToast])

  const handleAddTag = () => {
    const trimmed = tagInput.trim()
    if (trimmed && !tags.includes(trimmed) && tags.length < 10) {
      setTags([...tags, trimmed])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      addToast('Please upload an image file', 'error')
      return
    }

    setUploadingImage(true)
    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        const base64 = event.target?.result as string
        const response = await fetch('/api/articles/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64, filename: file.name }),
        })

        if (!response.ok) {
          addToast('Failed to upload image', 'error')
          return
        }

        const data = await response.json()
        setFeaturedImageUrl(data.url)
        addToast('Image uploaded successfully', 'success')
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Image upload error:', error)
      addToast('Error uploading image', 'error')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSaveDraft = async () => {
    if (!title.trim()) {
      addToast('Please enter a title', 'error')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          category,
          tags,
          featured_image_url: featuredImageUrl || null,
        }),
      })

      if (!response.ok) {
        addToast('Failed to save draft', 'error')
        return
      }

      const data = await response.json()
      addToast('Article saved as draft', 'success')
      router.push(`/articles/${data.data.id}`)
    } catch (error) {
      console.error('Save draft error:', error)
      addToast('Error saving draft', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      addToast('Please enter a title', 'error')
      return
    }

    if (!content.trim()) {
      addToast('Please enter article content', 'error')
      return
    }

    if (tags.length === 0) {
      addToast('Please add at least one tag', 'error')
      return
    }

    setSubmitting(true)
    try {
      // First save the article
      const saveResponse = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          category,
          tags,
          featured_image_url: featuredImageUrl || null,
        }),
      })

      if (!saveResponse.ok) {
        addToast('Failed to save article', 'error')
        return
      }

      const saveData = await saveResponse.json()
      const articleId = saveData.data.id

      // Then submit for approval
      const submitResponse = await fetch(`/api/articles/${articleId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!submitResponse.ok) {
        addToast('Failed to submit for approval', 'error')
        return
      }

      addToast('Article submitted for admin review', 'success')
      router.push('/articles')
    } catch (error) {
      console.error('Submit error:', error)
      addToast('Error submitting article', 'error')
    } finally {
      setSubmitting(false)
    }
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <a href="/articles" className="text-blue-600 hover:text-blue-700 font-semibold mb-6 inline-block">
          ← Back to Articles
        </a>

        <h1 className="text-4xl font-bold text-gray-900 mb-2">Create Article</h1>
        <p className="text-xl text-gray-600 mb-8">Share your expertise with investors</p>

        {/* Main Editor */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Panel - Form */}
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter article title"
                className="input-modern w-full"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-modern w-full"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Tags</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  placeholder="Add tag and press Enter"
                  className="input-modern flex-1"
                />
                <button onClick={handleAddTag} className="btn-primary px-4 py-2">
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <div
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                  >
                    #{tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-blue-900"
                      type="button"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Featured Image */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Featured Image</label>
              {featuredImageUrl ? (
                <div className="relative">
                  <img
                    src={featuredImageUrl}
                    alt="Featured"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => setFeaturedImageUrl('')}
                    className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
                    type="button"
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
              ) : (
                <label className="block border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition">
                  <DocumentTextIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSaveDraft}
                disabled={saving || submitting}
                className="btn-outline flex-1 py-3 text-sm font-semibold disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || submitting}
                className="btn-primary flex-1 py-3 text-sm font-semibold disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit for Approval'}
              </button>
            </div>
          </div>

          {/* Right Panel - Live Preview */}
          <div className="card p-8 h-fit sticky top-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Live Preview</h2>

            {/* Preview Title */}
            {title && (
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
            )}

            {/* Preview Category & Tags */}
            {(category || tags.length > 0) && (
              <div className="flex flex-wrap gap-2 mb-6">
                {category && (
                  <span className="inline-block px-3 py-1 text-sm font-semibold rounded-full bg-blue-50 text-blue-700">
                    {category}
                  </span>
                )}
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-block px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-700"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Preview Featured Image */}
            {featuredImageUrl && (
              <img
                src={featuredImageUrl}
                alt="Featured"
                className="w-full h-48 object-cover rounded-lg mb-6"
              />
            )}

            {/* Preview Content */}
            <div className="prose prose-sm max-w-none">
              {content ? (
                <ReactMarkdown remarkPlugins={[RemarkGfm]}>{content}</ReactMarkdown>
              ) : (
                <p className="text-gray-500 italic">Your article content will appear here...</p>
              )}
            </div>
          </div>
        </div>

        {/* Content Editor */}
        <div className="mt-6 card p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Article Content (Markdown)</h2>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your article content here... Markdown is supported!"
            className="input-modern w-full font-mono h-96 resize-none"
          />
          <p className="text-xs text-gray-500 mt-2">
            💡 Tip: Use markdown for formatting (# Headers, **bold**, *italic*, [links](url), etc.)
          </p>
        </div>
      </div>
    </div>
  )
}
