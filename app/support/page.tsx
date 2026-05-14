'use client'

import { useEffect, useState } from 'react'

import { PageShell } from '@/app/components/PageShell'
import { PageHeader } from '@/app/components/PageHeader'
import { useToast } from '@/app/components/toast-context'

const CATEGORIES: Array<{ value: string; label: string }> = [
  { value: 'account', label: 'Account / sign-in' },
  { value: 'billing', label: 'Billing / subscription' },
  { value: 'privacy', label: 'Privacy / data request' },
  { value: 'advisor-issue', label: 'Issue with an advisor' },
  { value: 'content-issue', label: 'Report content (article, forum)' },
  { value: 'bug', label: 'Bug report' },
  { value: 'other', label: 'Other' },
]

export default function SupportPage() {
  const { addToast } = useToast()
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [category, setCategory] = useState('other')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState<{ id: string } | null>(null)

  // Pre-fill name + email from session if available.
  useEffect(() => {
    void (async () => {
      try {
        const r = await fetch('/api/auth/session')
        const j = await r.json()
        if (j?.user?.email) setContactEmail(j.user.email)
        if (j?.user?.name) setContactName(j.user.name)
      } catch {
        // signed-out users fill it in themselves; that's fine.
      }
    })()
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contactName.trim() || !contactEmail.trim() || !subject.trim() || !body.trim()) {
      addToast('Please fill all fields', 'error')
      return
    }
    setSubmitting(true)
    try {
      const r = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactName: contactName.trim(),
          contactEmail: contactEmail.trim(),
          category,
          subject: subject.trim(),
          body: body.trim(),
        }),
      })
      const j = await r.json()
      if (!r.ok) {
        addToast(j.error || 'Failed to submit', 'error')
        return
      }
      setSubmitted({ id: j.request.id })
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <PageShell bucket="reading" surface="functional">
        <PageHeader
          eyebrow="Support"
          title="Request received"
          subtitle="Thanks — we'll respond by email."
        />
        <div className="card p-6">
          <p className="text-sm text-ink-700 mb-2">
            Reference id: <code className="font-data">{submitted.id}</code>
          </p>
          <p className="text-sm text-ink-700">
            Keep this id handy if you need to follow up.
          </p>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell bucket="reading" surface="functional">
      <PageHeader
        eyebrow="Support"
        title="Get in touch"
        subtitle="Account questions, billing issues, content reports, or grievances. We respond by email."
      />

      <form onSubmit={submit} className="card p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-ink-500 mb-1">Your name</label>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="input-modern w-full"
              maxLength={150}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-500 mb-1">Email</label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="input-modern w-full"
              maxLength={255}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink-500 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input-modern w-full"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink-500 mb-1">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="input-modern w-full"
            maxLength={300}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink-500 mb-1">Details</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            className="input-modern w-full"
            maxLength={10000}
            required
          />
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={submitting} className="btn-primary px-5 py-2 disabled:opacity-50">
            {submitting ? 'Sending…' : 'Send'}
          </button>
        </div>
      </form>

      <p className="text-xs text-ink-500 mt-4">
        For account deletion specifically, use the dedicated flow at{' '}
        <a href="/settings" className="text-forest-700 underline">
          /settings
        </a>
        . For data correction, edit your profile directly.
      </p>
    </PageShell>
  )
}
