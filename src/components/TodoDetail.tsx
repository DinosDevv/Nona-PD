import { useState, type FormEvent } from 'react'
import type { Todo, TodoState } from '../api/todos'
import { STATE_LABELS, formatDateTime, isOverdue } from '../lib/todoView'
import { shortName } from '../lib/people'
import Avatar from './Avatar'
import { AlertIcon, CheckIcon, UserPlusIcon, XIcon } from './icons'

type Person = { id: string; name: string }

type Props = {
  todo: Todo
  creator: Person | null
  assignees: Person[]
  notes: { id: string; authorName: string; body: string; createdAt: string }[]
  requests: { id: string; userId: string; name: string; message: string | null }[]
  assignable: Person[]
  myRequestId: string | null
  canEdit: boolean
  canAddNote: boolean
  canRequest: boolean
  isManager: boolean
  onChangeState: (state: TodoState) => void
  onAddNote: (body: string) => Promise<boolean>
  onRequest: () => void
  onWithdraw: (requestId: string) => void
  onResolve: (requestId: string, approve: boolean) => void
  onAssign: (userId: string) => void
  onUnassign: (userId: string) => void
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
  onAddNote,
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
        {overdue && <span className="badge badge--overdue"><AlertIcon /> Overdue</span>}
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
              <li key={n.id}>
                <p>{n.body}</p>
                <span className="muted small">
                  — {shortName(n.authorName)} · {formatDateTime(n.createdAt)}
                </span>
              </li>
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
