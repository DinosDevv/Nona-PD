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
import { createTodo, deleteTodo, listTodos, setTodoState, updateTodo, type Todo, type TodoState } from '../api/todos'
import { createNote, deleteNote, updateNote } from '../api/notes'
import { requestAssignment, resolveRequest, withdrawRequest } from '../api/requests'
import { listTimeEntries, startTimer, stopTimer, type TimeEntry } from '../api/time'
import { useAuth } from '../lib/useAuth'
import { useToast } from '../lib/useToast'
import { useRealtimeRefresh } from './useRealtimeRefresh'

type ProjectData = {
  project: Project | null
  members: Member[]
  responsibilities: Responsibility[]
  todos: Todo[]
  profiles: Profile[]
  timeEntries: TimeEntry[]
}

export function useProject(projectId: string) {
  const { session } = useAuth()
  const toast = useToast()
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
      listTimeEntries(projectId),
    ])
      .then(([project, members, responsibilities, todos, profiles, timeEntries]) => {
        if (!ignore) setData({ project, members, responsibilities, todos, profiles, timeEntries })
      })
      .catch((e: Error) => {
        if (!ignore) setError(e.message)
      })
    return () => {
      ignore = true
    }
  }, [projectId, version])

  // Live updates from teammates. Tables without a project_id column can't be
  // filtered here, but the permission rules limit them to your projects anyway.
  useRealtimeRefresh(
    `project:${projectId}`,
    [
      { table: 'projects', filter: `id=eq.${projectId}` },
      { table: 'project_members', filter: `project_id=eq.${projectId}` },
      { table: 'todos', filter: `project_id=eq.${projectId}` },
      { table: 'todo_assignees' },
      { table: 'todo_notes' },
      { table: 'assignment_requests' },
      { table: 'profiles' },
      { table: 'time_entries' },
    ],
    reload,
  )

  const members = data?.members ?? []
  const isManager = members.some((m) => m.user_id === userId && m.role === 'manager')
  const memberName = (id: string) =>
    members.find((m) => m.user_id === id)?.profiles?.full_name ?? 'Unknown'
  const isAssignee = (todo: Todo) => todo.todo_assignees.some((a) => a.user_id === userId)
  const canEdit = (todo: Todo) => isManager || isAssignee(todo)
  // Same rule as the database: author or PM, and never once done
  const canRename = (todo: Todo) => todo.state !== 'done' && (isManager || todo.created_by === userId)
  const myRequestId = (todo: Todo) =>
    todo.assignment_requests.find((r) => r.user_id === userId)?.id ?? null
  const canRequest = (todo: Todo) => !isManager && !isAssignee(todo)
  // Same rule as start_timer in the database
  const canTrackTime = (todo: Todo) => canEdit(todo) && todo.state !== 'done'
  const timeFor = (todoId: string) => (data?.timeEntries ?? []).filter((e) => e.todo_id === todoId)

  const creatorId = data?.project?.created_by ?? null
  // Everyone in the team who isn't in this project yet (for the "Add member" picker)
  const nonMembers = (data?.profiles ?? []).filter((p) => !members.some((m) => m.user_id === p.id))
  // Project members not yet assigned to this to-do (for the "Assign" picker)
  const assignable = (todo: Todo) =>
    members.filter((m) => !todo.todo_assignees.some((a) => a.user_id === m.user_id))

  async function run(action: () => Promise<void>, successMessage?: string) {
    try {
      await action()
      reload()
      if (successMessage) toast.success(successMessage)
      return true
    } catch (e) {
      toast.error((e as Error).message)
      return false
    }
  }

  return {
    ...data,
    currentUserId: userId,
    loading: data === null && error === null,
    error,
    isManager,
    memberName,
    canEdit,
    canRename,
    isAssignee,
    addTodo: (input: { title: string; description: string; deadline: string }) =>
      run(() => createTodo({ projectId, ...input, createdBy: userId }), 'To-do added'),
    editTodo: (todoId: string, input: { title: string; description: string; deadline: string }) =>
      run(() => updateTodo(todoId, input), 'To-do updated'),
    removeTodo: (todoId: string) => run(() => deleteTodo(todoId), 'To-do deleted'),
    changeState: (todoId: string, state: TodoState) => run(() => setTodoState(todoId, state)),
    addNote: (todoId: string, body: string) => run(() => createNote({ todoId, body, userId })),
    editNote: (noteId: string, body: string) => run(() => updateNote(noteId, body)),
    removeNote: (noteId: string) => run(() => deleteNote(noteId)),
    canTrackTime,
    timeFor,
    startTimer: (todoId: string) => run(() => startTimer(todoId), 'Timer started'),
    stopTimer: () => run(() => stopTimer(), 'Timer stopped'),
    myRequestId,
    canRequest,
    requestAssignment: (todoId: string, message: string) =>
      run(() => requestAssignment({ todoId, userId, message }), 'Request sent'),
    withdrawRequest: (requestId: string) => run(() => withdrawRequest(requestId), 'Request withdrawn'),
    resolveRequest: (requestId: string, approve: boolean) =>
      run(() => resolveRequest(requestId, approve), approve ? 'Request approved' : 'Request rejected'),
    creatorId,
    nonMembers,
    assignable,
    addMember: (memberId: string) => run(() => addMember(projectId, memberId), 'Member added'),
    setMemberRole: (memberId: string, role: ProjectRole) =>
      run(() => setMemberRole(projectId, memberId, role), 'Role updated'),
    removeMember: (memberId: string) => run(() => removeMember(projectId, memberId), 'Member removed'),
    assign: (todoId: string, memberId: string) => run(() => assignUser(todoId, memberId)),
    unassign: (todoId: string, memberId: string) => run(() => unassignUser(todoId, memberId)),
    updateProject: (input: { name: string; description: string; status: ProjectStatus }) =>
      run(() => updateProject(projectId, input), 'Project saved'),
    // No reload after deleting — the page navigates away
    deleteProject: async () => {
      try {
        await deleteProject(projectId)
        toast.success('Project deleted')
        return true
      } catch (e) {
        toast.error((e as Error).message)
        return false
      }
    },
  }
}
