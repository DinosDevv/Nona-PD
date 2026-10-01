import { supabase } from '../lib/supabase'
import type { Enums, Tables } from '../types/database'

export type TodoState = Enums<'todo_state'>
export type TodoNote = Pick<Tables<'todo_notes'>, 'id' | 'body' | 'user_id' | 'created_at'>
export type Todo = Tables<'todos'> & {
  todo_assignees: { user_id: string }[]
  todo_notes: TodoNote[]
}

export async function listTodos(projectId: string): Promise<Todo[]> {
  const { data, error } = await supabase
    .from('todos')
    .select('*, todo_assignees(user_id), todo_notes(id, body, user_id, created_at)')
    .eq('project_id', projectId)
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
