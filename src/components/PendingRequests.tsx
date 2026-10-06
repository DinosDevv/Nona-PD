import { CheckIcon, XIcon } from './icons'

type Props = {
  requests: { id: string; requesterName: string; todoTitle: string; message: string | null }[]
  onResolve: (requestId: string, approve: boolean) => void
}

export default function PendingRequests({ requests, onResolve }: Props) {
  if (requests.length === 0) return null

  return (
    <section className="card stack pending-requests">
      <strong>Pending requests ({requests.length})</strong>
      <ul className="stack">
        {requests.map((r) => (
          <li key={r.id} className="pending-requests__row">
            <span className="pending-requests__text">
              <span>
                <strong>{r.requesterName}</strong> <span className="muted">wants</span> {r.todoTitle}
              </span>
              {r.message && <q className="request-message">{r.message}</q>}
            </span>
            <span className="row">
              <button type="button" className="icon-button" title="Approve" aria-label={`Approve ${r.requesterName}`} onClick={() => onResolve(r.id, true)}>
                <CheckIcon />
              </button>
              <button type="button" className="icon-button" title="Reject" aria-label={`Reject ${r.requesterName}`} onClick={() => onResolve(r.id, false)}>
                <XIcon />
              </button>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
