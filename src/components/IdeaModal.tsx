import { useState, type FormEvent } from 'react'
import type { Idea } from '../api/ideas'
import { shortName } from '../lib/people'
import { timeAgo } from '../lib/todoView'
import Avatar from './Avatar'
import Modal from './Modal'
import { ArrowUpRightIcon, PencilIcon, TrashIcon } from './icons'

type Props = {
  idea: Idea | null // null = creating a new idea
  authorName?: string
  canEdit?: boolean
  onClose: () => void
  onSave: (input: { title: string; description: string }) => Promise<boolean>
  onDelete?: () => Promise<boolean>
  onConvert?: () => Promise<void>
  onOpenTask?: (todoId: string) => void
}

export default function IdeaModal({ idea, authorName, canEdit, onClose, onSave, onDelete, onConvert, onOpenTask }: Props) {
  const [editing, setEditing] = useState(idea === null)
  const [title, setTitle] = useState(idea?.title ?? '')
  const [description, setDescription] = useState(idea?.description ?? '')
  const [converting, setConverting] = useState(false)

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!(await onSave({ title, description }))) return
    if (idea === null) onClose()
    else setEditing(false)
  }

  if (editing) {
    return (
      <Modal title={idea ? 'Edit Idea' : 'New Idea'} description="A note for future work." onClose={onClose}>
        <form className="stack" onSubmit={handleSave}>
          <label className="field">
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
          </label>
          <label className="field">
            Description
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
          </label>
          <div className="modal__actions">
            <button type="button" className="button--ghost" onClick={() => (idea ? setEditing(false) : onClose())}>
              Cancel
            </button>
            <button type="submit">{idea ? 'Save' : 'Add Idea'}</button>
          </div>
        </form>
      </Modal>
    )
  }

  // Viewing an existing idea
  const i = idea!
  return (
    <Modal title={i.title} onClose={onClose}>
      {i.description ? (
        <p className="idea-modal__description">{i.description}</p>
      ) : (
        <p className="muted small">No description.</p>
      )}

      <span className="person small muted">
        <Avatar name={authorName ?? 'Unknown'} seed={i.created_by ?? undefined} size={22} />
        {shortName(authorName ?? 'Unknown')} · {timeAgo(i.created_at)}
      </span>

      {i.converted_at ? (
        <div className="idea-modal__converted">
          <span className="muted small">Turned into a task · {timeAgo(i.converted_at)}</span>
          {i.todo_id && (
            <button type="button" className="button--ghost" onClick={() => onOpenTask?.(i.todo_id!)}>
              <ArrowUpRightIcon /> Open task
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          className="button--block"
          disabled={converting}
          onClick={async () => {
            setConverting(true)
            await onConvert?.()
            setConverting(false)
          }}
        >
          {converting ? 'Turning into a task…' : 'Turn to task'}
        </button>
      )}

      {canEdit && (
        <div className="row idea-modal__actions">
          {!i.converted_at && (
            <button type="button" className="button--ghost" onClick={() => setEditing(true)}>
              <PencilIcon /> Edit
            </button>
          )}
          <button
            type="button"
            className="button--danger"
            onClick={async () => {
              if (confirm(`Delete the idea "${i.title}"?`) && (await onDelete?.())) onClose()
            }}
          >
            <TrashIcon /> Delete
          </button>
        </div>
      )}
    </Modal>
  )
}
