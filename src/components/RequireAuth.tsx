import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/useAuth'

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) return <p className="page-center muted">Loading…</p>
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}
