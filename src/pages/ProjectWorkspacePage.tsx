import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { projectFacade } from '../facades/project.facade'
import { useProject, isValidProjectId } from '../context/ProjectContext'
import { useApiOperation } from '../hooks/useLoadingError'
import { requirementFacade } from '../facades/requirement.facade'
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
      await selectProject(projectId)

      const skipKey = `iso_rules_skipped_${projectId}`
      const skipped = localStorage.getItem(skipKey)
      if (skipped !== '1') {
        const validationRules = await requirementFacade.listValidationRules(projectId)

        // If the project does not yet have ISO rules saved, return to the onboarding step.
        if (validationRules.length === 0) {
          navigate(`/app/projects/${projectId}/iso-rules`)
        }
      }
    })
  }, [projectId, navigate, run, selectProject])

  if (!isValidProjectId(projectId)) {
    return <NoProjectSelected message="El ID de proyecto en la URL no es válido." />
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-(--color-bg)">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-48 bg-(--color-bg-card) rounded-lg" />
          <div className="h-4 w-64 bg-(--color-bg-card) rounded-lg" />
        </div>
      </div>
    )
  }

  const hubCards = [
    {
      title: 'Requisitos',
      description: 'Define, organiza y gestiona los requerimientos funcionales y no funcionales.',
      icon: (
        <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      path: `/app/projects/${project.id}/requirements`
    },
    {
      title: 'Diagramas',
      description: 'Modela la arquitectura, flujos y componentes de tu sistema visualmente.',
      icon: (
        <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      ),
      path: `/app/projects/${project.id}/diagrams`
    },
    {
      title: 'Documentación',
      description: 'Crea reportes y especificaciones de ingeniería con tablas vivas sincronizadas en tiempo real.',
      icon: (
        <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      path: `/app/projects/${project.id}/reports`
    }
  ]

  return (
    <div className="min-h-[calc(100vh-64px)] bg-(--color-bg) text-(--color-text-primary)">
      <style>{`
        /* Grid background for workspace */
        .workspace-bg {
          background-image:
            linear-gradient(var(--color-border, rgba(99,120,180,0.06)) 1px, transparent 1px),
            linear-gradient(90deg, var(--color-border, rgba(99,120,180,0.06)) 1px, transparent 1px);
          background-size: 40px 40px;
          background-position: -1px -1px;
        }
        .sa-hero-eyebrow {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--color-accent);
        }
        .sa-hero-title {
          font-size: clamp(2rem, 5vw, 3.25rem);
          font-weight: 800;
          letter-spacing: -0.025em;
          line-height: 1.05;
          color: var(--color-text-primary);
          margin: 0;
        }
      `}</style>

      {/* ─── SECCIÓN HERO ─── */}
      <div className="workspace-bg">
        <div className="max-w-5xl mx-auto w-full pt-10 pb-6 px-6 md:px-8">

          {/* ── Project header ── */}
          <span className="sa-hero-eyebrow">// workspace</span>
          <h1 className="sa-hero-title mt-1 mb-3">
            {project.name}
          </h1>
          <p className="text-base md:text-lg text-(--color-text-secondary) font-light max-w-3xl leading-relaxed whitespace-normal wrap-break-word">
            {project.description || 'Sin descripción disponible para este proyecto.'}
          </p>
        </div>

        {/* ─── GRID DE MÓDULOS ─── */}
        <main className="max-w-5xl mx-auto w-full px-6 md:px-8 pb-20">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {hubCards.map((card) => (
              <div
                key={card.title}
                onClick={() => navigate(card.path)}
                className="group bg-(--color-bg-card) border border-(--color-border) rounded-2xl p-6 md:p-8 cursor-pointer hover:border-(--color-border-strong) hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate(card.path)}
              >
                {/* Icono del módulo */}
                <div className="text-(--color-accent) mb-5 group-hover:scale-110 transition-transform duration-200">
                  {card.icon}
                </div>

                {/* Título */}
                <h2 className="text-xl md:text-2xl font-semibold mb-3 text-(--color-text-primary) group-hover:text-(--color-accent) transition-colors">
                  {card.title}
                </h2>

                {/* Descripción */}
                <p className="text-(--color-text-secondary) leading-relaxed whitespace-normal wrap-break-word">
                  {card.description}
                </p>

                {/* Indicador "Abrir módulo" (aparece al hover) */}
                <div className="mt-6 flex items-center text-sm font-medium text-(--color-accent) opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  Abrir módulo
                  <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}

export default ProjectWorkspacePage