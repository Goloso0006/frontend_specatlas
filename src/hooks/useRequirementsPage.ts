import { useState, useEffect, useMemo } from 'react'
import { graphFacade } from '../facades/graph.facade'
import { useApiOperation } from './useLoadingError'
import { requirementFacade } from '../facades/requirement.facade'
import { validateRequirementBeforeSave } from '../utils/requirementValidation'
import { isValidProjectId } from '../context/ProjectContext'
import type { RequirementDTO, RequirementNode } from '../types/requirements'

export const EMPTY_REQUIREMENT: RequirementDTO = {
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

export function useRequirementsPage(projectId: string) {
  const { run, isLoading } = useApiOperation()

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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  useEffect(() => {
    if (!selectedRequirement?.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setImpactGraph(null)
      setImpactNodes([])
      return
    }
    void handleImpact(selectedRequirement.id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const typeToValidate = dto.requirementType || 'FUNCTIONAL'
    const { valid, errors } = validateRequirementBeforeSave(dto, typeToValidate)
    if (!valid) {
      alert(`Error:\n${errors.join('\n')}`)
      return
    }
    const saved = await run(
      () => requirementFacade.saveRequirement(dto),
      { errorMessage: 'Error al guardar el requisito.' }
    )
    if (saved) {
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

  return {
    isLoading,
    projectRequirements,
    selectedRequirement,
    impactNodes,
    impactGraph,
    inferenceGraph,
    isLoadingGraph,
    searchQuery,
    setSearchQuery,
    modalOpen,
    setModalOpen,
    modalInitial,
    displayedRequirements,
    isSearchMode,
    handleLoadProjectRequirements,
    handleSearch,
    handleClearSearch,
    handleInferRelations,
    handleSelectRequirement,
    handleEditRequirement,
    handleDeleteRequirement,
    handleAddNew,
    handleModalSave,
    handleModalConvert,
  }
}
