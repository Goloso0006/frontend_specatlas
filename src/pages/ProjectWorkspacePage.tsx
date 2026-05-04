import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { projectFacade } from '../facades/project.facade'
import { useProject, isValidProjectId } from '../context/ProjectContext'
import { useApiOperation } from '../hooks/useLoadingError'
import { PageShell } from '../components/layout/PageShell'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { NoProjectSelected } from '../components/ui/NoProjectSelected'
import type { ProjectResponse } from '../types/projects'

export function ProjectWorkspacePage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState<ProjectResponse | null>(null)
  const { run } = useApiOperation()
  const { selectProject } = useProject()

  useEffect(() => {
    if (!isValidProjectId(projectId)) return

    run(async () => {
      const data = await projectFacade.getProject(projectId)
      setProject(data)
      // Also set this project in the global context so other pages can access it
      await selectProject(projectId)
    })
  }, [projectId])

  if (!isValidProjectId(projectId)) {
    return (
      <PageShell>
        <NoProjectSelected message="El ID de proyecto en la URL no es válido." />
      </PageShell>
    )
  }

  if (!project) {
    return (
      <PageShell>
        <PageHeader title="Proyecto" description="Cargando..." />
      </PageShell>
    )
  }

  return (
    <PageShell>
      <PageHeader
        title={project.name}
        description={project.description || 'Sin descripción'}
        action={<Button onClick={() => navigate('/app/projects')}>Volver a Proyectos</Button>}
      />

      <section className="max-w-6xl mx-auto p-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="col-span-2 space-y-4">
            <div className="rounded-xl border app-border-strong app-card p-6">
              <h3 className="font-semibold mb-3">Resumen del proyecto</h3>
              <p className="text-sm app-text-secondary">{project.description || 'Sin descripción'}</p>
            </div>

            <div className="rounded-xl border app-border-strong app-card p-6">
              <h3 className="font-semibold mb-3">Módulos</h3>
              <div className="space-y-2">
                <Button onClick={() => navigate(`/app/projects/${project.id}/requirements`)} variant="secondary">Requisitos</Button>
                <Button onClick={() => navigate(`/app/projects/${project.id}/diagrams`)} variant="secondary">Diagramas</Button>
                <Button onClick={() => navigate(`/app/projects/${project.id}/validation-rules`)} variant="secondary">Reglas</Button>
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-xl border app-border-strong app-card p-4">
              <h4 className="font-medium mb-2">Estado</h4>
              <div className="text-sm">{project.status}</div>
            </div>

            <div className="rounded-xl border app-border-strong app-card p-4">
              <h4 className="font-medium mb-2">Metadatos</h4>
              <div className="text-sm text-app-text-muted">ID: {project.id}</div>
              <div className="text-sm text-app-text-muted">Owner: {project.ownerId}</div>
            </div>
          </aside>
        </div>
      </section>
    </PageShell>
  )
}

export default ProjectWorkspacePage
