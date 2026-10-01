import { useEffect, type ReactNode } from 'react'
import { XIcon } from './icons'
import './Modal.css'

type Props = {
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
}

export default function Modal({ title, description, onClose, children }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal__header">
          <div>
            <h2>{title}</h2>
            {description && <p className="muted small">{description}</p>}
          </div>
          <button type="button" className="icon-button" aria-label="Close" onClick={onClose}>
            <XIcon />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
