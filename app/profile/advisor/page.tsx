'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TrashIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline'
import { useToast } from '@/app/components/toast-context'

interface Credential {
  id: string
  credential_type: string
  issuer: string
  license_number: string
  expiry_date: string
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason?: string
  file_url?: string
}

export default function ProfilePage() {
  const router = useRouter()
  const { addToast } = useToast()

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)

  // Profile form
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [company, setCompany] = useState('')
  const [designation, setDesignation] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [website, setWebsite] = useState('')
  const [phone, setPhone] = useState('')
  // BRD §3.2 step 3 — Professional Information.
  const [yearsOfExperience, setYearsOfExperience] = useState('')
  const [licenseRegistrationNumber, setLicenseRegistrationNumber] = useState('')
  const [licenseRegistrationBody, setLicenseRegistrationBody] = useState('')

  // Credentials
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [credentialType, setCredentialType] = useState('')
  const [issuer, setIssuer] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Expertise
  const [expertise, setExpertise] = useState<string[]>([])
  const [newExpertise, setNewExpertise] = useState('')

  // Fetch user and profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/auth/session')
        const data = await response.json()

        if (!data.user) {
          router.push('/auth/signin')
          return
        }

        // Check if advisor role
        if (!data.user.roles?.includes('advisor')) {
          addToast('This page is for advisors only', 'error')
          router.push('/dashboard')
          return
        }

        setUser(data.user)

        // Fetch advisor profile
        const profileResponse = await fetch('/api/advisors/profile', {
          headers: { 'Content-Type': 'application/json' },
        })

        if (profileResponse.ok) {
          const profileData = await profileResponse.json()
          const profile = profileData.data || {}
          setDisplayName(profile.display_name || '')
          setBio(profile.bio || '')
          setCompany(profile.company_name || '')
          setDesignation(profile.designation || '')
          setCity(profile.city || '')
          setState(profile.state || '')
          setWebsite(profile.website_url || '')
          setPhone(profile.phone_number || '')
          setYearsOfExperience(
            typeof profile.years_of_experience === 'number'
              ? String(profile.years_of_experience)
              : '',
          )
          setLicenseRegistrationNumber(profile.license_registration_number || '')
          setLicenseRegistrationBody(profile.license_registration_body || '')
          setExpertise(Array.isArray(profile.expertise) ? profile.expertise : [])
        }

        // Fetch credentials
        const credsResponse = await fetch('/api/advisors/credentials')
        if (credsResponse.ok) {
          const credsData = await credsResponse.json()
          setCredentials(credsData.data || [])
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
        addToast('Error loading profile', 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [router, addToast])

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/advisors/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName,
          bio,
          company_name: company,
          designation,
          city,
          state,
          website_url: website,
          phone_number: phone,
          years_of_experience: yearsOfExperience === '' ? null : Number(yearsOfExperience),
          license_registration_number: licenseRegistrationNumber,
          license_registration_body: licenseRegistrationBody,
          expertise,
        }),
      })

      if (!response.ok) {
        addToast('Failed to save profile', 'error')
        return
      }

      addToast('Profile saved successfully', 'success')
    } catch (error) {
      console.error('Error saving profile:', error)
      addToast('Error saving profile', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleUploadCredential = async () => {
    if (!credentialType || !issuer || !licenseNumber || !expiryDate) {
      addToast('Please fill all credential fields', 'error')
      return
    }

    setUploadingFile(true)
    try {
      let fileBase64 = ''
      let fileName = ''

      if (selectedFile) {
        const reader = new FileReader()
        fileBase64 = await new Promise((resolve) => {
          reader.onloadend = () => {
            resolve((reader.result as string).split(',')[1])
          }
          reader.readAsDataURL(selectedFile)
        })
        fileName = selectedFile.name
      }

      const response = await fetch('/api/advisors/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential_type: credentialType,
          issuer,
          license_number: licenseNumber,
          expiry_date: expiryDate,
          file_base64: fileBase64,
          file_name: fileName,
        }),
      })

      if (!response.ok) {
        addToast('Failed to upload credential', 'error')
        return
      }

      const data = await response.json()
      setCredentials([...credentials, data.data])
      addToast(data.message, 'success')

      // Reset form
      setCredentialType('')
      setIssuer('')
      setLicenseNumber('')
      setExpiryDate('')
      setSelectedFile(null)
    } catch (error) {
      console.error('Error uploading credential:', error)
      addToast('Error uploading credential', 'error')
    } finally {
      setUploadingFile(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            <CheckCircleIcon className="h-4 w-4" /> Approved
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
            <XCircleIcon className="h-4 w-4" /> Rejected
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
            <ClockIcon className="h-4 w-4" /> Pending
          </span>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-gray-300 border-t-blue-500 rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <a href="/dashboard" className="text-blue-600 hover:text-blue-700 font-semibold mb-6 inline-block">
          ← Back to Dashboard
        </a>
        <h1 className="text-4xl font-bold text-gray-900 mb-8">My Profile</h1>

        {/* Profile Form */}
        <div className="card p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Basic Information</h2>
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Display Name</label>
              <input
                type="text"
                className="input-modern w-full"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Designation</label>
              <input
                type="text"
                className="input-modern w-full"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Company</label>
              <input
                type="text"
                className="input-modern w-full"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Website</label>
              <input
                type="url"
                className="input-modern w-full"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                className="input-modern w-full"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
              <input
                type="text"
                className="input-modern w-full"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
              <input
                type="text"
                className="input-modern w-full"
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
            </div>
          </div>

          {/* BRD §3.2 step 3 — Professional Information */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Professional Information</h3>
            <p className="text-xs text-gray-500 mb-4">
              Required before your profile can be approved for public listing.
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Years of Experience
                </label>
                <input
                  type="number"
                  min={0}
                  max={70}
                  className="input-modern w-full"
                  value={yearsOfExperience}
                  onChange={(e) => setYearsOfExperience(e.target.value)}
                  placeholder="e.g. 14"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  License / Registration Number
                </label>
                <input
                  type="text"
                  className="input-modern w-full"
                  value={licenseRegistrationNumber}
                  onChange={(e) => setLicenseRegistrationNumber(e.target.value)}
                  placeholder="e.g. INA000012345"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Issuing Body
                </label>
                <input
                  type="text"
                  className="input-modern w-full"
                  value={licenseRegistrationBody}
                  onChange={(e) => setLicenseRegistrationBody(e.target.value)}
                  placeholder="e.g. SEBI, IRDA, AMFI"
                />
              </div>
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Bio</label>
            <textarea
              className="input-modern w-full h-24"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell investors about your expertise and experience..."
            />
          </div>

          <button onClick={handleSaveProfile} disabled={saving} className="btn-primary w-full py-3 text-lg">
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>

        {/* Credentials */}
        <div className="card p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Credentials & Certifications</h2>

          {credentials.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Credentials</h3>
              <div className="space-y-3">
                {credentials.map((cred) => (
                  <div key={cred.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-gray-900">{cred.credential_type}</p>
                        <p className="text-gray-600 text-sm">{cred.issuer}</p>
                        <p className="text-gray-500 text-sm">License: {cred.license_number}</p>
                        <p className="text-gray-500 text-sm">
                          Expires: {new Date(cred.expiry_date).toLocaleDateString()}
                        </p>
                        {cred.rejection_reason && (
                          <p className="text-red-600 text-sm mt-2">Reason: {cred.rejection_reason}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(cred.status)}
                        {cred.file_url && (
                          <a href={cred.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm">
                            View File
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t pt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Credential</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Credential Type</label>
                <input
                  type="text"
                  placeholder="e.g., CFP, CFA, MBA"
                  className="input-modern w-full"
                  value={credentialType}
                  onChange={(e) => setCredentialType(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Issuer</label>
                <input
                  type="text"
                  placeholder="e.g., FPSB India"
                  className="input-modern w-full"
                  value={issuer}
                  onChange={(e) => setIssuer(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">License Number</label>
                <input
                  type="text"
                  className="input-modern w-full"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Expiry Date</label>
                <input
                  type="date"
                  className="input-modern w-full"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Certificate (PDF)</label>
              <input
                type="file"
                accept=".pdf"
                className="input-modern w-full"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              {selectedFile && <p className="text-sm text-gray-600 mt-1">{selectedFile.name}</p>}
            </div>

            <button
              onClick={handleUploadCredential}
              disabled={uploadingFile}
              className="btn-primary w-full py-3 text-lg"
            >
              {uploadingFile ? 'Uploading...' : 'Add Credential'}
            </button>
          </div>
        </div>

        {/* Expertise */}
        <div className="card p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Areas of Expertise</h2>

          {expertise.length > 0 && (
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {expertise.map((spec) => (
                  <span
                    key={spec}
                    className="inline-flex items-center gap-1 px-3 py-1 text-sm font-semibold rounded-full bg-blue-50 text-blue-700"
                  >
                    {spec}
                    <button
                      onClick={() => setExpertise(expertise.filter((s) => s !== spec))}
                      className="hover:text-red-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="mt-6 border-t pt-6" />
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g., Mutual Funds, Retirement Planning"
              className="input-modern flex-1"
              value={newExpertise}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && newExpertise) {
                  setExpertise([...expertise, newExpertise])
                  setNewExpertise('')
                }
              }}
            />
            <button
              onClick={() => {
                if (newExpertise) {
                  setExpertise([...expertise, newExpertise])
                  setNewExpertise('')
                }
              }}
              className="btn-primary px-6"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
