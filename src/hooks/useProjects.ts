import { useCallback, useEffect, useState } from 'react'
import { createProject, listProjects, type Project } from '../api/projects'
import { useAuth } from '../lib/useAuth'

export function useProjects() {
  const { session } = useAuth()
  const [projects, setProjects] = useState<Project[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listProjects()
      .then(setProjects)
      .catch((e: Error) => setError(e.message))
  }, [])

  const create = useCallback(
    async (name: string, description: string) => {
      try {
        return await createProject({ name, description, createdBy: session!.user.id })
      } catch (e) {
        setError((e as Error).message)
        return null
      }
    },
    [session],
  )

  return { projects, error, create }
}
