import { supabase } from '../lib/supabase'
import type { Enums, Tables } from '../types/database'

export type Member = Pick<Tables<'project_members'>, 'user_id' | 'role' | 'title'> & {
  profiles: Pick<Tables<'profiles'>, 'full_name' | 'user_status'> | null
}
export type Responsibility = Tables<'responsibilities'>
export type Profile = Pick<Tables<'profiles'>, 'id' | 'full_name'>
export type ProjectRole = Enums<'project_role'>

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

export async function listProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase.from('profiles').select('id, full_name').order('full_name')
  if (error) throw error
  return data
}

export async function addMember(projectId: string, userId: string): Promise<void> {
  const { error } = await supabase.from('project_members').insert({ project_id: projectId, user_id: userId })
  if (error) throw error
}

export async function setMemberRole(projectId: string, userId: string, role: ProjectRole): Promise<void> {
  const { error } = await supabase
    .from('project_members')
    .update({ role })
    .eq('project_id', projectId)
    .eq('user_id', userId)
  if (error) throw error
}

export async function removeMember(projectId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('project_members')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', userId)
  if (error) throw error
}
