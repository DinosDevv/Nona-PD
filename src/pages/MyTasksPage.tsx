import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMyTasks } from '../hooks/useMyTasks'
import type { MyTask } from '../api/todos'
import { STATE_LABELS, dueLabel, isDueSoon, isOverdue } from '../lib/todoView'
import Avatar from '../components/Avatar'
import { AlertIcon, CalendarIcon, ChevronRightIcon } from '../components/icons'
import '../components/TodoRow.css'
import './MyTasksPage.css'

type Tab = 'all' | 'overdue' | 'due_soon'

function TaskRow({ task, onOpen, onDone }: { task: MyTask; onOpen: () => void; onDone: () => void }) {
  const overdue = isOverdue(task)
  const dueSoon = !overdue && isDueSoon(task)

  return (
    <li className="todo-row" onClick={onOpen} onKeyDown={(e) => e.key === 'Enter' && onOpen()} tabIndex={0}>
      <button
        type="button"
        className={`state-box state-box--${overdue ? 'overdue' : task.state}`}
        title="Mark as done"
        aria-label={`Mark ${task.title} as done`}
        onClick={(e) => {
          e.stopPropagation()
          onDone()
        }}
      />
      <div className="todo-row__main">
        <span className="todo-row__title">{task.title}</span>
        {task.projects && (
          <span className="todo-row__people">
            <Avatar name={task.projects.name} seed={task.projects.id} size={18} square />
            <span>{task.projects.name}</span>
          </span>
        )}
      </div>
      <span className={`todo-row__due${overdue ? ' todo-row__due--overdue' : ''}`}>
        <CalendarIcon />
        {dueLabel(task.deadline)}
      </span>
      {overdue ? (
        <span className="badge badge--overdue"><AlertIcon /> Overdue</span>
      ) : dueSoon ? (
        <span className="badge badge--in_progress">Due soon</span>
      ) : (
        <span className={`badge badge--${task.state}`}>{STATE_LABELS[task.state]}</span>
      )}
      <span className="my-tasks__chevron"><ChevronRightIcon /></span>
    </li>
  )
}

export default function MyTasksPage() {
  const navigate = useNavigate()
  const { tasks, error, changeState } = useMyTasks()
  const [tab, setTab] = useState<Tab>('all')

  const all = tasks ?? []
  const overdue = all.filter((t) => isOverdue(t))
  const dueSoon = all.filter((t) => !isOverdue(t) && isDueSoon(t))
  const shown = tab === 'overdue' ? overdue : tab === 'due_soon' ? dueSoon : all

  const tabs: { value: Tab; label: string; count: number }[] = [
    { value: 'all', label: 'All', count: all.length },
    { value: 'overdue', label: 'Overdue', count: overdue.length },
    { value: 'due_soon', label: 'Due Soon', count: dueSoon.length },
  ]

  return (
    <div className="my-tasks">
      <div>
        <h1>My Tasks</h1>
        <p className="muted">All tasks assigned to you across all projects.</p>
      </div>
      {error && <p className="error">{error}</p>}

      <div className="segmented" role="group" aria-label="Filter tasks">
        {tabs.map((t) => (
          <button key={t.value} aria-pressed={tab === t.value} onClick={() => setTab(t.value)}>
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {tasks === null ? (
        <p className="muted">Loading…</p>
      ) : shown.length === 0 ? (
        <p className="muted my-tasks__empty">
          {tab === 'all' ? 'Nothing assigned to you right now.' : 'Nothing here.'}
        </p>
      ) : (
        <ul className="todo-list">
          {shown.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onOpen={() => navigate(`/dashboard/project/${task.project_id}?todo=${task.id}`)}
              onDone={() => changeState(task.id, 'done')}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
