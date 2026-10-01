import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/useAuth'
import { shortName } from '../lib/people'
import { useMyProfile } from '../hooks/useMyProfile'
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
  const { name } = useMyProfile()
  const { pathname } = useLocation()
  // Project pages count as part of the dashboard
  const onDashboard = pathname === '/dashboard' || pathname.startsWith('/dashboard/project')

  return (
    <div className="layout">
      <aside className="sidebar">
        <Link to="/dashboard" className="sidebar__brand">
          <span className="sidebar__logo">N</span>
          NONA
        </Link>

        <nav className="nav">
          <NavLink to="/dashboard" end className={`nav__item${onDashboard ? ' active' : ''}`}>
            <HomeIcon />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/dashboard/tasks" className="nav__item">
            <ListIcon />
            <span>My Tasks</span>
          </NavLink>
          <SoonItem icon={<FolderIcon />} label="Projects" />
          <NavLink to="/dashboard/team" className="nav__item">
            <UsersIcon />
            <span>Team</span>
          </NavLink>
          <SoonItem icon={<BellIcon />} label="Notifications" />
        </nav>

        <div className="sidebar__user">
          <Avatar name={name} seed={session?.user.id} size={32} />
          <div className="sidebar__user-text">
            <span className="sidebar__user-name">{shortName(name)}</span>
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
