import { useCallback, useEffect, useState } from 'react'
import { countMyOpenTasks } from '../api/todos'
import { useAuth } from '../lib/useAuth'
import { useRealtimeRefresh } from './useRealtimeRefresh'

// Open to-dos assigned to you, for the sidebar badge
export function useMyTaskCount() {
  const { session } = useAuth()
  const userId = session?.user.id
  const [count, setCount] = useState(0)
  const [version, setVersion] = useState(0)
  const reload = useCallback(() => setVersion((v) => v + 1), [])

  useEffect(() => {
    if (!userId) return
    let ignore = false
    countMyOpenTasks(userId)
      .then((n) => !ignore && setCount(n))
      .catch(() => {
        // badge just stays as it was
      })
    return () => {
      ignore = true
    }
  }, [userId, version])

  useRealtimeRefresh('tasks:badge', [{ table: 'todos' }, { table: 'todo_assignees' }], reload, !!userId)

  return count
}
