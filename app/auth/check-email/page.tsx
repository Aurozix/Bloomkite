'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Logo } from '@/app/components/Logo'

function CheckEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email')

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center mb-6">
          <Logo size={56} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Check your email</h1>
        <p className="text-gray-600 text-lg mb-6">
          {email ? (
            <>
              We sent a verification link to <strong>{email}</strong>.
            </>
          ) : (
            'We sent you a verification link.'
          )}
        </p>
        <p className="text-gray-500 text-sm mb-8">
          Click the link in the email to verify your account, then sign in.
        </p>
        <a href="/auth/signin" className="btn-outline">
          Back to sign in
        </a>
      </div>
    </div>
  )
}

export default function CheckEmail() {
  return (
    <Suspense fallback={null}>
      <CheckEmailContent />
    </Suspense>
  )
}
