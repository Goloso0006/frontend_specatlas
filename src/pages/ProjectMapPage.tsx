import { useMemo, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { requirementFacade } from '../facades/requirement.facade'
import { graphApi } from '../api/services/graphApi'
import { useResourceLoader } from '../hooks/useResourceLoader'
import { useProject, isValidProjectId } from '../context/ProjectContext'
import { NoProjectSelected } from '../components/ui/NoProjectSelected'
import { RequirementGraphFlow } from '../components/graph/RequirementGraphFlow'

export function ProjectMapPage() {
  const { projectId: routeProjectId } = useParams()
  const { projectId: contextProjectId } = useProject()
  const navigate = useNavigate()

  const projectId = routeProjectId ?? contextProjectId ?? ''
  const mapResource = useResourceLoader(
    async (activeProjectId: string) => {
      const reqs = await requirementFacade.getRequirementsByProject(activeProjectId)
      try {
        const graph = await graphApi.inferRelations(activeProjectId, reqs)
        return { requirements: reqs, graphData: graph }
      } catch {
        return { requirements: reqs, graphData: null }
      }
    },
    { errorMessage: 'Error al cargar el mapa del proyecto.' },
  )

  const requirements = mapResource.data?.requirements ?? []
  const graphData = mapResource.data?.graphData ?? null
  const isLoading = mapResource.isLoading


  const cacheKey = projectId ? `req-map:${projectId}` : null

  // On mount / project change: try loading from cache first. If no cache, autoload.
  useEffect(() => {
    if (!isValidProjectId(projectId) || projectId.startsWith('USR-')) return
    if (!cacheKey) return

    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        mapResource.setData(parsed)
        return
      } catch (err) {
        // ignore parse errors and fall through to load
      }
    }

    // No cache: auto-load once
    void mapResource.load(projectId).then((res) => {
      if (res && cacheKey) localStorage.setItem(cacheKey, JSON.stringify(res))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const handleUpdate = useCallback(() => {
    if (!isValidProjectId(projectId) || projectId.startsWith('USR-')) return
    if (!projectId) return
    // Force reload and update cache
    void mapResource.load(projectId).then((res) => {
        if (res && cacheKey) {
        try {
          localStorage.setItem(cacheKey, JSON.stringify(res))
        } catch {}
      }
    })
  }, [mapResource, projectId, cacheKey])

  const content = useMemo(() => ({ requirements, graphData }), [requirements, graphData])

  if (!isValidProjectId(projectId)) {
    return <NoProjectSelected message="Selecciona un proyecto para ver el mapa de requisitos." />
  }

  if (projectId.startsWith('USR-')) {
    return <NoProjectSelected message="ID de proyecto inválido." />
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-(--color-bg)">
      <div className="max-w-6xl mx-auto w-full px-6 md:px-8 pt-12 pb-20 space-y-8">
        <div>
          <button
            onClick={() => navigate(`/app/projects/${projectId}/requirements`)}
            className="mb-4 inline-flex items-center gap-2 text-[12px] font-medium text-(--color-text-muted) hover:text-(--color-text-primary) transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver
          </button>
          
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono font-medium uppercase tracking-[0.16em] text-(--color-accent)">
              // trazabilidad global
            </span>
            <button
              onClick={handleUpdate}
              disabled={mapResource.isLoading}
              title="Actualiza el mapa (solicita al servicio/IA)"
              className="ml-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-[var(--color-surface)] hover:bg-[var(--color-surface)]/90 border border-[var(--color-border)]"
            >
              Actualizar
            </button>
          </div>
          <h1 className="mt-1.5 text-3xl md:text-4xl font-extrabold tracking-tight text-(--color-text-primary) leading-tight">
            Mapa de requisitos
          </h1>
          <p className="mt-2.5 text-base text-(--color-text-secondary) leading-relaxed max-w-xl">
            Visualiza la trazabilidad completa entre requisitos funcionales y no funcionales de tu proyecto.
          </p>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-(--color-border) bg-(--color-bg-card)">
            <div className="flex flex-col items-center gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-(--color-border-strong) border-t-(--color-accent)" />
              <p className="text-sm font-medium text-(--color-text-muted)">Cargando mapa...</p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-(--color-bg-card) shadow-sm">
            <RequirementGraphFlow
              requirements={content.requirements}
              graphData={content.graphData}
              mode="project-map"
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default ProjectMapPage
