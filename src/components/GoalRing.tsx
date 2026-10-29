import { useState, type FormEvent } from 'react'
import { formatDuration } from '../lib/timeView'
import { CheckIcon, PencilIcon } from './icons'

type Props = {
  ms: number
  goalMs: number
  onSetGoal: (minutes: number) => Promise<boolean>
}

const R = 42
const CIRCUMFERENCE = 2 * Math.PI * R

export default function GoalRing({ ms, goalMs, onSetGoal }: Props) {
  const [editing, setEditing] = useState(false)
  const [hours, setHours] = useState(String(goalMs / 3_600_000))
  const progress = goalMs > 0 ? Math.min(ms / goalMs, 1) : 0
  const reached = goalMs > 0 && ms >= goalMs

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    const minutes = Math.round(Number(hours) * 60)
    if (await onSetGoal(minutes)) setEditing(false)
  }

  return (
    <section className={`card today-card goal${reached ? ' goal--reached' : ''}`}>
      <div className="goal__ring">
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle className="goal__track" cx="50" cy="50" r={R} />
          <circle
            className="goal__fill"
            cx="50"
            cy="50"
            r={R}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
          />
        </svg>
        <div className="goal__center">
          <strong>{formatDuration(ms)}</strong>
          <span className="muted small">{Math.round(progress * 100)}%</span>
        </div>
      </div>

      <div className="goal__text">
        <span className="today-card__label">Daily goal</span>
        {editing ? (
          <form className="goal__form" onSubmit={handleSave}>
            <input
              type="number"
              min="0"
              max="24"
              step="0.5"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              aria-label="Daily goal in hours"
              autoFocus
            />
            <span className="muted small">hours</span>
            <button type="submit" className="icon-button" aria-label="Save goal" title="Save">
              <CheckIcon />
            </button>
          </form>
        ) : (
          <span className="goal__value">
            {reached ? (
              <span className="goal__done"><CheckIcon /> Goal reached</span>
            ) : (
              <>of {formatDuration(goalMs)}</>
            )}
            <button
              type="button"
              className="icon-button"
              aria-label="Edit daily goal"
              title="Edit goal"
              onClick={() => {
                setHours(String(goalMs / 3_600_000))
                setEditing(true)
              }}
            >
              <PencilIcon />
            </button>
          </span>
        )}
      </div>
    </section>
  )
}
