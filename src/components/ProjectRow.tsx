import { Link } from 'react-router-dom'
import type { ProjectSummary } from '../api/projects'
import { progressOf } from '../lib/todoView'
import { PROJECT_STATUS_LABELS, hasRunningTimer, projectManager, projectTimeMs } from '../lib/projectView'
import { formatDuration } from '../lib/timeView'
import { useNow } from '../hooks/useNow'
import { shortName } from '../lib/people'
import Avatar from './Avatar'
import { ChevronRightIcon, ClockIcon } from './icons'
import './ProjectRow.css'

export default function ProjectRow({ project: p }: { project: ProjectSummary }) {
  const progress = progressOf(p.todos)
  const pm = projectManager(p)
  const tracking = hasRunningTimer(p)
  const now = useNow(tracking)

  return (
    <li>
      <Link to={`/dashboard/project/${p.id}`} className="project-row">
        <Avatar name={p.name} seed={p.id} size={44} square />
        <div className="project-row__text">
          <strong>{p.name}</strong>
          {p.description && <span className="muted small">{p.description}</span>}
        </div>
        <div className="project-row__progress">
          <span className="muted small project-row__meta">
            {progress.done}/{progress.total} done ·{' '}
            <span className="project-row__time" title="Time tracked">
              <ClockIcon /> {formatDuration(projectTimeMs(p, now))}
              {tracking && <span className="timer-dot" title="Someone is tracking time now" />}
            </span>
          </span>
          <div className="progress">
            <div className="progress__bar" style={{ width: `${progress.percent}%` }} />
          </div>
        </div>
        <span className="project-row__status">
          <span className={`badge badge--project-${p.status}`}>{PROJECT_STATUS_LABELS[p.status]}</span>
        </span>
        {pm && (
          <div className="project-row__pm">
            <Avatar name={pm.name} seed={pm.id} size={30} />
            <div className="project-row__pm-text">
              <span className="muted small">PM</span>
              <span className="small">{shortName(pm.name)}</span>
            </div>
          </div>
        )}
        <span className="project-row__chevron"><ChevronRightIcon /></span>
      </Link>
    </li>
  )
}
