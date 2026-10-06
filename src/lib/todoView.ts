// Display helpers for to-do lists: labels, overdue checks, filtering and sorting.
// They only work on data that's already loaded — no fetching here.
import type { Todo, TodoState } from '../api/todos'

export const STATE_LABELS: Record<TodoState, string> = {
  undone: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
}

export type StateFilter = 'all' | TodoState
export type SortKey = 'deadline' | 'newest' | 'title'

type Dated = { state: TodoState; deadline: string | null }

export const DUE_SOON_DAYS = 3

export function isOverdue(todo: Dated, now = new Date()) {
  return todo.state !== 'done' && todo.deadline !== null && new Date(todo.deadline) < now
}

export function isDueSoon(todo: Dated, now = new Date()) {
  if (todo.state === 'done' || !todo.deadline) return false
  const due = new Date(todo.deadline).getTime()
  return due >= now.getTime() && due <= now.getTime() + DUE_SOON_DAYS * 86_400_000
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

// "Today", "Tomorrow", "Yesterday", or "Oct 3"
export function dueLabel(deadline: string | null, now = new Date()) {
  if (!deadline) return 'No deadline'
  const due = new Date(deadline)
  const days = Math.round((startOfDay(due).getTime() - startOfDay(now).getTime()) / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days === -1) return 'Yesterday'
  return due.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
}

export function progressOf(todos: { state: TodoState }[]) {
  const done = todos.filter((t) => t.state === 'done').length
  return { done, total: todos.length, percent: todos.length ? Math.round((done / todos.length) * 100) : 0 }
}

export function filterAndSort(todos: Todo[], filter: StateFilter, search: string, sort: SortKey) {
  const q = search.trim().toLowerCase()
  const filtered = todos.filter(
    (t) =>
      (filter === 'all' || t.state === filter) &&
      (!q || t.title.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q)),
  )
  return [...filtered].sort((a, b) => {
    if (sort === 'title') return a.title.localeCompare(b.title)
    if (sort === 'newest') return b.created_at.localeCompare(a.created_at)
    // deadline: soonest first, no deadline last
    if (!a.deadline) return b.deadline ? 1 : 0
    if (!b.deadline) return -1
    return a.deadline.localeCompare(b.deadline)
  })
}

// ISO timestamp -> value for <input type="datetime-local"> (local time, no offset)
export function toLocalInput(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// "just now", "5m ago", "3h ago", "2d ago", then a date
export function timeAgo(iso: string, now = new Date()) {
  const seconds = Math.round((now.getTime() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' })
}
