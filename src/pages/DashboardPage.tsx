import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useProjects } from '../hooks/useProjects'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { projects, error, create } = useProjects()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    const project = await create(name, description)
    if (project) navigate(`/dashboard/project/${project.id}`)
  }

  return (
    <div className="stack">
      <h1>Projects</h1>
      {error && <p className="error">{error}</p>}

      {projects === null ? (
        <p className="muted">Loading…</p>
      ) : projects.length === 0 ? (
        <p className="muted">You're not in any projects yet.</p>
      ) : (
        <ul className="grid">
          {projects.map((p) => (
            <li key={p.id}>
              <Link to={`/dashboard/project/${p.id}`} className="card card--link">
                <strong>{p.name}</strong>
                {p.description && <p className="muted">{p.description}</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <form className="card stack" onSubmit={handleCreate} style={{ maxWidth: 420 }}>
        <h2>New project</h2>
        <label className="field">
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="field">
          Description
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        </label>
        <button type="submit">Create project</button>
      </form>
    </div>
  )
}
