import { Link } from 'react-router-dom'
import { useRunningTimer } from '../hooks/useRunningTimer'
import { useNow } from '../hooks/useNow'
import { formatClock } from '../lib/timeView'
import { StopIcon } from './icons'

export default function RunningTimerPill() {
  const { timer, stop } = useRunningTimer()
  const now = useNow(!!timer)
  if (!timer?.todos) return null

  return (
    <div className="running-timer">
      <Link to={`/dashboard/project/${timer.todos.project_id}?todo=${timer.todo_id}`} className="running-timer__link">
        <span className="timer-dot" />
        <span className="running-timer__clock">{formatClock(now - Date.parse(timer.started_at))}</span>
        <span className="running-timer__title">{timer.todos.title}</span>
      </Link>
      <button type="button" className="icon-button" title="Stop timer" aria-label="Stop timer" onClick={stop}>
        <StopIcon />
      </button>
    </div>
  )
}
