import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { requirementFacade } from '../facades/requirement.facade'
import { useProject, isValidProjectId } from '../context/ProjectContext'
import { NoProjectSelected } from '../components/ui/NoProjectSelected'
import { NonFunctionalRequirementsTable } from '../components/requirements/NonFunctionalRequirementsTable'
import { sortRequirements } from '../utils/requirementSortUtils'
import type { RequirementDTO } from '../types/requirements'

export function NonFunctionalRequirementManualPage() {
  const { projectId: routeProjectId } = useParams()
  const { projectId: contextProjectId } = useProject()

  const projectId = routeProjectId ?? contextProjectId ?? ''

  const [requirements, setRequirements] = useState<RequirementDTO[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showInstructions, setShowInstructions] = useState(true)

  // ── Primary load effect ──────────────────────────────────────────────────
  // Runs whenever projectId changes (navigation, route param change).
  // Uses a cancellation flag to avoid stale responses overwriting fresh data.

  useEffect(() => {
    if (!isValidProjectId(projectId)) {
      setRequirements([])
      setLoadError(null)
      return
    }

    let cancelled = false

    async function load() {
      setIsLoading(true)
      setLoadError(null)
      try {
        const data = await requirementFacade.getRequirementsByProject(projectId, 'NON_FUNCTIONAL')
        if (!cancelled) {
          setRequirements(sortRequirements(Array.isArray(data) ? data : []))
        }
      } catch {
        if (!cancelled) {
          setLoadError('No fue posible cargar los requisitos no funcionales. Intenta de nuevo.')
          setRequirements([])
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [projectId])

  // ── Reload callback (used after create/update/delete in the table) ───────

  function reloadRequirements() {
    if (!isValidProjectId(projectId)) return

    let cancelled = false

    async function load() {
      setIsLoading(true)
      setLoadError(null)
      try {
        const data = await requirementFacade.getRequirementsByProject(projectId, 'NON_FUNCTIONAL')
        if (!cancelled) {
          setRequirements(sortRequirements(Array.isArray(data) ? data : []))
        }
      } catch {
        if (!cancelled) {
          setLoadError('No fue posible recargar los requisitos.')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }

  // ── Guard ──────────────────────────────────────────────────────────────

  if (!isValidProjectId(projectId)) {
    return <NoProjectSelected message="Selecciona un proyecto para gestionar sus requisitos no funcionales." />
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
        .instruction-toggle:hover { color: var(--color-accent); }
      `}</style>

      {/* HEADER */}
      <header className="flex-shrink-0 px-6 py-5 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
        <div className="flex items-center justify-between mb-3">
          <span className="sa-hero-eyebrow">// non-functional requirements · ISO 25010</span>
          <span className="inline-flex items-center h-6 px-2.5 rounded-md text-[11px] font-mono font-medium bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)]">
            {projectId}
          </span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Requisitos No Funcionales
        </h1>

        <div className="flex items-center gap-4 mt-2">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Calidad, seguridad, rendimiento y restricciones del sistema — clasificación ISO 25010
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
              <svg className="w-3.5 h-3.5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Haz clic en una fila para expandir y editar el <span className="font-semibold text-[var(--color-text-primary)]">Detalle ISO 25010</span>.</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Usa <span className="font-semibold text-[var(--color-text-primary)]">+ Nuevo RNF</span> para agregar: categoría, métrica y valor objetivo.</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Usa <span className="font-semibold text-[var(--color-text-primary)]">✨ Mejorar con IA</span> para que la IA enriquezca el requisito.</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Haz clic en <span className="font-semibold text-[var(--color-text-primary)]">✓</span> o en el botón <span className="font-semibold text-[var(--color-text-primary)]">Guardar RNF</span> para persistir los cambios.</span>
            </div>
          </div>
        )}
      </header>

      {/* MAIN */}
      <main className="flex-1 px-6 py-6 overflow-x-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[var(--color-text-muted)] font-medium">Cargando requisitos no funcionales…</p>
          </div>
        ) : loadError ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <p className="text-sm text-rose-500 font-medium">{loadError}</p>
            <button
              onClick={reloadRequirements}
              className="px-4 py-2 text-sm font-bold rounded-xl bg-[var(--color-accent)] text-[var(--color-accent-foreground)] hover:opacity-90 transition-all"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <NonFunctionalRequirementsTable
            projectId={projectId}
            initialRequirements={requirements}
            onRequirementsChange={reloadRequirements}
          />
        )}
      </main>
    </div>
  )
}

export default NonFunctionalRequirementManualPage
