import { useCallback, useEffect, useState } from 'react'
import { getRunningTimer, stopTimer, type RunningTimer } from '../api/time'
import { useAuth } from '../lib/useAuth'
import { useToast } from '../lib/useToast'
import { useRealtimeRefresh } from './useRealtimeRefresh'

// Your running timer in any project, for the sidebar pill
export function useRunningTimer() {
  const { session } = useAuth()
  const toast = useToast()
  const userId = session?.user.id
  const [timer, setTimer] = useState<RunningTimer | null>(null)
  const [version, setVersion] = useState(0)
  const reload = useCallback(() => setVersion((v) => v + 1), [])

  useEffect(() => {
    if (!userId) return
    let ignore = false
    getRunningTimer(userId)
      .then((data) => !ignore && setTimer(data))
      .catch(() => {
        // the pill just stays as it was
      })
    return () => {
      ignore = true
    }
  }, [userId, version])

  useRealtimeRefresh('timer:mine', [{ table: 'time_entries', filter: `user_id=eq.${userId}` }], reload, !!userId)

  async function stop() {
    try {
      await stopTimer()
      reload()
      toast.success('Timer stopped')
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  return { timer, stop }
}
