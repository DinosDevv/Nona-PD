import { supabase } from '../lib/supabase'
import type { Tables } from '../types/database'

export type ActivityEntry = Tables<'activity'> & { profiles: { full_name: string } | null }

export async function listActivity(projectId: string): Promise<ActivityEntry[]> {
  const { data, error } = await supabase
    .from('activity')
    .select('*, profiles(full_name)')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) throw error
  return data
}
