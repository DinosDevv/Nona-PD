import { useCallback, useEffect, useState } from 'react'
import { deleteFile, getFileUrl, listFiles, uploadFile, type ProjectFile } from '../api/files'
import { useAuth } from '../lib/useAuth'
import { useToast } from '../lib/useToast'
import { useRealtimeRefresh } from './useRealtimeRefresh'

export function useProjectFiles(projectId: string, enabled: boolean) {
  const { session } = useAuth()
  const toast = useToast()
  const userId = session!.user.id
  const [files, setFiles] = useState<ProjectFile[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [version, setVersion] = useState(0)
  const reload = useCallback(() => setVersion((v) => v + 1), [])

  useEffect(() => {
    if (!enabled) return
    let ignore = false
    listFiles(projectId)
      .then((data) => !ignore && setFiles(data))
      .catch((e: Error) => !ignore && setError(e.message))
    return () => {
      ignore = true
    }
  }, [projectId, version, enabled])

  useRealtimeRefresh(`files:${projectId}`, [{ table: 'project_files', filter: `project_id=eq.${projectId}` }], reload, enabled)

  async function upload(list: FileList | File[]) {
    setUploading(true)
    let done = 0
    for (const file of Array.from(list)) {
      try {
        await uploadFile(projectId, file, userId)
        done++
      } catch (e) {
        toast.error((e as Error).message)
      }
    }
    setUploading(false)
    if (done) toast.success(done === 1 ? 'File uploaded' : `${done} files uploaded`)
    reload()
  }

  async function open(file: ProjectFile) {
    try {
      window.open(await getFileUrl(file.path, file.name), '_blank', 'noopener')
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  async function remove(file: ProjectFile) {
    try {
      await deleteFile(file)
      toast.success('File deleted')
      reload()
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  return { files, error, uploading, upload, open, remove, currentUserId: userId }
}
