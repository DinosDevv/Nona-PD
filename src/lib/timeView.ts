import type { TimeEntry } from '../api/time'

export function entryMs(e: { started_at: string; ended_at: string | null }, now = Date.now()) {
  return (e.ended_at ? Date.parse(e.ended_at) : now) - Date.parse(e.started_at)
}

// "2h 05m", "45m", "<1m", "0m"
export function formatDuration(ms: number) {
  if (ms <= 0) return '0m'
  const minutes = Math.floor(ms / 60_000)
  if (minutes < 1) return '<1m'
  const hours = Math.floor(minutes / 60)
  return hours ? `${hours}h ${String(minutes % 60).padStart(2, '0')}m` : `${minutes}m`
}

// "1:02:03" for a running clock
export function formatClock(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${Math.floor(total / 3600)}:${pad(Math.floor(total / 60) % 60)}:${pad(total % 60)}`
}

// Time per person on a set of entries, biggest first
export function timeByUser(entries: TimeEntry[], now = Date.now()) {
  const totals = new Map<string, { ms: number; running: boolean }>()
  for (const e of entries) {
    const t = totals.get(e.user_id) ?? { ms: 0, running: false }
    totals.set(e.user_id, { ms: t.ms + entryMs(e, now), running: t.running || !e.ended_at })
  }
  return [...totals].map(([userId, t]) => ({ userId, ...t })).sort((a, b) => b.ms - a.ms)
}
