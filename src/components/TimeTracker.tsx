import type { TimeEntry } from '../api/time'
import { useNow } from '../hooks/useNow'
import { entryMs, formatClock, formatDuration, timeByUser } from '../lib/timeView'
import { shortName } from '../lib/people'
import Avatar from './Avatar'
import { PlayIcon, StopIcon } from './icons'

type Props = {
  entries: TimeEntry[]
  currentUserId: string
  canTrack: boolean
  memberName: (id: string) => string
  onStart: () => void
  onStop: () => void
}

export default function TimeTracker({ entries, currentUserId, canTrack, memberName, onStart, onStop }: Props) {
  const mine = entries.find((e) => e.user_id === currentUserId && !e.ended_at)
  const now = useNow(entries.some((e) => !e.ended_at))
  const total = entries.reduce((sum, e) => sum + entryMs(e, now), 0)

  return (
    <section className="stack time-tracker">
      <div className="time-tracker__head">
        <h3>Time</h3>
        <span className="time-tracker__total">{formatDuration(total)}</span>
      </div>

      {canTrack &&
        (mine ? (
          <button type="button" className="button--danger button--block" onClick={onStop}>
            <StopIcon /> Stop · {formatClock(now - Date.parse(mine.started_at))}
          </button>
        ) : (
          <button type="button" className="button--ghost button--block" onClick={onStart}>
            <PlayIcon /> Start timer
          </button>
        ))}

      {entries.length > 0 && (
        <ul className="person-list">
          {timeByUser(entries, now).map((u) => (
            <li key={u.userId}>
              <span className="person">
                <Avatar name={memberName(u.userId)} seed={u.userId} size={22} />
                {shortName(memberName(u.userId))}
                {u.running && <span className="timer-dot" title="Timer running" />}
              </span>
              <span className="muted small">{formatDuration(u.ms)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
