import { useSession } from '../lib/useSession'
import { useNow } from '../hooks/useNow'
import { formatClock } from '../lib/timeView'
import { timeOfDay } from '../lib/sessionView'
import SessionLauncher from './SessionLauncher'
import { StopIcon } from './icons'

// Big "what am I doing right now" card at the top of Today
export default function SessionHero() {
  const { running, stop } = useSession()
  const now = useNow(!!running)

  if (!running) {
    return (
      <section className="card today-card hero">
        <span className="today-card__label">Start coding</span>
        <SessionLauncher compact />
      </section>
    )
  }

  return (
    <section className="card today-card hero hero--running">
      <span className="today-card__label hero__label">
        <span className="timer-dot" /> Coding since {timeOfDay(running.started_at)}
      </span>
      <span className="hero__clock">{formatClock(now - Date.parse(running.started_at))}</span>
      <span className="hero__what">
        <strong>{running.projects?.name}</strong>
        {running.todos && <span className="muted"> · {running.todos.title}</span>}
      </span>
      <button type="button" className="hero__stop" onClick={() => stop()}>
        <StopIcon /> Stop session
      </button>
    </section>
  )
}
