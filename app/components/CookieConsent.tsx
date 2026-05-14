'use client'

// Cookie / consent banner (BRD §12.3, §13.1, DPDP Act 2023 alignment).
//
// Three categories:
//   essential   - required for the app to work; cannot be disabled
//   analytics   - usage tracking (none deployed yet; flag-only)
//   marketing   - external retargeting pixels (none deployed yet; flag-only)
//
// Choice persisted in BOTH localStorage (for client-side feature gating) and
// a `bk_cookie_consent` cookie (so server-rendered pages can branch too).
// One year expiry; banner re-prompts if the version constant changes.

import { useCallback, useEffect, useState } from 'react'
import { Cog6ToothIcon, XMarkIcon } from '@heroicons/react/24/outline'

const STORAGE_KEY = 'bk_cookie_consent_v1'
const COOKIE_NAME = 'bk_cookie_consent'
const COOKIE_MAX_AGE_DAYS = 365

interface ConsentState {
  essential: true // always true; here for shape
  analytics: boolean
  marketing: boolean
  decidedAt: string
}

function readConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as ConsentState
  } catch {
    return null
  }
}

function writeConsent(state: ConsentState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore — cookie below is the fallback
  }
  // Compact serialisation for the cookie. Server only needs to know which
  // categories were granted; doesn't need the timestamp.
  const flags = [
    'essential',
    state.analytics ? 'analytics' : null,
    state.marketing ? 'marketing' : null,
  ]
    .filter(Boolean)
    .join('|')
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(flags)};path=/;max-age=${
    COOKIE_MAX_AGE_DAYS * 24 * 60 * 60
  };SameSite=Lax`
}

export function CookieConsent() {
  const [open, setOpen] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)

  useEffect(() => {
    if (!readConsent()) setOpen(true)
  }, [])

  const decide = useCallback(
    (state: { analytics: boolean; marketing: boolean }) => {
      writeConsent({
        essential: true,
        analytics: state.analytics,
        marketing: state.marketing,
        decidedAt: new Date().toISOString(),
      })
      setOpen(false)
    },
    [],
  )

  const acceptAll = () => decide({ analytics: true, marketing: true })
  const rejectNonEssential = () => decide({ analytics: false, marketing: false })
  const saveCustom = () => decide({ analytics, marketing })

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-50 border-t-2 border-forest-200 bg-paper shadow-lg"
    >
      <div className="max-w-5xl mx-auto p-4 md:p-6">
        {!showDetails ? (
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <p className="flex-1 text-sm text-ink-700 leading-relaxed">
              We use cookies to keep you signed in and remember your preferences. With your consent
              we may also use analytics or marketing cookies.{' '}
              <a href="/privacy" className="text-forest-700 underline">Learn more</a>.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowDetails(true)}
                className="px-3 py-2 text-sm font-semibold text-ink-700 inline-flex items-center gap-1 hover:bg-ink-100 rounded"
              >
                <Cog6ToothIcon className="h-4 w-4" />
                Customise
              </button>
              <button
                onClick={rejectNonEssential}
                className="px-4 py-2 text-sm font-semibold text-ink-700 border border-ink-200 rounded hover:bg-ink-100"
              >
                Reject non-essential
              </button>
              <button
                onClick={acceptAll}
                className="btn-primary px-4 py-2 text-sm"
              >
                Accept all
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between mb-4">
              <h2 className="font-semibold text-forest-700">Cookie preferences</h2>
              <button
                onClick={() => setShowDetails(false)}
                className="text-ink-500 hover:bg-ink-100 p-1 rounded"
                aria-label="Close details"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 rounded border border-ink-200 opacity-75 cursor-not-allowed">
                <input type="checkbox" checked disabled className="mt-1 h-4 w-4" />
                <div>
                  <p className="text-sm font-semibold text-ink-700">Essential (required)</p>
                  <p className="text-xs text-ink-500">
                    Sign-in session, security, and basic functionality. Cannot be disabled.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded border border-ink-200 cursor-pointer hover:bg-ink-50">
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  className="mt-1 h-4 w-4"
                />
                <div>
                  <p className="text-sm font-semibold text-ink-700">Analytics</p>
                  <p className="text-xs text-ink-500">
                    Aggregate usage data so we can improve the platform. No third-party trackers
                    deployed today; this preference applies if any are added.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded border border-ink-200 cursor-pointer hover:bg-ink-50">
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                  className="mt-1 h-4 w-4"
                />
                <div>
                  <p className="text-sm font-semibold text-ink-700">Marketing</p>
                  <p className="text-xs text-ink-500">
                    Personalised content and outbound campaigns. None deployed today; preference
                    applied if any are added.
                  </p>
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowDetails(false)}
                className="px-4 py-2 text-sm text-ink-700 hover:bg-ink-100 rounded"
              >
                Back
              </button>
              <button onClick={saveCustom} className="btn-primary px-4 py-2 text-sm">
                Save preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
