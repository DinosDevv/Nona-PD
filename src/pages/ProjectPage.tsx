import { useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { useProject } from '../hooks/useProject'
import TodoCard from '../components/TodoCard'
import './ProjectPage.css'

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
    isAssignee,
    addTodo,
    changeState,
    addNote,
  } = useProject(projectId!)

  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newDeadline, setNewDeadline] = useState('')

  async function handleAddTodo(e: FormEvent) {
    e.preventDefault()
    if (await addTodo({ title: newTitle, description: newDescription, deadline: newDeadline })) {
      setNewTitle('')
      setNewDescription('')
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
            <TodoCard
              key={todo.id}
              todo={todo}
              creatorName={todo.created_by ? memberName(todo.created_by) : 'Unknown'}
              assignees={todo.todo_assignees.map((a) => ({ id: a.user_id, name: memberName(a.user_id) }))}
              notes={todo.todo_notes.map((n) => ({
                id: n.id,
                authorName: memberName(n.user_id),
                body: n.body,
                createdAt: n.created_at,
              }))}
              canEdit={canEdit(todo)}
              canAddNote={isAssignee(todo)}
              onChangeState={(state) => changeState(todo.id, state)}
              onAddNote={(body) => addNote(todo.id, body)}
            />
          ))}
        </ul>

        <form className="card stack" onSubmit={handleAddTodo}>
          <h3>New to-do</h3>
          <input placeholder="Title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required />
          <textarea
            placeholder="Description (optional)"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            rows={2}
          />
          <label className="field">
            Due (optional)
            <input type="datetime-local" value={newDeadline} onChange={(e) => setNewDeadline(e.target.value)} />
          </label>
          <button type="submit">Add to-do</button>
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
