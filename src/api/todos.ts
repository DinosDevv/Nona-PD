import { supabase } from '../lib/supabase'
import type { Enums, Tables } from '../types/database'

export type TodoState = Enums<'todo_state'>
export type Todo = Tables<'todos'> & { todo_assignees: { user_id: string }[] }

export async function listTodos(projectId: string): Promise<Todo[]> {
  const { data, error } = await supabase
    .from('todos')
    .select('*, todo_assignees(user_id)')
    .eq('project_id', projectId)
    .order('created_at')
  if (error) throw error
  return data
}

export async function createTodo(input: {
  projectId: string
  title: string
  deadline?: string
  createdBy: string
}): Promise<void> {
  const { error } = await supabase.from('todos').insert({
    project_id: input.projectId,
    title: input.title,
    deadline: input.deadline || null,
    created_by: input.createdBy,
  })
  if (error) throw error
}

export async function setTodoState(todoId: string, state: TodoState): Promise<void> {
  const { error } = await supabase.from('todos').update({ state }).eq('id', todoId)
  if (error) throw error
}
