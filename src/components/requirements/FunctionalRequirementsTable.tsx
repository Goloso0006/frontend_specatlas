import React, { useState, useEffect, useMemo } from 'react'
import { EditableRequirementRow, type RowStatus } from './EditableRequirementRow'
import { RequirementAiImprovePreview } from './RequirementAiImprovePreview'
import { RequirementSimilarityPanel } from './RequirementSimilarityPanel'
import { RequirementMemoryPanel } from './RequirementMemoryPanel'
import { RequirementTableDetail } from './RequirementTableDetail'
import { DeleteConfirmationModal } from './DeleteConfirmationModal'
import { RequirementDeleteImpactModal } from './RequirementDeleteImpactModal'
import { RequirementFiltersBar } from './RequirementFiltersBar'
import { RequirementTraceabilityPanel } from './RequirementTraceabilityPanel'
import { RequirementQualityDetailModal } from './RequirementQualityDetailModal'
import { requirementFacade } from '../../facades/requirement.facade'
import { qualityAnalysisApi } from '../../api/services/qualityAnalysisApi'
import { generateNextCode } from '../../utils/requirementCodeUtils'
import { sortRequirements } from '../../utils/requirementSortUtils'
import {
  EMPTY_FILTERS,
  buildFilterOptions,
  filterRequirements,
  hasActiveFilters,
  type RequirementFilters,
} from '../../utils/requirementFilterUtils'
import { analyzeRequirementText } from '../../utils/requirementQualityAnalyzer'
import type { RequirementDTO, RequirementMemoryResponse, RequirementDeleteImpactResponse, RuleViolation, RequirementQualityAnalysisDTO } from '../../types/requirements'

interface FunctionalRequirementsTableProps {
  projectId: string
  initialRequirements: RequirementDTO[]
  onRequirementsChange?: () => void
}

interface TableRow {
  localId: string
  requirement: RequirementDTO
  status: RowStatus
  errorMessage?: string
}

function toTableRows(requirements: RequirementDTO[]): TableRow[] {
  return sortRequirements(requirements).map(r => ({
    localId: r.id || crypto.randomUUID(),
    requirement: r,
    status: 'saved' as RowStatus,
  }))
}

// ── Main component ────────────────────────────────────────────────────────────

