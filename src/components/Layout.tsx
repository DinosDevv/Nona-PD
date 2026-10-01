import { Link, Outlet } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/useAuth'
import { useTheme } from '../hooks/useTheme'
import { MoonIcon, SunIcon } from './icons'
import './Layout.css'

export default function Layout() {
  const { session } = useAuth()
  const { theme, toggle } = useTheme()

  return (
    <div className="layout">
      <header className="layout__header">
        <Link to="/dashboard" className="layout__brand">Nona PD</Link>
        <div className="row">
          <span className="muted">{session?.user.email}</span>
          <button
            className="icon-button"
            onClick={toggle}
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
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
