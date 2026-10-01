import { useCallback, useEffect, useState } from 'react'
import {
  countUnread,
  generateDeadlineNotifications,
  listNotifications,
  markAllRead,
  markRead,
  type Notification,
} from '../api/notifications'
import { resolveRequest } from '../api/requests'
import { useAuth } from '../lib/useAuth'
import { useToast } from '../lib/useToast'
import { useRealtimeRefresh } from './useRealtimeRefresh'

export function useNotifications() {
  const { session } = useAuth()
  const toast = useToast()
  const userId = session!.user.id
  const [items, setItems] = useState<Notification[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  const reload = useCallback(() => setVersion((v) => v + 1), [])

  useEffect(() => {
    let ignore = false
    listNotifications(userId)
      .then((data) => !ignore && setItems(data))
      .catch((e: Error) => !ignore && setError(e.message))
    return () => {
      ignore = true
    }
  }, [userId, version])

  useRealtimeRefresh(
    'notifications:page',
    [{ table: 'notifications', filter: `user_id=eq.${userId}` }, { table: 'assignment_requests' }],
    reload,
  )

  async function attempt(action: () => Promise<void>, successMessage?: string) {
    try {
      await action()
      if (successMessage) toast.success(successMessage)
      reload()
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  return {
    items,
    error,
    markRead: (id: string) => attempt(() => markRead(id)),
    markAllRead: () => attempt(() => markAllRead(userId)),
    resolve: (requestId: string, approve: boolean) =>
      attempt(() => resolveRequest(requestId, approve), approve ? 'Request approved' : 'Request rejected'),
  }
}

// Unread count for the sidebar badge; also creates due-soon notifications once per session load
export function useUnreadCount() {
  const { session } = useAuth()
  const userId = session?.user.id
  const [count, setCount] = useState(0)
  const [version, setVersion] = useState(0)
  const reload = useCallback(() => setVersion((v) => v + 1), [])

  useEffect(() => {
    if (!userId) return
    generateDeadlineNotifications()
      .catch(() => {
        // not critical
      })
      .finally(reload)
  }, [userId, reload])

  useEffect(() => {
    if (!userId) return
    let ignore = false
    countUnread(userId)
      .then((n) => !ignore && setCount(n))
      .catch(() => {
        // badge just stays as it was
      })
    return () => {
      ignore = true
    }
  }, [userId, version])

  useRealtimeRefresh('notifications:badge', [{ table: 'notifications', filter: `user_id=eq.${userId}` }], reload, !!userId)

  return count
}