export const FunctionalRequirementsTable: React.FC<FunctionalRequirementsTableProps> = ({
  projectId,
  initialRequirements,
  onRequirementsChange,
}) => {
  // rows = all rows including unsaved drafts, maintained in sorted order
  const [rows, setRows] = useState<TableRow[]>(() => toTableRows(initialRequirements))

  useEffect(() => {
    // When parent refetches and passes new requirements, rebuild rows.
    // Keep unsaved drafts (rows without a backend id) so the user doesn't lose work.
    // Merge all rows and sort together so drafts land in their natural code position.
    setRows(prev => {
      const drafts = prev.filter(r => !r.requirement.id && r.status !== 'saved')
      const savedReqs = toTableRows(initialRequirements)
      // Combine drafts with saved rows and sort everything together by code
      const allReqs = [
        ...drafts.map(d => d.requirement),
        ...savedReqs.map(s => s.requirement),
      ]
      const sortedReqs = sortRequirements(allReqs)
      // Reconstruct TableRow list preserving localId and status
      const byId = new Map([
        ...drafts.map(d => [d.requirement.code ?? d.localId, d] as const),
        ...savedReqs.map(s => [s.requirement.id ?? s.localId, s] as const),
      ])
      return sortedReqs.map(req => {
        const key = req.id || req.code || ''
        return byId.get(key) ?? savedReqs.find(s => s.requirement.id === req.id || s.requirement.code === req.code) ?? drafts.find(d => d.requirement.code === req.code) ?? { localId: crypto.randomUUID(), requirement: req, status: 'saved' as RowStatus }
      })
    })
  }, [initialRequirements])

  const [filters, setFilters] = useState<RequirementFilters>(EMPTY_FILTERS)
  const [aiPreview, setAiPreview] = useState<{ current: RequirementDTO; suggested: RequirementDTO; localId: string } | null>(null)
  const [duplicatePreview, setDuplicatePreview] = useState<{ localId: string; matches: any[] } | null>(null)
  const [memoryPreview, setMemoryPreview] = useState<{ localId: string; memory: RequirementMemoryResponse } | null>(null)
  const [selectedLocalId, setSelectedLocalId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ localId: string; requirement: RequirementDTO; impact?: RequirementDeleteImpactResponse } | null>(null)
  const [proceduralViolations, setProceduralViolations] = useState<Map<string, RuleViolation[]>>(new Map())
  const [traceabilityPreview, setTraceabilityPreview] = useState<{ localId: string; requirement: RequirementDTO } | null>(null)
  
  // Persisted database Quality Analysis states
  const [qualityAnalyses, setQualityAnalyses] = useState<Map<string, RequirementQualityAnalysisDTO>>(new Map())
  const [activeQualityModal, setActiveQualityModal] = useState<{ localId: string; requirement: RequirementDTO; analysis: RequirementQualityAnalysisDTO | null } | null>(null)

  // Duplicates risk and traceability link counts states
  const [duplicateInfoMap, setDuplicateInfoMap] = useState<Map<string, { status: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH'; matches: any[] }>>(new Map())
  const [traceabilityCountMap, setTraceabilityCountMap] = useState<Map<string, number>>(new Map())

  const getDuplicateStatus = (matches: any[]) => {
    // Filter matches to only keep relevant ones (e.g., level !== 'LOW' and similarity >= 15%)
    const relevantMatches = matches.filter(m => {
      const pct = m.similarityPercentage || (m.similarity ? m.similarity * 100 : 0)
      return m.level !== 'LOW' && pct >= 15
    })

    if (!relevantMatches || relevantMatches.length === 0) return { status: 'NONE' as const, matches: [] }
    
    // Sort matches so that DUPLICATE and VERY_SIMILAR matches come before RELATED/LOW, then sort by similarity
    const sorted = [...relevantMatches].sort((a, b) => {
      const aIsDup = a.level === 'DUPLICATE' || a.level === 'VERY_SIMILAR' ? 1 : 0
      const bIsDup = b.level === 'DUPLICATE' || b.level === 'VERY_SIMILAR' ? 1 : 0
      if (aIsDup !== bIsDup) return bIsDup - aIsDup // Put DUPLICATE first
      
      const pctA = a.similarityPercentage || (a.similarity ? a.similarity * 100 : 0)
      const pctB = b.similarityPercentage || (b.similarity ? b.similarity * 100 : 0)
      return pctB - pctA // Put highest similarity first
    })

    const hasDuplicate = sorted.some(m => m.level === 'DUPLICATE' || m.level === 'VERY_SIMILAR')
    const hasRelated = sorted.some(m => m.level === 'RELATED')
    
    if (hasDuplicate) return { status: 'HIGH' as const, matches: sorted }
    if (hasRelated) return { status: 'MEDIUM' as const, matches: sorted }
    return { status: 'NONE' as const, matches: sorted }
  }

  /*
  const _runAnalysisForRow = async (localId: string, req: RequirementDTO) => {
    // 1. Traceability links count
    if (req.id) {
      try {
        const links = await requirementFacade.getRequirementTraceability(req.id)
        setTraceabilityCountMap(prev => {
          const next = new Map(prev)
          next.set(localId, links.length)
          return next
        })
      } catch (err) {
        console.error("Error loading traceability for row", localId, err)
      }
    }

    // 2. Rules check
    try {
      const response = await requirementFacade.evaluateRequirementAgainstRules(req, projectId)
      setProceduralViolations(prev => {
        const next = new Map(prev)
        next.set(localId, response.violations)
        return next
      })
    } catch (err) {
      console.error("Error running rules check for row", localId, err)
    }

    // 3. Duplicates check
    if (req.title.trim() || req.description.trim()) {
      try {
        const matches = await requirementFacade.checkDuplicates({
          projectId,
          title: req.title,
          description: req.description
        })
        const filtered = matches.filter((m: any) => m.requirementId !== req.id)
        const dupStatus = getDuplicateStatus(filtered)
        setDuplicateInfoMap(prev => {
          const next = new Map(prev)
          next.set(localId, dupStatus)
          return next
        })
      } catch (err) {
        console.error("Error checking duplicates for row", localId, err)
      }
    }
  }

  const _debounceTimersRef = React.useRef<Map<string, any>>(new Map())
  */

  const handleRowChangeDebounced = (_localId: string, _req: RequirementDTO) => {
    // Disabled automatic analysis on typing to avoid rate limits and duplicate executions.
    console.log("[RF_TABLE] auto runAnalysisForRow disabled");
  }

  const loadQualityAnalyses = async () => {
    if (!projectId) return
    try {
      const analyses = await qualityAnalysisApi.getProjectQualityAnalyses(projectId)
      const nextMap = new Map<string, RequirementQualityAnalysisDTO>()
      analyses.forEach(a => {
        if (a.requirementId) {
          nextMap.set(a.requirementId, a)
        }
      })
      setQualityAnalyses(nextMap)
    } catch (err) {
      console.warn("[QUALITY_UI] Fallback to empty quality map due to API error:", err)
      setQualityAnalyses(new Map())
    }
  }

  // Trigger analysis for all rows when initialRequirements loads
  useEffect(() => {
    loadQualityAnalyses()
    console.log("[RF_TABLE] initialRequirements changed, rows updated without auto analysis");
    console.log("[RF_TABLE] auto runAnalysisForRow disabled");
  }, [initialRequirements, projectId])

  // Filter options are derived from the FULL rows (including drafts) so that
  // dropdown options remain stable while filters are active.
  const filterOptions = useMemo(
    () => buildFilterOptions(rows.map(r => r.requirement)),
    [rows],
  )

  // visibleRows: apply filters to all rows (preserves draft rows, correct order)
  const visibleRows = useMemo(
    () => {
      const reqs = filterRequirements(rows.map(r => r.requirement), filters)
      const reqIds = new Set(reqs.map(r => r.id || r.code))
      return rows.filter(r => reqIds.has(r.requirement.id || r.requirement.code))
    },
    [rows, filters],
  )

  const selectedRow = rows.find(r => r.localId === selectedLocalId)
  const isFiltering = hasActiveFilters(filters)

  // ── Live quality analysis ──────────────────────────────────────────────────
  // Runs purely locally (no backend, no AI). Keyed by localId for O(1) lookup.
  // useMemo so it only recomputes when row requirements actually change.
  const qualityMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof analyzeRequirementText>>()
    for (const row of rows) {
      const localIssues = analyzeRequirementText({
        title: row.requirement.title,
        description: row.requirement.description,
        acceptanceCriteria: row.requirement.acceptanceCriteria,
        requirementType: row.requirement.requirementType ?? 'FUNCTIONAL',
      })
      
      const violations = proceduralViolations.get(row.localId) || []
      const proceduralIssues = violations.map(v => ({
        id: `rule-${v.ruleId}-${crypto.randomUUID().slice(0, 8)}`,
        ruleId: v.ruleId,
        severity: v.severity.toLowerCase() as any,
        field: 'procedural' as any,
        message: v.message,
        suggestion: `Regla: ${v.ruleName || 'Regla del proyecto'}`
      }))

      map.set(row.localId, [...localIssues, ...proceduralIssues])
    }
    return map
  }, [rows, proceduralViolations])

  // ── Helpers ──────────────────────────────────────────────────────────────

  const updateRow = (localId: string, updates: Partial<RequirementDTO>) => {
    setRows(prev => prev.map(row => {
      if (row.localId === localId) {
        const updatedReq = { ...row.requirement, ...updates }
        if ('title' in updates || 'description' in updates) {
          handleRowChangeDebounced(localId, updatedReq)
        }
        return { ...row, requirement: updatedReq, status: row.status === 'saved' ? 'draft' : row.status }
      }
      return row
    }))
  }

  const setRowStatus = (localId: string, status: RowStatus, errorMessage?: string) =>
    setRows(prev => prev.map(row => row.localId === localId ? { ...row, status, errorMessage } : row))

  // ── Add ──────────────────────────────────────────────────────────────────

  const handleAddRow = () => {
    const nextCode = generateNextCode(rows.map(r => r.requirement), 'RF')
    const newReq: RequirementDTO = {
      id: '', code: nextCode, title: '', description: '',
      actors: [], acceptanceCriteria: [],
      isoClassification: 'Funcional', requirementType: 'FUNCTIONAL',
      nonFunctionalDetail: null, projectId, relatedCodes: [],
    }
    const newLocalId = crypto.randomUUID()
    const newRow = { localId: newLocalId, requirement: newReq, status: 'draft' as RowStatus }
    // Insert draft in sorted position so new RF-004 appears after RF-003, not at top
    setRows(prev => {
      const allReqs = sortRequirements([...prev.map(r => r.requirement), newReq])
      const byCode = new Map([...prev.map(r => [r.requirement.code ?? r.localId, r] as const)])
      return allReqs.map(req =>
        (req.code === nextCode && !req.id)
          ? newRow
          : byCode.get(req.code ?? '') ?? prev.find(r => r.requirement.id === req.id) ?? newRow
      )
    })
    setSelectedLocalId(newLocalId)
    // Clear filters so the new row is visible
    setFilters(EMPTY_FILTERS)
  }

  // ── Save ─────────────────────────────────────────────────────────────────

  const handleSave = async (localId: string) => {
    const row = rows.find(r => r.localId === localId)
    if (!row) return
    const { requirement } = row
    if (!requirement.title.trim() || !requirement.description.trim()) {
      setRowStatus(localId, 'incomplete', 'Título y descripción requeridos')
      return
    }
    setRowStatus(localId, 'saving')
    try {
      const saved = await requirementFacade.saveRequirement({ ...requirement, id: requirement.id || '' })
      if (saved) {
        console.log("[SAVE_REQUIREMENT] saved requirement", saved.id);
        console.log("[SAVE_REQUIREMENT] updating local row only");
        setRows(prev => {
          const updated = prev.map(r =>
            r.localId === localId ? { ...r, requirement: saved, status: 'saved' as RowStatus, errorMessage: undefined } : r,
          )
          // Re-sort ALL rows together (drafts + saved) so newly saved items land in correct position
          const allReqs = sortRequirements(updated.map(r => r.requirement))
          const byLocalId = new Map(updated.map(r => [r.requirement.id || r.localId, r] as const))
          return allReqs.map(req => byLocalId.get(req.id || '') ?? byLocalId.get(updated.find(r => r.requirement.code === req.code)?.localId ?? '') ?? updated.find(r => r.requirement.code === req.code)!).filter(Boolean)
        })
        onRequirementsChange?.()
      } else {
        setRowStatus(localId, 'error', 'Error al guardar')
      }
    } catch (e: any) {
      setRowStatus(localId, 'error', e.message || 'Error de servidor')
    }
  }

  // ── AI Improve ───────────────────────────────────────────────────────────

  const handleImprove = async (localId: string) => {
    const row = rows.find(r => r.localId === localId)
    if (!row) return
    const { requirement } = row
    
    // Draft protection: require saved requirement
    if (!requirement.id) {
      setRowStatus(localId, 'error', 'Guarda el requisito antes de mejorarlo con IA.')
      return
    }
    
    // Content validation
    if (!requirement.title.trim() && !requirement.description.trim()) {
      setRowStatus(localId, 'error', 'El requisito debe tener título o descripción.')
      return
    }
    
    // Build payload with explicit requirementType for FUNCTIONAL requirements
    const payload: RequirementDTO = {
      ...requirement,
      projectId: requirement.projectId.trim(),
      requirementType: 'FUNCTIONAL',
    }
    
    setRowStatus(localId, 'checking') // Use 'checking' to denote AI processing
    try {
      const improved = await requirementFacade.improveRequirement(payload)
      if (improved) {
        setAiPreview({ current: requirement, suggested: improved, localId })
        setRowStatus(localId, 'saved') // restore status, let the modal handle applying
      } else {
        setRowStatus(localId, 'error', 'La IA no devolvió una propuesta válida.')
      }
    } catch (e: any) {
      const errorMsg = e.message || 'Error al mejorar requisito'
      
      if (e.data?.errorCode === 'error.requirement.out_of_context' || e.message?.includes('El requerimiento ingresado no parece estar relacionado')) {
        setRowStatus(localId, 'error', 'El requerimiento ingresado no parece estar relacionado con el proyecto actual. Por favor, revísalo.')
      } else if (e.status === 400 || e.statusCode === 400) {
        setRowStatus(
          localId,
          'error',
          'La solicitud de mejora no es válida. Verifica que el requisito tenga proyecto, tipo y descripción.'
        )
      } else if (errorMsg === 'MISSING_REQUIREMENT_TYPE') {
        setRowStatus(localId, 'error', 'Tipo de requisito obligatorio.')
      } else {
        setRowStatus(localId, 'error', errorMsg)
      }
    }
  }

  // ── Duplicates ───────────────────────────────────────────────────────────

  const handleCheckDuplicates = async (localId: string) => {
    const row = rows.find(r => r.localId === localId)
    if (!row) return
    const { requirement } = row
    if (!requirement.title.trim() && !requirement.description.trim()) {
      setRowStatus(localId, 'incomplete', 'Escribe algo primero')
      return
    }
    setRowStatus(localId, 'checking')
    try {
      console.log("[RF_TABLE] manual duplicate analysis for", requirement.id);
      const matches = await requirementFacade.checkDuplicates({
        projectId,
        title: requirement.title,
        description: requirement.description,
        requirementId: requirement.id,
        code: requirement.code,
        requirementType: 'FUNCTIONAL'
      })
      const filtered = matches.filter((m: any) => m.requirementId !== requirement.id)
      const dupStatus = getDuplicateStatus(filtered)
      setDuplicateInfoMap(prev => {
        const next = new Map(prev)
        next.set(localId, dupStatus)
        return next
      })
      setRowStatus(localId, row.status === 'checking' ? 'draft' : row.status)
      setDuplicatePreview({ localId, matches: dupStatus.matches })
    } catch {
      setRowStatus(localId, 'error', 'Error al verificar duplicados')
    }
  }

  const handleEvaluateRules = async (localId: string) => {
    const row = rows.find(r => r.localId === localId)
    if (!row) return
    setRowStatus(localId, 'checking')
    try {
      console.log("[RF_TABLE] manual rules evaluation for", row.requirement.id);
      const response = await requirementFacade.evaluateRequirementAgainstRules(row.requirement, projectId)
      setProceduralViolations(prev => {
        const next = new Map(prev)
        next.set(localId, response.violations)
        return next
      })
      setRowStatus(localId, row.requirement.id ? 'saved' : 'draft')
    } catch {
      setRowStatus(localId, 'error', 'Error al validar reglas')
    }
  }


  const handleManageTraceability = async (localId: string) => {
    const row = rows.find(r => r.localId === localId)
    if (!row || !row.requirement.id) return
    
    console.log("[RF_TABLE] manual traceability load for", row.requirement.id);
    
    try {
      const links = await requirementFacade.getRequirementTraceability(row.requirement.id)
      setTraceabilityCountMap(prev => {
        const next = new Map(prev)
        next.set(localId, links.length)
        return next
      })
    } catch (err) {
      console.error("Error loading traceability", err)
    }
    
    setTraceabilityPreview({ localId, requirement: row.requirement })
  }

  const applyAiImprovement = () => {
    if (!aiPreview) return
    const { suggested, localId } = aiPreview
    setRows(prev => prev.map(r =>
      r.localId === localId
        ? { ...r, requirement: { ...r.requirement, ...suggested, id: r.requirement.id, code: r.requirement.code }, status: 'ai_improved' }
        : r,
    ))
    setAiPreview(null)
  }

  // ── Delete ───────────────────────────────────────────────────────────────
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteRequest = async (localId: string) => {
    const row = rows.find(r => r.localId === localId)
    if (!row) return
    if (row.requirement.id) {
      setRowStatus(localId, 'checking')
      try {
        const impact = await requirementFacade.getRequirementDeleteImpact(row.requirement.id)
        setRowStatus(localId, 'saved')
        setDeleteConfirm({ localId, requirement: row.requirement, impact })
      } catch {
        setRowStatus(localId, 'error', 'Error al calcular impacto')
      }
    } else {
      setRows(prev => prev.filter(r => r.localId !== localId))
      if (selectedLocalId === localId) setSelectedLocalId(null)
    }
  }

  const handleOpenQualityAnalysis = async (localId: string, req: RequirementDTO) => {
    const row = rows.find(r => r.localId === localId)
    const localIssues = analyzeRequirementText({
      title: req.title,
      description: req.description,
      acceptanceCriteria: req.acceptanceCriteria,
      requirementType: req.requirementType ?? 'FUNCTIONAL',
    })
    const isSaved = row ? row.status === 'saved' : false
    const analysis = (isSaved && req.id && localIssues.length === 0) ? (qualityAnalyses.get(req.id) || null) : null
    setActiveQualityModal({ localId, requirement: req, analysis })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return
    const { localId, requirement } = deleteConfirm
    setRowStatus(localId, 'saving')
    setIsDeleting(true)
    try {
      await requirementFacade.deleteRequirement(requirement.id!)
      setRows(prev => prev.filter(r => r.localId !== localId))
      if (selectedLocalId === localId) setSelectedLocalId(null)
      onRequirementsChange?.()
      setDeleteConfirm(null)
    } catch {
      setRowStatus(localId, 'error', 'Error al borrar')
    } finally {
      setIsDeleting(false)
    }
  }



  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
            Gestión de Requisitos
          </h3>
          <span className="px-2 py-0.5 rounded-md bg-[var(--color-surface)] text-[var(--color-text-muted)] text-[11px] font-bold border border-[var(--color-border)]">
            {rows.length} Total
          </span>
        </div>
        <button
          onClick={handleAddRow}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-[var(--color-accent)] text-[var(--color-accent-foreground)] hover:opacity-90 transition-all shadow-lg shadow-[var(--color-accent)]/20 active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Nueva funcionalidad
        </button>
      </div>

      {/* Filter bar */}
      <RequirementFiltersBar
        filters={filters}
        options={filterOptions}
        onFiltersChange={setFilters}
        totalShown={visibleRows.length}
        totalAll={rows.length}
        showRnfFilters={false}
      />

      <div className="relative flex-1 flex">
        {/* Table */}
        <div className={`flex-1 transition-all duration-500 ${selectedLocalId ? 'mr-[420px]' : ''}`}>
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl shadow-xl flex flex-col h-fit overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-[var(--color-border-strong)]">
              <table className="w-full border-collapse text-left min-w-[1100px] table-fixed">
                <thead className="sticky top-0 z-10 bg-[var(--color-surface)]/95 backdrop-blur-md shadow-sm">
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] w-24">Código</th>
                    <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] w-1/4">Título</th>
                    <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] w-2/5">Descripción</th>
                    <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] w-40">Actores</th>
                    <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] text-center w-20">BDD</th>
                    <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] w-28">Estado</th>
                    <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] w-44">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-24 text-center">
                        <div className="flex flex-col items-center gap-3">
                          {isFiltering ? (
                            <>
                              <svg className="w-12 h-12 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                              </svg>
                              <p className="text-sm font-semibold text-[var(--color-text-secondary)]">Ningún requisito coincide con los filtros actuales</p>
                              <button
                                onClick={() => setFilters(EMPTY_FILTERS)}
                                className="text-xs text-[var(--color-accent)] hover:underline font-medium"
                              >
                                Limpiar filtros
                              </button>
                            </>
                          ) : (
                            <>
                              <svg className="w-12 h-12 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <p className="text-sm italic font-medium opacity-30">No hay requisitos funcionales en este proyecto</p>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    visibleRows.map(row => (
                      <EditableRequirementRow
                        key={row.localId}
                        localId={row.localId}
                        requirement={row.requirement}
                        status={row.status}
                        errorMessage={row.errorMessage}
                        isSelected={selectedLocalId === row.localId}
                        duplicateInfo={duplicateInfoMap.get(row.localId)}
                        traceabilityCount={traceabilityCountMap.get(row.localId) || 0}
                        onUpdate={updates => updateRow(row.localId, updates)}
                        onSave={() => handleSave(row.localId)}
                        onImprove={() => handleImprove(row.localId)}
                        onCheckDuplicates={() => handleCheckDuplicates(row.localId)}
                        onOpenQualityAnalysis={() => handleOpenQualityAnalysis(row.localId, row.requirement)}
                        qualityAnalysis={row.requirement.id ? qualityAnalyses.get(row.requirement.id) : null}
                        onEvaluateRules={() => handleEvaluateRules(row.localId)}
                        onManageTraceability={() => handleManageTraceability(row.localId)}
                        onDelete={() => handleDeleteRequest(row.localId)}
                        onSelect={() => setSelectedLocalId(row.localId === selectedLocalId ? null : row.localId)}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Floating detail panel */}
        <div
          className={`fixed inset-y-0 right-0 w-[420px] z-50 transform transition-all duration-500 ease-in-out p-6 pointer-events-none ${selectedLocalId ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
        >
          {selectedRow && (
            <div className="h-full pointer-events-auto">
              <RequirementTableDetail
                requirement={selectedRow.requirement}
                status={selectedRow.status}
                onClose={() => setSelectedLocalId(null)}
                onSave={() => handleSave(selectedRow.localId)}
                onImprove={() => handleImprove(selectedRow.localId)}
                onUpdate={updates => updateRow(selectedRow.localId, updates)}
              />
            </div>
          )}
        </div>
      </div>

      {deleteConfirm && (
        <DeleteConfirmationModal
          requirement={deleteConfirm.requirement}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      {aiPreview && (
        <RequirementAiImprovePreview
          current={aiPreview.current}
          suggested={aiPreview.suggested}
          onApply={applyAiImprovement}
          onCancel={() => setAiPreview(null)}
        />
      )}

      {duplicatePreview && (
        <RequirementSimilarityPanel
          matches={duplicatePreview.matches}
          onClose={() => setDuplicatePreview(null)}
          onImproveWithAi={() => {
            const lid = duplicatePreview.localId
            setDuplicatePreview(null)
            handleImprove(lid)
          }}
        />
      )}

      {memoryPreview && (
        <RequirementMemoryPanel
          memory={memoryPreview.memory}
          onClose={() => setMemoryPreview(null)}
          qualityIssues={qualityMap.get(memoryPreview.localId)}
        />
      )}

      {traceabilityPreview && (
        <RequirementTraceabilityPanel
          requirement={traceabilityPreview.requirement}
          allRequirements={rows.map(r => r.requirement)}
          onClose={() => setTraceabilityPreview(null)}
        />
      )}

      {deleteConfirm && deleteConfirm.impact && (
        <RequirementDeleteImpactModal
          impact={deleteConfirm.impact}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirm(null)}
          isDeleting={isDeleting}
        />
      )}

      {deleteConfirm && !deleteConfirm.impact && (
        <DeleteConfirmationModal
          requirement={deleteConfirm.requirement}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      {activeQualityModal && (() => {
        const liveRow = rows.find(r => r.localId === activeQualityModal.localId)
        const liveReq = liveRow ? liveRow.requirement : activeQualityModal.requirement
        const localIssues = analyzeRequirementText({
          title: liveReq.title,
          description: liveReq.description,
          acceptanceCriteria: liveReq.acceptanceCriteria,
          requirementType: liveReq.requirementType ?? 'FUNCTIONAL',
        })
        const isSaved = liveRow ? liveRow.status === 'saved' : false
        const analysis = (isSaved && liveReq.id && localIssues.length === 0) ? (qualityAnalyses.get(liveReq.id) || null) : null
        return (
          <RequirementQualityDetailModal
            requirement={liveReq}
            analysis={analysis}
            isOpen={activeQualityModal !== null}
            status={liveRow ? liveRow.status : 'draft'}
            onClose={() => setActiveQualityModal(null)}
            onReanalized={(updated) => {
              setQualityAnalyses(prev => {
                const next = new Map(prev)
                next.set(updated.requirementId, updated)
                return next
              })
              setActiveQualityModal(prev => prev ? { ...prev, analysis: updated } : null)
            }}
          />
        )
      })()}
    </div>
  )
}
