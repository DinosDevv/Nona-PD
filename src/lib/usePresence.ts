import { createContext, useContext } from 'react'

export type PresenceStatus = 'online' | 'away' | 'offline'

export const PresenceContext = createContext<Record<string, PresenceStatus>>({})

// Map of user id -> online / away; anyone missing is offline
export function usePresence() {
  const map = useContext(PresenceContext)
  return (userId: string): PresenceStatus => map[userId] ?? 'offline'
}

export const PRESENCE_LABELS: Record<PresenceStatus, string> = {
  online: 'Online',
  away: 'Away',
  offline: 'Offline',
}
