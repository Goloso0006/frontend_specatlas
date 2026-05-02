import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { projectFacade } from '../facades/project.facade'
import { useApiOperation } from '../hooks/useLoadingError'
import { PageShell } from '../components/layout/PageShell'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import type { ProjectResponse } from '../types/projects'

export function ProjectWorkspacePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState<ProjectResponse | null>(null)
  const { run } = useApiOperation()

  useEffect(() => {
    if (!id) return
    run(async () => {
      const data = await projectFacade.getProject(id)
      setProject(data)
    })
  }, [id])

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
                <Button onClick={() => navigate('/app/requirements')} variant="secondary">Requisitos</Button>
                <Button onClick={() => navigate('/app/diagrams')} variant="secondary">Diagramas</Button>
                <Button onClick={() => navigate('/app/validation-rules')} variant="secondary">Reglas</Button>
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
