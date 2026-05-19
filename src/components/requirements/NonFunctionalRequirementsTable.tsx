import React, { useState, useEffect, useMemo } from 'react'
import { requirementFacade } from '../../facades/requirement.facade'
import { generateNextCode } from '../../utils/requirementCodeUtils'
import { sortRequirements } from '../../utils/requirementSortUtils'
import { DeleteConfirmationModal } from './DeleteConfirmationModal'
import { RequirementDeleteImpactModal } from './RequirementDeleteImpactModal'
import { RequirementAiImprovePreview } from './RequirementAiImprovePreview'
import { RequirementSimilarityPanel } from './RequirementSimilarityPanel'
import { RequirementMemoryPanel } from './RequirementMemoryPanel'
import { RequirementFiltersBar } from './RequirementFiltersBar'
import { RequirementTraceabilityPanel } from './RequirementTraceabilityPanel'
import { RequirementQualityStatusBadge } from './RequirementQualityStatusBadge'
import { RequirementQualityDetailModal } from './RequirementQualityDetailModal'
import { analyzeRequirementText } from '../../utils/requirementQualityAnalyzer'
import { qualityAnalysisApi } from '../../api/services/qualityAnalysisApi'
import {
  EMPTY_FILTERS,
  buildFilterOptions,
  filterRequirements,
  hasActiveFilters,
  type RequirementFilters,
} from '../../utils/requirementFilterUtils'
import type { RequirementDTO, NonFunctionalDetailDTO, RequirementMemoryResponse, RequirementDeleteImpactResponse, RequirementQualityAnalysisDTO } from '../../types/requirements'

type RowStatus = 'draft' | 'saved' | 'saving' | 'error' | 'incomplete' | 'ai_improved' | 'checking'

interface TableRow {
  localId: string
  requirement: RequirementDTO
  status: RowStatus
  errorMessage?: string
}

const ISO_CATEGORIES = [
  'Rendimiento', 'Seguridad', 'Usabilidad', 'Confiabilidad',
  'Mantenibilidad', 'Portabilidad', 'Compatibilidad', 'Funcionalidad',
]

const OPERATORS = ['<', '<=', '=', '>=', '>', '≠']

