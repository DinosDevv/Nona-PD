import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useProjects } from '../hooks/useProjects'
import { useToday } from '../hooks/useToday'
import ProjectRow from '../components/ProjectRow'
import Modal from '../components/Modal'
import StatTiles from '../components/StatTiles'
import SessionHero from '../components/SessionHero'
import GoalRing from '../components/GoalRing'
import SessionList from '../components/SessionList'
import { ChevronRightIcon, FlameIcon, PlusIcon } from '../components/icons'
import { hasRunningTimer, projectTimeMs, statusCounts } from '../lib/projectView'
import { formatDuration } from '../lib/timeView'
import { colorFor, firstName } from '../lib/people'
import { useNow } from '../hooks/useNow'
import { useMyProfile } from '../hooks/useMyProfile'
import './DashboardPage.css'
import './Today.css'

function greeting(now = new Date()) {
  const h = now.getHours()
  if (h < 5) return 'Coding late'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { projects, error, create } = useProjects()
  const { profile } = useMyProfile()
  const { today, now: todayNow, goalMs, setGoal } = useToday()
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

  const weekMax = Math.max(...(today?.week.days.map((d) => d.ms) ?? [0]), 1)

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1>{greeting(new Date(todayNow))}{profile ? `, ${firstName(profile.full_name)}` : ''} 👋</h1>
          <p className="muted">
            {new Date(todayNow).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>
      {error && <p className="error">{error}</p>}

      {/* Today: what you're doing, goal, streak */}
      <div className="today-grid">
        <SessionHero />
        <GoalRing ms={today?.todayMs ?? 0} goalMs={goalMs} onSetGoal={setGoal} />
        <section className={`card today-card streak${(today?.streak ?? 0) > 0 ? ' streak--on' : ''}`}>
          <span className="today-card__label">Streak</span>
          <span className="streak__value">
            <FlameIcon />
            {today?.streak ?? 0} {today?.streak === 1 ? 'day' : 'days'}
          </span>
          <span className="muted small">Days in a row with 15m+ of coding</span>
        </section>
      </div>

      <div className="today-columns">
        <section className="card stack">
          <div className="today-section-head">
            <h2>Today's sessions</h2>
            <span className="muted small">{formatDuration(today?.todayMs ?? 0)}</span>
          </div>
          {today === null ? (
            <p className="muted small">Loading…</p>
          ) : (
            <SessionList sessions={today.todaySessions} now={todayNow} empty="Nothing logged yet today." />
          )}
        </section>

        <section className="card stack">
          <div className="today-section-head">
            <h2>This week</h2>
            <Link to="/dashboard/history" className="muted small today-link">
              History <ChevronRightIcon />
            </Link>
          </div>
          <div className="week-strip" aria-label="Time per day this week">
            {today?.week.days.map((d, i) => (
              <div key={d.key} className={`week-strip__day${i === 6 ? ' is-today' : ''}`} title={formatDuration(d.ms)}>
                <span className="week-strip__track">
                  <span className="week-strip__stack" style={{ height: `${(d.ms / weekMax) * 100}%` }}>
                    {d.byProject.map((p) => (
                      <span key={p.id} style={{ flexGrow: p.ms, background: colorFor(p.id) }} />
                    ))}
                  </span>
                </span>
                <span className="week-strip__label">{d.date.toLocaleDateString([], { weekday: 'narrow' })}</span>
              </div>
            ))}
          </div>
          <span className="muted small">
            {formatDuration(today?.week.totalMs ?? 0)} this week · {today?.week.activeDays ?? 0} of 7 days
          </span>
        </section>
      </div>

      {/* Projects */}
      <section className="stack">
        <div className="page-header">
          <h2>Your Projects</h2>
          <button className="button--ghost" onClick={() => setShowForm(true)}>
            <PlusIcon /> New Project
          </button>
        </div>
        {projects && (
          <StatTiles {...statusCounts(projects)} timeTracked={formatDuration(totalTime)} tracking={tracking} />
        )}
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
