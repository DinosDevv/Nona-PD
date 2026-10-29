import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getRunningSession, startSession, stopSession, type Session } from '../api/time'
import { useAuth } from '../lib/useAuth'
import { useToast } from '../lib/useToast'
import { SessionContext, type SessionApi } from '../lib/useSession'
import { isTyping, lastProject, rememberLastProject, sessionLabel } from '../lib/sessionView'
import { formatClock } from '../lib/timeView'
import { useNow } from '../hooks/useNow'
import { useRealtimeRefresh } from '../hooks/useRealtimeRefresh'
import Modal from './Modal'
import SessionLauncher from './SessionLauncher'
import SessionNoteModal from './SessionNoteModal'
import StillCodingCheck from './StillCodingCheck'

const BASE_TITLE = 'Nona Project Dashboard'

// "⏱ 0:42:13 · School CRM" in the browser tab while a session runs. Ticks on its own,
// so the rest of the app doesn't re-render every second.
function TabTitle({ running }: { running: Session | null }) {
  const now = useNow(!!running)
  useEffect(() => {
    document.title = running
      ? `⏱ ${formatClock(now - Date.parse(running.started_at))} · ${sessionLabel(running)}`
      : BASE_TITLE
  }, [running, now])
  useEffect(() => () => {
    document.title = BASE_TITLE
  }, [])
  return null
}

export default function SessionProvider({ children }: { children: ReactNode }) {
  const { session: auth } = useAuth()
  const toast = useToast()
  const userId = auth!.user.id
  const [running, setRunning] = useState<Session | null>(null)
  const [version, setVersion] = useState(0)
  const reload = useCallback(() => setVersion((v) => v + 1), [])
  const [launcherOpen, setLauncherOpen] = useState(false)
  const [justStopped, setJustStopped] = useState<{ id: string; ms: number; label: string } | null>(null)

  useEffect(() => {
    let ignore = false
    getRunningSession(userId)
      .then((data) => !ignore && setRunning(data))
      .catch(() => {
        // keeps the last known state
      })
    return () => {
      ignore = true
    }
  }, [userId, version])

  useRealtimeRefresh('session:mine', [{ table: 'time_entries', filter: `user_id=eq.${userId}` }], reload)

  const start = useCallback(
    async (projectId: string, todoId?: string | null) => {
      try {
        await startSession(projectId, todoId)
        rememberLastProject(projectId)
        reload()
        toast.success('Session started')
      } catch (e) {
        toast.error((e as Error).message)
      }
    },
    [reload, toast],
  )

  const stop = useCallback(
    async (at?: Date) => {
      if (!running) return
      try {
        const label = sessionLabel(running)
        const ms = (at?.getTime() ?? Date.now()) - Date.parse(running.started_at)
        const id = await stopSession(at)
        reload()
        if (id) setJustStopped({ id, ms, label })
        else toast.show('Under a minute — session discarded')
      } catch (e) {
        toast.error((e as Error).message)
      }
    },
    [running, reload, toast],
  )

  // Alt+S: stop if running, otherwise start on the last project (or pick one)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey || e.code !== 'KeyS' || isTyping(e.target)) return
      e.preventDefault()
      const last = lastProject()
      if (running) stop()
      else if (last) start(last)
      else setLauncherOpen(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [running, start, stop])

  const api = useMemo<SessionApi>(
    () => ({ running, start, stop, openLauncher: () => setLauncherOpen(true) }),
    [running, start, stop],
  )

  return (
    <SessionContext.Provider value={api}>
      {children}
      <TabTitle running={running} />
      <StillCodingCheck running={running} onStop={stop} />
      {launcherOpen && (
        <Modal title="Start a session" description="Pick a project; a to-do is optional." onClose={() => setLauncherOpen(false)}>
          <SessionLauncher onStarted={() => setLauncherOpen(false)} />
        </Modal>
      )}
      {justStopped && (
        <SessionNoteModal
          sessionId={justStopped.id}
          durationMs={justStopped.ms}
          label={justStopped.label}
          onClose={() => setJustStopped(null)}
        />
      )}
    </SessionContext.Provider>
  )
}