function NfDetailPanel({
  detail,
  onChange,
}: {
  detail: NonFunctionalDetailDTO
  onChange: (d: Partial<NonFunctionalDetailDTO>) => void
}) {
  const inp = 'w-full px-2 py-1.5 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]'
  return (
    <div className="grid grid-cols-2 gap-3 p-4 bg-[var(--color-surface)]/40 rounded-xl border border-[var(--color-border)] mt-2">
      <div>
        <label className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-1 block">Categoría ISO</label>
        <select value={detail.category} onChange={e => onChange({ category: e.target.value })} className={inp}>
          <option value="">Seleccionar…</option>
          {ISO_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-1 block">Métrica</label>
        <input value={detail.metricName} onChange={e => onChange({ metricName: e.target.value })} placeholder="Ej: Tiempo de respuesta" className={inp} />
      </div>
      <div className="flex gap-2">
        <div className="w-20 flex-shrink-0">
          <label className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-1 block">Operador</label>
          <select value={detail.operator} onChange={e => onChange({ operator: e.target.value })} className={inp}>
            {OPERATORS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-1 block">Valor objetivo</label>
          <input value={detail.targetValue} onChange={e => onChange({ targetValue: e.target.value })} placeholder="Ej: 2" className={inp} />
        </div>
        <div className="w-20 flex-shrink-0">
          <label className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-1 block">Unidad</label>
          <input value={detail.unit} onChange={e => onChange({ unit: e.target.value })} placeholder="seg, %, ms" className={inp} />
        </div>
      </div>
      <div>
        <label className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-1 block">Método de verificación</label>
        <input value={detail.verificationMethod} onChange={e => onChange({ verificationMethod: e.target.value })} placeholder="Test de carga, auditoría…" className={inp} />
      </div>
      <div className="col-span-2">
        <label className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-1 block">Contexto (opcional)</label>
        <input value={detail.context ?? ''} onChange={e => onChange({ context: e.target.value })} placeholder="Condiciones de aplicación…" className={inp} />
      </div>
    </div>
  )
}

const EMPTY_DETAIL: NonFunctionalDetailDTO = {
  category: '',
  metricName: '',
  operator: '<=',
  targetValue: '',
  unit: '',
  verificationMethod: '',
  context: '',
}

function toRows(reqs: RequirementDTO[]): TableRow[] {
  return sortRequirements(reqs).map(r => ({ localId: r.id || crypto.randomUUID(), requirement: r, status: 'saved' as RowStatus }))
}

interface Props {
  projectId: string
  initialRequirements: RequirementDTO[]
  onRequirementsChange?: () => void
}

export const NonFunctionalRequirementsTable: React.FC<Props> = ({ projectId, initialRequirements, onRequirementsChange }) => {
  const [rows, setRows] = useState<TableRow[]>(() => toRows(initialRequirements))
  const [filters, setFilters] = useState<RequirementFilters>(EMPTY_FILTERS)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ localId: string; requirement: RequirementDTO; impact?: RequirementDeleteImpactResponse } | null>(null)
  const [aiPreview, setAiPreview] = useState<{ current: RequirementDTO; suggested: RequirementDTO; localId: string } | null>(null)
  const [duplicatePreview, setDuplicatePreview] = useState<{ localId: string; matches: any[] } | null>(null)
  const [memoryPreview, setMemoryPreview] = useState<{ localId: string; memory: RequirementMemoryResponse } | null>(null)

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

    // 2. Duplicates check
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
    console.log("[RNF_TABLE] auto runAnalysisForRow disabled");
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
    console.log("[RNF_TABLE] initialRequirements changed, rows updated without auto analysis");
    console.log("[RNF_TABLE] auto runAnalysisForRow disabled");
  }, [initialRequirements, projectId])

  // Fix: sync rows when parent refetches (re-entering the screen)
  // Merge all rows (drafts + saved) sorted by code, preserving unsaved drafts
  useEffect(() => {
    setRows(prev => {
      const drafts = prev.filter(r => !r.requirement.id && r.status !== 'saved')
      const savedReqs = toRows(initialRequirements)
      // Combine drafts with saved rows and sort everything together by code
      const allReqs = [
        ...drafts.map(d => d.requirement),
        ...savedReqs.map(s => s.requirement),
      ]
      const sortedReqs = sortRequirements(allReqs)
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

  // Filter options derived from full rows (stable while filters are active)
  const filterOptions = useMemo(
    () => buildFilterOptions(rows.map(r => r.requirement)),
    [rows],
  )

  // visibleRows: apply shared filter logic, preserve sorted order
  const visibleRows = useMemo(() => {
    const reqs = filterRequirements(rows.map(r => r.requirement), filters)
    const reqIds = new Set(reqs.map(r => r.id || r.code))
    return rows.filter(r => reqIds.has(r.requirement.id || r.requirement.code))
  }, [rows, filters])

  const isFiltering = hasActiveFilters(filters)


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

  const updateDetail = (localId: string, delta: Partial<NonFunctionalDetailDTO>) =>
    setRows(prev => prev.map(r => {
      if (r.localId !== localId) return r
      const detail = { ...(r.requirement.nonFunctionalDetail ?? EMPTY_DETAIL), ...delta }
      return { ...r, requirement: { ...r.requirement, nonFunctionalDetail: detail }, status: r.status === 'saved' ? 'draft' : r.status }
    }))

  const setStatus = (localId: string, status: RowStatus, errorMessage?: string) =>
    setRows(prev => prev.map(r => r.localId === localId ? { ...r, status, errorMessage } : r))

  const handleAdd = () => {
    const code = generateNextCode(rows.map(r => r.requirement), 'RNF')
    const req: RequirementDTO = {
      id: '', code, title: '', description: '',
      actors: [], acceptanceCriteria: [],
      isoClassification: '', requirementType: 'NON_FUNCTIONAL',
      nonFunctionalDetail: { ...EMPTY_DETAIL }, projectId, relatedCodes: [],
    }
    const lid = crypto.randomUUID()
    const newRow = { localId: lid, requirement: req, status: 'draft' as RowStatus }
    // Insert draft in sorted position so RNF-003 appears after RNF-002, not at top
    setRows(prev => {
      const allReqs = sortRequirements([...prev.map(r => r.requirement), req])
      const byCode = new Map([...prev.map(r => [r.requirement.code ?? r.localId, r] as const)])
      return allReqs.map(r =>
        (r.code === code && !r.id)
          ? newRow
          : byCode.get(r.code ?? '') ?? prev.find(p => p.requirement.id === r.id) ?? newRow
      )
    })
    setExpandedId(lid)
    setFilters(EMPTY_FILTERS) // clear filters so new row is visible
  }



  const handleSave = async (localId: string) => {
    const row = rows.find(r => r.localId === localId)
    if (!row) return
    if (!row.requirement.title.trim() || !row.requirement.description.trim()) {
      setStatus(localId, 'incomplete', 'Título y descripción requeridos')
      return
    }
    setStatus(localId, 'saving')
    try {
      const saved = await requirementFacade.saveRequirement({ ...row.requirement, id: row.requirement.id || '' })
      if (saved) {
        console.log("[SAVE_REQUIREMENT] saved requirement", saved.id);
        console.log("[SAVE_REQUIREMENT] updating local row only");
        setRows(prev => {
          const updated = prev.map(r => r.localId === localId ? { ...r, requirement: saved, status: 'saved' as RowStatus, errorMessage: undefined } : r)
          // Re-sort ALL rows together (drafts + saved) so newly saved items land in correct position
          const allReqs = sortRequirements(updated.map(r => r.requirement))
          const byLocalId = new Map(updated.map(r => [r.requirement.id || r.localId, r] as const))
          return allReqs.map(req => byLocalId.get(req.id || '') ?? byLocalId.get(updated.find(r => r.requirement.code === req.code)?.localId ?? '') ?? updated.find(r => r.requirement.code === req.code)!).filter(Boolean)
        })
        onRequirementsChange?.()
      } else setStatus(localId, 'error', 'Error al guardar')
    } catch (e: any) {
      setStatus(localId, 'error', e.message || 'Error de servidor')
    }
  }

  const handleImprove = async (localId: string) => {
    const row = rows.find(r => r.localId === localId)
    if (!row || !row.requirement.id) return // disabled for drafts
    const { requirement } = row
    
    // Content validation
    if (!requirement.title.trim() && !requirement.description.trim()) {
      setStatus(localId, 'error', 'El requisito debe tener título o descripción.')
      return
    }
    
    // Build payload with explicit requirementType for NON_FUNCTIONAL requirements
    const payload: RequirementDTO = {
      ...requirement,
      projectId: requirement.projectId.trim(),
      requirementType: 'NON_FUNCTIONAL',
    }
    
    setStatus(localId, 'checking') // Use 'checking' to denote AI processing
    try {
      const improved = await requirementFacade.improveRequirement(payload)
      if (improved) {
        setAiPreview({ current: requirement, suggested: improved, localId })
        setStatus(localId, 'saved') // restore status, let the modal handle applying
      } else {
        setStatus(localId, 'error', 'La IA no devolvió una propuesta válida.')
      }
    } catch (e: any) {
      const errorMsg = e.message || 'Error al mejorar requisito'
      
      // Check if it's a 400 Bad Request from backend
      if (e.status === 400 || e.statusCode === 400) {
        setStatus(
          localId,
          'error',
          'La solicitud de mejora no es válida. Verifica que el requisito tenga proyecto, tipo y descripción.'
        )
      } else if (errorMsg === 'MISSING_REQUIREMENT_TYPE') {
        setStatus(localId, 'error', 'Tipo de requisito obligatorio.')
      } else {
        setStatus(localId, 'error', errorMsg)
      }
    }
  }

  const handleCheckDuplicates = async (localId: string) => {
    const row = rows.find(r => r.localId === localId)
    if (!row) return
    const { requirement } = row
    if (!requirement.title.trim() && !requirement.description.trim()) {
      setStatus(localId, 'incomplete', 'Escribe algo primero')
      return
    }
    setStatus(localId, 'checking')
    try {
      console.log("[RNF_TABLE] manual duplicate analysis for", requirement.id);
      const matches = await requirementFacade.checkDuplicates({
        projectId,
        title: requirement.title,
        description: requirement.description,
        requirementId: requirement.id,
        code: requirement.code,
        requirementType: 'NON_FUNCTIONAL'
      })
      const filtered = matches.filter((m: any) => m.requirementId !== requirement.id)
      const dupStatus = getDuplicateStatus(filtered)
      setDuplicateInfoMap(prev => {
        const next = new Map(prev)
        next.set(localId, dupStatus)
        return next
      })
      setStatus(localId, row.status === 'checking' ? 'draft' : row.status)
      setDuplicatePreview({ localId, matches: dupStatus.matches })
    } catch {
      setStatus(localId, 'error', 'Error al verificar duplicados')
    }
  }


  const handleManageTraceability = async (localId: string) => {
    const row = rows.find(r => r.localId === localId)
    if (!row || !row.requirement.id) return
    
    console.log("[RNF_TABLE] manual traceability load for", row.requirement.id);
    
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

  const handleOpenQualityAnalysis = async (localId: string, req: RequirementDTO) => {
    const row = rows.find(r => r.localId === localId)
    const localIssues = analyzeRequirementText({
      title: req.title,
      description: req.description,
      acceptanceCriteria: req.acceptanceCriteria,
      requirementType: req.requirementType ?? 'NON_FUNCTIONAL',
    })
    const isSaved = row ? row.status === 'saved' : false
    const analysis = (isSaved && req.id && localIssues.length === 0) ? (qualityAnalyses.get(req.id) || null) : null
    setActiveQualityModal({ localId, requirement: req, analysis })
  }



  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteRequest = async (localId: string) => {
    const row = rows.find(r => r.localId === localId)
    if (!row) return
    if (row.requirement.id) {
      setStatus(localId, 'checking')
      try {
        const impact = await requirementFacade.getRequirementDeleteImpact(row.requirement.id)
        setStatus(localId, 'saved')
        setDeleteConfirm({ localId, requirement: row.requirement, impact })
      } catch {
        setStatus(localId, 'error', 'Error al calcular impacto')
      }
    } else {
      setRows(prev => prev.filter(r => r.localId !== localId))
      if (expandedId === localId) setExpandedId(null)
    }
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return
    const { localId, requirement } = deleteConfirm
    setStatus(localId, 'saving')
    setIsDeleting(true)
    try {
      await requirementFacade.deleteRequirement(requirement.id!)
      setRows(prev => prev.filter(r => r.localId !== localId))
      if (expandedId === localId) setExpandedId(null)
      onRequirementsChange?.()
      setDeleteConfirm(null)
    } catch {
      setStatus(localId, 'error', 'Error al borrar')
    } finally {
      setIsDeleting(false)
    }
  }

  const statusBadge = (status: RowStatus) => {
    const map: Record<RowStatus, string> = {
      saved: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      draft: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      saving: 'bg-slate-500/10 text-slate-500 animate-pulse border-slate-500/20',
      checking: 'bg-slate-500/10 text-slate-500 animate-pulse border-slate-500/20',
      error: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
      incomplete: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      ai_improved: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    }
    const label: Record<RowStatus, string> = { saved: 'Guardado', draft: 'Borrador', saving: 'Guardando', checking: 'Procesando', error: 'Error', incomplete: 'Incompleto', ai_improved: 'IA ✨' }
    return <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${map[status]}`}>{label[status]}</span>
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Requisitos No Funcionales</h3>
          <span className="px-2 py-0.5 rounded-md bg-[var(--color-surface)] text-[var(--color-text-muted)] text-[11px] font-bold border border-[var(--color-border)]">{rows.length} Total</span>
        </div>
        <button onClick={handleAdd} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-[var(--color-accent)] text-[var(--color-accent-foreground)] hover:opacity-90 transition-all shadow-lg shadow-[var(--color-accent)]/20 active:scale-95">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          Nuevo RNF
        </button>
      </div>

      {/* Filter bar */}
      <RequirementFiltersBar
        filters={filters}
        options={filterOptions}
        onFiltersChange={setFilters}
        totalShown={visibleRows.length}
        totalAll={rows.length}
        showRnfFilters={true}
      />

      {/* Table */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left min-w-[900px]">
            <thead className="bg-[var(--color-surface)]/95 backdrop-blur-md">
              <tr className="border-b border-[var(--color-border)]">
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] w-24">Código</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] w-36">Categoría ISO</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Título</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] w-48">Métrica objetivo</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] w-28">Estado</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] w-36">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-24 text-center">
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <p className="text-sm italic font-medium opacity-30">No hay requisitos no funcionales en este proyecto</p>
                      </>
                    )}
                  </div>
                </td></tr>
              ) : visibleRows.map(row => {
                const d = row.requirement.nonFunctionalDetail
                const isExpanded = expandedId === row.localId
                const metricLabel = d?.metricName && d?.targetValue ? `${d.metricName} ${d.operator} ${d.targetValue} ${d.unit}`.trim() : '—'
                const isInvalid = row.status === 'incomplete' || row.status === 'error'

                const localIssues = analyzeRequirementText({
                  title: row.requirement.title,
                  description: row.requirement.description,
                  acceptanceCriteria: row.requirement.acceptanceCriteria,
                  requirementType: 'NON_FUNCTIONAL',
                })

                const localAnalysis: RequirementQualityAnalysisDTO = {
                  id: `local-${row.requirement.id || 'draft'}`,
                  requirementId: row.requirement.id || 'draft',
                  requirementCode: row.requirement.code || 'REQ',
                  requirementType: 'NON_FUNCTIONAL' as const,
                  qualityStatus: (localIssues.some(i => i.severity === 'error') ? 'ERROR' : localIssues.length > 0 ? 'WARNING' : 'OK') as any,
                  totalViolations: localIssues.length,
                  errorCount: localIssues.filter(i => i.severity === 'error').length,
                  warningCount: localIssues.filter(i => i.severity === 'warning').length,
                  infoCount: 0,
                  analyzedAt: new Date().toISOString(),
                  analysisSource: 'RULES' as const,
                  violations: localIssues.map(issue => ({
                    id: issue.id,
                    field: issue.field === 'procedural' ? 'description' : issue.field,
                    severity: issue.severity.toUpperCase() as 'WARNING' | 'ERROR' | 'INFO',
                    fragment: issue.term || '',
                    message: issue.message,
                    suggestion: issue.suggestion || null,
                    ruleCode: issue.ruleId || 'AMBIGUOUS_TERM',
                    ruleName: 'Regla de calidad / Claridad'
                  }))
                }

                return (
                  <React.Fragment key={row.localId}>
                    <tr onClick={() => setExpandedId(isExpanded ? null : row.localId)}
                      className={`group border-b border-[var(--color-border)] transition-all cursor-pointer ${isExpanded ? 'bg-[var(--color-accent-subtle)]/10 shadow-[inset_4px_0_0_0_var(--color-accent)]' : 'hover:bg-[var(--color-surface)]/30'}`}>
                      <td className="px-4 py-3 text-[11px] font-mono font-bold text-[var(--color-text-muted)]">{row.requirement.code || 'RNF-Borrador'}</td>
                      <td className="px-4 py-3">
                        {d?.category ? (
                          <span className="inline-flex items-center h-5 px-2 rounded-md text-[10px] font-bold bg-violet-500/10 text-violet-600 border border-violet-500/20">{d.category}</span>
                        ) : <span className="text-[11px] text-[var(--color-text-muted)] italic">Sin categoría</span>}
                      </td>
                      <td className="px-4 py-3 text-left align-top">
                        <input value={row.requirement.title} onClick={e => e.stopPropagation()}
                          onChange={e => updateRow(row.localId, { title: e.target.value })}
                          placeholder="Título del RNF..."
                          className={`w-full text-sm font-semibold bg-transparent border-0 focus:ring-1 focus:ring-[var(--color-accent)] rounded transition-all placeholder:text-[var(--color-text-muted)]/40 ${isInvalid && !row.requirement.title ? 'bg-rose-500/5 ring-1 ring-rose-500/30' : ''}`}
                        />
                        {row.requirement.description && (
                          <p className="text-[11px] text-[var(--color-text-muted)] whitespace-pre-wrap break-words mt-1 px-0.5 leading-relaxed max-w-2xl">
                            {row.requirement.description}
                          </p>
                        )}

                        {/* Horizontal Badges for RNF */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2" onClick={e => e.stopPropagation()}>
                          {/* Calidad Badge — live client-side ambiguity/quality analysis */}
                          <RequirementQualityStatusBadge 
                            analysis={(row.requirement.id ? (qualityAnalyses.get(row.requirement.id) || null) : null) || localAnalysis}
                            onClick={() => handleOpenQualityAnalysis(row.localId, row.requirement)}
                          />

                          {/* Duplicados Badge */}
                          {(() => {
                            const dupInfo = duplicateInfoMap.get(row.localId)
                            if (!dupInfo) return null
                            return (
                              <span
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleCheckDuplicates?.(row.localId)
                                }}
                                title="Click para reanalizar duplicados"
                                className={`cursor-pointer inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border transition-colors ${
                                  dupInfo.status === 'NONE'
                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20'
                                    : dupInfo.status === 'LOW'
                                    ? 'bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20'
                                    : dupInfo.status === 'MEDIUM'
                                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20'
                                    : 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20'
                                }`}
                              >
                                <span className="w-1 h-1 rounded-full bg-current shrink-0" />
                                {dupInfo.status === 'NONE' && 'Dups: Sin riesgo'}
                                {dupInfo.status === 'LOW' && `Dups: Bajo (${dupInfo.matches[0] ? Math.round(dupInfo.matches[0].similarityPercentage || dupInfo.matches[0].similarity * 100) : 0}%)`}
                                {dupInfo.status === 'MEDIUM' && `Dups: Revisar (${dupInfo.matches[0] ? Math.round(dupInfo.matches[0].similarityPercentage || dupInfo.matches[0].similarity * 100) : 0}%)`}
                                {dupInfo.status === 'HIGH' && `Dups: Alto (${dupInfo.matches[0] ? Math.round(dupInfo.matches[0].similarityPercentage || dupInfo.matches[0].similarity * 100) : 0}%)`}
                              </span>
                            )
                          })()}

                          {/* Trazabilidad Badge */}
                          {row.requirement.id && (
                            <span
                              onClick={(e) => {
                                  e.stopPropagation()
                                  handleManageTraceability?.(row.localId)
                              }}
                              title="Click para gestionar trazabilidad"
                              className={`cursor-pointer inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border transition-colors bg-cyan-500/10 text-cyan-500 border-cyan-500/20 hover:bg-cyan-500/20`}
                            >
                              <span className="w-1 h-1 rounded-full bg-current shrink-0" />
                              Traza: {traceabilityCountMap.get(row.localId) || 0}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-[var(--color-text-secondary)] font-mono">{metricLabel}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {statusBadge(row.status)}
                          {row.errorMessage && <p className="text-[9px] text-rose-500 mt-0.5">{row.errorMessage}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={e => { e.stopPropagation(); handleSave(row.localId) }} disabled={row.status === 'saving'} title="Guardar" className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-500/10 transition-colors disabled:opacity-30">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          </button>
                          
                          <button onClick={e => { e.stopPropagation(); handleDeleteRequest(row.localId) }} disabled={row.status === 'saving'} title="Eliminar" className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-500/10 transition-colors disabled:opacity-30">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>

                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {deleteConfirm && <DeleteConfirmationModal requirement={deleteConfirm.requirement} onConfirm={confirmDelete} onCancel={() => setDeleteConfirm(null)} />}
      {aiPreview && (
        <RequirementAiImprovePreview
          current={aiPreview.current}
          suggested={aiPreview.suggested}
          onCancel={() => setAiPreview(null)}
          onApply={() => {
            setRows(prev => prev.map(r => r.localId === aiPreview.localId ? { ...r, requirement: { ...r.requirement, ...aiPreview.suggested, id: r.requirement.id, code: r.requirement.code }, status: 'ai_improved' } : r))
            setAiPreview(null)
          }}
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

      {memoryPreview && (
        <RequirementMemoryPanel
          memory={memoryPreview.memory}
          onClose={() => setMemoryPreview(null)}
          qualityIssues={[]}
        />
      )}

      {traceabilityPreview && (
        <RequirementTraceabilityPanel
          requirement={traceabilityPreview.requirement}
          allRequirements={rows.map(r => r.requirement)}
          onClose={() => setTraceabilityPreview(null)}
        />
      )}

      {/* Centered Floating RNF Detail Modal */}
      {expandedId && (() => {
        const row = rows.find(r => r.localId === expandedId)
        if (!row) return null
        const isInvalid = row.status === 'incomplete' || row.status === 'error'
        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            {/* Modal Backdrop to click and close */}
            <div 
              className="absolute inset-0 cursor-default" 
              onClick={() => setExpandedId(null)} 
            />

            {/* Modal Content Card */}
            <div className="relative w-full max-w-4xl max-h-[90vh] bg-[var(--color-bg-card)] border border-[var(--color-border-strong)] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
              
              {/* Header */}
              <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-surface)]/30">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-[var(--color-text-muted)] bg-[var(--color-bg)] px-2.5 py-1 rounded-lg border border-[var(--color-border)]">
                    {row.requirement.code || 'Borrador'}
                  </span>
                  <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                    Editar Requisito No Funcional
                  </h3>
                </div>
                <button 
                  onClick={() => setExpandedId(null)}
                  className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
                
                {/* Title Input */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-2 block">
                    Título del Requisito
                  </label>
                  <input
                    type="text"
                    value={row.requirement.title}
                    onChange={e => updateRow(row.localId, { title: e.target.value })}
                    placeholder="Título del RNF..."
                    className={`w-full px-3 py-2 text-sm font-semibold bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] transition-all ${
                      isInvalid && !row.requirement.title ? 'bg-rose-500/5 ring-1 ring-rose-500/30' : ''
                    }`}
                  />
                </div>

                {/* Descripción (Full Width) */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-2 block">
                    Descripción
                  </label>
                  <textarea 
                    value={row.requirement.description || ''}
                    onChange={e => updateRow(row.localId, { description: e.target.value })}
                    placeholder="Describe el requisito no funcional..."
                    rows={4}
                    className={`w-full px-3 py-2 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] resize-none transition-all ${
                      isInvalid && !row.requirement.description ? 'ring-1 ring-rose-500/30' : ''
                    }`}
                  />
                </div>

                {/* Section: Criterios de Aceptación (Tarjeta Aparte) */}
                <div className="border-t border-[var(--color-border)]/50 pt-5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-3 block flex items-center gap-1.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    Criterios de Aceptación
                  </label>
                  <div className="bg-[var(--color-bg)]/30 border border-[var(--color-border)]/85 rounded-xl p-4 space-y-3">
                    <div className="space-y-2.5">
                      {(row.requirement.acceptanceCriteria || []).length === 0 ? (
                        <p className="text-xs text-[var(--color-text-muted)] italic py-6 text-center">
                          No hay criterios de aceptación definidos para este requisito.
                        </p>
                      ) : (
                        (row.requirement.acceptanceCriteria || []).map((c, i) => (
                          <div key={i} className="flex gap-2 items-start bg-[var(--color-surface)]/20 p-2 rounded-lg border border-[var(--color-border)]/50 focus-within:border-[var(--color-accent)]/50 transition-colors">
                            <span className="text-[var(--color-accent)] font-bold text-xs mt-1.5 ml-1 flex-shrink-0">✓</span>
                            <textarea 
                              value={c} 
                              onChange={e => {
                                const next = [...(row.requirement.acceptanceCriteria || [])]
                                next[i] = e.target.value
                                updateRow(row.localId, { acceptanceCriteria: next })
                              }} 
                              placeholder="Escribe un criterio de aceptación..."
                              rows={3}
                              className="flex-1 px-2.5 py-1 text-xs bg-transparent border-0 focus:ring-0 resize-none focus:outline-none placeholder:text-[var(--color-text-muted)]/40 overflow-hidden"
                            />
                            <button 
                              onClick={() => {
                                const next = (row.requirement.acceptanceCriteria || []).filter((_, j) => j !== i)
                                updateRow(row.localId, { acceptanceCriteria: next })
                              }} 
                              className="text-rose-500 hover:text-rose-700 text-xs p-1.5 transition-colors rounded-lg hover:bg-rose-500/10"
                            >
                              ✕
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="flex justify-start">
                      <button 
                        onClick={() => updateRow(row.localId, { acceptanceCriteria: [...(row.requirement.acceptanceCriteria || []), ''] })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[var(--color-accent)] bg-[var(--color-accent-subtle)]/30 hover:bg-[var(--color-accent-subtle)]/50 font-bold transition-all"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Agregar criterio de aceptación</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Section: ISO 25010 */}
                <div className="border-t border-[var(--color-border)]/50 pt-5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-3 block flex items-center gap-1.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-violet-500 animate-pulse" />
                    Especificación ISO 25010
                  </label>
                  <div className="bg-[var(--color-bg)]/30 border border-[var(--color-border)]/80 rounded-xl p-4">
                    <NfDetailPanel
                      detail={row.requirement.nonFunctionalDetail ?? { ...EMPTY_DETAIL }}
                      onChange={delta => updateDetail(row.localId, delta)}
                    />
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-[var(--color-border)] flex items-center justify-between bg-[var(--color-surface)]/20">
                {/* Delete Button (danger) */}
                <button
                  onClick={() => { handleDeleteRequest(row.localId); setExpandedId(null); }}
                  disabled={row.status === 'saving'}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all disabled:opacity-40"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Eliminar RNF</span>
                </button>

                {/* Right side buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setExpandedId(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold border border-[var(--color-border-strong)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] transition-all"
                  >
                    Cancelar
                  </button>

                  <button
                    onClick={() => { setExpandedId(null); handleOpenQualityAnalysis(row.localId, row.requirement); }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Análisis de calidad</span>
                  </button>

                  <button
                    onClick={() => handleImprove(row.localId)}
                    disabled={row.status === 'saving' || row.status === 'checking'}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 transition-all disabled:opacity-40"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>{row.status === 'checking' ? 'Procesando…' : '✨ Mejorar con IA'}</span>
                  </button>

                  <button
                    onClick={() => { handleSave(row.localId); setExpandedId(null); }}
                    disabled={row.status === 'saving'}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-[var(--color-accent)] text-[var(--color-accent-foreground)] hover:opacity-90 transition-all shadow-md shadow-[var(--color-accent)]/15 active:scale-95 disabled:opacity-40"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{row.status === 'saving' ? 'Guardando…' : 'Aplicar cambios'}</span>
                  </button>
                </div>

              </div>

            </div>
          </div>
        )
      })()}

      {activeQualityModal && (() => {
        const liveRow = rows.find(r => r.localId === activeQualityModal.localId)
        const liveReq = liveRow ? liveRow.requirement : activeQualityModal.requirement
        const localIssues = analyzeRequirementText({
          title: liveReq.title,
          description: liveReq.description,
          acceptanceCriteria: liveReq.acceptanceCriteria,
          requirementType: liveReq.requirementType ?? 'NON_FUNCTIONAL',
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
