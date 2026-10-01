import { useCallback, useEffect, useState } from 'react'
import { deleteProject, getProject, updateProject, type Project, type ProjectStatus } from '../api/projects'
import {
  addMember,
  listMembers,
  listProfiles,
  listResponsibilities,
  removeMember,
  setMemberRole,
  type Member,
  type Profile,
  type ProjectRole,
  type Responsibility,
} from '../api/members'
import { assignUser, unassignUser } from '../api/assignees'
import { createTodo, listTodos, setTodoState, type Todo, type TodoState } from '../api/todos'
import { createNote } from '../api/notes'
import { requestAssignment, resolveRequest, withdrawRequest } from '../api/requests'
import { useAuth } from '../lib/useAuth'

type ProjectData = {
  project: Project | null
  members: Member[]
  responsibilities: Responsibility[]
  todos: Todo[]
  profiles: Profile[]
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
      listProfiles(),
    ])
      .then(([project, members, responsibilities, todos, profiles]) => {
        if (!ignore) setData({ project, members, responsibilities, todos, profiles })
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
  const isAssignee = (todo: Todo) => todo.todo_assignees.some((a) => a.user_id === userId)
  const canEdit = (todo: Todo) => isManager || isAssignee(todo)
  const myRequestId = (todo: Todo) =>
    todo.assignment_requests.find((r) => r.user_id === userId)?.id ?? null
  const canRequest = (todo: Todo) => !isManager && !isAssignee(todo)

  const creatorId = data?.project?.created_by ?? null
  // Everyone in the team who isn't in this project yet (for the "Add member" picker)
  const nonMembers = (data?.profiles ?? []).filter((p) => !members.some((m) => m.user_id === p.id))
  // Project members not yet assigned to this to-do (for the "Assign" picker)
  const assignable = (todo: Todo) =>
    members.filter((m) => !todo.todo_assignees.some((a) => a.user_id === m.user_id))

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
    isAssignee,
    addTodo: (input: { title: string; description: string; deadline: string }) =>
      run(() => createTodo({ projectId, ...input, createdBy: userId })),
    changeState: (todoId: string, state: TodoState) => run(() => setTodoState(todoId, state)),
    addNote: (todoId: string, body: string) =>
      run(() => createNote({ todoId, body, userId })),
    myRequestId,
    canRequest,
    requestAssignment: (todoId: string, message: string) =>
      run(() => requestAssignment({ todoId, userId, message })),
    withdrawRequest: (requestId: string) => run(() => withdrawRequest(requestId)),
    resolveRequest: (requestId: string, approve: boolean) =>
      run(() => resolveRequest(requestId, approve)),
    creatorId,
    nonMembers,
    assignable,
    addMember: (memberId: string) => run(() => addMember(projectId, memberId)),
    setMemberRole: (memberId: string, role: ProjectRole) =>
      run(() => setMemberRole(projectId, memberId, role)),
    removeMember: (memberId: string) => run(() => removeMember(projectId, memberId)),
    assign: (todoId: string, memberId: string) => run(() => assignUser(todoId, memberId)),
    unassign: (todoId: string, memberId: string) => run(() => unassignUser(todoId, memberId)),
    updateProject: (input: { name: string; description: string; status: ProjectStatus }) =>
      run(() => updateProject(projectId, input)),
    // No reload after deleting — the page navigates away
    deleteProject: async () => {
      try {
        await deleteProject(projectId)
        return true
      } catch (e) {
        setError((e as Error).message)
        return false
      }
    },
  }
}
