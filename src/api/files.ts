import { supabase } from '../lib/supabase'
import type { Tables } from '../types/database'

const BUCKET = 'project-files'
export const MAX_FILE_BYTES = 25 * 1024 * 1024

export type ProjectFile = Tables<'project_files'>

export async function listFiles(projectId: string): Promise<ProjectFile[]> {
  const { data, error } = await supabase
    .from('project_files')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function uploadFile(projectId: string, file: File, userId: string): Promise<void> {
  if (file.size > MAX_FILE_BYTES) throw new Error(`${file.name} is larger than 25 MB`)
  // Unique prefix so two files with the same name don't collide
  const safeName = file.name.replace(/[^\w.-]+/g, '_')
  const path = `${projectId}/${crypto.randomUUID()}-${safeName}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type || undefined })
  if (uploadError) throw uploadError

  const { error } = await supabase.from('project_files').insert({
    project_id: projectId,
    name: file.name,
    path,
    size: file.size,
    content_type: file.type || null,
    uploaded_by: userId,
  })
  if (error) {
    // Don't leave an orphaned object behind
    await supabase.storage.from(BUCKET).remove([path])
    throw error
  }
}

// Short-lived link, since the bucket is private
export async function getFileUrl(path: string, fileName: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60, { download: fileName })
  if (error) throw error
  return data.signedUrl
}

export async function deleteFile(file: ProjectFile): Promise<void> {
  const { error: storageError } = await supabase.storage.from(BUCKET).remove([file.path])
  if (storageError) throw storageError
  const { error } = await supabase.from('project_files').delete().eq('id', file.id)
  if (error) throw error
}
