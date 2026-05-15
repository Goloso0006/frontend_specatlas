import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { requirementFacade } from '../facades/requirement.facade'
import { useApiOperation } from '../hooks/useLoadingError'
import { useProject, isValidProjectId } from '../context/ProjectContext'
import { NoProjectSelected } from '../components/ui/NoProjectSelected'
import { FunctionalRequirementsTable } from '../components/requirements/FunctionalRequirementsTable'
import type { RequirementDTO } from '../types/requirements'

export function FunctionalRequirementManualPage() {
  const { projectId: routeProjectId } = useParams()
  const { projectId: contextProjectId } = useProject()
  const { run, isLoading } = useApiOperation()

  const projectId = routeProjectId ?? contextProjectId ?? ''

  const [requirements, setRequirements] = useState<RequirementDTO[]>([])
  const [initialLoadDone, setInitialLoadDone] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)

  // ── Handlers ────────────────────────────────────────────────────────────

  const loadRequirements = useCallback(async (activeProjectId: string) => {
    const data = await run(
      () => requirementFacade.getRequirementsByProject(activeProjectId, 'FUNCTIONAL'),
      { errorMessage: 'Error al cargar requisitos.' }
    )
    if (data) {
      setRequirements(data)
      setInitialLoadDone(true)
    }
  }, [run])

  // ── Effects ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isValidProjectId(projectId)) {
      void loadRequirements(projectId)
    }
  }, [projectId, loadRequirements])

  // ── Guard ──────────────────────────────────────────────────────────────

  if (!isValidProjectId(projectId)) {
    return <NoProjectSelected message="Selecciona un proyecto para gestionar sus requisitos." />
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)] flex flex-col">
      <style>{`
        .sa-hero-eyebrow {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--color-accent);
        }
        .instruction-toggle {
          cursor: pointer;
          transition: color 0.2s;
        }
        .instruction-toggle:hover {
          color: var(--color-accent);
        }
      `}</style>

      {/* ==================== HEADER ==================== */}
      <header className="flex-shrink-0 px-6 py-5 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
        <div className="flex items-center justify-between mb-3">
          <span className="sa-hero-eyebrow">// functional requirements</span>
          <span className="inline-flex items-center h-6 px-2.5 rounded-md text-[11px] font-mono font-medium bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)]">
            {projectId}
          </span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Requisitos Funcionales
        </h1>

        <div className="flex items-center gap-4 mt-2">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Gestión de requisitos con descripciones completas visibles
          </p>
          <button
            onClick={() => setShowInstructions(v => !v)}
            className="instruction-toggle flex items-center gap-1 text-xs text-[var(--color-text-muted)]"
            aria-label={showInstructions ? 'Ocultar ayuda' : 'Mostrar ayuda'}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {showInstructions ? 'Ocultar ayuda' : 'Mostrar ayuda'}
          </button>
        </div>

        {showInstructions && (
          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-3">
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Haga clic en <span className="font-semibold text-[var(--color-text-primary)]">✓</span> para guardar cada fila al editar.</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Use el botón <span className="font-semibold text-[var(--color-text-primary)]">+ Nueva funcionalidad</span> para agregar requerimientos.</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Usa <span className="font-semibold text-[var(--color-text-primary)]">✨ Mejorar</span> para que la IA optimice el requisito seleccionado.</span>
            </div>
          </div>
        )}
      </header>

      {/* ==================== MAIN CONTENT ==================== */}
      <main className="flex-1 px-6 py-6 overflow-x-hidden">
        {!initialLoadDone && isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[var(--color-text-muted)] font-medium">Cargando requisitos funcionales...</p>
          </div>
        ) : (
          <FunctionalRequirementsTable
            projectId={projectId}
            initialRequirements={requirements}
            onRequirementsChange={() => loadRequirements(projectId)}
          />
        )}
      </main>
    </div>
  )
}

export default FunctionalRequirementManualPage