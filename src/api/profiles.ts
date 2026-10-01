import { supabase } from '../lib/supabase'
import type { Tables } from '../types/database'

export type Profile = Tables<'profiles'>

// Fired after you edit your own profile, so other views can refresh your name
export const PROFILE_UPDATED = 'profile-updated'

export type TeamMember = Profile & {
  project_members: { projects: { id: string; name: string } | null }[]
}

// Everyone on the team, with the projects you share with them
// (the permission rules only show memberships in projects you're in)
export async function listTeam(): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, project_members(projects(id, name))')
    .order('full_name')
  if (error) throw error
  return data
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw error
  return data
}

export async function updateMyProfile(
  userId: string,
  input: { fullName: string; status: string },
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ full_name: input.fullName.trim(), user_status: input.status.trim() || null })
    .eq('id', userId)
  if (error) throw error
  window.dispatchEvent(new Event(PROFILE_UPDATED))
}
