import { supabase } from '../lib/supabase'
import type { Tables } from '../types/database'

export type Idea = Tables<'ideas'>

export async function listIdeas(projectId: string): Promise<Idea[]> {
  const { data, error } = await supabase
    .from('ideas')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createIdea(input: { projectId: string; title: string; description: string; userId: string }): Promise<void> {
  const { error } = await supabase.from('ideas').insert({
    project_id: input.projectId,
    title: input.title,
    description: input.description || null,
    created_by: input.userId,
  })
  if (error) throw error
}

export async function updateIdea(ideaId: string, input: { title: string; description: string }): Promise<void> {
  const { error } = await supabase
    .from('ideas')
    .update({ title: input.title, description: input.description || null })
    .eq('id', ideaId)
  if (error) throw error
}

export async function deleteIdea(ideaId: string): Promise<void> {
  const { error } = await supabase.from('ideas').delete().eq('id', ideaId)
  if (error) throw error
}

// Creates the to-do and marks the idea converted in one step; returns the new to-do's id
export async function convertIdea(ideaId: string): Promise<string> {
  const { data, error } = await supabase.rpc('convert_idea_to_task', { p_idea: ideaId })
  if (error) throw error
  return data
}
