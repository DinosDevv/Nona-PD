import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useProjects } from '../hooks/useProjects'
import ProjectRow from '../components/ProjectRow'
import Modal from '../components/Modal'
import StatTiles from '../components/StatTiles'
import { PlusIcon } from '../components/icons'
import { hasRunningTimer, projectTimeMs, statusCounts } from '../lib/projectView'
import { formatDuration } from '../lib/timeView'
import { useNow } from '../hooks/useNow'
import { firstName } from '../lib/people'
import { useMyProfile } from '../hooks/useMyProfile'
import './DashboardPage.css'

function greeting(now = new Date()) {
  const h = now.getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { projects, error, create } = useProjects()
  const { profile } = useMyProfile()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  // Completed projects live on the Projects page
  const activeProjects = (projects ?? []).filter((p) => p.status !== 'completed')
  const completedCount = (projects ?? []).length - activeProjects.length
  const tracking = (projects ?? []).some(hasRunningTimer)
  const now = useNow(tracking)
  const totalTime = (projects ?? []).reduce((sum, p) => sum + projectTimeMs(p, now), 0)

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    const project = await create(name, description)
    if (project) navigate(`/dashboard/project/${project.id}`)
  }

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1>{greeting()}{profile ? `, ${firstName(profile.full_name)}` : ''} 👋</h1>
          <p className="muted">Here's what's happening with your projects.</p>
        </div>
        <button onClick={() => setShowForm(true)}>
          <PlusIcon /> New Project
        </button>
      </div>
      {error && <p className="error">{error}</p>}

      {projects && (
        <StatTiles {...statusCounts(projects)} timeTracked={formatDuration(totalTime)} tracking={tracking} />
      )}

      <section className="stack">
        <h2>Your Projects</h2>
        {projects === null ? (
          <p className="muted">Loading…</p>
        ) : activeProjects.length === 0 ? (
          <p className="muted">
            {projects.length === 0 ? "You're not in any projects yet." : 'No active projects.'}
          </p>
        ) : (
          <ul className="project-list">
            {activeProjects.map((p) => (
              <ProjectRow key={p.id} project={p} />
            ))}
          </ul>
        )}
        {completedCount > 0 && (
          <Link to="/dashboard/projects" className="muted small">
            {completedCount} completed project{completedCount === 1 ? '' : 's'} → Projects
          </Link>
        )}
      </section>

      {showForm && (
        <Modal title="New Project" description="You'll be its Project Manager." onClose={() => setShowForm(false)}>
          <form className="stack" onSubmit={handleCreate}>
            <label className="field">
              Name
              <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
            </label>
            <label className="field">
              Description
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </label>
            <div className="modal__actions">
              <button type="button" className="button--ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit">Create Project</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
