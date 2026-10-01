import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <main className="page-center">
      <h1>You're probably lost little guy.</h1>
      <Link to="/dashboard">Back to dashboard</Link>
    </main>
  )
}
