import { useState, type FormEvent } from 'react'
import { useProjects } from '../hooks/useProjects'
import { useMyTasks } from '../hooks/useMyTasks'
import { useSession } from '../lib/useSession'
import { lastProject } from '../lib/sessionView'
import { PlayIcon } from './icons'
import './Session.css'

type Props = {
  onStarted?: () => void
  compact?: boolean
}

export default function SessionLauncher({ onStarted, compact }: Props) {
  const { start } = useSession()
  const { projects } = useProjects()
  const { tasks } = useMyTasks()
  const [pickedProject, setPickedProject] = useState<string | null>(null)
  const [todoId, setTodoId] = useState('')
  const [starting, setStarting] = useState(false)

  // Projects you can log time on: everything except completed ones
  const options = (projects ?? []).filter((p) => p.status !== 'completed')
  const remembered = lastProject()
  const projectId =
    pickedProject ?? (options.some((p) => p.id === remembered) ? remembered : options[0]?.id) ?? ''
  const todos = (tasks ?? []).filter((t) => t.project_id === projectId)

  async function handleStart(e: FormEvent) {
    e.preventDefault()
    if (!projectId) return
    setStarting(true)
    await start(projectId, todoId || null)
    setStarting(false)
    onStarted?.()
  }

  if (projects !== null && options.length === 0) {
    return <p className="muted small">Create a project first, then you can start logging sessions.</p>
  }

  return (
    <form className={`launcher${compact ? ' launcher--compact' : ''}`} onSubmit={handleStart}>
      <label className="field">
        Project
        <select
          value={projectId}
          onChange={(e) => {
            setPickedProject(e.target.value)
            setTodoId('')
          }}
          required
        >
          {options.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </label>
      <label className="field">
        To-do (optional)
        <select value={todoId} onChange={(e) => setTodoId(e.target.value)}>
          <option value="">No specific to-do</option>
          {todos.map((t) => (
            <option key={t.id} value={t.id}>{t.title}</option>
          ))}
        </select>
      </label>
      <button type="submit" className="launcher__start" disabled={starting || !projectId}>
        <PlayIcon /> {starting ? 'Starting…' : 'Start session'}
      </button>
      <span className="muted small launcher__hint">
        Tip: <kbd>Alt</kbd> + <kbd>S</kbd> starts or stops from anywhere
      </span>
    </form>
  )
}
