type Props = {
  total: number
  active: number
  onHold: number
  completed: number
}

export default function StatTiles({ total, active, onHold, completed }: Props) {
  const tiles = [
    { label: 'Total Projects', value: total, dot: null },
    { label: 'Active', value: active, dot: 'var(--color-status-done)' },
    { label: 'On Hold', value: onHold, dot: 'var(--color-status-in-progress)' },
    { label: 'Completed', value: completed, dot: 'var(--color-muted)' },
  ]

  return (
    <ul className="stat-tiles">
      {tiles.map((t) => (
        <li key={t.label} className="card stat-tile">
          <span className="stat-tile__label">
            {t.dot && <span className="stat-tile__dot" style={{ background: t.dot }} />}
            {t.label}
          </span>
          <span className="stat-tile__value">{t.value}</span>
        </li>
      ))}
    </ul>
  )
}
