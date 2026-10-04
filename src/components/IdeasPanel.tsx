import { useState } from 'react'
import type { Idea } from '../api/ideas'
import { shortName } from '../lib/people'
import { timeAgo } from '../lib/todoView'
import Avatar from './Avatar'
import IdeaModal from './IdeaModal'
import { ArrowUpRightIcon, LightbulbIcon, PlusIcon } from './icons'

type Props = {
  ideas: Idea[] | null
  currentUserId: string
  isManager: boolean
  memberName: (id: string) => string
  onCreate: (input: { title: string; description: string }) => Promise<boolean>
  onUpdate: (ideaId: string, input: { title: string; description: string }) => Promise<boolean>
  onDelete: (ideaId: string) => Promise<boolean>
  onConvert: (ideaId: string) => Promise<void>
  onOpenTask: (todoId: string) => void
}

export default function IdeasPanel({
  ideas,
  currentUserId,
  isManager,
  memberName,
  onCreate,
  onUpdate,
  onDelete,
  onConvert,
  onOpenTask,
}: Props) {
  const [openId, setOpenId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [showConverted, setShowConverted] = useState(false)

  const all = ideas ?? []
  const convertedCount = all.filter((i) => i.converted_at).length
  const shown = showConverted ? all : all.filter((i) => !i.converted_at)
  const selected = all.find((i) => i.id === openId) ?? null
  const authorOf = (i: Idea) => (i.created_by ? memberName(i.created_by) : 'Unknown')

  return (
    <section className="stack">
      <div className="toolbar">
        <p className="muted small">Ideas are notes for future work. Turn one into a to-do when it's time.</p>
        <button onClick={() => setCreating(true)}>
          <PlusIcon /> New Idea
        </button>
      </div>

      {convertedCount > 0 && (
        <label className="checkbox small">
          <input type="checkbox" checked={showConverted} onChange={(e) => setShowConverted(e.target.checked)} />
          Show converted ({convertedCount})
        </label>
      )}

      {ideas === null ? (
        <p className="muted">Loading…</p>
      ) : shown.length === 0 ? (
        <p className="muted">No ideas yet.</p>
      ) : (
        <ul className="idea-grid">
          {shown.map((i) => (
            <li key={i.id}>
              <button
                type="button"
                className={`card idea-card${i.converted_at ? ' idea-card--converted' : ''}`}
                onClick={() => setOpenId(i.id)}
              >
                <span className="idea-card__title">
                  <LightbulbIcon />
                  <strong>{i.title}</strong>
                </span>
                {i.description && <span className="idea-card__description muted small">{i.description}</span>}
                <span className="idea-card__footer muted small">
                  <Avatar name={authorOf(i)} seed={i.created_by ?? undefined} size={18} />
                  {shortName(authorOf(i))} · {timeAgo(i.created_at)}
                  {i.converted_at && (
                    <span className="badge badge--done idea-card__badge">
                      <ArrowUpRightIcon /> Task
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {creating && <IdeaModal idea={null} onClose={() => setCreating(false)} onSave={onCreate} />}

      {selected && (
        <IdeaModal
          key={selected.id}
          idea={selected}
          authorName={authorOf(selected)}
          canEdit={isManager || selected.created_by === currentUserId}
          onClose={() => setOpenId(null)}
          onSave={(input) => onUpdate(selected.id, input)}
          onDelete={() => onDelete(selected.id)}
          onConvert={() => onConvert(selected.id)}
          onOpenTask={(todoId) => {
            setOpenId(null)
            onOpenTask(todoId)
          }}
        />
      )}
    </section>
  )
}
