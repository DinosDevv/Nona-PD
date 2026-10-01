import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useProjects } from '../hooks/useProjects'
import Avatar from '../components/Avatar'
import Modal from '../components/Modal'
import { ChevronRightIcon, PlusIcon } from '../components/icons'
import { progressOf } from '../lib/todoView'
import { projectManager } from '../lib/projectView'
import { shortName } from '../lib/people'
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
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    const project = await create(name, description)
    if (project) navigate(`/dashboard/project/${project.id}`)
  }

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1>{greeting()} 👋</h1>
          <p className="muted">Here's what's happening with your projects.</p>
        </div>
        <button onClick={() => setShowForm(true)}>
          <PlusIcon /> New Project
        </button>
      </div>
      {error && <p className="error">{error}</p>}

      <section className="stack">
        <h2>Your Projects</h2>
        {projects === null ? (
          <p className="muted">Loading…</p>
        ) : projects.length === 0 ? (
          <p className="muted">You're not in any projects yet.</p>
        ) : (
          <ul className="project-list">
            {projects.map((p) => {
              const progress = progressOf(p.todos)
              const pm = projectManager(p)
              return (
                <li key={p.id}>
                  <Link to={`/dashboard/project/${p.id}`} className="project-row">
                    <Avatar name={p.name} seed={p.id} size={44} square />
                    <div className="project-row__text">
                      <strong>{p.name}</strong>
                      {p.description && <span className="muted small">{p.description}</span>}
                    </div>
                    <div className="project-row__progress">
                      <span className="muted small">{progress.done}/{progress.total} done</span>
                      <div className="progress">
                        <div className="progress__bar" style={{ width: `${progress.percent}%` }} />
                      </div>
                    </div>
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
            })}
          </ul>
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
