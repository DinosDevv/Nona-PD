import { useState, type FormEvent } from 'react'
import type { Todo, TodoState } from '../api/todos'
import { AddNoteIcon, CheckIcon, NotesIcon, UserPlusIcon, UsersIcon, XIcon } from './icons'
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
  requests: { id: string; name: string }[]
  myRequestId: string | null
  canRequest: boolean
  canResolve: boolean
  onRequest: () => void
  onWithdraw: (requestId: string) => void
  onResolve: (requestId: string, approve: boolean) => void
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
  requests,
  myRequestId,
  canRequest,
  canResolve,
  onRequest,
  onWithdraw,
  onResolve,
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
        <div className="todo__title">
          <strong>{todo.title}</strong>
          {todo.description && <p className="todo__description">{todo.description}</p>}
        </div>
        <select
          className="todo__state"
          value={todo.state}
          disabled={!canEdit}
          onChange={(e) => onChangeState(e.target.value as TodoState)}
        >
          {Object.entries(STATE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div className="todo__footer">
        <span className="todo__meta muted">
          By {creatorName} ·{' '}
          {todo.deadline
            ? `Due ${new Date(todo.deadline).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}`
            : 'No deadline'}
        </span>
        <div className="todo__actions">
          <button
            type="button"
            className="icon-button"
            title="Assignees"
            aria-label="Show assignees"
            aria-pressed={showAssignees}
            onClick={() => setShowAssignees((v) => !v)}
          >
            <UsersIcon /> {assignees.length}
            {canResolve && requests.length > 0 && (
              <span className="icon-button__dot" title={`${requests.length} pending request(s)`} />
            )}
          </button>
          <button
            type="button"
            className="icon-button"
            title="Notes"
            aria-label="Show notes"
            aria-pressed={showNotes}
            onClick={() => setShowNotes((v) => !v)}
          >
            <NotesIcon /> {notes.length}
          </button>
          {canAddNote && (
            <button
              type="button"
              className="icon-button"
              title="Add note"
              aria-label="Add note"
              aria-pressed={noteOpen}
              onClick={() => setNoteOpen((v) => !v)}
            >
              <AddNoteIcon />
            </button>
          )}
          {canRequest && (
            <button
              type="button"
              className="icon-button"
              title={myRequestId ? 'Withdraw assignment request' : 'Request assignment'}
              aria-label={myRequestId ? 'Withdraw assignment request' : 'Request assignment'}
              aria-pressed={myRequestId !== null}
              onClick={() => (myRequestId ? onWithdraw(myRequestId) : onRequest())}
            >
              <UserPlusIcon />
            </button>
          )}
        </div>
      </div>

      {showAssignees && (
        <div className="todo__people">
          <ul className="todo__assignees">
            {assignees.map((a) => <li key={a.id}>{a.name}</li>)}
          </ul>
          {requests.length > 0 && (
            <>
              <div className="muted todo__subhead">Requested</div>
              <ul className="todo__requests">
                {requests.map((r) => (
                  <li key={r.id}>
                    <span>{r.name}</span>
                    {canResolve && (
                      <span className="todo__actions">
                        <button type="button" className="icon-button" title="Approve" aria-label={`Approve ${r.name}`} onClick={() => onResolve(r.id, true)}>
                          <CheckIcon />
                        </button>
                        <button type="button" className="icon-button" title="Reject" aria-label={`Reject ${r.name}`} onClick={() => onResolve(r.id, false)}>
                          <XIcon />
                        </button>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
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
