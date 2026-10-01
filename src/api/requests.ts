import { supabase } from '../lib/supabase'

export async function requestAssignment(input: { todoId: string; userId: string; message?: string }): Promise<void> {
  const { error } = await supabase
    .from('assignment_requests')
    .insert({ todo_id: input.todoId, user_id: input.userId, message: input.message?.trim() || null })
  if (error) throw error
}

export async function withdrawRequest(requestId: string): Promise<void> {
  const { error } = await supabase.from('assignment_requests').delete().eq('id', requestId)
  if (error) throw error
}

// Approving assigns the requester via the on_assignment_request_resolved trigger
export async function resolveRequest(requestId: string, approve: boolean): Promise<void> {
  const { error } = await supabase
    .from('assignment_requests')
    .update({ status: approve ? 'approved' : 'rejected' })
    .eq('id', requestId)
  if (error) throw error
}
