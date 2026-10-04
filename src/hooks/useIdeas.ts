import { useCallback, useEffect, useState } from 'react'
import { convertIdea, createIdea, deleteIdea, listIdeas, updateIdea, type Idea } from '../api/ideas'
import { useAuth } from '../lib/useAuth'
import { useToast } from '../lib/useToast'
import { useRealtimeRefresh } from './useRealtimeRefresh'

export function useIdeas(projectId: string) {
  const { session } = useAuth()
  const toast = useToast()
  const userId = session!.user.id
  const [ideas, setIdeas] = useState<Idea[] | null>(null)
  const [version, setVersion] = useState(0)
  const reload = useCallback(() => setVersion((v) => v + 1), [])

  useEffect(() => {
    let ignore = false
    listIdeas(projectId)
      .then((data) => !ignore && setIdeas(data))
      .catch((e: Error) => !ignore && toast.error(e.message))
    return () => {
      ignore = true
    }
  }, [projectId, version, toast])

  useRealtimeRefresh(`ideas:${projectId}`, [{ table: 'ideas', filter: `project_id=eq.${projectId}` }], reload)

  async function run(action: () => Promise<void>, successMessage: string) {
    try {
      await action()
      reload()
      toast.success(successMessage)
      return true
    } catch (e) {
      toast.error((e as Error).message)
      return false
    }
  }

  return {
    ideas,
    create: (input: { title: string; description: string }) =>
      run(() => createIdea({ projectId, ...input, userId }), 'Idea added'),
    update: (ideaId: string, input: { title: string; description: string }) =>
      run(() => updateIdea(ideaId, input), 'Idea updated'),
    remove: (ideaId: string) => run(() => deleteIdea(ideaId), 'Idea deleted'),
    // Returns the new to-do's id, or null if it failed
    convert: async (ideaId: string) => {
      try {
        const todoId = await convertIdea(ideaId)
        reload()
        toast.success('Turned into a task')
        return todoId
      } catch (e) {
        toast.error((e as Error).message)
        return null
      }
    },
  }
}
