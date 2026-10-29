// Helpers for coding sessions: tags, last-used project, streaks, heatmap, CSV.
// Display/derivation only — no fetching here.
import type { Session } from '../api/time'
import { dayKey, splitByDay } from './historyView'

export const SESSION_TAGS = ['feature', 'bugfix', 'refactor', 'learning', 'review', 'docs'] as const

export const STREAK_MIN_MS = 15 * 60_000
export const STILL_CODING_MS = 3 * 60 * 60_000

const LAST_PROJECT_KEY = 'nona:last-project'

export function lastProject(): string | null {
  try {
    return localStorage.getItem(LAST_PROJECT_KEY)
  } catch {
    return null
  }
}

export function rememberLastProject(projectId: string) {
  try {
    localStorage.setItem(LAST_PROJECT_KEY, projectId)
  } catch {
    // not critical
  }
}

// Don't hijack shortcuts while someone is typing
export function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null
  return !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))
}

export function sessionLabel(s: Pick<Session, 'todos' | 'projects'>) {
  return s.todos?.title ?? s.projects?.name ?? 'Session'
}

// Total ms per local day, for any set of sessions
export function msByDay(sessions: Session[], now = Date.now()) {
  const totals = new Map<string, number>()
  for (const s of sessions) {
    for (const part of splitByDay(s, now)) totals.set(part.key, (totals.get(part.key) ?? 0) + part.ms)
  }
  return totals
}

// Days in a row with at least 15 minutes. Today only counts once it qualifies,
// so the streak doesn't drop to zero at midnight.
export function streakDays(sessions: Session[], now = Date.now()) {
  const totals = msByDay(sessions, now)
  const day = new Date(now)
  if ((totals.get(dayKey(day)) ?? 0) < STREAK_MIN_MS) day.setDate(day.getDate() - 1)
  let streak = 0
  while ((totals.get(dayKey(day)) ?? 0) >= STREAK_MIN_MS) {
    streak++
    day.setDate(day.getDate() - 1)
  }
  return streak
}

// Sessions overlapping a given local day, newest first
export function sessionsOn(sessions: Session[], key: string, now = Date.now()) {
  return sessions
    .filter((s) => splitByDay(s, now).some((p) => p.key === key))
    .sort((a, b) => b.started_at.localeCompare(a.started_at))
}

// Minutes coded per weekday (0 = Monday) × hour, for the heatmap
export function hourMatrix(sessions: Session[], since: Date, now = Date.now()) {
  const grid = Array.from({ length: 7 }, () => Array<number>(24).fill(0))
  for (const s of sessions) {
    let start = Math.max(Date.parse(s.started_at), since.getTime())
    const end = s.ended_at ? Date.parse(s.ended_at) : now
    while (start < end) {
      const d = new Date(start)
      const nextHour = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours() + 1).getTime()
      const sliceEnd = Math.min(end, nextHour)
      grid[(d.getDay() + 6) % 7][d.getHours()] += sliceEnd - start
      start = sliceEnd
    }
  }
  return grid
}

export function timeOfDay(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// Fixed 24h "13:05" for exports, whatever the system locale
function hhmm(iso: string) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function csvCell(value: string) {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

export function sessionsToCsv(sessions: Session[], now = Date.now()) {
  const header = ['date', 'start', 'end', 'minutes', 'project', 'todo', 'note', 'tags']
  const rows = [...sessions]
    .sort((a, b) => a.started_at.localeCompare(b.started_at))
    .map((s) => {
      const end = s.ended_at ? Date.parse(s.ended_at) : now
      return [
        dayKey(new Date(s.started_at)),
        hhmm(s.started_at),
        s.ended_at ? hhmm(s.ended_at) : 'running',
        String(Math.round((end - Date.parse(s.started_at)) / 60_000)),
        s.projects?.name ?? '',
        s.todos?.title ?? '',
        s.note ?? '',
        s.tags.join(' '),
      ]
    })
  return [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\n')
}

export function downloadText(filename: string, text: string, type = 'text/csv') {
  const url = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
