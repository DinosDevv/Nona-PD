import type { ProjectStatus, ProjectSummary } from '../api/projects'
import { entryMs } from './timeView'

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planned: 'Planned',
  active: 'Active',
  on_hold: 'On Hold',
  completed: 'Completed',
}

export function statusCounts(projects: { status: ProjectStatus }[]) {
  const count = (s: ProjectStatus) => projects.filter((p) => p.status === s).length
  return { total: projects.length, active: count('active'), onHold: count('on_hold'), completed: count('completed') }
}

// The creator if they're still a PM, otherwise the first PM listed
export function projectManager(project: ProjectSummary) {
  const managers = project.project_members.filter((m) => m.role === 'manager')
  const pm = managers.find((m) => m.user_id === project.created_by) ?? managers[0]
  return pm ? { id: pm.user_id, name: pm.profiles?.full_name ?? 'Unknown' } : null
}

// Total tracked time on a project; running timers count up to now
export function projectTimeMs(project: ProjectSummary, now = Date.now()) {
  return project.todos.reduce(
    (sum, t) => sum + t.time_entries.reduce((s, e) => s + entryMs(e, now), 0),
    0,
  )
}

export function hasRunningTimer(project: ProjectSummary) {
  return project.todos.some((t) => t.time_entries.some((e) => !e.ended_at))
}
