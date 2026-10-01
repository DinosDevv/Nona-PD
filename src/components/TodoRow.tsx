import type { Todo } from '../api/todos'
import { STATE_LABELS, dueLabel, isOverdue } from '../lib/todoView'
import { shortName } from '../lib/people'
import { AvatarStack } from './Avatar'
import { AlertIcon, CalendarIcon, CheckIcon } from './icons'

type Props = {
  todo: Todo
  assignees: { id: string; name: string }[]
  selected: boolean
  canEdit: boolean
  onSelect: () => void
  onToggleDone: () => void
}

export default function TodoRow({ todo, assignees, selected, canEdit, onSelect, onToggleDone }: Props) {
  const overdue = isOverdue(todo)
  const done = todo.state === 'done'

  return (
    <li
      className={`todo-row${selected ? ' todo-row--selected' : ''}${overdue ? ' todo-row--overdue' : ''}`}
      onClick={onSelect}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
      tabIndex={0}
      aria-current={selected}
    >
      <button
        type="button"
        className={`state-box state-box--${overdue ? 'overdue' : todo.state}`}
        disabled={!canEdit}
        title={canEdit ? (done ? 'Mark as not done' : 'Mark as done') : STATE_LABELS[todo.state]}
        aria-label={done ? `Mark ${todo.title} as not done` : `Mark ${todo.title} as done`}
        onClick={(e) => {
          e.stopPropagation()
          onToggleDone()
        }}
      >
        {done && <CheckIcon />}
      </button>

      <div className="todo-row__main">
        <span className={`todo-row__title${done ? ' todo-row__title--done' : ''}`}>{todo.title}</span>
        <span className="todo-row__people">
          {assignees.length > 0 ? (
            <>
              <AvatarStack people={assignees} size={18} max={3} />
              <span>{assignees.map((a) => shortName(a.name)).join(', ')}</span>
            </>
          ) : (
            <span>Unassigned</span>
          )}
        </span>
      </div>

      <span className={`todo-row__due${overdue ? ' todo-row__due--overdue' : ''}`}>
        <CalendarIcon />
        {dueLabel(todo.deadline)}
      </span>

      {overdue ? (
        <span className="badge badge--overdue"><AlertIcon /> Overdue</span>
      ) : (
        <span className={`badge badge--${todo.state}`}>{STATE_LABELS[todo.state]}</span>
      )}
    </li>
  )
}
