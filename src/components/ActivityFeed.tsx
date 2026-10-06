import type { ActivityEntry } from '../api/activity'
import { STATE_LABELS, timeAgo } from '../lib/todoView'
import { PROJECT_STATUS_LABELS } from '../lib/projectView'
import { shortName } from '../lib/people'
import type { ProjectStatus } from '../api/projects'
import type { TodoState } from '../api/todos'
import Avatar from './Avatar'

type Data = {
  todo_title?: string
  user_name?: string
  file_name?: string
  from?: string
  to?: string
  role?: string
  approved?: boolean
  idea_title?: string
}

// "moved Create API routes → In Progress"
function describe(entry: ActivityEntry) {
  const d = entry.data as Data
  const todo = <strong>{d.todo_title}</strong>
  const user = <strong>{d.user_name ? shortName(d.user_name) : 'someone'}</strong>
  switch (entry.type) {
    case 'project_created':
      return <>created the project</>
    case 'project_status':
      return <>changed the project status to <strong>{PROJECT_STATUS_LABELS[d.to as ProjectStatus] ?? d.to}</strong></>
    case 'todo_created':
      return <>created {todo}</>
    case 'todo_edited':
      return <>edited {todo}</>
    case 'todo_deleted':
      return <>deleted {todo}</>
    case 'todo_state':
      return <>moved {todo} → <strong>{STATE_LABELS[d.to as TodoState] ?? d.to}</strong></>
    case 'assigned':
      return <>assigned {user} to {todo}</>
    case 'unassigned':
      return <>removed {user} from {todo}</>
    case 'request_new':
      return <>requested to work on {todo}</>
    case 'request_resolved':
      return <>{d.approved ? 'approved' : 'rejected'} {user}'s request for {todo}</>
    case 'note_added':
      return <>added a note to {todo}</>
    case 'member_added':
      return <>added {user} to the project</>
    case 'member_removed':
      return <>removed {user} from the project</>
    case 'role_changed':
      return <>made {user} {d.role === 'manager' ? 'a PM' : 'a contributor'}</>
    case 'idea_added':
      return <>added the idea <strong>{d.idea_title}</strong></>
    case 'idea_converted':
      return <>turned the idea <strong>{d.idea_title}</strong> into a task</>
    case 'file_uploaded':
      return <>uploaded <strong>{d.file_name}</strong></>
    case 'file_deleted':
      return <>deleted <strong>{d.file_name}</strong></>
    default:
      return <>{entry.type.replace(/_/g, ' ')}</>
  }
}

export default function ActivityFeed({ entries }: { entries: ActivityEntry[] | null }) {
  if (entries === null) return <p className="muted">Loading…</p>
  if (entries.length === 0) return <p className="muted">No activity yet.</p>

  return (
    <ul className="activity-feed card">
      {entries.map((e) => {
        const actor = e.profiles?.full_name ?? 'Someone'
        return (
          <li key={e.id}>
            <Avatar name={actor} seed={e.actor_id ?? actor} size={28} />
            <p>
              <strong>{shortName(actor)}</strong> {describe(e)}
            </p>
            <span className="muted small">{timeAgo(e.created_at)}</span>
          </li>
        )
      })}
    </ul>
  )
}
