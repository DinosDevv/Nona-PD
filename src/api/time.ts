import { supabase } from '../lib/supabase'
import type { Tables } from '../types/database'

export type TimeEntry = Pick<
  Tables<'time_entries'>,
  'id' | 'project_id' | 'todo_id' | 'user_id' | 'started_at' | 'ended_at' | 'note' | 'tags'
>
export type Session = TimeEntry & {
  projects: { id: string; name: string } | null
  todos: { title: string } | null
}

const ENTRY = 'id, project_id, todo_id, user_id, started_at, ended_at, note, tags'
const SESSION = `${ENTRY}, projects(id, name), todos(title)`

export async function listTimeEntries(projectId: string): Promise<TimeEntry[]> {
  const { data, error } = await supabase.from('time_entries').select(ENTRY).eq('project_id', projectId)
  if (error) throw error
  return data
}

export async function getRunningSession(userId: string): Promise<Session | null> {
  const { data, error } = await supabase
    .from('time_entries')
    .select(SESSION)
    .eq('user_id', userId)
    .is('ended_at', null)
    .maybeSingle()
  if (error) throw error
  return data
}

// Your sessions that overlap the range (still running, or ended after `since`)
export async function listMySessions(userId: string, since: Date): Promise<Session[]> {
  const { data, error } = await supabase
    .from('time_entries')
    .select(SESSION)
    .eq('user_id', userId)
    .or(`ended_at.is.null,ended_at.gte.${since.toISOString()}`)
    .order('started_at', { ascending: false })
  if (error) throw error
  return data
}

export async function startSession(projectId: string, todoId?: string | null): Promise<void> {
  const { error } = await supabase.rpc('start_session', { p_project: projectId, p_todo: todoId ?? undefined })
  if (error) throw error
}

// Returns the saved session's id, or null if it was under a minute and got discarded
export async function stopSession(at?: Date): Promise<string | null> {
  const { data, error } = await supabase.rpc('stop_timer', { p_at: at?.toISOString() })
  if (error) throw error
  return data
}

export async function describeSession(sessionId: string, input: { note: string; tags: string[] }): Promise<void> {
  const { error } = await supabase
    .from('time_entries')
    .update({ note: input.note.trim() || null, tags: input.tags })
    .eq('id', sessionId)
  if (error) throw error
}
