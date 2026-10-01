import { useState, type FormEvent } from 'react'
import type { Todo, TodoState } from '../api/todos'
import './TodoCard.css'

const STATE_LABELS: Record<TodoState, string> = {
  undone: 'Undone',
  in_progress: 'In progress',
  done: 'Done',
}

type Props = {
  todo: Todo
  creatorName: string
  assignees: { id: string; name: string }[]
  notes: { id: string; authorName: string; body: string; createdAt: string }[]
  canEdit: boolean
  canAddNote: boolean
  onChangeState: (state: TodoState) => void
  onAddNote: (body: string) => Promise<boolean>
}

export default function TodoCard({
  todo,
  creatorName,
  assignees,
  notes,
  canEdit,
  canAddNote,
  onChangeState,
  onAddNote,
}: Props) {
  const [showAssignees, setShowAssignees] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const [note, setNote] = useState('')

  async function handleAddNote(e: FormEvent) {
    e.preventDefault()
    if (await onAddNote(note)) {
      setNote('')
      setNoteOpen(false)
      setShowNotes(true)
    }
  }

  return (
    <li className={`card todo todo--${todo.state}`}>
      <div className="todo__header">
        <strong>{todo.title}</strong>
        <select
          value={todo.state}
          disabled={!canEdit}
          onChange={(e) => onChangeState(e.target.value as TodoState)}
        >
          {Object.entries(STATE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {todo.description && <p className="todo__description">{todo.description}</p>}

      <div className="todo__meta muted">
        <span>By {creatorName}</span>
        <span>
          {todo.deadline
            ? `Due ${new Date(todo.deadline).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}`
            : 'No deadline'}
        </span>
      </div>

      <div className="row">
        <button type="button" className="button--ghost" onClick={() => setShowAssignees((v) => !v)}>
          {showAssignees ? 'Hide assignees' : `Assignees (${assignees.length})`}
        </button>
        <button type="button" className="button--ghost" onClick={() => setShowNotes((v) => !v)}>
          {showNotes ? 'Hide notes' : `Notes (${notes.length})`}
        </button>
        {canAddNote && (
          <button type="button" className="button--ghost" onClick={() => setNoteOpen((v) => !v)}>
            Add note
          </button>
        )}
      </div>

      {showAssignees && (
        <ul className="todo__assignees">
          {assignees.map((a) => <li key={a.id}>{a.name}</li>)}
        </ul>
      )}

      {showNotes && (
        notes.length === 0 ? (
          <p className="muted todo__empty">No notes yet.</p>
        ) : (
          <ul className="todo__notes">
            {notes.map((n) => (
              <li key={n.id}>
                <div className="muted">
                  {n.authorName} · {new Date(n.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
                <p>{n.body}</p>
              </li>
            ))}
          </ul>
        )
      )}

      {noteOpen && (
        <form className="stack" onSubmit={handleAddNote}>
          <textarea
            placeholder="Write a note for the PM…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            required
            autoFocus
          />
          <div className="row">
            <button type="submit">Save note</button>
            <button type="button" className="button--ghost" onClick={() => setNoteOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </li>
  )
}
