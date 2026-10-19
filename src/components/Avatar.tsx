import { colorFor, initials } from '../lib/people'
import './Avatar.css'

type Props = {
  name: string
  seed?: string
  size?: number
  square?: boolean
}

export default function Avatar({ name, seed, size = 28, square = false }: Props) {
  return (
    <span
      className={`avatar${square ? ' avatar--square' : ''}`}
      style={{ width: size, height: size, fontSize: size * 0.38, background: colorFor(seed ?? name) }}
      title={name}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  )
}

export function AvatarStack({ people, max = 4, size = 28 }: { people: { id: string; name: string }[]; max?: number; size?: number }) {
  const shown = people.slice(0, max)
  const extra = people.length - shown.length
  return (
    <span className="avatar-stack" aria-label={people.map((p) => p.name).join(', ')}>
      {shown.map((p) => (
        <Avatar key={p.id} name={p.name} seed={p.id} size={size} />
      ))}
      {extra > 0 && (
        <span className="avatar avatar--extra" style={{ width: size, height: size, fontSize: size * 0.36 }}>
          +{extra}
        </span>
      )}
    </span>
  )
}
