import type { Session } from '../api/time'
import { colorFor } from '../lib/people'
import { timeOfDay } from '../lib/sessionView'
import { entryMs, formatDuration } from '../lib/timeView'
import './Session.css'

type Props = {
  sessions: Session[]
  now: number
  empty?: string
}

// A day's sessions: time range, duration, project · to-do, note and tags
export default function SessionList({ sessions, now, empty = 'No sessions.' }: Props) {
  if (sessions.length === 0) return <p className="muted small">{empty}</p>

  return (
    <ul className="session-list">
      {sessions.map((s) => (
        <li key={s.id} className={s.ended_at ? undefined : 'session-list__running'}>
          <span className="session-list__time">
            {timeOfDay(s.started_at)}–{s.ended_at ? timeOfDay(s.ended_at) : 'now'}
          </span>
          <span className="session-list__duration">
            {!s.ended_at && <span className="timer-dot" />}
            {formatDuration(entryMs(s, now))}
          </span>
          <div className="session-list__body">
            <span className="session-list__what">
              <span className="session-list__dot" style={{ background: colorFor(s.project_id) }} />
              <strong>{s.projects?.name ?? 'Project'}</strong>
              {s.todos && <span className="muted"> · {s.todos.title}</span>}
            </span>
            {s.note && <p className="session-list__note">{s.note}</p>}
            {s.tags.length > 0 && (
              <span className="session-list__tags">
                {s.tags.map((t) => (
                  <span key={t} className="tag-chip tag-chip--static">#{t}</span>
                ))}
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
