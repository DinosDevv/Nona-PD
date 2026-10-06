import { supabase } from '../lib/supabase'
import type { Enums, Tables } from '../types/database'

export type TodoState = Enums<'todo_state'>
export type TodoNote = Pick<Tables<'todo_notes'>, 'id' | 'body' | 'user_id' | 'created_at' | 'updated_at'>
export type TodoRequest = Pick<Tables<'assignment_requests'>, 'id' | 'user_id' | 'message'>
export type Todo = Tables<'todos'> & {
  todo_assignees: { user_id: string }[]
  todo_notes: TodoNote[]
  assignment_requests: TodoRequest[]
}
export type MyTask = Tables<'todos'> & { projects: { id: string; name: string } | null }

export async function listTodos(projectId: string): Promise<Todo[]> {
  const { data, error } = await supabase
    .from('todos')
    .select(
      '*, todo_assignees(user_id), todo_notes(id, body, user_id, created_at, updated_at), assignment_requests(id, user_id, message)',
    )
    .eq('project_id', projectId)
    .eq('assignment_requests.status', 'pending') // filters the embedded requests, not the to-dos
    .order('created_at')
    .order('created_at', { referencedTable: 'todo_notes' })
  if (error) throw error
  return data
}

export async function createTodo(input: {
  projectId: string
  title: string
  description?: string
  deadline?: string
  createdBy: string
}): Promise<void> {
  const { error } = await supabase.from('todos').insert({
    project_id: input.projectId,
    title: input.title,
    description: input.description || null,
    // datetime-local gives local time without an offset; convert so Postgres stores the right instant
    deadline: input.deadline ? new Date(input.deadline).toISOString() : null,
    created_by: input.createdBy,
  })
  if (error) throw error
}

export async function setTodoState(todoId: string, state: TodoState): Promise<void> {
  const { error } = await supabase.from('todos').update({ state }).eq('id', todoId)
  if (error) throw error
}

// Open to-dos assigned to this user, across all their projects
export async function listMyTasks(userId: string): Promise<MyTask[]> {
  const { data, error } = await supabase
    .from('todos')
    .select('*, projects(id, name), todo_assignees!inner(user_id)')
    .eq('todo_assignees.user_id', userId)
    .neq('state', 'done')
    .order('deadline', { ascending: true, nullsFirst: false })
  if (error) throw error
  return data
}

// Title/description: author or PM, not once done (enforced in the database).
// Deadline: assignees or PM.
export async function updateTodo(
  todoId: string,
  input: { title: string; description: string; deadline: string },
): Promise<void> {
  const { error } = await supabase
    .from('todos')
    .update({
      title: input.title,
      description: input.description || null,
      deadline: input.deadline ? new Date(input.deadline).toISOString() : null,
    })
    .eq('id', todoId)
  if (error) throw error
}

export async function deleteTodo(todoId: string): Promise<void> {
  const { error } = await supabase.from('todos').delete().eq('id', todoId)
  if (error) throw error
}

export async function countMyOpenTasks(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('todos')
    .select('id, todo_assignees!inner(user_id)', { count: 'exact', head: true })
    .eq('todo_assignees.user_id', userId)
    .neq('state', 'done')
  if (error) throw error
  return count ?? 0
}
