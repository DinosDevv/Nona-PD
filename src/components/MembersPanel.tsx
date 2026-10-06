import { useState } from 'react'
import type { Member, Profile, ProjectRole, Responsibility } from '../api/members'
import { shortName } from '../lib/people'
import { PRESENCE_LABELS, usePresence } from '../lib/usePresence'
import Avatar from './Avatar'
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, XIcon } from './icons'

type Props = {
  members: Member[]
  responsibilities: Responsibility[]
  isManager: boolean
  creatorId: string | null
  nonMembers: Profile[]
  onAdd: (userId: string) => void
  onSetRole: (userId: string, role: ProjectRole) => void
  onRemove: (userId: string) => void
}

export default function MembersPanel({
  members,
  responsibilities,
  isManager,
  creatorId,
  nonMembers,
  onAdd,
  onSetRole,
  onRemove,
}: Props) {
  const [newMemberId, setNewMemberId] = useState('')
  const presenceOf = usePresence()

  return (
    <section className="stack">
      {isManager && nonMembers.length > 0 && (
        <form
          className="add-member"
          onSubmit={(e) => {
            e.preventDefault()
            onAdd(newMemberId)
            setNewMemberId('')
          }}
        >
          <select value={newMemberId} onChange={(e) => setNewMemberId(e.target.value)} required>
            <option value="" disabled>Add member…</option>
            {nonMembers.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
          </select>
          <button type="submit"><PlusIcon /> Add</button>
        </form>
      )}

      <ul className="member-grid">
        {members.map((m) => {
          const name = m.profiles?.full_name ?? 'Unknown'
          const isPM = m.role === 'manager'
          const canManage = isManager && m.user_id !== creatorId
          const duties = responsibilities.filter((r) => r.user_id === m.user_id)
          const presence = presenceOf(m.user_id)
          return (
            <li key={m.user_id} className="card member-card">
              <div className="member-card__head">
                <span className="member-card__avatar">
                  <Avatar name={name} seed={m.user_id} size={40} />
                  <span className={`status-dot status-dot--${presence}`} title={PRESENCE_LABELS[presence]} />
                </span>
                <div className="member-card__name">
                  <strong>{shortName(name)}</strong>
                  <span className="muted small">{m.title ?? (isPM ? 'Project Manager' : 'Contributor')}</span>
                </div>
                {isPM ? <span className="badge">PM</span> : <span className="badge badge--muted">Contributor</span>}
              </div>

              {m.profiles?.user_status && (
                <div className="member-card__status small">{m.profiles.user_status}</div>
              )}

              {duties.length > 0 && (
                <ul className="responsibilities small">
                  {duties.map((r) => <li key={r.id}>{r.description}</li>)}
                </ul>
              )}

              {canManage && (
                <div className="member-card__actions">
                  <button
                    type="button"
                    className="icon-button"
                    title={isPM ? 'Make contributor' : 'Make PM'}
                    aria-label={isPM ? `Make ${name} a contributor` : `Make ${name} a PM`}
                    onClick={() => onSetRole(m.user_id, isPM ? 'contributor' : 'manager')}
                  >
                    {isPM ? <ArrowDownIcon /> : <ArrowUpIcon />}
                    {isPM ? 'Make contributor' : 'Make PM'}
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    title="Remove from project"
                    aria-label={`Remove ${name} from project`}
                    onClick={() => {
                      if (confirm(`Remove ${name} from this project? Their assignments here will be removed too.`)) {
                        onRemove(m.user_id)
                      }
                    }}
                  >
                    <XIcon /> Remove
                  </button>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
