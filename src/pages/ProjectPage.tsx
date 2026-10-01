import { useParams } from 'react-router-dom'

export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>()

  return (
    <section>
      <h1>Project {projectId}</h1>
      <p className="muted">To-dos, responsibilities and active members go here.</p>
    </section>
  )
}
