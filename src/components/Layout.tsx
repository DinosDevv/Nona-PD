import { Link, Outlet } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/useAuth'
import './Layout.css'

export default function Layout() {
  const { session } = useAuth()

  return (
    <div className="layout">
      <header className="layout__header">
        <Link to="/dashboard" className="layout__brand">Nona PD</Link>
        <div className="row">
          <span className="muted">{session?.user.email}</span>
          <button className="button--ghost" onClick={() => supabase.auth.signOut()}>
            Log out
          </button>
        </div>
      </header>
      <main className="layout__main">
        <Outlet />
      </main>
    </div>
  )
}
