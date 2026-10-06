import { useCallback, useEffect, useState } from 'react'
import { createProject, listProjects, type ProjectSummary } from '../api/projects'
import { useAuth } from '../lib/useAuth'
import { useToast } from '../lib/useToast'
import { useRealtimeRefresh } from './useRealtimeRefresh'

export function useProjects() {
  const { session } = useAuth()
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const toast = useToast()
  const [version, setVersion] = useState(0)
  const reload = useCallback(() => setVersion((v) => v + 1), [])

  useEffect(() => {
    let ignore = false
    listProjects()
      .then((data) => !ignore && setProjects(data))
      .catch((e: Error) => !ignore && setError(e.message))
    return () => {
      ignore = true
    }
  }, [version])

  useRealtimeRefresh(
    'projects:list',
    [
      { table: 'projects' },
      { table: 'project_members' },
      { table: 'todos' },
      { table: 'profiles' },
      { table: 'time_entries' },
    ],
    reload,
  )

  const create = useCallback(
    async (name: string, description: string) => {
      try {
        return await createProject({ name, description, createdBy: session!.user.id })
      } catch (e) {
        toast.error((e as Error).message)
        return null
      }
    },
    [session, toast],
  )

  return { projects, error, create }
}
