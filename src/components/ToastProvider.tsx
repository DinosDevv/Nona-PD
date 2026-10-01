import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { ToastContext, type ToastApi, type ToastKind } from '../lib/useToast'
import { AlertIcon, CheckIcon, XIcon } from './icons'
import './Toast.css'

type Toast = { id: number; message: string; kind: ToastKind }

const DURATION_MS = 4000
let nextId = 1

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: number) => setToasts((all) => all.filter((t) => t.id !== id)), [])

  const show = useCallback(
    (message: string, kind: ToastKind = 'info') => {
      const id = nextId++
      setToasts((all) => [...all.slice(-3), { id, message, kind }])
      setTimeout(() => dismiss(id), DURATION_MS)
    },
    [dismiss],
  )

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (m) => show(m, 'success'),
      error: (m) => show(m, 'error'),
    }),
    [show],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.kind}`}>
            <span className="toast__icon">{t.kind === 'error' ? <AlertIcon /> : <CheckIcon />}</span>
            <span className="toast__message">{t.message}</span>
            <button type="button" className="icon-button" aria-label="Dismiss" onClick={() => dismiss(t.id)}>
              <XIcon />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
