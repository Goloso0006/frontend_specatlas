import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { projectFacade } from '../facades/project.facade'
import { validationRuleFacade } from '../facades/validationRule.facade'
import { useApiOperation } from '../hooks/useLoadingError'
import { isValidProjectId } from '../context/ProjectContext'
import type { ProjectResponse } from '../types/projects'
import type { ValidationRuleResponse } from '../types/validationRules'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'

export function ProjectInfoPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState<ProjectResponse | null>(null)
  const [rules, setRules] = useState<ValidationRuleResponse[]>([])
  const { run } = useApiOperation()

  useEffect(() => {
    if (!isValidProjectId(projectId)) return

    run(async () => {
      const [projData, rulesData] = await Promise.all([
        projectFacade.getProject(projectId),
        validationRuleFacade.getRulesByProject(projectId)
      ])
      setProject(projData)
      setRules(rulesData)
    })
  }, [projectId])

  if (!isValidProjectId(projectId)) return null

  return (
    <div className="min-h-screen bg-app-bg">
      <nav className="h-16 px-8 flex items-center justify-between border-b border-app-border bg-white dark:bg-[#1e1e1e]">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/app/projects/${projectId}`)}
            className="text-app-text-muted hover:text-app-text-primary transition-colors text-sm font-medium"
          >
            ← Hub
          </button>
          <div className="h-4 w-[1px] bg-app-border" />
          <span className="font-semibold app-text-primary tracking-tight">Información del Proyecto</span>
        </div>
        <Button variant="secondary" size="sm" onClick={() => navigate(`/app/projects/${projectId}/edit`)}>
          Editar Proyecto
        </Button>
      </nav>

      <main className="max-w-4xl mx-auto py-12 px-8 space-y-12">
        {/* Project Details */}
        <section className="space-y-6">
          <div className="border-b border-app-border pb-4">
            <h2 className="text-2xl font-bold tracking-tight">Detalles Generales</h2>
          </div>
          
          <div className="grid gap-8 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-[12px] font-bold uppercase tracking-wider text-app-text-muted">Nombre</label>
              <p className="text-lg font-medium">{project?.name || 'Cargando...'}</p>
            </div>
            <div className="space-y-1">
              <label className="text-[12px] font-bold uppercase tracking-wider text-app-text-muted">Estado</label>
              <div>
                <Badge variant={project?.status === 'ACTIVE' ? 'success' : 'neutral'}>
                  {project?.status || '...'}
                </Badge>
              </div>
            </div>
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[12px] font-bold uppercase tracking-wider text-app-text-muted">Descripción</label>
              <p className="text-[15px] app-text-secondary leading-relaxed">
                {project?.description || 'Sin descripción.'}
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-[12px] font-bold uppercase tracking-wider text-app-text-muted">ID del Proyecto</label>
              <p className="text-sm font-mono text-app-text-muted">{project?.id}</p>
            </div>
            <div className="space-y-1">
              <label className="text-[12px] font-bold uppercase tracking-wider text-app-text-muted">Propietario</label>
              <p className="text-sm text-app-text-muted">{project?.ownerId}</p>
            </div>
          </div>
        </section>

        {/* Rules Summary */}
        <section className="space-y-6">
          <div className="border-b border-app-border pb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Reglas de Validación</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate(`/app/projects/${projectId}/validation-rules`)}>
              Gestionar Reglas
            </Button>
          </div>

          {rules.length === 0 ? (
            <div className="p-12 text-center bg-app-surface rounded-2xl border border-dashed border-app-border">
              <p className="app-text-secondary">No hay reglas definidas para este proyecto.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {rules.map(rule => (
                <div key={rule.id} className="p-4 bg-white dark:bg-[#1e1e1e] border border-app-border rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold">{rule.name}</h3>
                    <Badge variant={rule.severity === 'ERROR' ? 'danger' : rule.severity === 'WARN' ? 'warning' : 'neutral'}>
                      {rule.severity}
                    </Badge>
                  </div>
                  <p className="text-sm app-text-secondary">{rule.description}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
