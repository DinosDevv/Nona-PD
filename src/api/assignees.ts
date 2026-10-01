import { supabase } from '../lib/supabase'

export async function assignUser(todoId: string, userId: string): Promise<void> {
  const { error } = await supabase.from('todo_assignees').insert({ todo_id: todoId, user_id: userId })
  if (error) throw error
}

export async function unassignUser(todoId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('todo_assignees')
    .delete()
    .eq('todo_id', todoId)
    .eq('user_id', userId)
  if (error) throw error
}
