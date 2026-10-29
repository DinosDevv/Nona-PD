import { createContext, useContext } from 'react'
import type { Session } from '../api/time'

export type SessionApi = {
  running: Session | null
  start: (projectId: string, todoId?: string | null) => Promise<void>
  stop: (at?: Date) => Promise<void>
  openLauncher: () => void
}

export const SessionContext = createContext<SessionApi>({
  running: null,
  start: async () => {},
  stop: async () => {},
  openLauncher: () => {},
})

// The one place every start/stop goes through (sidebar, Today, to-do timers, Alt+S)
export function useSession() {
  return useContext(SessionContext)
}
