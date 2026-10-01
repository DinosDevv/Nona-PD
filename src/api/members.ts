import { supabase } from '../lib/supabase'
import type { Tables } from '../types/database'

export type Member = Pick<Tables<'project_members'>, 'user_id' | 'role' | 'title'> & {
  profiles: Pick<Tables<'profiles'>, 'full_name' | 'user_status'> | null
}
export type Responsibility = Tables<'responsibilities'>

export async function listMembers(projectId: string): Promise<Member[]> {
  const { data, error } = await supabase
    .from('project_members')
    .select('user_id, role, title, profiles(full_name, user_status)')
    .eq('project_id', projectId)
  if (error) throw error
  return data
}

export async function listResponsibilities(projectId: string): Promise<Responsibility[]> {
  const { data, error } = await supabase
    .from('responsibilities')
    .select('*')
    .eq('project_id', projectId)
    .order('position')
  if (error) throw error
  return data
}
