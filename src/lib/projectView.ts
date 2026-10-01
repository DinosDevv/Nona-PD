import type { ProjectSummary } from '../api/projects'

// The creator if they're still a PM, otherwise the first PM listed
export function projectManager(project: ProjectSummary) {
  const managers = project.project_members.filter((m) => m.role === 'manager')
  const pm = managers.find((m) => m.user_id === project.created_by) ?? managers[0]
  return pm ? { id: pm.user_id, name: pm.profiles?.full_name ?? 'Unknown' } : null
}
