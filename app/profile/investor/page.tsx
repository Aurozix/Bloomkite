'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/app/components/toast-context'

const RISK_BADGE_STYLES: Record<string, string> = {
  Conservative: 'bg-blue-100 text-blue-700',
  'Moderately Conservative': 'bg-cyan-100 text-cyan-700',
  Moderate: 'bg-amber-100 text-amber-700',
  'Moderately Aggressive': 'bg-orange-100 text-orange-700',
  Aggressive: 'bg-red-100 text-red-700',
}

export default function InvestorProfilePage() {
  const router = useRouter()
  const { addToast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [phone, setPhone] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [gender, setGender] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [pincode, setPincode] = useState('')
  const [riskProfile, setRiskProfile] = useState<string | null>(null)

  // BRD §3.1 step 4 — investment interests. Categories the investor wants to
  // explore. M:N to master_data_investment_categories.
  type CategoryRow = { id: string; slug: string; name: string }
  const [interestsCatalog, setInterestsCatalog] = useState<CategoryRow[]>([])
  const [selectedInterestIds, setSelectedInterestIds] = useState<string[]>([])
  const [savingInterests, setSavingInterests] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const sessionResp = await fetch('/api/auth/session')
        const sessionData = await sessionResp.json()

        if (!sessionData.user) {
          router.push('/auth/signin')
          return
        }

        if (!sessionData.user.roles?.includes('investor')) {
          addToast('This page is for investors only', 'error')
          router.push('/dashboard')
          return
        }

        const [profileResp, catalogResp, interestsResp] = await Promise.allSettled([
          fetch('/api/investors/profile'),
          fetch('/api/master-data/investment-categories'),
          fetch('/api/investors/interests'),
        ])

        if (profileResp.status === 'fulfilled' && profileResp.value.ok) {
          const { data } = await profileResp.value.json()
          if (data) {
            setDisplayName(data.display_name || '')
            setBio(data.bio || '')
            setPhone(data.phone_number || '')
            setDateOfBirth(data.date_of_birth || '')
            setGender(data.gender || '')
            setCity(data.city || '')
            setState(data.state || '')
            setPincode(data.pincode || '')
            setRiskProfile(data.risk_profile || null)
          }
        }
        if (catalogResp.status === 'fulfilled' && catalogResp.value.ok) {
          const j = await catalogResp.value.json()
          setInterestsCatalog(j.data || [])
        }
        if (interestsResp.status === 'fulfilled' && interestsResp.value.ok) {
          const j = await interestsResp.value.json()
          setSelectedInterestIds(
            (j.data || []).map((r: { categoryId: string }) => r.categoryId),
          )
        }
      } catch (err) {
        console.error('Error loading investor profile:', err)
        addToast('Error loading profile', 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [router, addToast])

  const handleSaveInterests = async () => {
    setSavingInterests(true)
    try {
      const resp = await fetch('/api/investors/interests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryIds: selectedInterestIds }),
      })
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}))
        addToast(data.error || 'Failed to save interests', 'error')
        return
      }
      addToast('Investment interests saved', 'success')
    } finally {
      setSavingInterests(false)
    }
  }

  const toggleInterest = (id: string) => {
    setSelectedInterestIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const resp = await fetch('/api/investors/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName,
          bio,
          phone_number: phone,
          date_of_birth: dateOfBirth || null,
          gender: gender || null,
          city,
          state,
          pincode,
        }),
      })

      if (!resp.ok) {
        addToast('Failed to save profile', 'error')
        return
      }

      addToast('Profile saved', 'success')
    } catch (err) {
      console.error('Error saving investor profile:', err)
      addToast('Error saving profile', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-gray-300 border-t-blue-500 rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <a
          href="/dashboard"
          className="text-blue-600 hover:text-blue-700 font-semibold mb-6 inline-block"
        >
          ← Back to Dashboard
        </a>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">My Profile</h1>
        <p className="text-gray-600 mb-8">
          Manage your personal details. Sharing data with advisors is always opt-in.
        </p>

        <section className="card p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Basic Information</h2>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Display Name
              </label>
              <input
                type="text"
                className="input-modern w-full"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                className="input-modern w-full"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date of Birth
              </label>
              <input
                type="date"
                className="input-modern w-full"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Gender
              </label>
              <select
                className="input-modern w-full"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="">Prefer not to say</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                className="input-modern w-full"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                State
              </label>
              <input
                type="text"
                className="input-modern w-full"
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Pincode
              </label>
              <input
                type="text"
                className="input-modern w-full"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                maxLength={6}
                placeholder="560001"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              About Me
            </label>
            <textarea
              className="input-modern w-full h-24"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell advisors about your financial situation, goals, or anything else you'd like them to know."
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary w-full py-3 text-lg disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </section>

        {/* BRD §3.1 step 4 — Investment interests */}
        <section className="card p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Investment Interests</h2>
          <p className="text-sm text-gray-600 mb-6">
            Pick the categories you want to explore. We&apos;ll use these to surface
            relevant advisors and articles. No ranking — every selection is equally
            interesting.
          </p>

          <div className="grid sm:grid-cols-2 gap-2 mb-6">
            {interestsCatalog.map((row) => {
              const checked = selectedInterestIds.includes(row.id)
              return (
                <label
                  key={row.id}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 cursor-pointer transition ${
                    checked
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleInterest(row.id)}
                    className="h-4 w-4"
                  />
                  <span className="text-gray-900 font-medium">{row.name}</span>
                </label>
              )
            })}
          </div>

          {interestsCatalog.length === 0 && (
            <p className="text-sm text-gray-500 italic mb-6">
              No investment categories available yet. Master data needs to be seeded.
            </p>
          )}

          <button
            onClick={handleSaveInterests}
            disabled={savingInterests}
            className="btn-primary w-full md:w-auto px-6 py-3"
          >
            {savingInterests
              ? 'Saving...'
              : `Save ${selectedInterestIds.length} selected`}
          </button>
        </section>

        <section className="card p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Risk Profile</h2>
          {riskProfile ? (
            <div className="flex items-center gap-4">
              <span
                className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                  RISK_BADGE_STYLES[riskProfile] ?? 'bg-gray-100 text-gray-700'
                }`}
              >
                {riskProfile}
              </span>
              <a
                href="/calculators/risk-profiler"
                className="text-sm text-blue-600 font-semibold hover:underline"
              >
                Retake assessment →
              </a>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-4">
                You haven&apos;t taken the risk assessment yet. It takes ~3 minutes
                and personalizes the recommendations you&apos;ll see across the app.
              </p>
              <a
                href="/calculators/risk-profiler"
                className="btn-primary inline-block"
              >
                Take Risk Assessment
              </a>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
