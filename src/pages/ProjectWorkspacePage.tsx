import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { projectFacade } from '../facades/project.facade'
import { useProject, isValidProjectId } from '../context/ProjectContext'
import { useApiOperation } from '../hooks/useLoadingError'
import { NoProjectSelected } from '../components/ui/NoProjectSelected'
import type { ProjectResponse } from '../types/projects'

export function ProjectWorkspacePage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState<ProjectResponse | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { run } = useApiOperation()
  const { selectProject } = useProject()

  useEffect(() => {
    if (!isValidProjectId(projectId)) return
    run(async () => {
      const data = await projectFacade.getProject(projectId)
      setProject(data)
      await selectProject(projectId)
    })
  }, [projectId])

  if (!isValidProjectId(projectId)) {
    return <NoProjectSelected message="El ID de proyecto en la URL no es válido." />
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--color-bg)]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-48 bg-[var(--color-bg-card)] rounded-lg" />
          <div className="h-4 w-64 bg-[var(--color-bg-card)] rounded-lg" />
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
    }
  ]

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)] flex flex-col">
      {/* ─── Estilos ─── */}
      <style>{`
        /* Fondo con grid sutil */
        .workspace-bg {
          background-image:
            linear-gradient(var(--color-border, rgba(99,120,180,0.06)) 1px, transparent 1px),
            linear-gradient(90deg, var(--color-border, rgba(99,120,180,0.06)) 1px, transparent 1px);
          background-size: 40px 40px;
          background-position: -1px -1px;
        }

        /* Logo */
        .sa-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }
        .sa-logo-mark {
          width: 28px;
          height: 28px;
          border: 1.5px solid var(--color-accent);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-accent-subtle);
        }
        .sa-logo-name {
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--color-text-primary);
          text-transform: uppercase;
        }

        /* Hero */
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

        /* Botón volver animado */
        .back-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--color-text-secondary);
          transition: color 0.2s;
        }
        .back-btn:hover { color: var(--color-text-primary); }
        .back-arrow {
          transition: transform 0.2s;
        }
        .back-btn:hover .back-arrow {
          transform: translateX(-3px);
        }
      `}</style>

      {/* ─── BARRA DE NAVEGACIÓN ─── */}
      <nav className="h-16 px-6 md:px-8 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg)]/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="sa-logo cursor-pointer" onClick={() => navigate('/app')}>
          <div className="sa-logo-mark">
            <svg width="14" height="14" fill="none" stroke="var(--color-accent)" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
            </svg>
          </div>
          <span className="sa-logo-name">SpecAtlas</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/app')} className="back-btn hidden sm:flex text-sm font-medium">
              <svg className="w-4 h-4 back-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver
            </button>
            <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-text-muted)] hidden sm:block" />
            <span className="font-semibold tracking-tight truncate max-w-[140px] md:max-w-xs text-[var(--color-text-primary)]">
              {project.name}
            </span>
          </div>

          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg hover:bg-[var(--color-surface)] transition-colors text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              title="Configuración del Proyecto"
              aria-label="Abrir menú de configuración"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {isMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl shadow-2xl z-20 overflow-hidden py-1 backdrop-blur-md bg-opacity-90">
                  <button onClick={() => { navigate(`/app/projects/${project.id}/info`); setIsMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors flex items-center gap-3">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Información
                  </button>
                  <button onClick={() => { navigate(`/app/projects/${project.id}/edit`); setIsMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors flex items-center gap-3">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Editar proyecto
                  </button>
                  <button onClick={() => { navigate(`/app/projects/${project.id}/validation-rules`); setIsMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors flex items-center gap-3">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Reglas de validación
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ─── SECCIÓN HERO ─── */}
      <div className="workspace-bg flex-1">
        <div className="max-w-5xl mx-auto w-full pt-12 pb-8 px-6 md:px-8">
          <span className="sa-hero-eyebrow">// workspace</span>
          <h1 className="sa-hero-title mt-1 mb-3">
            {project.name}
          </h1>
          <p className="text-base md:text-lg text-[var(--color-text-secondary)] font-light max-w-3xl leading-relaxed whitespace-normal break-words">
            {project.description || 'Sin descripción disponible para este proyecto.'}
          </p>
        </div>

        {/* ─── GRID DE MÓDULOS (animación hover:-translate-y-2) ─── */}
        <main className="max-w-5xl mx-auto w-full px-6 md:px-8 pb-20">
          <div className="grid gap-6 md:grid-cols-2">
            {hubCards.map((card) => (
              <div
                key={card.title}
                onClick={() => navigate(card.path)}
                className="group bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-6 md:p-8 cursor-pointer hover:border-[var(--color-border-strong)] hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate(card.path)}
              >
                {/* Icono del módulo */}
                <div className="text-[var(--color-accent)] mb-5 group-hover:scale-110 transition-transform duration-200">
                  {card.icon}
                </div>

                {/* Título */}
                <h2 className="text-xl md:text-2xl font-semibold mb-3 text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">
                  {card.title}
                </h2>

                {/* Descripción */}
                <p className="text-[var(--color-text-secondary)] leading-relaxed whitespace-normal break-words">
                  {card.description}
                </p>

                {/* Indicador "Abrir módulo" (aparece al hover) */}
                <div className="mt-6 flex items-center text-sm font-medium text-[var(--color-accent)] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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