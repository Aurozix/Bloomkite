'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Dispatcher: redirect /profile to the role-specific profile page based on
// the authenticated session's current role. Keeps a single bookmarkable URL
// while letting investors and advisors edit fields specific to their role.
export default function ProfileDispatch() {
  const router = useRouter()

  useEffect(() => {
    const dispatch = async () => {
      try {
        const resp = await fetch('/api/auth/session')
        const { user } = await resp.json()

        if (!user) {
          router.replace('/auth/signin')
          return
        }

        const role: string | null = user.current_role
        if (role === 'advisor') {
          router.replace('/profile/advisor')
        } else if (role === 'investor') {
          router.replace('/profile/investor')
        } else {
          router.replace('/dashboard')
        }
      } catch {
        router.replace('/auth/signin')
      }
    }
    dispatch()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin h-12 w-12 border-4 border-gray-300 border-t-blue-500 rounded-full" />
    </div>
  )
}
