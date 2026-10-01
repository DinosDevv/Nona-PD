import { supabase } from '../lib/supabase'
import type { Tables } from '../types/database'

export type Project = Tables<'projects'>

export async function listProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
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
