import { useState, type FormEvent } from 'react'
import type { Project, ProjectStatus } from '../api/projects'
import { PROJECT_STATUS_LABELS } from '../lib/projectView'
import Modal from './Modal'

type Props = {
  project: Project
  onClose: () => void
  onSave: (input: { name: string; description: string; status: ProjectStatus }) => Promise<boolean>
  onDelete: () => Promise<void>
}

export default function ProjectSettingsModal({ project, onClose, onSave, onDelete }: Props) {
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description ?? '')
  const [status, setStatus] = useState<ProjectStatus>(project.status)

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (await onSave({ name, description, status })) onClose()
  }

  function handleDelete() {
    if (confirm(`Delete "${project.name}" and all its to-dos? This can't be undone.`)) onDelete()
  }

  return (
    <Modal title="Project Settings" onClose={onClose}>
      <form className="stack" onSubmit={handleSave}>
        <label className="field">
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        </label>
        <label className="field">
          Description
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </label>
        <label className="field">
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}>
            {Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <div className="modal__actions">
          <button type="button" className="button--ghost" onClick={onClose}>Cancel</button>
          <button type="submit">Save</button>
        </div>
      </form>

      <div className="danger-zone">
        <div>
          <strong className="small">Danger zone</strong>
          <p className="muted small">Deletes the project, its to-dos, notes and requests.</p>
        </div>
        <button type="button" className="button--danger" onClick={handleDelete}>
          Delete project
        </button>
      </div>
    </Modal>
  )
}
