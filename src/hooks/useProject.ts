import { useCallback, useEffect, useState } from 'react'
import { getProject, type Project } from '../api/projects'
import { listMembers, listResponsibilities, type Member, type Responsibility } from '../api/members'
import { createTodo, listTodos, setTodoState, type Todo, type TodoState } from '../api/todos'
import { useAuth } from '../lib/useAuth'

type ProjectData = {
  project: Project | null
  members: Member[]
  responsibilities: Responsibility[]
  todos: Todo[]
}

export function useProject(projectId: string) {
  const { session } = useAuth()
  const userId = session!.user.id

  const [data, setData] = useState<ProjectData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  const reload = useCallback(() => setVersion((v) => v + 1), [])

  useEffect(() => {
    let ignore = false
    Promise.all([
      getProject(projectId),
      listMembers(projectId),
      listResponsibilities(projectId),
      listTodos(projectId),
    ])
      .then(([project, members, responsibilities, todos]) => {
        if (!ignore) setData({ project, members, responsibilities, todos })
      })
      .catch((e: Error) => {
        if (!ignore) setError(e.message)
      })
    return () => {
      ignore = true
    }
  }, [projectId, version])

  const members = data?.members ?? []
  const isManager = members.some((m) => m.user_id === userId && m.role === 'manager')
  const memberName = (id: string) =>
    members.find((m) => m.user_id === id)?.profiles?.full_name ?? 'Unknown'
  const canEdit = (todo: Todo) =>
    isManager || todo.todo_assignees.some((a) => a.user_id === userId)

  async function run(action: () => Promise<void>) {
    try {
      await action()
      reload()
      return true
    } catch (e) {
      setError((e as Error).message)
      return false
    }
  }

  return {
    ...data,
    loading: data === null && error === null,
    error,
    isManager,
    memberName,
    canEdit,
    addTodo: (title: string, deadline: string) =>
      run(() => createTodo({ projectId, title, deadline, createdBy: userId })),
    changeState: (todoId: string, state: TodoState) => run(() => setTodoState(todoId, state)),
  }
}
