import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../hooks/useNotifications'
import type { Notification } from '../api/notifications'
import { timeAgo } from '../lib/todoView'
import { shortName } from '../lib/people'
import Avatar from '../components/Avatar'
import {
  AlertIcon,
  ArrowUpRightIcon,
  CheckIcon,
  ClockIcon,
  FolderIcon,
  NotesIcon,
  UserPlusIcon,
  XIcon,
} from '../components/icons'
import './NotificationsPage.css'

type Filter = 'all' | 'unread' | 'requests' | 'tasks'

type Data = { todo_title?: string; project_name?: string; message?: string; approved?: boolean; deadline?: string }

const TASK_TYPES = ['assigned', 'todo_done', 'note_added', 'deadline_soon']

function content(n: Notification): { icon: ReactNode; tone: string; text: ReactNode } {
  const d = n.data as Data
  const actor = <strong>{shortName(n.actor?.full_name ?? 'Someone')}</strong>
  const todo = <strong>{d.todo_title}</strong>
  switch (n.type) {
    case 'assigned':
      return { icon: <UserPlusIcon />, tone: 'blue', text: <>{actor} assigned you to {todo}</> }
    case 'request_new':
      return { icon: <UserPlusIcon />, tone: 'blue', text: <>{actor} requested to work on {todo}</> }
    case 'request_resolved':
      return d.approved
        ? { icon: <CheckIcon />, tone: 'green', text: <>{actor} approved your request for {todo}</> }
        : { icon: <XIcon />, tone: 'red', text: <>{actor} rejected your request for {todo}</> }
    case 'todo_done':
      return { icon: <CheckIcon />, tone: 'green', text: <>{actor} completed {todo}</> }
    case 'note_added':
      return { icon: <NotesIcon />, tone: 'blue', text: <>{actor} added a note to {todo}</> }
    case 'added_to_project':
      return { icon: <FolderIcon />, tone: 'blue', text: <>{actor} added you to <strong>{d.project_name}</strong></> }
    case 'deadline_soon': {
      const overdue = d.deadline ? new Date(d.deadline) < new Date() : false
      return overdue
        ? { icon: <AlertIcon />, tone: 'red', text: <>{todo} is overdue</> }
        : { icon: <ClockIcon />, tone: 'orange', text: <>Your deadline is approaching: {todo}</> }
    }
    default:
      return { icon: <AlertIcon />, tone: 'blue', text: <>{n.type}</> }
  }
}

export default function NotificationsPage() {
  const navigate = useNavigate()
  const { items, error, markRead, markAllRead, resolve } = useNotifications()
  const [filter, setFilter] = useState<Filter>('all')

  const all = items ?? []
  const matches = (n: Notification, f: Filter) =>
    f === 'all' ||
    (f === 'unread' && !n.read_at) ||
    (f === 'requests' && n.type.startsWith('request')) ||
    (f === 'tasks' && TASK_TYPES.includes(n.type))
  const shown = all.filter((n) => matches(n, filter))
  const unread = all.filter((n) => !n.read_at).length

  function open(n: Notification) {
    if (!n.read_at) markRead(n.id)
    if (n.project_id) navigate(`/dashboard/project/${n.project_id}${n.todo_id ? `?todo=${n.todo_id}` : ''}`)
  }

  const filters: { value: Filter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'unread', label: `Unread (${unread})` },
    { value: 'requests', label: 'Requests' },
    { value: 'tasks', label: 'Tasks' },
  ]

  return (
    <div className="notifications">
      <div className="page-header">
        <div>
          <h1>Notifications</h1>
          <p className="muted">What's happened in your projects.</p>
        </div>
        <button className="button--ghost" onClick={markAllRead} disabled={unread === 0}>
          Mark all as read
        </button>
      </div>
      {error && <p className="error">{error}</p>}

      <div className="segmented" role="group" aria-label="Filter notifications">
        {filters.map((f) => (
          <button key={f.value} aria-pressed={filter === f.value} onClick={() => setFilter(f.value)}>
            {f.label}
          </button>
        ))}
      </div>

      {items === null ? (
        <p className="muted">Loading…</p>
      ) : shown.length === 0 ? (
        <p className="muted">You're all caught up.</p>
      ) : (
        <ul className="notification-list card">
          {shown.map((n) => {
            const c = content(n)
            const pendingRequest = n.type === 'request_new' && n.request_id && n.assignment_requests?.status === 'pending'
            const handledRequest = n.type === 'request_new' && !pendingRequest
            return (
              <li key={n.id} className={n.read_at ? undefined : 'notification--unread'}>
                <span className={`notification__icon notification__icon--${c.tone}`}>{c.icon}</span>
                {n.actor && <Avatar name={n.actor.full_name} seed={n.actor_id ?? undefined} size={28} />}
                <div className="notification__body">
                  <p>{c.text}</p>
                  <span className="muted small">
                    {n.projects?.name && `${n.projects.name} · `}
                    {timeAgo(n.created_at)}
                    {handledRequest && ' · handled'}
                  </span>
                  {n.type === 'request_new' && (n.data as Data).message && (
                    <q className="request-message">{(n.data as Data).message}</q>
                  )}
                  {pendingRequest && (
                    <div className="row notification__actions">
                      <button
                        className="button--approve"
                        onClick={() => {
                          resolve(n.request_id!, true)
                          if (!n.read_at) markRead(n.id)
                        }}
                      >
                        <CheckIcon /> Approve
                      </button>
                      <button
                        className="button--danger"
                        onClick={() => {
                          resolve(n.request_id!, false)
                          if (!n.read_at) markRead(n.id)
                        }}
                      >
                        <XIcon /> Reject
                      </button>
                    </div>
                  )}
                </div>
                {n.project_id && (
                  <button type="button" className="icon-button" title="Open" aria-label="Open" onClick={() => open(n)}>
                    <ArrowUpRightIcon />
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
