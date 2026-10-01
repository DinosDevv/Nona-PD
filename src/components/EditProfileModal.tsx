import { useState, type FormEvent } from 'react'
import Modal from './Modal'

type Props = {
  fullName: string
  status: string
  onClose: () => void
  onSave: (input: { fullName: string; status: string }) => Promise<boolean>
}

export default function EditProfileModal({ fullName, status, onClose, onSave }: Props) {
  const [name, setName] = useState(fullName)
  const [newStatus, setNewStatus] = useState(status)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (await onSave({ fullName: name, status: newStatus })) onClose()
  }

  return (
    <Modal title="Edit Profile" description="How you appear to the rest of the team." onClose={onClose}>
      <form className="stack" onSubmit={handleSubmit}>
        <label className="field">
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        </label>
        <label className="field">
          Status
          <input
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            placeholder="e.g. Researching the market"
            maxLength={80}
          />
        </label>
        <div className="modal__actions">
          <button type="button" className="button--ghost" onClick={onClose}>Cancel</button>
          <button type="submit">Save</button>
        </div>
      </form>
    </Modal>
  )
}
