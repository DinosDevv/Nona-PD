import { useState, type FormEvent } from 'react'
import { describeSession } from '../api/time'
import { useToast } from '../lib/useToast'
import { SESSION_TAGS } from '../lib/sessionView'
import { formatDuration } from '../lib/timeView'
import Modal from './Modal'
import './Session.css'

type Props = {
  sessionId: string
  durationMs: number
  label: string
  onClose: () => void
}

export default function SessionNoteModal({ sessionId, durationMs, label, onClose }: Props) {
  const toast = useToast()
  const [note, setNote] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const toggle = (tag: string) =>
    setTags((current) => (current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag]))

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await describeSession(sessionId, { note, tags })
      toast.success('Session saved')
      onClose()
    } catch (err) {
      toast.error((err as Error).message)
      setSaving(false)
    }
  }

  return (
    <Modal title={`Session saved · ${formatDuration(durationMs)}`} description={label} onClose={onClose}>
      <form className="stack" onSubmit={handleSave}>
        <label className="field">
          What did you work on?
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="e.g. wired up JWT refresh, fixed the mobile nav…"
            autoFocus
          />
        </label>
        <div className="tag-chips" role="group" aria-label="Tags">
          {SESSION_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              className="tag-chip"
              aria-pressed={tags.includes(tag)}
              onClick={() => toggle(tag)}
            >
              #{tag}
            </button>
          ))}
        </div>
        <div className="modal__actions">
          <button type="button" className="button--ghost" onClick={onClose}>Skip</button>
          <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </Modal>
  )
}
