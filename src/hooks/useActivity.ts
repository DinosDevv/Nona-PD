import { useCallback, useEffect, useState } from 'react'
import { listActivity, type ActivityEntry } from '../api/activity'
import { useRealtimeRefresh } from './useRealtimeRefresh'

export function useActivity(projectId: string, enabled: boolean) {
  const [entries, setEntries] = useState<ActivityEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  const reload = useCallback(() => setVersion((v) => v + 1), [])

  useEffect(() => {
    if (!enabled) return
    let ignore = false
    listActivity(projectId)
      .then((data) => !ignore && setEntries(data))
      .catch((e: Error) => !ignore && setError(e.message))
    return () => {
      ignore = true
    }
  }, [projectId, version, enabled])

  useRealtimeRefresh(`activity:${projectId}`, [{ table: 'activity', filter: `project_id=eq.${projectId}` }], reload, enabled)

  return { entries, error }
}
