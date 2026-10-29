import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/useAuth'
import { shortName } from '../lib/people'
import { useMyProfile } from '../hooks/useMyProfile'
import { useMyTaskCount } from '../hooks/useMyTaskCount'
import { useUnreadCount } from '../hooks/useNotifications'
import Avatar from './Avatar'
import RunningTimerPill from './RunningTimerPill'
import { BellIcon, ClockIcon, FolderIcon, HomeIcon, ListIcon, LogOutIcon, MoreIcon, UsersIcon } from './icons'
import './Layout.css'
import './Nav.css'

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
  // Phones: Team & Notifications live behind "More"
  const [moreOpen, setMoreOpen] = useState(false)
  const onTeamPages = pathname.startsWith('/dashboard/team') || pathname.startsWith('/dashboard/notifications')

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
            <span>Today</span>
          </NavLink>
          <NavLink to="/dashboard/history" className="nav__item">
            <ClockIcon />
            <span>History</span>
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

          <span className="nav__section">Team</span>
          <NavLink to="/dashboard/team" className="nav__item nav__item--team">
            <UsersIcon />
            <span>Team</span>
          </NavLink>
          <NavLink to="/dashboard/notifications" className="nav__item nav__item--team">
            <BellIcon />
            <span>Notifications</span>
            <Count n={unread} />
          </NavLink>

          <button
            type="button"
            className={`nav__item nav__more${onTeamPages ? ' active' : ''}`}
            aria-expanded={moreOpen}
            onClick={() => setMoreOpen((v) => !v)}
          >
            <MoreIcon />
            <span>More</span>
            <Count n={unread} />
          </button>
        </nav>

        {moreOpen && (
          <div className="more-sheet__backdrop" onClick={() => setMoreOpen(false)}>
            <div className="more-sheet" onClick={(e) => e.stopPropagation()}>
              <NavLink to="/dashboard/team" className="nav__item" onClick={() => setMoreOpen(false)}>
                <UsersIcon />
                <span>Team</span>
              </NavLink>
              <NavLink to="/dashboard/notifications" className="nav__item" onClick={() => setMoreOpen(false)}>
                <BellIcon />
                <span>Notifications</span>
                <Count n={unread} />
              </NavLink>
            </div>
          </div>
        )}

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
