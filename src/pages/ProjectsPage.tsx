import { useState } from 'react'
import { useProjects } from '../hooks/useProjects'
import type { ProjectStatus } from '../api/projects'
import { PROJECT_STATUS_LABELS } from '../lib/projectView'
import ProjectRow from '../components/ProjectRow'
import './ProjectsPage.css'

type Filter = 'all' | ProjectStatus

const FILTERS: Filter[] = ['all', 'active', 'planned', 'on_hold', 'completed']

export default function ProjectsPage() {
  const { projects, error } = useProjects()
  const [filter, setFilter] = useState<Filter>('all')

  const all = projects ?? []
  const count = (f: Filter) => (f === 'all' ? all.length : all.filter((p) => p.status === f).length)
  const shown = filter === 'all' ? all : all.filter((p) => p.status === filter)

  return (
    <div className="projects-page">
      <div>
        <h1>Projects</h1>
        <p className="muted">Every project you're a member of, including completed ones.</p>
      </div>
      {error && <p className="error">{error}</p>}

      <div className="segmented" role="group" aria-label="Filter by status">
        {FILTERS.map((f) => (
          <button key={f} aria-pressed={filter === f} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : PROJECT_STATUS_LABELS[f]} ({count(f)})
          </button>
        ))}
      </div>

      {projects === null ? (
        <p className="muted">Loading…</p>
      ) : shown.length === 0 ? (
        <p className="muted">No projects here.</p>
      ) : (
        <ul className="project-list">
          {shown.map((p) => (
            <ProjectRow key={p.id} project={p} />
          ))}
        </ul>
      )}
    </div>
  )
}
