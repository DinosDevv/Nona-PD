import { supabase } from '../lib/supabase'

export async function createNote(input: {
  todoId: string
  body: string
  userId: string
}): Promise<void> {
  const { error } = await supabase
    .from('todo_notes')
    .insert({ todo_id: input.todoId, body: input.body, user_id: input.userId })
  if (error) throw error
}

export async function updateNote(noteId: string, body: string): Promise<void> {
  const { error } = await supabase.from('todo_notes').update({ body }).eq('id', noteId)
  if (error) throw error
}

export async function deleteNote(noteId: string): Promise<void> {
  const { error } = await supabase.from('todo_notes').delete().eq('id', noteId)
  if (error) throw error
}
