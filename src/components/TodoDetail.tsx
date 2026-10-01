import { useState, type FormEvent } from 'react'
import type { Todo, TodoState } from '../api/todos'
import { STATE_LABELS, formatDateTime, isOverdue } from '../lib/todoView'
import { shortName } from '../lib/people'
import Avatar from './Avatar'
import { AlertIcon, CheckIcon, PencilIcon, TrashIcon, UserPlusIcon, XIcon } from './icons'

type Person = { id: string; name: string }
type NoteItem = { id: string; authorName: string; mine: boolean; body: string; createdAt: string; edited: boolean }

type Props = {
  todo: Todo
  creator: Person | null
  assignees: Person[]
  notes: NoteItem[]
  requests: { id: string; userId: string; name: string; message: string | null }[]
  assignable: Person[]
  myRequestId: string | null
  canEdit: boolean
  canAddNote: boolean
  canRequest: boolean
  isManager: boolean
  onChangeState: (state: TodoState) => void
  onEdit: () => void
  onDelete: () => void
  onAddNote: (body: string) => Promise<boolean>
  onEditNote: (noteId: string, body: string) => Promise<boolean>
  onDeleteNote: (noteId: string) => void
  onRequest: () => void
  onWithdraw: (requestId: string) => void
  onResolve: (requestId: string, approve: boolean) => void
  onAssign: (userId: string) => void
  onUnassign: (userId: string) => void
}

function NoteRow({ note, onSave, onDelete }: { note: NoteItem; onSave: (body: string) => Promise<boolean>; onDelete: () => void }) {
  const [editing, setEditing] = useState(false)
  const [body, setBody] = useState(note.body)

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (await onSave(body)) setEditing(false)
  }

  if (editing) {
    return (
      <li>
        <form className="stack" onSubmit={handleSave}>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} required autoFocus />
          <div className="row">
            <button type="submit">Save</button>
            <button
              type="button"
              className="button--ghost"
              onClick={() => {
                setBody(note.body)
                setEditing(false)
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </li>
    )
  }

  return (
    <li>
      <p>{note.body}</p>
      <div className="note__footer">
        <span className="muted small">
          — {shortName(note.authorName)} · {formatDateTime(note.createdAt)}
          {note.edited && ' · edited'}
        </span>
        {note.mine && (
          <span className="row">
            <button type="button" className="icon-button" title="Edit note" aria-label="Edit note" onClick={() => setEditing(true)}>
              <PencilIcon />
            </button>
            <button
              type="button"
              className="icon-button"
              title="Delete note"
              aria-label="Delete note"
              onClick={() => confirm('Delete this note?') && onDelete()}
            >
              <TrashIcon />
            </button>
          </span>
        )}
      </div>
    </li>
  )
}

