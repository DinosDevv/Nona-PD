import { useState } from 'react'
import { useTimeHistory } from '../hooks/useTimeHistory'
import { barLabel, dayKey, longDate } from '../lib/historyView'
import { formatDuration } from '../lib/timeView'
import { colorFor } from '../lib/people'
import { downloadText, hourMatrix, sessionsOn, sessionsToCsv } from '../lib/sessionView'
import SessionList from '../components/SessionList'
import { DownloadIcon } from '../components/icons'
import './HistoryPage.css'
import './Heatmap.css'

const RANGES = [
  { days: 7, label: 'Last 7 days' },
  { days: 30, label: 'Last 30 days' },
  { days: 90, label: 'Last 90 days' },
]

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Weekday × hour, shaded by how much you coded in that slot over the range
function Heatmap({ grid }: { grid: number[][] }) {
  const max = Math.max(...grid.flat(), 1)
  return (
    <section className="card stack">
      <div className="today-section-head">
        <h2>When you code</h2>
        <span className="muted small">Darker = more time in that hour</span>
      </div>
      <div className="heatmap" role="table" aria-label="Time coded by weekday and hour">
        <span />
        {Array.from({ length: 24 }, (_, h) => (
          <span key={h} className="heatmap__hour">{h % 3 === 0 ? String(h).padStart(2, '0') : ''}</span>
        ))}
        {grid.map((row, d) => (
          <div key={d} className="heatmap__row" role="row">
            <span className="heatmap__day">{WEEKDAYS[d]}</span>
            {row.map((ms, h) => (
              <span
                key={h}
                className="heatmap__cell"
                role="cell"
                title={`${WEEKDAYS[d]} ${String(h).padStart(2, '0')}:00 — ${formatDuration(ms)}`}
                style={{ opacity: ms ? 0.18 + 0.82 * (ms / max) : undefined }}
                data-empty={ms ? undefined : ''}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}

export default function HistoryPage() {
  const [days, setDays] = useState(7)
  const { history, sessions, now, error } = useTimeHistory(days)
  const [selectedKey, setSelectedKey] = useState(() => dayKey(new Date()))

  return (
    <div className="history">
      <div className="page-header">
        <div>
          <h1>Time History</h1>
          <p className="muted">How much time you've tracked, day by day.</p>
        </div>
        <button
          className="button--ghost"
          disabled={!sessions?.length}
          onClick={() =>
            sessions &&
            downloadText(`nona-sessions-${dayKey(new Date(now))}.csv`, sessionsToCsv(sessions, now))
          }
        >
          <DownloadIcon /> Export CSV
        </button>
      </div>

      <div className="segmented" role="group" aria-label="Range">
        {RANGES.map((r) => (
          <button key={r.days} aria-pressed={days === r.days} onClick={() => setDays(r.days)}>
            {r.label}
          </button>
        ))}
      </div>

      {error && <p className="error">{error}</p>}

      {history === null ? (
        <p className="muted">Loading…</p>
      ) : (
        (() => {
          const todayKey = history.days[history.days.length - 1].key
          const max = Math.max(...history.days.map((d) => d.ms), 1)
          const selected = history.days.find((d) => d.key === selectedKey) ?? history.days[history.days.length - 1]

          return (
            <>
              <ul className="history__tiles">
                <li className="card stat-tile">
                  <span className="stat-tile__label">Total</span>
                  <span className="stat-tile__value">{formatDuration(history.totalMs)}</span>
                </li>
                <li className="card stat-tile">
                  <span className="stat-tile__label">Daily average</span>
                  <span className="stat-tile__value">{formatDuration(history.averageMs)}</span>
                </li>
                <li className="card stat-tile">
                  <span className="stat-tile__label">Best day</span>
                  <span className="stat-tile__value">{history.bestDay ? formatDuration(history.bestDay.ms) : '—'}</span>
                  {history.bestDay && <span className="muted small">{longDate(history.bestDay.date)}</span>}
                </li>
                <li className="card stat-tile">
                  <span className="stat-tile__label">Days tracked</span>
                  <span className="stat-tile__value">
                    {history.activeDays} <span className="muted history__of">of {days}</span>
                  </span>
                </li>
              </ul>

              <section className="card history__chart">
                <div className={`history__bars history__bars--${days}`} role="list" aria-label="Time per day">
                  {history.days.map((d, i) => {
                    const breakdown = d.byProject.map((p) => `${p.name} ${formatDuration(p.ms)}`).join(', ')
                    return (
                      <button
                        key={d.key}
                        type="button"
                        role="listitem"
                        className={`history__bar${d.key === selected.key ? ' is-selected' : ''}${d.key === todayKey ? ' is-today' : ''}`}
                        title={`${longDate(d.date)} — ${formatDuration(d.ms)}${breakdown ? ` (${breakdown})` : ''}`}
                        aria-label={`${longDate(d.date)}: ${formatDuration(d.ms)}`}
                        onClick={() => setSelectedKey(d.key)}
                      >
                        <span className="history__track">
                          <span className="history__stack" style={{ height: `${(d.ms / max) * 100}%` }}>
                            {d.byProject.map((p) => (
                              <span key={p.id} style={{ flexGrow: p.ms, background: colorFor(p.id) }} />
                            ))}
                          </span>
                        </span>
                        <span className="history__label">{barLabel(d.date, i, days)}</span>
                      </button>
                    )
                  })}
                </div>
              </section>

              <div className="history__columns">
                <section className="card stack">
                  <div className="history__day-head">
                    <h2>{selected.key === todayKey ? 'Today' : longDate(selected.date)}</h2>
                    <span className="history__day-total">{formatDuration(selected.ms)}</span>
                  </div>
                  {selected.byProject.length === 0 ? (
                    <p className="muted small">No time tracked on this day.</p>
                  ) : (
                    <ul className="history__rows">
                      {selected.byProject.map((p) => (
                        <li key={p.id}>
                          <span className="history__row-name">
                            <span className="history__dot" style={{ background: colorFor(p.id) }} />
                            {p.name}
                          </span>
                          <span className="history__row-time">{formatDuration(p.ms)}</span>
                          <span className="progress history__share">
                            <span
                              className="progress__bar"
                              style={{ width: `${(p.ms / selected.ms) * 100}%`, background: colorFor(p.id) }}
                            />
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <h3 className="history__sessions-head">Sessions</h3>
                  <SessionList
                    sessions={sessionsOn(sessions ?? [], selected.key, now)}
                    now={now}
                    empty="No sessions on this day."
                  />
                </section>

                <section className="card stack">
                  <h2>Projects in this range</h2>
                  {history.projects.length === 0 ? (
                    <p className="muted small">Start a timer on a to-do and it'll show up here.</p>
                  ) : (
                    <ul className="history__rows">
                      {history.projects.map((p) => (
                        <li key={p.id}>
                          <span className="history__row-name">
                            <span className="history__dot" style={{ background: colorFor(p.id) }} />
                            {p.name}
                          </span>
                          <span className="history__row-time">{formatDuration(p.ms)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>

              <Heatmap grid={hourMatrix(sessions ?? [], history.days[0].date, now)} />
            </>
          )
        })()
      )}
    </div>
  )
}
