import { Link } from 'react-router-dom'
import { useSession } from '../lib/useSession'
import { useNow } from '../hooks/useNow'
import { formatClock } from '../lib/timeView'
import { sessionLabel } from '../lib/sessionView'
import { PlayIcon, StopIcon } from './icons'

// Running session in the sidebar / top bar — or a start button when nothing runs
export default function RunningTimerPill() {
  const { running, stop, openLauncher } = useSession()
  const now = useNow(!!running)

  if (!running) {
    return (
      <button type="button" className="start-session" onClick={openLauncher} title="Start a session (Alt+S)">
        <PlayIcon />
        <span>Start session</span>
      </button>
    )
  }

  const to = running.todo_id
    ? `/dashboard/project/${running.project_id}?todo=${running.todo_id}`
    : `/dashboard/project/${running.project_id}`

  return (
    <div className="running-timer">
      <Link to={to} className="running-timer__link">
        <span className="timer-dot" />
        <span className="running-timer__clock">{formatClock(now - Date.parse(running.started_at))}</span>
        <span className="running-timer__title">{sessionLabel(running)}</span>
      </Link>
      <button type="button" className="icon-button" title="Stop (Alt+S)" aria-label="Stop session" onClick={() => stop()}>
        <StopIcon />
      </button>
    </div>
  )
}
