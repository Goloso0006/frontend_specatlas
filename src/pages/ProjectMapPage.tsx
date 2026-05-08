import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { requirementFacade } from '../facades/requirement.facade'
import { graphApi } from '../api/services/graphApi'
import { useApiOperation } from '../hooks/useLoadingError'
import { useProject, isValidProjectId } from '../context/ProjectContext'
import { NoProjectSelected } from '../components/ui/NoProjectSelected'
import { RequirementGraphFlow } from '../components/graph/RequirementGraphFlow'
import type { RequirementDTO } from '../types/requirements'

export function ProjectMapPage() {
  const { projectId: routeProjectId } = useParams()
  const { projectId: contextProjectId } = useProject()
  const navigate = useNavigate()

  const projectId = routeProjectId ?? contextProjectId ?? ''

  const [requirements, setRequirements] = useState<RequirementDTO[]>([])
  const [graphData, setGraphData] = useState<any>(null)
  
  const { run: runLoad, isLoading } = useApiOperation()

  useEffect(() => {
    if (!isValidProjectId(projectId) || projectId.startsWith('USR-')) return

    void runLoad(async () => {
      // Intentamos cargar el grafo completo inferido del proyecto
      // Si el endpoint no existe o falla, cargamos requisitos como fallback
      try {
        const reqs = await requirementFacade.getRequirementsByProject(projectId)
        setRequirements(reqs)

        // Usamos el endpoint de inferencia como aproximación al mapa completo
        const graph = await graphApi.inferRelations(projectId, reqs)
        setGraphData(graph)
      } catch (e) {
        // Fallback gracefully si el grafo falla
      }
    }, {
      operationName: 'loadProjectMap',
      errorMessage: 'Error al cargar el mapa del proyecto.',
    })
  }, [projectId, runLoad])

  if (!isValidProjectId(projectId)) {
    return <NoProjectSelected message="Selecciona un proyecto para ver el mapa de requisitos." />
  }

  if (projectId.startsWith('USR-')) {
    return <NoProjectSelected message="ID de proyecto inválido." />
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[var(--color-bg)]">
      <div className="max-w-6xl mx-auto w-full px-6 md:px-8 pt-12 pb-20 space-y-8">
        <div>
          <button
            onClick={() => navigate(`/app/projects/${projectId}/requirements`)}
            className="mb-4 inline-flex items-center gap-2 text-[12px] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver
          </button>
          
          <span className="text-[11px] font-mono font-medium uppercase tracking-[0.16em] text-[var(--color-accent)]">
            // trazabilidad global
          </span>
          <h1 className="mt-1.5 text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--color-text-primary)] leading-tight">
            Mapa de requisitos
          </h1>
          <p className="mt-2.5 text-base text-[var(--color-text-secondary)] leading-relaxed max-w-xl">
            Visualiza la trazabilidad completa entre requisitos funcionales y no funcionales de tu proyecto.
          </p>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)]">
            <div className="flex flex-col items-center gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-border-strong)] border-t-[var(--color-accent)]" />
              <p className="text-sm font-medium text-[var(--color-text-muted)]">Cargando mapa...</p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-[var(--color-bg-card)] shadow-sm">
            <RequirementGraphFlow
              requirements={requirements}
              graphData={graphData}
              mode="project-map"
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default ProjectMapPage
