'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TrashIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline'
import { useToast } from '@/app/components/toast-context'

type CredentialClass = 'CERTIFICATION' | 'AWARD' | 'EDUCATION' | 'EXPERIENCE'

interface Credential {
  id: string
  credential_class: CredentialClass
  credential_type: string
  issuer: string
  license_number?: string | null
  expiry_date?: string | null
  award_year?: number | null
  start_date?: string | null
  end_date?: string | null
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason?: string
  file_url?: string
}

const CLASS_LABELS: Record<CredentialClass, { title: string; titleFieldLabel: string; issuerFieldLabel: string }> = {
  CERTIFICATION: { title: 'Certification', titleFieldLabel: 'Certification name', issuerFieldLabel: 'Issuing body' },
  AWARD: { title: 'Award', titleFieldLabel: 'Award title', issuerFieldLabel: 'Awarded by' },
  EDUCATION: { title: 'Education', titleFieldLabel: 'Degree / qualification', issuerFieldLabel: 'Institution' },
  EXPERIENCE: { title: 'Experience', titleFieldLabel: 'Role / designation', issuerFieldLabel: 'Company' },
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
  const [credentialClass, setCredentialClass] = useState<CredentialClass>('CERTIFICATION')
  const [credentialType, setCredentialType] = useState('')
  const [issuer, setIssuer] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [awardYear, setAwardYear] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Expertise (legacy free-text tags — superseded by structured declarations
  // below; left in place so existing data isn't lost. Remove in cleanup.)
  const [expertise, setExpertise] = useState<string[]>([])
  const [newExpertise, setNewExpertise] = useState('')

  // BRD §3.2 step 5+6 — Products / Services / Brands declaration with
  // priority ranking. Each is an ordered list; brands carry no priority.
  type MasterRow = { id: string; slug: string; name: string }
  type Declared<K extends string> = { name: string; slug: string } & Record<K, string>
  const [productsCatalog, setProductsCatalog] = useState<MasterRow[]>([])
  const [servicesCatalog, setServicesCatalog] = useState<MasterRow[]>([])
  const [brandsCatalog, setBrandsCatalog] = useState<MasterRow[]>([])
  const [declaredProducts, setDeclaredProducts] = useState<Declared<'productId'>[]>([])
  const [declaredServices, setDeclaredServices] = useState<Declared<'serviceId'>[]>([])
  const [declaredBrands, setDeclaredBrands] = useState<Declared<'brandId'>[]>([])
  const [savingDeclarations, setSavingDeclarations] = useState(false)

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

        // Fetch master-data catalogs (products / services / brands) + the
        // advisor's existing declarations. All in parallel — they don't
        // depend on each other and one failing shouldn't block the others.
        const [
          productsCatalogRes,
          servicesCatalogRes,
          brandsCatalogRes,
          declarationsRes,
        ] = await Promise.allSettled([
          fetch('/api/master-data/products'),
          fetch('/api/master-data/services'),
          fetch('/api/master-data/brands'),
          fetch('/api/advisors/declarations'),
        ])

        if (productsCatalogRes.status === 'fulfilled' && productsCatalogRes.value.ok) {
          const j = await productsCatalogRes.value.json()
          setProductsCatalog(j.data || [])
        }
        if (servicesCatalogRes.status === 'fulfilled' && servicesCatalogRes.value.ok) {
          const j = await servicesCatalogRes.value.json()
          setServicesCatalog(j.data || [])
        }
        if (brandsCatalogRes.status === 'fulfilled' && brandsCatalogRes.value.ok) {
          const j = await brandsCatalogRes.value.json()
          setBrandsCatalog(j.data || [])
        }
        if (declarationsRes.status === 'fulfilled' && declarationsRes.value.ok) {
          const j = await declarationsRes.value.json()
          setDeclaredProducts(j.data?.products || [])
          setDeclaredServices(j.data?.services || [])
          setDeclaredBrands(j.data?.brands || [])
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

  const handleSaveDeclarations = async () => {
    setSavingDeclarations(true)
    try {
      const res = await fetch('/api/advisors/declarations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Priority is positional — the server uses index+1 when no
          // explicit priority is sent. UI keeps the list in display order.
          products: declaredProducts.map((p, i) => ({
            productId: p.productId,
            priority: i + 1,
          })),
          services: declaredServices.map((s, i) => ({
            serviceId: s.serviceId,
            priority: i + 1,
          })),
          brands: declaredBrands.map((b) => ({ brandId: b.brandId })),
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        addToast(data.error || 'Failed to save declarations', 'error')
        return
      }
      addToast('Declarations saved', 'success')
    } finally {
      setSavingDeclarations(false)
    }
  }

  const moveItem = <T,>(list: T[], idx: number, dir: -1 | 1): T[] => {
    const next = [...list]
    const target = idx + dir
    if (target < 0 || target >= next.length) return next
    ;[next[idx], next[target]] = [next[target], next[idx]]
    return next
  }

  const handleUploadCredential = async () => {
    // Class-aware client-side validation. Server validates again — this is
    // just for fast feedback.
    if (!credentialType || !issuer) {
      addToast('Title and issuer are required', 'error')
      return
    }
    if (credentialClass === 'CERTIFICATION' && (!licenseNumber || !expiryDate)) {
      addToast('Certifications need a license number and expiry date', 'error')
      return
    }
    if ((credentialClass === 'AWARD' || credentialClass === 'EDUCATION') && !awardYear) {
      addToast(
        credentialClass === 'AWARD' ? 'Year of award is required' : 'Year of graduation is required',
        'error',
      )
      return
    }
    if (credentialClass === 'EXPERIENCE' && !startDate) {
      addToast('Start date is required', 'error')
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
          credential_class: credentialClass,
          credential_type: credentialType,
          issuer,
          ...(credentialClass === 'CERTIFICATION'
            ? { license_number: licenseNumber, expiry_date: expiryDate }
            : {}),
          ...(credentialClass === 'AWARD' || credentialClass === 'EDUCATION'
            ? { award_year: Number(awardYear) }
            : {}),
          ...(credentialClass === 'EXPERIENCE'
            ? { start_date: startDate, end_date: endDate || null }
            : {}),
          file_base64: fileBase64,
          file_name: fileName,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        addToast(data.error || 'Failed to upload credential', 'error')
        return
      }

      const data = await response.json()
      setCredentials([...credentials, data.data])
      addToast(data.message, 'success')

      // Reset all class-specific fields
      setCredentialType('')
      setIssuer('')
      setLicenseNumber('')
      setExpiryDate('')
      setAwardYear('')
      setStartDate('')
      setEndDate('')
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
                {credentials.map((cred) => {
                  const cls = (cred.credential_class || 'CERTIFICATION') as CredentialClass
                  const labels = CLASS_LABELS[cls]
                  return (
                    <div key={cred.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                            {labels.title}
                          </p>
                          <p className="font-bold text-gray-900">{cred.credential_type}</p>
                          <p className="text-gray-600 text-sm">{cred.issuer}</p>
                          {cls === 'CERTIFICATION' && (
                            <>
                              {cred.license_number && (
                                <p className="text-gray-500 text-sm">License: {cred.license_number}</p>
                              )}
                              {cred.expiry_date && (
                                <p className="text-gray-500 text-sm">
                                  Expires: {new Date(cred.expiry_date).toLocaleDateString()}
                                </p>
                              )}
                            </>
                          )}
                          {(cls === 'AWARD' || cls === 'EDUCATION') && cred.award_year && (
                            <p className="text-gray-500 text-sm">
                              {cls === 'AWARD' ? 'Year' : 'Graduated'}: {cred.award_year}
                            </p>
                          )}
                          {cls === 'EXPERIENCE' && cred.start_date && (
                            <p className="text-gray-500 text-sm">
                              {new Date(cred.start_date).toLocaleDateString()} —{' '}
                              {cred.end_date
                                ? new Date(cred.end_date).toLocaleDateString()
                                : 'Present'}
                            </p>
                          )}
                          {cred.rejection_reason && (
                            <p className="text-red-600 text-sm mt-2">
                              Reason: {cred.rejection_reason}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(cred.status)}
                          {cred.file_url && (
                            <a
                              href={cred.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 text-sm"
                            >
                              View File
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="border-t pt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Credential</h3>

            {/* Class selector — picks which form fields to render below */}
            <div className="flex flex-wrap gap-2 mb-4">
              {(Object.keys(CLASS_LABELS) as CredentialClass[]).map((cls) => (
                <button
                  key={cls}
                  type="button"
                  onClick={() => setCredentialClass(cls)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    credentialClass === cls
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {CLASS_LABELS[cls].title}
                </button>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {CLASS_LABELS[credentialClass].titleFieldLabel}
                </label>
                <input
                  type="text"
                  className="input-modern w-full"
                  value={credentialType}
                  onChange={(e) => setCredentialType(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {CLASS_LABELS[credentialClass].issuerFieldLabel}
                </label>
                <input
                  type="text"
                  className="input-modern w-full"
                  value={issuer}
                  onChange={(e) => setIssuer(e.target.value)}
                />
              </div>

              {credentialClass === 'CERTIFICATION' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      License Number
                    </label>
                    <input
                      type="text"
                      className="input-modern w-full"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      className="input-modern w-full"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                    />
                  </div>
                </>
              )}

              {(credentialClass === 'AWARD' || credentialClass === 'EDUCATION') && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {credentialClass === 'AWARD' ? 'Year of Award' : 'Year of Graduation'}
                  </label>
                  <input
                    type="number"
                    min={1900}
                    max={new Date().getFullYear() + 1}
                    className="input-modern w-full"
                    value={awardYear}
                    onChange={(e) => setAwardYear(e.target.value)}
                  />
                </div>
              )}

              {credentialClass === 'EXPERIENCE' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      className="input-modern w-full"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      End Date (leave blank if current)
                    </label>
                    <input
                      type="date"
                      className="input-modern w-full"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Supporting Document (PDF, optional)
              </label>
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
              {uploadingFile ? 'Uploading...' : `Add ${CLASS_LABELS[credentialClass].title}`}
            </button>
          </div>
        </div>

        {/* BRD §3.2 step 5+6 — Products / Services / Brands + priority ranking */}
        <div className="card p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Products, Services & Brands
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Declare what you advise on. For Products and Services, order matters —
            items at the top show first on your public profile.
          </p>

          {/* Products */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Products</h3>
            <DeclarationPicker
              kind="product"
              catalog={productsCatalog}
              declared={declaredProducts.map((p) => ({ id: p.productId, name: p.name }))}
              onAdd={(row) =>
                setDeclaredProducts([
                  ...declaredProducts,
                  { productId: row.id, slug: row.slug, name: row.name },
                ])
              }
              onMove={(idx, dir) => setDeclaredProducts(moveItem(declaredProducts, idx, dir))}
              onRemove={(idx) =>
                setDeclaredProducts(declaredProducts.filter((_, i) => i !== idx))
              }
              orderable
            />
          </div>

          {/* Services */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Services</h3>
            <DeclarationPicker
              kind="service"
              catalog={servicesCatalog}
              declared={declaredServices.map((s) => ({ id: s.serviceId, name: s.name }))}
              onAdd={(row) =>
                setDeclaredServices([
                  ...declaredServices,
                  { serviceId: row.id, slug: row.slug, name: row.name },
                ])
              }
              onMove={(idx, dir) => setDeclaredServices(moveItem(declaredServices, idx, dir))}
              onRemove={(idx) =>
                setDeclaredServices(declaredServices.filter((_, i) => i !== idx))
              }
              orderable
            />
          </div>

          {/* Brands — no ranking per BRD §3.2 step 6 */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Brands</h3>
            <DeclarationPicker
              kind="brand"
              catalog={brandsCatalog}
              declared={declaredBrands.map((b) => ({ id: b.brandId, name: b.name }))}
              onAdd={(row) =>
                setDeclaredBrands([
                  ...declaredBrands,
                  { brandId: row.id, slug: row.slug, name: row.name },
                ])
              }
              onMove={() => {
                /* brands aren't orderable */
              }}
              onRemove={(idx) =>
                setDeclaredBrands(declaredBrands.filter((_, i) => i !== idx))
              }
              orderable={false}
            />
          </div>

          <button
            onClick={handleSaveDeclarations}
            disabled={savingDeclarations}
            className="btn-primary w-full py-3 text-lg"
          >
            {savingDeclarations ? 'Saving...' : 'Save Declarations'}
          </button>
        </div>

        {/* Expertise (legacy free-text — kept until structured declarations
            fully replace it; remove in a cleanup commit). */}
        <div className="card p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Areas of Expertise</h2>
          <p className="text-xs text-gray-500 mb-6">
            Legacy free-text tags. New advisors should use the Products / Services / Brands
            declarations above instead.
          </p>

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

interface DeclarationPickerProps {
  kind: 'product' | 'service' | 'brand'
  catalog: Array<{ id: string; slug: string; name: string }>
  declared: Array<{ id: string; name: string }>
  onAdd: (row: { id: string; slug: string; name: string }) => void
  onMove: (idx: number, dir: -1 | 1) => void
  onRemove: (idx: number) => void
  orderable: boolean
}

function DeclarationPicker({
  kind,
  catalog,
  declared,
  onAdd,
  onMove,
  onRemove,
  orderable,
}: DeclarationPickerProps) {
  const declaredIds = new Set(declared.map((d) => d.id))
  const available = catalog.filter((c) => !declaredIds.has(c.id))

  return (
    <div>
      {declared.length > 0 ? (
        <ol className="space-y-2 mb-4">
          {declared.map((item, idx) => (
            <li
              key={item.id}
              className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200"
            >
              {orderable && (
                <span className="text-sm text-gray-500 font-mono w-6 text-right">
                  {idx + 1}.
                </span>
              )}
              <span className="flex-1 text-gray-900">{item.name}</span>
              {orderable && (
                <>
                  <button
                    type="button"
                    onClick={() => onMove(idx, -1)}
                    disabled={idx === 0}
                    className="px-2 text-gray-500 hover:text-gray-900 disabled:opacity-30"
                    aria-label="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => onMove(idx, 1)}
                    disabled={idx === declared.length - 1}
                    className="px-2 text-gray-500 hover:text-gray-900 disabled:opacity-30"
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => onRemove(idx)}
                className="px-2 text-gray-500 hover:text-red-600"
                aria-label="Remove"
              >
                ×
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-gray-500 italic mb-4">
          None declared yet. Pick from the list below.
        </p>
      )}

      {available.length > 0 ? (
        <select
          onChange={(e) => {
            const id = e.target.value
            if (!id) return
            const row = catalog.find((c) => c.id === id)
            if (row) onAdd(row)
            e.target.value = ''
          }}
          defaultValue=""
          className="input-modern w-full"
        >
          <option value="">
            Add a {kind}...
          </option>
          {available.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name}
            </option>
          ))}
        </select>
      ) : (
        <p className="text-sm text-gray-500 italic">
          All available {kind}s have been declared.
        </p>
      )}
    </div>
  )
}
