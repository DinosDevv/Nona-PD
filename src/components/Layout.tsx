import { Link, NavLink, Outlet } from 'react-router-dom'
import type { ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/useAuth'
import { shortName } from '../lib/people'
import Avatar from './Avatar'
import { BellIcon, FolderIcon, HomeIcon, ListIcon, LogOutIcon, UsersIcon } from './icons'
import './Layout.css'

// Pages that don't exist yet are shown but not clickable
function SoonItem({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="nav__item nav__item--disabled" aria-disabled="true" title="Coming soon">
      {icon}
      <span>{label}</span>
    </span>
  )
}

export default function Layout() {
  const { session } = useAuth()
  const email = session?.user.email ?? ''

  return (
    <div className="layout">
      <aside className="sidebar">
        <Link to="/dashboard" className="sidebar__brand">
          <span className="sidebar__logo">N</span>
          NONA
        </Link>

        <nav className="nav">
          <NavLink to="/dashboard" className="nav__item">
            <HomeIcon />
            <span>Dashboard</span>
          </NavLink>
          <SoonItem icon={<ListIcon />} label="My Tasks" />
          <SoonItem icon={<FolderIcon />} label="Projects" />
          <SoonItem icon={<UsersIcon />} label="Team" />
          <SoonItem icon={<BellIcon />} label="Notifications" />
        </nav>

        <div className="sidebar__user">
          <Avatar name={email} seed={session?.user.id} size={32} />
          <div className="sidebar__user-text">
            <span className="sidebar__user-name">{shortName(email)}</span>
            <span className="muted small">{email}</span>
          </div>
          <button
            type="button"
            className="icon-button"
            title="Log out"
            aria-label="Log out"
            onClick={() => supabase.auth.signOut()}
          >
            <LogOutIcon />
          </button>
        </div>
      </aside>

      <main className="layout__main">
        <Outlet />
      </main>
    </div>
  )
}
