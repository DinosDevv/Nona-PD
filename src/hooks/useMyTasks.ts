import { useCallback, useEffect, useState } from 'react'
import { listMyTasks, setTodoState, type MyTask, type TodoState } from '../api/todos'
import { useAuth } from '../lib/useAuth'
import { useToast } from '../lib/useToast'
import { useRealtimeRefresh } from './useRealtimeRefresh'

export function useMyTasks() {
  const { session } = useAuth()
  const userId = session!.user.id
  const [tasks, setTasks] = useState<MyTask[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const toast = useToast()
  const [version, setVersion] = useState(0)
  const reload = useCallback(() => setVersion((v) => v + 1), [])

  useEffect(() => {
    let ignore = false
    listMyTasks(userId)
      .then((data) => !ignore && setTasks(data))
      .catch((e: Error) => !ignore && setError(e.message))
    return () => {
      ignore = true
    }
  }, [userId, version])

  useRealtimeRefresh('tasks:mine', [{ table: 'todos' }, { table: 'todo_assignees' }, { table: 'projects' }], reload)

  async function changeState(todoId: string, state: TodoState) {
    try {
      await setTodoState(todoId, state)
      reload()
      if (state === 'done') toast.success('Marked as done')
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  return { tasks, error, changeState }
}