export default function TodoDetail({
  todo,
  creator,
  assignees,
  notes,
  requests,
  assignable,
  myRequestId,
  canEdit,
  canAddNote,
  canRequest,
  isManager,
  onChangeState,
  onEdit,
  onDelete,
  onAddNote,
  onEditNote,
  onDeleteNote,
  onRequest,
  onWithdraw,
  onResolve,
  onAssign,
  onUnassign,
}: Props) {
  const [note, setNote] = useState('')
  const overdue = isOverdue(todo)

  async function handleAddNote(e: FormEvent) {
    e.preventDefault()
    if (await onAddNote(note)) setNote('')
  }

  return (
    <aside className="todo-detail">
      <div className="todo-detail__header">
        <h2>{todo.title}</h2>
        <div className="row">
          {overdue && <span className="badge badge--overdue"><AlertIcon /> Overdue</span>}
          {canEdit && (
            <>
              <button type="button" className="icon-button" title="Edit to-do" aria-label="Edit to-do" onClick={onEdit}>
                <PencilIcon />
              </button>
              <button
                type="button"
                className="icon-button"
                title="Delete to-do"
                aria-label="Delete to-do"
                onClick={() => confirm(`Delete "${todo.title}"? Its notes and requests go with it.`) && onDelete()}
              >
                <TrashIcon />
              </button>
            </>
          )}
        </div>
      </div>
      {todo.description && <p className="todo-detail__description">{todo.description}</p>}

      <dl className="detail-grid">
        <dt>Status</dt>
        <dd>
          <select
            className={`state-select state-select--${todo.state}`}
            value={todo.state}
            disabled={!canEdit}
            onChange={(e) => onChangeState(e.target.value as TodoState)}
          >
            {Object.entries(STATE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </dd>

        <dt>Deadline</dt>
        <dd className={overdue ? 'error' : undefined}>
          {todo.deadline ? formatDateTime(todo.deadline) : <span className="muted">No deadline</span>}
        </dd>

        <dt>Created by</dt>
        <dd>
          {creator ? (
            <span className="person">
              <Avatar name={creator.name} seed={creator.id} size={22} />
              {shortName(creator.name)}
            </span>
          ) : (
            <span className="muted">Unknown</span>
          )}
        </dd>

        <dt>Assignees</dt>
        <dd>
          <ul className="person-list">
            {assignees.length === 0 && <li className="muted">Unassigned</li>}
            {assignees.map((a) => (
              <li key={a.id}>
                <span className="person">
                  <Avatar name={a.name} seed={a.id} size={22} />
                  {shortName(a.name)}
                </span>
                {isManager && (
                  <button type="button" className="icon-button" title="Unassign" aria-label={`Unassign ${a.name}`} onClick={() => onUnassign(a.id)}>
                    <XIcon />
                  </button>
                )}
              </li>
            ))}
          </ul>
          {isManager && assignable.length > 0 && (
            <select value="" onChange={(e) => e.target.value && onAssign(e.target.value)} className="todo-detail__assign">
              <option value="">Assign member…</option>
              {assignable.map((m) => <option key={m.id} value={m.id}>{shortName(m.name)}</option>)}
            </select>
          )}
        </dd>

        {requests.length > 0 && (
          <>
            <dt>Requested</dt>
            <dd>
              <ul className="person-list">
                {requests.map((r) => (
                  <li key={r.id} className="person-list__request">
                    <span className="person">
                      <Avatar name={r.name} seed={r.userId} size={22} />
                      {shortName(r.name)}
                    </span>
                    {isManager && (
                      <span className="row">
                        <button type="button" className="icon-button" title="Approve" aria-label={`Approve ${r.name}`} onClick={() => onResolve(r.id, true)}>
                          <CheckIcon />
                        </button>
                        <button type="button" className="icon-button" title="Reject" aria-label={`Reject ${r.name}`} onClick={() => onResolve(r.id, false)}>
                          <XIcon />
                        </button>
                      </span>
                    )}
                    {r.message && <q className="request-message">{r.message}</q>}
                  </li>
                ))}
              </ul>
            </dd>
          </>
        )}
      </dl>

      <section className="stack">
        <h3>Notes</h3>
        {notes.length === 0 ? (
          <p className="muted small">No notes yet.</p>
        ) : (
          <ul className="notes">
            {notes.map((n) => (
              <NoteRow
                key={n.id}
                note={n}
                onSave={(body) => onEditNote(n.id, body)}
                onDelete={() => onDeleteNote(n.id)}
              />
            ))}
          </ul>
        )}

        {canAddNote && (
          <form className="stack" onSubmit={handleAddNote}>
            <textarea
              placeholder="Write a note for the PM…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              required
            />
            <div>
              <button type="submit" className="button--ghost">Add Note</button>
            </div>
          </form>
        )}
      </section>

      {canRequest && (
        <button
          type="button"
          className="button--ghost button--block"
          onClick={() => (myRequestId ? onWithdraw(myRequestId) : onRequest())}
        >
          <UserPlusIcon />
          {myRequestId ? 'Withdraw Request' : 'Request Assignment'}
        </button>
      )}
    </aside>
  )
}
