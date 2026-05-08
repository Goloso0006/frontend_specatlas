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
import type { RequirementDTO, RequirementNode } from '../types/requirements'
import { validateRequirementBeforeSave } from '../utils/requirementValidation'

const EMPTY_REQUIREMENT: RequirementDTO = {
  id: '', code: '', title: '', description: '',
  actors: [], acceptanceCriteria: [], isoClassification: '',
  projectId: '', relatedCodes: [], requirementType: 'NON_FUNCTIONAL',
}

export function NonFunctionalRequirementManualPage() {
  const { projectId: routeProjectId } = useParams()
  const { projectId: contextProjectId } = useProject()

  const { run, isLoading } = useApiOperation()

  const projectId = routeProjectId ?? contextProjectId ?? ''

  const [projectRequirements, setProjectRequirements] = useState<RequirementDTO[]>([])
  const [selectedRequirement, setSelectedRequirement] = useState<RequirementDTO | null>(null)
  const [impactNodes, setImpactNodes] = useState<RequirementNode[]>([])
  const [impactGraph, setImpactGraph] = useState<Record<string, unknown> | null>(null)
  const [inferenceGraph, setInferenceGraph] = useState<Record<string, unknown> | null>(null)
  const [isLoadingGraph, setIsLoadingGraph] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalInitial, setModalInitial] = useState<RequirementDTO>({ ...EMPTY_REQUIREMENT, projectId })

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
    void handleLoadRequirements(projectId)
  }, [projectId])

  useEffect(() => {
    if (!selectedRequirement?.id) { setImpactGraph(null); setImpactNodes([]); return }
    void handleImpact(selectedRequirement.id)
  }, [selectedRequirement?.id])

  const nonFunctionalRequirements = useMemo(() => {
    return projectRequirements.filter((req) => {
      const rType = (req as RequirementDTO & { requirementType?: string }).requirementType
      if (!rType) return true
      return rType === 'NON_FUNCTIONAL'
    })
  }, [projectRequirements])

  const displayedRequirements = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return nonFunctionalRequirements
    return nonFunctionalRequirements.filter((r) => r.title.toLowerCase().includes(q))
  }, [nonFunctionalRequirements, searchQuery])

  const isSearchMode = searchQuery.trim().length > 0

  async function handleLoadRequirements(pid: string) {
    if (!isValidProjectId(pid)) return
    const data = await run(
      () => requirementFacade.getRequirementsByProject(pid, 'NON_FUNCTIONAL'),
      { errorMessage: 'Error al cargar los RNF.' }
    )
    if (data) setProjectRequirements(data)
  }

  async function handleImpact(requirementId: string) {
    setIsLoadingGraph(true)
    const data = await run(() => graphFacade.getImpact(requirementId), { errorMessage: 'Error al consultar impacto.' })
    setIsLoadingGraph(false)
    if (data) { setImpactNodes(Array.isArray(data) ? (data as RequirementNode[]) : []); setImpactGraph(data as Record<string, unknown>) }
  }

  async function handleInferRelations() {
    if (!isValidProjectId(projectId) || projectRequirements.length === 0) return
    const data = await run(() => graphFacade.inferRelations(projectId, projectRequirements), { errorMessage: 'Error al inferir relaciones.' })
    if (data) setInferenceGraph(data)
  }

  function handleSelectRequirement(req: RequirementDTO) { setSelectedRequirement(req) }
  function handleEditRequirement(req: RequirementDTO) { setModalInitial(req); setModalOpen(true) }

  async function handleDeleteRequirement(req: RequirementDTO) {
    if (!req.id) return
    setProjectRequirements(prev => prev.filter(r => r.id !== req.id))
    if (selectedRequirement?.id === req.id) setSelectedRequirement(null)
    await run(() => requirementFacade.deleteRequirement(req.id), { errorMessage: 'Error al eliminar el RNF.' })
  }

  function handleAddNew() { setModalInitial({ ...EMPTY_REQUIREMENT, projectId }); setModalOpen(true) }

  async function handleModalSave(dto: RequirementDTO) {
    const { valid, errors } = validateRequirementBeforeSave(dto, 'NON_FUNCTIONAL')
    if (!valid) {
      alert(`Error:\n${errors.join('\n')}`)
      return
    }
    const saved = await run(() => requirementFacade.saveRequirement(dto), { errorMessage: 'Error al guardar el RNF.' })
    if (saved) {
      setProjectRequirements(prev => {
        const idx = prev.findIndex(r => r.id === saved.id)
        return idx >= 0 ? prev.map((r, i) => (i === idx ? saved : r)) : [...prev, saved]
      })
      setSelectedRequirement(saved)
      setModalOpen(false)
    }
  }

  async function handleModalConvert(text: string, onResult: (dto: RequirementDTO) => void) {
    const data = await run(() => requirementFacade.convertTextToRequirement(projectId, text), { errorMessage: 'Error al convertir.' })
    if (data) onResult(data)
  }

  if (!isValidProjectId(projectId)) {
    return <NoProjectSelected message="Selecciona un proyecto para ver sus RNF." />
  }

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)] text-[var(--color-text-primary)]">

      <div className="flex-shrink-0 flex items-start justify-between px-6 pt-5 pb-4 border-b border-[var(--color-border)]">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight text-[var(--color-text-primary)] leading-tight">
            Gestión de Requisitos No Funcionales
          </h1>
          <p className="mt-0.5 text-[12.5px] text-[var(--color-text-muted)] leading-relaxed">
            Calidad, seguridad, rendimiento, usabilidad y restricciones del sistema.
          </p>
        </div>
        <div className="flex-shrink-0 ml-4 pt-0.5">
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Proyecto</span>
            <span className="inline-flex items-center h-6 px-2.5 rounded-md text-[11px] font-mono font-medium bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border-strong)] max-w-[160px] truncate" title={projectId}>
              {projectId}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">
        <div className="flex-shrink-0 flex flex-col border-r border-[var(--color-border)]" style={{ width: 'clamp(300px, 38%, 480px)' }}>
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                No funcionales
                {displayedRequirements.length > 0 && (
                  <span className="ml-1.5 text-[var(--color-text-muted)] normal-case font-normal">({displayedRequirements.length})</span>
                )}
              </span>
              {isSearchMode && (
                <span className="inline-flex items-center h-4 px-1.5 rounded text-[10px] font-medium bg-[var(--color-accent-subtle)] text-[var(--color-text-muted)] border border-[var(--color-border)]">búsqueda</span>
              )}
            </div>
            <button type="button" onClick={() => handleLoadRequirements(projectId)} disabled={isLoading} aria-label="Recargar" title="Recargar"
              className="w-6 h-6 flex items-center justify-center rounded-md text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-40">
              <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} className={isLoading ? 'animate-spin' : ''}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          <div className="flex-shrink-0 px-3 py-2 border-b border-[var(--color-border)]">
            <RequirementsSearchBar value={searchQuery} onChange={setSearchQuery} onSearch={() => setSearchQuery((c) => c.trim())} onClear={() => setSearchQuery('')} isLoading={isLoading} />
          </div>
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

export default NonFunctionalRequirementManualPage
