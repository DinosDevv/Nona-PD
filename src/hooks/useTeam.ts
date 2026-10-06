import { useCallback, useEffect, useState } from 'react'
import { listTeam, updateMyProfile, type TeamMember } from '../api/profiles'
import { useAuth } from '../lib/useAuth'
import { useToast } from '../lib/useToast'
import { useRealtimeRefresh } from './useRealtimeRefresh'

export function useTeam() {
  const { session } = useAuth()
  const userId = session!.user.id
  const [team, setTeam] = useState<TeamMember[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const toast = useToast()
  const [version, setVersion] = useState(0)
  const reload = useCallback(() => setVersion((v) => v + 1), [])

  useEffect(() => {
    let ignore = false
    listTeam()
      .then((data) => !ignore && setTeam(data))
      .catch((e: Error) => !ignore && setError(e.message))
    return () => {
      ignore = true
    }
  }, [version])

  useRealtimeRefresh('team', [{ table: 'profiles' }, { table: 'project_members' }], reload)

  async function updateMe(input: { fullName: string; status: string }) {
    try {
      await updateMyProfile(userId, input)
      reload()
      toast.success('Profile saved')
      return true
    } catch (e) {
      toast.error((e as Error).message)
      return false
    }
  }

  return {
    me: team?.find((m) => m.id === userId) ?? null,
    others: team?.filter((m) => m.id !== userId) ?? [],
    loading: team === null && error === null,
    error,
    updateMe,
  }
}
