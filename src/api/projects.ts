import { supabase } from '../lib/supabase'
import type { Enums, Tables } from '../types/database'
import type { ProjectRole } from './members'
import type { TodoState } from './todos'

export type Project = Tables<'projects'>
export type ProjectStatus = Enums<'project_status'>
export type ProjectSummary = Project & {
  todos: { state: TodoState; time_entries: { started_at: string; ended_at: string | null }[] }[]
  project_members: { user_id: string; role: ProjectRole; profiles: { full_name: string } | null }[]
}

export async function listProjects(): Promise<ProjectSummary[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*, todos(state, time_entries(started_at, ended_at)), project_members(user_id, role, profiles(full_name))')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getProject(id: string): Promise<Project | null> {
  const { data, error } = await supabase.from('projects').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export async function createProject(input: {
  name: string
  description?: string
  createdBy: string
}): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      name: input.name,
      description: input.description || null,
      created_by: input.createdBy,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateProject(
  id: string,
  input: { name: string; description: string; status: ProjectStatus },
): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .update({ name: input.name, description: input.description || null, status: input.status })
    .eq('id', id)
  if (error) throw error
}

// Deletes members, to-dos, notes and requests too (on delete cascade)
export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw error
}
