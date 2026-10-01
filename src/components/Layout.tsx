import { Link, Outlet } from 'react-router-dom'
import './Layout.css'

export default function Layout() {
  return (
    <div className="layout">
      <header className="layout__header">
        <Link to="/dashboard" className="layout__brand">Nona PD</Link>
      </header>
      <main className="layout__main">
        <Outlet />
      </main>
    </div>
  )
}
