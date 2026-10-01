import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useProject } from '../hooks/useProject'
import { PROJECT_STATUS_LABELS } from '../lib/projectView'
import { filterAndSort, progressOf, STATE_LABELS, type SortKey, type StateFilter } from '../lib/todoView'
import Avatar, { AvatarStack } from '../components/Avatar'
import Modal from '../components/Modal'
import TodoRow from '../components/TodoRow'
import TodoDetail from '../components/TodoDetail'
import PendingRequests from '../components/PendingRequests'
import MembersPanel from '../components/MembersPanel'
import ProjectSettingsModal from '../components/ProjectSettingsModal'
import RequestAssignmentModal from '../components/RequestAssignmentModal'
import { ArrowLeftIcon, PlusIcon, SearchIcon, SettingsIcon } from '../components/icons'
import './ProjectPage.css'

type Tab = 'todos' | 'members'

const FILTERS: { value: StateFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'undone', label: STATE_LABELS.undone },
  { value: 'in_progress', label: STATE_LABELS.in_progress },
  { value: 'done', label: STATE_LABELS.done },
]

export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const {
    project,
    members = [],
    responsibilities = [],
    todos = [],
    loading,
    error,
    memberName,
    canEdit,
    isAssignee,
    addTodo,
    changeState,
    addNote,
    isManager,
    myRequestId,
    canRequest,
    requestAssignment,
    withdrawRequest,
    resolveRequest,
    creatorId,
    nonMembers,
    assignable,
    addMember,
    setMemberRole,
    removeMember,
    assign,
    unassign,
    updateProject,
    deleteProject,
  } = useProject(projectId!)
  const navigate = useNavigate()
  const [showSettings, setShowSettings] = useState(false)
  const [requestTaskId, setRequestTaskId] = useState<string | null>(null)

  const [tab, setTab] = useState<Tab>('todos')
  const [filter, setFilter] = useState<StateFilter>('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortKey>('deadline')
  const [searchParams] = useSearchParams()
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get('todo'))

  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newDeadline, setNewDeadline] = useState('')

  async function handleAddTodo(e: FormEvent) {
    e.preventDefault()
    if (await addTodo({ title: newTitle, description: newDescription, deadline: newDeadline })) {
      setNewTitle('')
      setNewDescription('')
      setNewDeadline('')
      setShowForm(false)
    }
  }

  if (loading) return <p className="muted">Loading…</p>
  if (!project) return <p className="muted">{error ?? "Project not found, or you're not a member."}</p>

  const people = (ids: string[]) => ids.map((id) => ({ id, name: memberName(id) }))
  const visibleTodos = filterAndSort(todos, filter, search, sort)
  const selected = todos.find((t) => t.id === selectedId) ?? visibleTodos[0] ?? null
  const progress = progressOf(todos)

  return (
    <div className="project">
      <header className="project-header">
        <Link to="/dashboard" className="back-link">
          <ArrowLeftIcon /> Projects
        </Link>
        <div className="project-header__main">
          <Avatar name={project.name} seed={project.id} size={44} square />
          <div className="project-header__text">
            <h1>{project.name}</h1>
            {project.description && <p className="muted">{project.description}</p>}
            <div className="project-header__progress">
              <div className="progress">
                <div className="progress__bar" style={{ width: `${progress.percent}%` }} />
              </div>
              <span className="muted small">{progress.done}/{progress.total} done</span>
            </div>
          </div>
          <div className="project-header__side">
            <div className="row">
              <AvatarStack people={members.map((m) => ({ id: m.user_id, name: memberName(m.user_id) }))} size={32} />
              {isManager && (
                <button className="button--ghost" onClick={() => setShowSettings(true)}>
                  <SettingsIcon /> Project Settings
                </button>
              )}
            </div>
            <span className={`badge badge--project-${project.status}`}>{PROJECT_STATUS_LABELS[project.status]}</span>
          </div>
        </div>

        <nav className="tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'todos'} onClick={() => setTab('todos')}>To-Do</button>
          <button role="tab" aria-selected={tab === 'members'} onClick={() => setTab('members')}>
            Members <span className="muted">{members.length}</span>
          </button>
          <button role="tab" disabled title="Coming soon">Activity</button>
          <button role="tab" disabled title="Coming soon">Files</button>
        </nav>
      </header>

      {error && <p className="error">{error}</p>}

      {tab === 'members' ? (
        <MembersPanel
          members={members}
          responsibilities={responsibilities}
          isManager={isManager}
          creatorId={creatorId}
          nonMembers={nonMembers}
          onAdd={addMember}
          onSetRole={setMemberRole}
          onRemove={removeMember}
        />
      ) : (
        <>
          {isManager && (
            <PendingRequests
              requests={todos.flatMap((t) =>
                t.assignment_requests.map((r) => ({
                  id: r.id,
                  requesterName: memberName(r.user_id),
                  todoTitle: t.title,
                  message: r.message,
                })),
              )}
              onResolve={resolveRequest}
            />
          )}

          <div className="board">
            <section className="board__list">
              <div className="toolbar">
                <div className="segmented" role="group" aria-label="Filter by state">
                  {FILTERS.map((f) => (
                    <button key={f.value} aria-pressed={filter === f.value} onClick={() => setFilter(f.value)}>
                      {f.label}
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowForm(true)}>
                  <PlusIcon /> New To-Do
                </button>
              </div>

              <div className="toolbar">
                <label className="search">
                  <SearchIcon />
                  <input placeholder="Search tasks…" value={search} onChange={(e) => setSearch(e.target.value)} />
                </label>
                <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Sort">
                  <option value="deadline">Sort: Deadline</option>
                  <option value="newest">Sort: Newest</option>
                  <option value="title">Sort: Title</option>
                </select>
              </div>

              {visibleTodos.length === 0 ? (
                <p className="muted board__empty">{todos.length === 0 ? 'No to-dos yet.' : 'No to-dos match.'}</p>
              ) : (
                <ul className="todo-list">
                  {visibleTodos.map((todo) => (
                    <TodoRow
                      key={todo.id}
                      todo={todo}
                      assignees={people(todo.todo_assignees.map((a) => a.user_id))}
                      selected={selected?.id === todo.id}
                      canEdit={canEdit(todo)}
                      onSelect={() => setSelectedId(todo.id)}
                      onToggleDone={() => changeState(todo.id, todo.state === 'done' ? 'undone' : 'done')}
                    />
                  ))}
                </ul>
              )}
            </section>

            <section className="card board__detail">
              {selected ? (
                <TodoDetail
                  key={selected.id}
                  todo={selected}
                  creator={selected.created_by ? { id: selected.created_by, name: memberName(selected.created_by) } : null}
                  assignees={people(selected.todo_assignees.map((a) => a.user_id))}
                  notes={selected.todo_notes.map((n) => ({
                    id: n.id,
                    authorName: memberName(n.user_id),
                    body: n.body,
                    createdAt: n.created_at,
                  }))}
                  requests={selected.assignment_requests.map((r) => ({
                    id: r.id,
                    userId: r.user_id,
                    name: memberName(r.user_id),
                    message: r.message,
                  }))}
                  assignable={people(assignable(selected).map((m) => m.user_id))}
                  myRequestId={myRequestId(selected)}
                  canEdit={canEdit(selected)}
                  canAddNote={isAssignee(selected)}
                  canRequest={canRequest(selected)}
                  isManager={isManager}
                  onChangeState={(state) => changeState(selected.id, state)}
                  onAddNote={(body) => addNote(selected.id, body)}
                  onRequest={() => setRequestTaskId(selected.id)}
                  onWithdraw={withdrawRequest}
                  onResolve={resolveRequest}
                  onAssign={(uid) => assign(selected.id, uid)}
                  onUnassign={(uid) => unassign(selected.id, uid)}
                />
              ) : (
                <p className="muted">Select a to-do to see its details.</p>
              )}
            </section>
          </div>
        </>
      )}

      {requestTaskId && (
        <RequestAssignmentModal
          tasks={todos.filter((t) => canRequest(t) && !myRequestId(t)).map((t) => ({ id: t.id, title: t.title }))}
          initialTaskId={requestTaskId}
          onClose={() => setRequestTaskId(null)}
          onSend={requestAssignment}
        />
      )}

      {showSettings && (
        <ProjectSettingsModal
          project={project}
          onClose={() => setShowSettings(false)}
          onSave={updateProject}
          onDelete={async () => {
            if (await deleteProject()) navigate('/dashboard')
          }}
        />
      )}

      {showForm && (
        <Modal title="New To-Do" description="You'll be assigned to it automatically." onClose={() => setShowForm(false)}>
          <form className="stack" onSubmit={handleAddTodo}>
            <label className="field">
              Title
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required autoFocus />
            </label>
            <label className="field">
              Description
              <textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows={3} />
            </label>
            <label className="field">
              Due (optional)
              <input type="datetime-local" value={newDeadline} onChange={(e) => setNewDeadline(e.target.value)} />
            </label>
            <div className="modal__actions">
              <button type="button" className="button--ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit">Add To-Do</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
