import { createContext, useContext } from 'react'

export type ToastKind = 'success' | 'error' | 'info'

export type ToastApi = {
  show: (message: string, kind?: ToastKind) => void
  success: (message: string) => void
  error: (message: string) => void
}

export const ToastContext = createContext<ToastApi>({
  show: () => {},
  success: () => {},
  error: () => {},
})

export function useToast() {
  return useContext(ToastContext)
}
