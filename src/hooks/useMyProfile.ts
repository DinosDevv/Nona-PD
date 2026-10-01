import { useEffect, useState } from 'react'
import { getProfile, PROFILE_UPDATED, type Profile } from '../api/profiles'
import { useAuth } from '../lib/useAuth'

// Your own profile, for showing your real name (falls back to email until one is set)
export function useMyProfile() {
  const { session } = useAuth()
  const userId = session?.user.id
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    if (!userId) return
    let ignore = false
    const load = () =>
      getProfile(userId)
        .then((data) => !ignore && setProfile(data))
        .catch(() => {
          // not critical — the email fallback is shown
        })
    load()
    window.addEventListener(PROFILE_UPDATED, load)
    return () => {
      ignore = true
      window.removeEventListener(PROFILE_UPDATED, load)
    }
  }, [userId])

  return { profile, name: profile?.full_name ?? session?.user.email ?? '' }
}
