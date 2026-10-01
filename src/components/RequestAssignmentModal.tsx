import { useState, type FormEvent } from 'react'
import Modal from './Modal'

type Props = {
  tasks: { id: string; title: string }[]
  initialTaskId: string
  onClose: () => void
  onSend: (taskId: string, message: string) => Promise<boolean>
}

export default function RequestAssignmentModal({ tasks, initialTaskId, onClose, onSend }: Props) {
  const [taskId, setTaskId] = useState(initialTaskId)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSending(true)
    const ok = await onSend(taskId, message)
    setSending(false)
    if (ok) onClose()
  }

  return (
    <Modal title="Request Assignment" description="Select a task you want to be assigned to." onClose={onClose}>
      <form className="stack" onSubmit={handleSubmit}>
        <label className="field">
          Task
          <select value={taskId} onChange={(e) => setTaskId(e.target.value)} required>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </label>
        <label className="field">
          Message (optional)
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="I'd like to take this task. I have some time today…"
          />
        </label>
        <div className="modal__actions">
          <button type="button" className="button--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={sending}>{sending ? 'Sending…' : 'Send Request'}</button>
        </div>
      </form>
    </Modal>
  )
}
