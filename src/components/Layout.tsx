import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/useAuth'
import { shortName } from '../lib/people'
import { useMyProfile } from '../hooks/useMyProfile'
import { useMyTaskCount } from '../hooks/useMyTaskCount'
import { useUnreadCount } from '../hooks/useNotifications'
import Avatar from './Avatar'
import RunningTimerPill from './RunningTimerPill'
import { BellIcon, FolderIcon, HomeIcon, ListIcon, LogOutIcon, UsersIcon } from './icons'
import './Layout.css'

function Count({ n }: { n: number }) {
  return n > 0 ? <span className="nav__count">{n > 99 ? '99+' : n}</span> : null
}

export default function Layout() {
  const { session } = useAuth()
  const email = session?.user.email ?? ''
  const { name } = useMyProfile()
  const taskCount = useMyTaskCount()
  const unread = useUnreadCount()
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
            <Count n={taskCount} />
          </NavLink>
          <NavLink to="/dashboard/projects" className="nav__item">
            <FolderIcon />
            <span>Projects</span>
          </NavLink>
          <NavLink to="/dashboard/team" className="nav__item">
            <UsersIcon />
            <span>Team</span>
          </NavLink>
          <NavLink to="/dashboard/notifications" className="nav__item">
            <BellIcon />
            <span>Notifications</span>
            <Count n={unread} />
          </NavLink>
        </nav>

        <RunningTimerPill />

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
