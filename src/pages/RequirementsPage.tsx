import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { graphFacade } from '../facades/graph.facade'
import { useApiOperation } from '../hooks/useLoadingError'
import { requirementFacade } from '../facades/requirement.facade'
import { useProject, isValidProjectId } from '../context/ProjectContext'
import { NoProjectSelected } from '../components/ui/NoProjectSelected'
import { RequirementsSearchBar } from '../components/requirements/RequirementsSearchBar'
import { RequirementListPanel } from '../components/requirements/RequirementListPanel'
import { RequirementDetailPanel } from '../components/requirements/RequirementDetailPanel'
import { RequirementFormModal } from '../components/requirements/RequirementFormModal'
import type {
  RequirementDTO,
  RequirementNode,
} from '../types/requirements'

// ── Constants ──────────────────────────────────────────────────────────────

const EMPTY_REQUIREMENT: RequirementDTO = {
  id: '',
  code: '',
  title: '',
  description: '',
  actors: [],
  acceptanceCriteria: [],
  isoClassification: '',
  projectId: '',
  relatedCodes: [],
}

// ── Page ──────────────────────────────────────────────────────────────────

export function RequirementsPage() {
  const { projectId: routeProjectId } = useParams()
  const { projectId: contextProjectId } = useProject()
  const { run, isLoading } = useApiOperation()
  const projectId = routeProjectId ?? contextProjectId ?? ''

  // ── Data state ──
  const [projectRequirements, setProjectRequirements] = useState<RequirementDTO[]>([])
  const [selectedRequirement, setSelectedRequirement] = useState<RequirementDTO | null>(null)
  const [impactNodes, setImpactNodes] = useState<RequirementNode[]>([])
  const [impactGraph, setImpactGraph] = useState<Record<string, unknown> | null>(null)
  const [inferenceGraph, setInferenceGraph] = useState<Record<string, unknown> | null>(null)
  const [isLoadingGraph, setIsLoadingGraph] = useState(false)

  // ── Search state ──
  const [searchQuery, setSearchQuery] = useState('')

  // ── Modal state ──
  const [modalOpen, setModalOpen] = useState(false)
  const [modalInitial, setModalInitial] = useState<RequirementDTO>({ ...EMPTY_REQUIREMENT, projectId })

  // ── Effects ──────────────────────────────────────────────────────────────

  // Reset the view when the active project changes and reload its requirements.
  useEffect(() => {
    setProjectRequirements([])
    setSelectedRequirement(null)
    setImpactNodes([])
    setImpactGraph(null)
    setInferenceGraph(null)
    setSearchQuery('')
    setModalOpen(false)
    setModalInitial({ ...EMPTY_REQUIREMENT, projectId })

    if (!isValidProjectId(projectId)) return

    void handleLoadProjectRequirements(projectId)
  }, [projectId])

  // Load impact graph when requirement is selected
  useEffect(() => {
    if (!selectedRequirement?.id) {
      setImpactGraph(null)
      setImpactNodes([])
      return
    }
    void handleImpact(selectedRequirement.id)
  }, [selectedRequirement?.id])

  const displayedRequirements = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    if (!normalizedQuery) {
      return projectRequirements
    }

    return projectRequirements.filter((requirement) =>
      requirement.title.toLowerCase().includes(normalizedQuery),
    )
  }, [projectRequirements, searchQuery])

  const isSearchMode = searchQuery.trim().length > 0

  // ── Handlers ─────────────────────────────────────────────────────────────

  async function handleLoadProjectRequirements(activeProjectId: string) {
    if (!isValidProjectId(activeProjectId)) return
    const data = await run(
      () => requirementFacade.getRequirementsByProject(activeProjectId),
      { errorMessage: 'Error al cargar los requisitos.' }
    )
    if (data) {
      setProjectRequirements(data)
    }
  }

  async function handleSearch() {
    setSearchQuery((current) => current.trim())
  }

  function handleClearSearch() {
    setSearchQuery('')
  }

  async function handleImpact(requirementId: string) {
    setIsLoadingGraph(true)
    const data = await run(
      () => graphFacade.getImpact(requirementId),
      { errorMessage: 'Error al consultar impacto.' }
    )
    setIsLoadingGraph(false)
    if (data) {
      setImpactNodes(Array.isArray(data) ? (data as RequirementNode[]) : [])
      setImpactGraph(data as Record<string, unknown>)
    }
  }

  async function handleInferRelations() {
    if (!isValidProjectId(projectId) || projectRequirements.length === 0) return
    const data = await run(
      () => graphFacade.inferRelations(projectId, projectRequirements),
      { errorMessage: 'Error al inferir relaciones.' }
    )
    if (data) setInferenceGraph(data)
  }

  function handleSelectRequirement(req: RequirementDTO) {
    setSelectedRequirement(req)
  }

  function handleEditRequirement(req: RequirementDTO) {
    setModalInitial(req)
    setModalOpen(true)
  }

  async function handleDeleteRequirement(req: RequirementDTO) {
    if (!req.id) return
    // Optimistic UI: remove immediately
    setProjectRequirements(prev => prev.filter(r => r.id !== req.id))
    if (selectedRequirement?.id === req.id) setSelectedRequirement(null)
    // Real API call
    await run(
      () => requirementFacade.deleteRequirement(req.id),
      { errorMessage: 'Error al eliminar el requisito.' }
    )
  }

  function handleAddNew() {
    setModalInitial({ ...EMPTY_REQUIREMENT, projectId })
    setModalOpen(true)
  }

  async function handleModalSave(dto: RequirementDTO) {
    const saved = await run(
      () => requirementFacade.saveRequirement(dto),
      { errorMessage: 'Error al guardar el requisito.' }
    )
    if (saved) {
      // Update or add in list
      setProjectRequirements(prev => {
        const idx = prev.findIndex(r => r.id === saved.id)
        return idx >= 0
          ? prev.map((r, i) => (i === idx ? saved : r))
          : [...prev, saved]
      })
      setSelectedRequirement(saved)
      setModalOpen(false)
    }
  }

  async function handleModalConvert(text: string, onResult: (dto: RequirementDTO) => void) {
    const data = await run(
      () => requirementFacade.convertTextToRequirement(projectId, text),
      { errorMessage: 'Error al convertir.' }
    )
    if (data) onResult(data)
  }

  // ── Guard ─────────────────────────────────────────────────────────────────

  if (!isValidProjectId(projectId)) {
    return <NoProjectSelected message="Selecciona un proyecto para ver sus requisitos." />
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)] text-[var(--color-text-primary)]">

      {/* ══════════════════════════════════════════════════════════════
          ENCABEZADO PRINCIPAL
      ══════════════════════════════════════════════════════════════ */}
      <div className="flex-shrink-0 flex items-start justify-between px-6 pt-5 pb-4 border-b border-[var(--color-border)]">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight text-[var(--color-text-primary)] leading-tight">
            Gestión de Requisitos
          </h1>
          <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)] leading-relaxed">
            Convierte lenguaje natural, analiza impacto y gestiona dependencias.
          </p>
        </div>

        {/* Project ID badge */}
        <div className="flex-shrink-0 ml-4 pt-0.5">
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Proyecto</span>
            <span
              className="inline-flex items-center h-6 px-2.5 rounded-md text-[11px] font-mono font-medium bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border-strong)] max-w-[160px] truncate"
              title={projectId}
            >
              {projectId}
            </span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          CUERPO: DOS COLUMNAS
      ══════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* ── Left column: requirement list ──
             WIDTH: modify the clamp() below to adjust this column's width.
             Format: clamp(min, preferred%, max)
             e.g. clamp(320px, 40%, 520px) makes it wider.
        ── */}
        <div
          className="flex-shrink-0 flex flex-col border-r border-[var(--color-border)]"
          style={{ width: 'clamp(300px, 38%, 480px)' }}
        >
          {/* Column header: title + reload */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                Requisitos
                {displayedRequirements.length > 0 && (
                  <span className="ml-1.5 text-[var(--color-text-muted)] normal-case font-normal">
                    ({displayedRequirements.length})
                  </span>
                )}
              </span>
              {isSearchMode && (
                <span className="inline-flex items-center h-4 px-1.5 rounded text-[10px] font-medium bg-[var(--color-accent-subtle)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
                  búsqueda
                </span>
              )}
            </div>
            {/* Reload button */}
            <button
              type="button"
              onClick={() => handleLoadProjectRequirements(projectId)}
              disabled={isLoading}
              aria-label="Recargar lista"
              title="Recargar"
              className="w-6 h-6 flex items-center justify-center rounded-md text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-40"
            >
              <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}
                className={isLoading ? 'animate-spin' : ''}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {/* Search bar — embedded in the left column, in the same position as the top nav bar */}
          <div className="flex-shrink-0 px-3 py-2 border-b border-[var(--color-border)]">
            <RequirementsSearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={handleSearch}
              onClear={handleClearSearch}
              isLoading={isLoading}
            />
          </div>

          {/* List */}
          <div className="flex-1 min-h-0">
            <RequirementListPanel
              requirements={displayedRequirements}
              selectedId={selectedRequirement?.id ?? null}
              isLoading={isLoading && displayedRequirements.length === 0}
              onSelect={handleSelectRequirement}
              onEdit={handleEditRequirement}
              onDelete={handleDeleteRequirement}
              onAddNew={handleAddNew}
            />
          </div>
        </div>

        {/* ── Right column: detail panel ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <RequirementDetailPanel
            requirements={projectRequirements}
            requirement={selectedRequirement}
            impactGraph={impactGraph}
            inferenceGraph={inferenceGraph}
            impactNodes={impactNodes}
            isLoadingGraph={isLoadingGraph}
            onInferRelations={handleInferRelations}
          />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          MODAL: create / edit
      ══════════════════════════════════════════════════════════════ */}
      <RequirementFormModal
        isOpen={modalOpen}
        initial={modalInitial}
        isLoading={isLoading}
        onSave={handleModalSave}
        onClose={() => setModalOpen(false)}
        onConvert={handleModalConvert}
      />
    </div>
  )
}