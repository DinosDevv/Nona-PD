import { supabase } from '../lib/supabase'
import type { Tables } from '../types/database'

export type TimeEntry = Pick<Tables<'time_entries'>, 'id' | 'todo_id' | 'user_id' | 'started_at' | 'ended_at'>
export type RunningTimer = TimeEntry & { todos: { title: string; project_id: string } | null }

export async function listTimeEntries(projectId: string): Promise<TimeEntry[]> {
  const { data, error } = await supabase
    .from('time_entries')
    .select('id, todo_id, user_id, started_at, ended_at, todos!inner(project_id)')
    .eq('todos.project_id', projectId)
  if (error) throw error
  return data
}

export async function getRunningTimer(userId: string): Promise<RunningTimer | null> {
  const { data, error } = await supabase
    .from('time_entries')
    .select('id, todo_id, user_id, started_at, ended_at, todos(title, project_id)')
    .eq('user_id', userId)
    .is('ended_at', null)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function startTimer(todoId: string): Promise<void> {
  const { error } = await supabase.rpc('start_timer', { p_todo: todoId })
  if (error) throw error
}

export async function stopTimer(): Promise<void> {
  const { error } = await supabase.rpc('stop_timer')
  if (error) throw error
}
