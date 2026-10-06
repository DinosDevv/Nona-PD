import type { TimeEntry } from '../api/time'
import { useNow } from '../hooks/useNow'
import { formatClock, formatDuration, timeByUser } from '../lib/timeView'
import { shortName } from '../lib/people'
import Avatar from './Avatar'
import { ClockIcon, PlayIcon, StopIcon } from './icons'

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
  const people = timeByUser(entries, now)
  const total = people.reduce((sum, p) => sum + p.ms, 0)
  const myTotal = people.find((p) => p.userId === currentUserId)?.ms ?? 0
  const othersTracking = people.filter((p) => p.running && p.userId !== currentUserId)

  const label = mine ? 'Tracking now' : canTrack ? 'Start tracking' : 'Time on this task'
  const readout = mine
    ? formatClock(now - Date.parse(mine.started_at))
    : formatDuration(canTrack ? myTotal : total)

  return (
    <section className={`timer-card${mine ? ' timer-card--running' : ''}`}>
      <div className="timer-card__main">
        {canTrack ? (
          <button
            type="button"
            className="timer-card__button"
            onClick={mine ? onStop : onStart}
            title={mine ? 'Stop timer' : 'Start timer'}
            aria-label={mine ? 'Stop timer' : 'Start timer'}
          >
            {mine ? <StopIcon /> : <PlayIcon />}
          </button>
        ) : (
          <span className="timer-card__button timer-card__button--idle" aria-hidden="true">
            <ClockIcon />
          </span>
        )}
        <div className="timer-card__readout">
          <span className="timer-card__label">{label}</span>
          <span className="timer-card__clock">{readout}</span>
          <span className="timer-card__sub">
            Team total {formatDuration(total)}
            {people.length > 0 && ` · ${people.length} ${people.length === 1 ? 'person' : 'people'}`}
          </span>
        </div>
      </div>

      {othersTracking.length > 0 && (
        <p className="timer-card__others">
          <span className="timer-dot" />
          {othersTracking.map((p) => shortName(memberName(p.userId))).join(', ')}{' '}
          {othersTracking.length === 1 ? 'is' : 'are'} tracking now
        </p>
      )}

      {people.length > 0 && (
        <ul className="person-list timer-card__people">
          {people.map((p) => (
            <li key={p.userId}>
              <span className="person">
                <Avatar name={memberName(p.userId)} seed={p.userId} size={22} />
                {shortName(memberName(p.userId))}
                {p.running && <span className="timer-dot" title="Tracking now" />}
              </span>
              <span className="timer-card__time">{formatDuration(p.ms)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
