import { useState, type FormEvent } from 'react'
import type { Todo } from '../api/todos'
import { toLocalInput } from '../lib/todoView'
import Modal from './Modal'

type Props = {
  todo: Todo
  canRename: boolean
  onClose: () => void
  onSave: (input: { title: string; description: string; deadline: string }) => Promise<boolean>
}

export default function EditTodoModal({ todo, canRename, onClose, onSave }: Props) {
  const [title, setTitle] = useState(todo.title)
  const [description, setDescription] = useState(todo.description ?? '')
  const [deadline, setDeadline] = useState(toLocalInput(todo.deadline))

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (await onSave({ title, description, deadline })) onClose()
  }

  const lockedReason =
    todo.state === 'done'
      ? "Completed to-dos can't be renamed."
      : 'Only the author or a PM can change the title and description.'

  return (
    <Modal title="Edit To-Do" onClose={onClose}>
      <form className="stack" onSubmit={handleSubmit}>
        <label className="field">
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} required disabled={!canRename} autoFocus />
        </label>
        <label className="field">
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            disabled={!canRename}
          />
        </label>
        {!canRename && <p className="muted small">{lockedReason}</p>}
        <label className="field">
          Due (optional)
          <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </label>
        <div className="modal__actions">
          <button type="button" className="button--ghost" onClick={onClose}>Cancel</button>
          <button type="submit">Save</button>
        </div>
      </form>
    </Modal>
  )
}
