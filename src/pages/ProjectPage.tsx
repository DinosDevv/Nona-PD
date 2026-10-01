import { useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { useProject } from '../hooks/useProject'
import type { TodoState } from '../api/todos'
import './ProjectPage.css'

const STATE_LABELS: Record<TodoState, string> = {
  undone: 'Undone',
  in_progress: 'In progress',
  done: 'Done',
}

export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const {
    project,
    members = [],
    responsibilities = [],
    todos = [],
    loading,
    error,
    memberName,
    canEdit,
    addTodo,
    changeState,
  } = useProject(projectId!)

  const [newTitle, setNewTitle] = useState('')
  const [newDeadline, setNewDeadline] = useState('')

  async function handleAddTodo(e: FormEvent) {
    e.preventDefault()
    if (await addTodo(newTitle, newDeadline)) {
      setNewTitle('')
      setNewDeadline('')
    }
  }

  if (loading) return <p className="muted">Loading…</p>
  if (!project) return <p className="muted">{error ?? "Project not found, or you're not a member."}</p>

  return (
    <div className="project">
      <section className="stack">
        <div>
          <h1>{project.name}</h1>
          {project.description && <p className="muted">{project.description}</p>}
        </div>
        {error && <p className="error">{error}</p>}

        <h2>To-dos</h2>
        {todos.length === 0 && <p className="muted">No to-dos yet.</p>}
        <ul className="stack">
          {todos.map((todo) => (
            <li key={todo.id} className={`card todo todo--${todo.state}`}>
              <div className="todo__main">
                <strong>{todo.title}</strong>
                <span className="muted">
                  {todo.todo_assignees.map((a) => memberName(a.user_id)).join(', ') || 'Unassigned'}
                  {todo.deadline && ` · due ${new Date(todo.deadline).toLocaleDateString()}`}
                </span>
              </div>
              <select
                value={todo.state}
                disabled={!canEdit(todo)}
                onChange={(e) => changeState(todo.id, e.target.value as TodoState)}
              >
                {Object.entries(STATE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </li>
          ))}
        </ul>

        <form className="row" onSubmit={handleAddTodo}>
          <input
            placeholder="New to-do"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
            style={{ flex: 1 }}
          />
          <input type="date" value={newDeadline} onChange={(e) => setNewDeadline(e.target.value)} />
          <button type="submit">Add</button>
        </form>
      </section>

      <aside className="stack">
        <h2>Members</h2>
        <ul className="stack">
          {members.map((m) => (
            <li key={m.user_id} className="card">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <strong>{m.profiles?.full_name}</strong>
                {m.role === 'manager' && <span className="badge">PM</span>}
              </div>
              {m.title && <div className="muted">{m.title}</div>}
              {m.profiles?.user_status && <div className="status">● {m.profiles.user_status}</div>}
              {responsibilities.some((r) => r.user_id === m.user_id) && (
                <ul className="responsibilities">
                  {responsibilities
                    .filter((r) => r.user_id === m.user_id)
                    .map((r) => <li key={r.id}>{r.description}</li>)}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  )
}
