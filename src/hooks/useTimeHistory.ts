import { useCallback, useEffect, useMemo, useState } from 'react'
import { listMyTimeEntries, type MyTimeEntry } from '../api/time'
import { buildHistory } from '../lib/historyView'
import { useAuth } from '../lib/useAuth'
import { useNow } from './useNow'
import { useRealtimeRefresh } from './useRealtimeRefresh'

// Your tracked time over the last `days` days (including today)
export function useTimeHistory(days: number) {
  const { session } = useAuth()
  const userId = session!.user.id
  const [entries, setEntries] = useState<MyTimeEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  const reload = useCallback(() => setVersion((v) => v + 1), [])

  useEffect(() => {
    let ignore = false
    const today = new Date()
    const since = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (days - 1))
    listMyTimeEntries(userId, since)
      .then((data) => !ignore && setEntries(data))
      .catch((e: Error) => !ignore && setError(e.message))
    return () => {
      ignore = true
    }
  }, [userId, days, version])

  useRealtimeRefresh('history', [{ table: 'time_entries', filter: `user_id=eq.${userId}` }], reload)

  // Today's bar keeps growing while a timer runs
  const now = useNow(entries?.some((e) => !e.ended_at) ?? false, 30_000)
  const history = useMemo(() => (entries ? buildHistory(entries, days, now) : null), [entries, days, now])

  return { history, error }
}
