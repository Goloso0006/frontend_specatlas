import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { graphFacade } from '../../facades/graph.facade'
import { requirementFacade } from '../../facades/requirement.facade'
import { useApiOperation } from '../../hooks/useLoadingError'
import { useProject, isValidProjectId } from '../../context/ProjectContext'
import { NoProjectSelected } from '../ui/NoProjectSelected'
import { RequirementsSearchBar } from './RequirementsSearchBar'
import { RequirementListPanel } from './RequirementListPanel'
import { RequirementDetailPanel } from './RequirementDetailPanel'
import { RequirementFormModal } from './RequirementFormModal'
import type { RequirementDTO, RequirementNode } from '../../types/requirements'
import { validateRequirementBeforeSave } from '../../utils/requirementValidation'

type RequirementType = 'FUNCTIONAL' | 'NON_FUNCTIONAL'

interface RequirementManagementPageProps {
  requirementType: RequirementType
}

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

function getPageTitle(requirementType: RequirementType) {
  return requirementType === 'FUNCTIONAL'
    ? 'Gestión de Requisitos Funcionales'
    : 'Gestión de Requisitos No Funcionales'
}

function getPageDescription(requirementType: RequirementType) {
  return requirementType === 'FUNCTIONAL'
    ? 'Convierte lenguaje natural, analiza impacto y gestiona dependencias.'
    : 'Calidad, seguridad, rendimiento, usabilidad y restricciones del sistema.'
}

function getSelectedProjectMessage(requirementType: RequirementType) {
  return requirementType === 'FUNCTIONAL'
    ? 'Selecciona un proyecto para ver sus requisitos funcionales.'
    : 'Selecciona un proyecto para ver sus requisitos no funcionales.'
}

function getListTitle(requirementType: RequirementType) {
  return requirementType === 'FUNCTIONAL' ? 'Funcionales' : 'No funcionales'
}

function getLoadErrorMessage(requirementType: RequirementType) {
  return requirementType === 'FUNCTIONAL'
    ? 'Error al cargar los requisitos.'
    : 'Error al cargar los RNF.'
}

function getDeleteErrorMessage(requirementType: RequirementType) {
  return requirementType === 'FUNCTIONAL'
    ? 'Error al eliminar el requisito.'
    : 'Error al eliminar el RNF.'
}

function getSaveErrorMessage(requirementType: RequirementType) {
  return requirementType === 'FUNCTIONAL'
    ? 'Error al guardar el requisito.'
    : 'Error al guardar el RNF.'
}

function getConvertErrorMessage() {
  return 'Error al convertir.'
}

function getReloadAriaLabel(requirementType: RequirementType) {
  return requirementType === 'FUNCTIONAL'
    ? 'Recargar requisitos funcionales'
    : 'Recargar requisitos no funcionales'
}

function getReloadTitle(requirementType: RequirementType) {
  return requirementType === 'FUNCTIONAL'
    ? 'Recargar requisitos funcionales'
    : 'Recargar requisitos no funcionales'
}

function createEmptyRequirement(projectId: string, requirementType: RequirementType): RequirementDTO {
  return {
    ...EMPTY_REQUIREMENT,
    projectId,
    requirementType,
  }
}

function filterRequirementsByType(requirements: RequirementDTO[], requirementType: RequirementType) {
  if (requirementType === 'FUNCTIONAL') {
    return requirements
  }

  return requirements.filter((requirement) => {
    if (!requirement.requirementType) return true
    return requirement.requirementType === 'NON_FUNCTIONAL'
  })
}

