// Display helpers for the History page. They only work on already-loaded entries.
import type { Session } from '../api/time'

export type DayTotal = {
  key: string
  date: Date
  ms: number
  byProject: { id: string; name: string; ms: number }[]
}

export function dayKey(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// Splits an entry at local midnights, so a timer left running overnight counts toward each day
export function splitByDay(e: { started_at: string; ended_at: string | null }, now = Date.now()) {
  const parts: { key: string; ms: number }[] = []
  let start = Date.parse(e.started_at)
  const end = e.ended_at ? Date.parse(e.ended_at) : now
  while (start < end) {
    const s = new Date(start)
    const nextMidnight = new Date(s.getFullYear(), s.getMonth(), s.getDate() + 1).getTime()
    const sliceEnd = Math.min(end, nextMidnight)
    parts.push({ key: dayKey(s), ms: sliceEnd - start })
    start = sliceEnd
  }
  return parts
}

export function buildHistory(entries: Session[], days: number, now = Date.now()) {
  const today = new Date(now)
  const list: DayTotal[] = []
  const byKey = new Map<string, DayTotal>()
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i)
    const day: DayTotal = { key: dayKey(date), date, ms: 0, byProject: [] }
    list.push(day)
    byKey.set(day.key, day)
  }

  const projectTotals = new Map<string, { id: string; name: string; ms: number }>()
  for (const e of entries) {
    const project = e.projects
    if (!project) continue
    for (const part of splitByDay(e, now)) {
      const day = byKey.get(part.key)
      if (!day) continue // outside the range
      day.ms += part.ms
      const p = day.byProject.find((x) => x.id === project.id)
      if (p) p.ms += part.ms
      else day.byProject.push({ id: project.id, name: project.name, ms: part.ms })
      const t = projectTotals.get(project.id) ?? { id: project.id, name: project.name, ms: 0 }
      t.ms += part.ms
      projectTotals.set(project.id, t)
    }
  }
  for (const d of list) d.byProject.sort((a, b) => b.ms - a.ms)

  const totalMs = list.reduce((sum, d) => sum + d.ms, 0)
  return {
    days: list,
    projects: [...projectTotals.values()].sort((a, b) => b.ms - a.ms),
    totalMs,
    averageMs: totalMs / days,
    bestDay: list.reduce<DayTotal | null>((best, d) => (d.ms > (best?.ms ?? 0) ? d : best), null),
    activeDays: list.filter((d) => d.ms > 0).length,
  }
}

export function longDate(d: Date) {
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
}

// Weekday names for a week; every ~5th / ~15th date for longer ranges so labels don't overlap
export function barLabel(d: Date, index: number, days: number) {
  if (days <= 7) return d.toLocaleDateString([], { weekday: 'short' })
  const every = days <= 30 ? 5 : 15
  const fromEnd = days - 1 - index
  return fromEnd % every === 0 ? d.toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''
}
