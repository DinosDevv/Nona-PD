import { useState } from 'react'
import { useTeam } from '../hooks/useTeam'
import type { TeamMember } from '../api/profiles'
import { shortName } from '../lib/people'
import { PRESENCE_LABELS, usePresence } from '../lib/usePresence'
import Avatar from '../components/Avatar'
import EditProfileModal from '../components/EditProfileModal'
import './TeamPage.css'

function TeamRow({ member, isMe, onEdit }: { member: TeamMember; isMe?: boolean; onEdit?: () => void }) {
  const projects = member.project_members.flatMap((pm) => (pm.projects ? [pm.projects.name] : []))
  const presence = usePresence()(member.id)

  return (
    <li className="team-row">
      <Avatar name={member.full_name} seed={member.id} size={40} />
      <div className="team-row__who">
        <strong>
          {shortName(member.full_name)}
          {isMe && <span className="muted"> (you)</span>}
        </strong>
        <span className="muted small">{projects.length ? projects.join(', ') : 'No shared projects'}</span>
      </div>
      <div className="team-row__status small">
        <span className={`status-dot status-dot--${presence}`} title={PRESENCE_LABELS[presence]} />
        <div className="team-row__status-text">
          <span className={`team-row__presence team-row__presence--${presence}`}>{PRESENCE_LABELS[presence]}</span>
          <span className="muted">{member.user_status ?? 'No status'}</span>
        </div>
      </div>
      {isMe && (
        <button type="button" className="button--ghost" onClick={onEdit}>Edit</button>
      )}
    </li>
  )
}

export default function TeamPage() {
  const { me, others, loading, error, updateMe } = useTeam()
  const [editing, setEditing] = useState(false)

  return (
    <div className="team">
      <div>
        <h1>Team</h1>
        <p className="muted">Your team and their current status.</p>
      </div>
      {error && <p className="error">{error}</p>}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : (
        <ul className="team-list">
          {me && <TeamRow member={me} isMe onEdit={() => setEditing(true)} />}
          {others.map((m) => <TeamRow key={m.id} member={m} />)}
        </ul>
      )}

      {editing && me && (
        <EditProfileModal
          fullName={me.full_name}
          status={me.user_status ?? ''}
          onClose={() => setEditing(false)}
          onSave={updateMe}
        />
      )}
    </div>
  )
}