export function RequirementManagementPage({ requirementType }: RequirementManagementPageProps) {
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
  const [modalInitial, setModalInitial] = useState<RequirementDTO>(createEmptyRequirement(projectId, requirementType))

  useEffect(() => {
    setProjectRequirements([])
    setSelectedRequirement(null)
    setImpactNodes([])
    setImpactGraph(null)
    setInferenceGraph(null)
    setSearchQuery('')
    setModalOpen(false)
    setModalInitial(createEmptyRequirement(projectId, requirementType))

    if (!isValidProjectId(projectId)) return

    void handleLoadProjectRequirements(projectId)
  }, [projectId, requirementType])

  useEffect(() => {
    if (!selectedRequirement?.id) {
      setImpactGraph(null)
      setImpactNodes([])
      return
    }

    void handleImpact(selectedRequirement.id)
  }, [selectedRequirement?.id])

  const visibleRequirements = useMemo(
    () => filterRequirementsByType(projectRequirements, requirementType),
    [projectRequirements, requirementType],
  )

  const displayedRequirements = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    if (!normalizedQuery) {
      return visibleRequirements
    }

    return visibleRequirements.filter((requirement) =>
      requirement.title.toLowerCase().includes(normalizedQuery),
    )
  }, [visibleRequirements, searchQuery])

  const isSearchMode = searchQuery.trim().length > 0

  async function handleLoadProjectRequirements(activeProjectId: string) {
    if (!isValidProjectId(activeProjectId)) return

    const data = await run(
      () => requirementFacade.getRequirementsByProject(activeProjectId, requirementType),
      { errorMessage: getLoadErrorMessage(requirementType) },
    )

    if (data) {
      setProjectRequirements(data)
    }
  }

  function handleSearch() {
    setSearchQuery((current) => current.trim())
  }

  function handleClearSearch() {
    setSearchQuery('')
  }

  async function handleImpact(requirementId: string) {
    setIsLoadingGraph(true)

    try {
      const data = await run(
        () => graphFacade.getImpact(requirementId),
        { errorMessage: 'Error al consultar impacto.' },
      )

      if (data) {
        setImpactNodes(Array.isArray(data) ? (data as RequirementNode[]) : [])
        setImpactGraph(data as Record<string, unknown>)
      }
    } finally {
      setIsLoadingGraph(false)
    }
  }

  async function handleInferRelations() {
    if (!isValidProjectId(projectId) || projectRequirements.length === 0) return

    const data = await run(
      () => graphFacade.inferRelations(projectId, projectRequirements),
      { errorMessage: 'Error al inferir relaciones.' },
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

    setProjectRequirements((prev) => prev.filter((r) => r.id !== req.id))
    if (selectedRequirement?.id === req.id) setSelectedRequirement(null)

    await run(
      () => requirementFacade.deleteRequirement(req.id),
      { errorMessage: getDeleteErrorMessage(requirementType) },
    )
  }

  function handleAddNew() {
    setModalInitial(createEmptyRequirement(projectId, requirementType))
    setModalOpen(true)
  }

  async function handleModalSave(dto: RequirementDTO) {
    const typeToValidate = dto.requirementType || requirementType
    const { valid, errors } = validateRequirementBeforeSave(dto, typeToValidate)

    if (!valid) {
      alert(`Error:\n${errors.join('\n')}`)
      return
    }

    const saved = await run(
      () => requirementFacade.saveRequirement({ ...dto, requirementType }),
      { errorMessage: getSaveErrorMessage(requirementType) },
    )

    if (saved) {
      setProjectRequirements((prev) => {
        const idx = prev.findIndex((r) => r.id === saved.id)
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
      { errorMessage: getConvertErrorMessage() },
    )

    if (data) onResult({ ...data, requirementType })
  }

  if (!isValidProjectId(projectId)) {
    return <NoProjectSelected message={getSelectedProjectMessage(requirementType)} />
  }

  return (
    <div className="flex flex-col h-full bg-[radial-gradient(circle_at_top_left,var(--color-accent-subtle),transparent_32%),var(--color-bg)] text-(--color-text-primary)">
      <div className="shrink-0 flex items-start justify-between px-6 pt-5 pb-4 border-b border-(--color-border)">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight text-(--color-text-primary) leading-tight">
            {getPageTitle(requirementType)}
          </h1>
          <p className="mt-0.5 text-[12.5px] text-(--color-text-muted) leading-relaxed">
            {getPageDescription(requirementType)}
          </p>
        </div>

        <div className="shrink-0 ml-4 pt-0.5">
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-(--color-text-muted)">Proyecto</span>
            <span
              className="inline-flex items-center h-6 px-2.5 rounded-md text-[11px] font-mono font-medium bg-(--color-surface) text-(--color-text-secondary) border border-(--color-border-strong) max-w-40 truncate"
              title={projectId}
            >
              {projectId}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">
        <div
          className="shrink-0 flex flex-col rounded-[1.5rem] border border-(--color-border-strong) bg-(--color-bg-card) shadow-[0_18px_60px_rgba(43,43,43,0.07)] overflow-hidden"
          style={{ width: 'clamp(300px, 38%, 480px)' }}
        >
          <div className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-(--color-border)">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-(--color-text-muted)">
                {getListTitle(requirementType)}
                {displayedRequirements.length > 0 && (
                  <span className="ml-1.5 text-(--color-text-muted) normal-case font-normal">
                    ({displayedRequirements.length})
                  </span>
                )}
              </span>
              {isSearchMode && (
                <span className="inline-flex items-center h-4 px-1.5 rounded text-[10px] font-medium bg-(--color-accent-subtle) text-(--color-text-muted) border border-(--color-border)">
                  búsqueda
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => handleLoadProjectRequirements(projectId)}
              disabled={isLoading}
              aria-label={getReloadAriaLabel(requirementType)}
              title={getReloadTitle(requirementType)}
              className="w-6 h-6 flex items-center justify-center rounded-md text-(--color-text-muted) hover:bg-(--color-surface) hover:text-(--color-text-primary) transition-colors disabled:opacity-40"
            >
              <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} className={isLoading ? 'animate-spin' : ''}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          <div className="shrink-0 px-3 py-2 border-b border-(--color-border)">
            <RequirementsSearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={handleSearch}
              onClear={handleClearSearch}
              isLoading={isLoading}
            />
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

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden rounded-[1.5rem] border border-(--color-border-strong) bg-(--color-bg-card) shadow-[0_18px_60px_rgba(43,43,43,0.07)]">
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

export default RequirementManagementPage