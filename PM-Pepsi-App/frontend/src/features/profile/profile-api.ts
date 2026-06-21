import { userProfileSchema } from '@/api/schemas'
import { AUTH_CHANGED_EVENT, isLoggedIn } from '@/features/auth/login-api'
import { fetchApi } from '@/lib/fetch-api'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

export async function fetchProfile() {
  const json = await fetchApi<unknown>('/api/v1/auth/profile')
  return userProfileSchema.parse(json)
}

/** โหลดโปรไฟล์จาก GET /api/v1/auth/profile */
export function useProfileQuery(enabled = true) {
  const [loggedIn, setLoggedIn] = useState(() => isLoggedIn())

  useEffect(() => {
    const sync = () => setLoggedIn(isLoggedIn())
    window.addEventListener(AUTH_CHANGED_EVENT, sync)
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, sync)
  }, [])

  return useQuery({
    queryKey: ['auth-profile'],
    queryFn: fetchProfile,
    enabled: enabled && loggedIn,
    staleTime: 60_000,
  })
}
