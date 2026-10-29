import { useState } from 'react'
import type { Session } from '../api/time'
import { useNow } from '../hooks/useNow'
import { STILL_CODING_MS, sessionLabel, timeOfDay } from '../lib/sessionView'
import { toLocalInput } from '../lib/todoView'
import { formatDuration } from '../lib/timeView'
import Modal from './Modal'
import './Session.css'

type Props = {
  running: Session | null
  onStop: (at?: Date) => Promise<void>
}

// After 3h, asks whether you're still coding (catches forgotten timers)
export default function StillCodingCheck({ running, onStop }: Props) {
  const now = useNow(!!running, 15_000)
  // Snooze per session: don't ask again before this moment
  const [snooze, setSnooze] = useState<{ id: string; until: number } | null>(null)
  const [stopAt, setStopAt] = useState('')

  if (!running) return null
  const started = Date.parse(running.started_at)
  const elapsed = now - started
  const snoozed = snooze?.id === running.id && now < snooze.until
  if (elapsed < STILL_CODING_MS || snoozed) return null

  const defaultStop = toLocalInput(new Date(started + STILL_CODING_MS).toISOString())

  return (
    <Modal
      title="Still coding?"
      description={`You've been tracking ${sessionLabel(running)} for ${formatDuration(elapsed)} (since ${timeOfDay(running.started_at)}).`}
      onClose={() => setSnooze({ id: running.id, until: Date.now() + 60 * 60_000 })}
    >
      <div className="stack">
        <button type="button" onClick={() => setSnooze({ id: running.id, until: Date.now() + 60 * 60_000 })}>
          Keep going
        </button>
        <button type="button" className="button--ghost" onClick={() => onStop()}>
          Stop now
        </button>
        <form
          className="still-coding__earlier"
          onSubmit={(e) => {
            e.preventDefault()
            onStop(new Date(stopAt || defaultStop))
          }}
        >
          <label className="field">
            I stopped earlier, at
            <input
              type="datetime-local"
              value={stopAt || defaultStop}
              min={toLocalInput(running.started_at)}
              onChange={(e) => setStopAt(e.target.value)}
            />
          </label>
          <button type="submit" className="button--ghost">Stop at that time</button>
        </form>
      </div>
    </Modal>
  )
}
