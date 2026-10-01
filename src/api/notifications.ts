import { supabase } from '../lib/supabase'
import type { Tables } from '../types/database'

export type Notification = Tables<'notifications'> & {
  actor: { full_name: string } | null
  projects: { name: string } | null
  assignment_requests: { status: Tables<'assignment_requests'>['status'] } | null
}

export async function listNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*, actor:profiles!notifications_actor_id_fkey(full_name), projects(name), assignment_requests(status)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw error
  return data
}

export async function countUnread(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null)
  if (error) throw error
  return count ?? 0
}

export async function markRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
  if (error) throw error
}

export async function markAllRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null)
  if (error) throw error
}

// Creates "deadline within 24h / overdue" notifications for your open to-dos (once per to-do)
export async function generateDeadlineNotifications(): Promise<void> {
  const { error } = await supabase.rpc('generate_deadline_notifications')
  if (error) throw error
}
