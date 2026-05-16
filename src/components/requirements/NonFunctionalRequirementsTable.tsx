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
import { RequirementQualityBadge } from './RequirementQualityBadge'
import { analyzeRequirementText } from '../../utils/requirementQualityAnalyzer'
import { validateNonFunctionalDetail } from '../../utils/nonFunctionalRequirementValidator'
import {
  EMPTY_FILTERS,
  buildFilterOptions,
  filterRequirements,
  hasActiveFilters,
  type RequirementFilters,
} from '../../utils/requirementFilterUtils'
import type { RequirementDTO, NonFunctionalDetailDTO, RequirementMemoryResponse, RequirementDeleteImpactResponse, RuleViolation } from '../../types/requirements'

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
  const [proceduralViolations, setProceduralViolations] = useState<Map<string, RuleViolation[]>>(new Map())
  const [traceabilityPreview, setTraceabilityPreview] = useState<{ localId: string; requirement: RequirementDTO } | null>(null)

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

  // ── Live quality analysis ──────────────────────────────────────────────────
  // Pure local analysis, no backend calls, no AI. keyed by localId.
  const qualityMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof analyzeRequirementText>>()
    for (const row of rows) {
      const localIssues = analyzeRequirementText({
        title: row.requirement.title,
        description: row.requirement.description,
        acceptanceCriteria: row.requirement.acceptanceCriteria,
        requirementType: row.requirement.requirementType ?? 'NON_FUNCTIONAL',
      })
      
      const violations = proceduralViolations.get(row.localId) || []
      const proceduralIssues = violations.map(v => ({
        id: `rule-${v.ruleId}-${crypto.randomUUID().slice(0, 8)}`,
        ruleId: v.ruleId,
        severity: v.severity.toLowerCase() as any,
        field: 'procedural' as any,
        message: v.message,
        suggestion: `Regla: ${v.ruleName}`
      }))

      const detailIssues = validateNonFunctionalDetail(row.requirement)

      map.set(row.localId, [...localIssues, ...proceduralIssues, ...detailIssues])
    }
    return map
  }, [rows, proceduralViolations])

  const updateRow = (localId: string, updates: Partial<RequirementDTO>) =>
    setRows(prev => prev.map(r => r.localId === localId ? { ...r, requirement: { ...r.requirement, ...updates }, status: r.status === 'saved' ? 'draft' : r.status } : r))

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
    
    // Ensure requirementType is set for the payload
    const payload = { ...requirement, requirementType: 'NON_FUNCTIONAL' as const }
    
    setStatus(localId, 'checking') // Use checking to denote loading
    try {
      const improved = await requirementFacade.improveRequirement(payload)
      if (improved) {
        setAiPreview({ current: requirement, suggested: improved, localId })
        setStatus(localId, 'saved') // restore status, let modal handle apply
      } else {
        setStatus(localId, 'error', 'IA no respondió')
      }
    } catch (e: any) {
      if (e.message === 'MISSING_REQUIREMENT_TYPE') {
        setStatus(localId, 'error', 'No se pudo mejorar el requisito porque falta el tipo de requisito.')
      } else if (e.status === 400 || e.statusCode === 400) {
        setStatus(localId, 'error', e.message || 'La solicitud de mejora no es válida. Verifica que el requisito tenga proyecto, tipo y descripción.')
      } else {
        setStatus(localId, 'error', e.message || 'Error IA')
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
      const matches = await requirementFacade.checkDuplicates({
        projectId,
        title: requirement.title,
        description: requirement.description
      })
      setStatus(localId, row.status === 'checking' ? 'draft' : row.status)
      setDuplicatePreview({ localId, matches })
    } catch {
      setStatus(localId, 'error', 'Error al verificar duplicados')
    }
  }

  const handleViewMemory = async (localId: string) => {
    const row = rows.find(r => r.localId === localId)
    if (!row || !row.requirement.id) return
    setStatus(localId, 'checking')
    try {
      const memory = await requirementFacade.getRequirementMemory(row.requirement.id)
      setStatus(localId, row.status === 'checking' ? 'saved' : row.status)
      setMemoryPreview({ localId, memory })
    } catch {
      setStatus(localId, 'error', 'Error al cargar memoria')
    }
  }

  const handleManageTraceability = (localId: string) => {
    const row = rows.find(r => r.localId === localId)
    if (!row || !row.requirement.id) return
    setTraceabilityPreview({ localId, requirement: row.requirement })
  }

  const handleEvaluateRules = async (localId: string) => {
    const row = rows.find(r => r.localId === localId)
    if (!row) return
    setStatus(localId, 'checking')
    try {
      const response = await requirementFacade.evaluateRequirementAgainstRules(row.requirement, projectId)
      setProceduralViolations(prev => {
        const next = new Map(prev)
        next.set(localId, response.violations)
        return next
      })
      setStatus(localId, row.requirement.id ? 'saved' : 'draft')
    } catch {
      setStatus(localId, 'error', 'Error al validar reglas')
    }
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
                return (
                  <React.Fragment key={row.localId}>
                    <tr onClick={() => setExpandedId(isExpanded ? null : row.localId)}
                      className={`group border-b border-[var(--color-border)] transition-all cursor-pointer ${isExpanded ? 'bg-[var(--color-accent-subtle)]/10 shadow-[inset_4px_0_0_0_var(--color-accent)]' : 'hover:bg-[var(--color-surface)]/30'}`}>
                      <td className="px-4 py-3 text-[11px] font-mono font-bold text-[var(--color-text-muted)]">{row.requirement.code}</td>
                      <td className="px-4 py-3">
                        {d?.category ? (
                          <span className="inline-flex items-center h-5 px-2 rounded-md text-[10px] font-bold bg-violet-500/10 text-violet-600 border border-violet-500/20">{d.category}</span>
                        ) : <span className="text-[11px] text-[var(--color-text-muted)] italic">Sin categoría</span>}
                      </td>
                      <td className="px-4 py-3">
                        <input value={row.requirement.title} onClick={e => e.stopPropagation()}
                          onChange={e => updateRow(row.localId, { title: e.target.value })}
                          placeholder="Título del RNF..."
                          className={`w-full text-sm font-semibold bg-transparent border-0 focus:ring-1 focus:ring-[var(--color-accent)] rounded transition-all placeholder:text-[var(--color-text-muted)]/40 ${isInvalid && !row.requirement.title ? 'bg-rose-500/5 ring-1 ring-rose-500/30' : ''}`}
                        />
                        {row.requirement.description && <p className="text-[11px] text-[var(--color-text-muted)] truncate mt-0.5 px-0.5">{row.requirement.description}</p>}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-[var(--color-text-secondary)] font-mono">{metricLabel}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {statusBadge(row.status)}
                          {row.errorMessage && <p className="text-[9px] text-rose-500 mt-0.5">{row.errorMessage}</p>}
                          {/* Quality badge — purely informational, never blocks save */}
                          {(() => {
                            const qi = qualityMap.get(row.localId)
                            return qi && qi.length > 0 ? <RequirementQualityBadge issues={qi} /> : null
                          })()}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={e => { e.stopPropagation(); handleSave(row.localId) }} disabled={row.status === 'saving'} title="Guardar" className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-500/10 transition-colors disabled:opacity-30">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          </button>
                          <button onClick={e => { e.stopPropagation(); handleImprove(row.localId) }} disabled={row.status === 'saving' || !row.requirement.id} title={!row.requirement.id ? "Guarda el requisito antes de mejorarlo con IA" : "Mejorar con IA"} className={`p-1.5 rounded-lg text-purple-600 hover:bg-purple-500/10 transition-colors disabled:opacity-30 ${!row.requirement.id ? 'cursor-not-allowed' : ''}`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                          </button>
                          <button onClick={e => { e.stopPropagation(); handleCheckDuplicates(row.localId) }} disabled={row.status === 'saving'} title="Verificar duplicados" className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-500/10 transition-colors disabled:opacity-30">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                          </button>
                          <button onClick={e => { e.stopPropagation(); handleViewMemory(row.localId) }} disabled={row.status === 'saving' || !row.requirement.id} title={!row.requirement.id ? "Guarda el requisito antes de consultar su memoria" : "Ver memoria"} className={`p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-500/10 transition-colors disabled:opacity-30 ${!row.requirement.id ? 'cursor-not-allowed' : ''}`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                          </button>
                          <button onClick={e => { e.stopPropagation(); handleEvaluateRules(row.localId) }} disabled={row.status === 'saving'} title="Validar reglas del proyecto" className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-500/10 transition-colors disabled:opacity-30">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </button>
                          <button onClick={e => { e.stopPropagation(); handleManageTraceability(row.localId) }} disabled={row.status === 'saving' || !row.requirement.id} title={!row.requirement.id ? "Guarda el requisito antes de gestionar trazabilidad" : "Gestionar trazabilidad"} className={`p-1.5 rounded-lg text-cyan-600 hover:bg-cyan-500/10 transition-colors disabled:opacity-30 ${!row.requirement.id ? 'cursor-not-allowed' : ''}`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                          </button>
                          <button onClick={e => { e.stopPropagation(); handleDeleteRequest(row.localId) }} disabled={row.status === 'saving'} title="Eliminar" className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-500/10 transition-colors disabled:opacity-30">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]/20">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Descripción */}
                            <div>
                              <label className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-1.5 block">Descripción</label>
                              <textarea value={row.requirement.description}
                                onChange={e => updateRow(row.localId, { description: e.target.value })}
                                placeholder="Describe el requisito no funcional..."
                                rows={3}
                                className={`w-full px-3 py-2 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] resize-none ${isInvalid && !row.requirement.description ? 'ring-1 ring-rose-500/30' : ''}`}
                              />
                              {/* Criterios de aceptación */}
                              <label className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-1.5 mt-3 block">Criterios de aceptación</label>
                              <div className="space-y-1.5">
                                {(row.requirement.acceptanceCriteria || []).map((c, i) => (
                                  <div key={i} className="flex gap-2 items-start">
                                    <span className="text-[var(--color-accent)] font-bold text-xs mt-2">✓</span>
                                    <input value={c} onChange={e => {
                                      const next = [...(row.requirement.acceptanceCriteria || [])]
                                      next[i] = e.target.value
                                      updateRow(row.localId, { acceptanceCriteria: next })
                                    }} className="flex-1 px-2 py-1.5 text-xs bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]" />
                                    <button onClick={() => {
                                      const next = (row.requirement.acceptanceCriteria || []).filter((_, j) => j !== i)
                                      updateRow(row.localId, { acceptanceCriteria: next })
                                    }} className="mt-1 text-rose-500 hover:text-rose-700 text-xs">✕</button>
                                  </div>
                                ))}
                                <button onClick={() => updateRow(row.localId, { acceptanceCriteria: [...(row.requirement.acceptanceCriteria || []), ''] })}
                                  className="text-[11px] text-[var(--color-accent)] hover:underline font-medium">+ Agregar criterio</button>
                              </div>
                            </div>
                            {/* ISO Detail */}
                            <div>
                              <label className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-1.5 block flex items-center gap-1.5">
                                <span className="inline-block w-2 h-2 rounded-full bg-violet-500" />
                                Detalle ISO 25010
                              </label>
                              <NfDetailPanel
                                detail={row.requirement.nonFunctionalDetail ?? { ...EMPTY_DETAIL }}
                                onChange={delta => updateDetail(row.localId, delta)}
                              />
                              <div className="flex justify-end gap-2 mt-3">
                                <button onClick={() => handleImprove(row.localId)} disabled={row.status === 'saving' || row.status === 'checking'}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-[var(--color-border-strong)] text-purple-600 hover:bg-purple-500/10 transition-all disabled:opacity-40">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                  {row.status === 'checking' ? 'Procesando…' : '✨ Mejorar con IA'}
                                </button>
                                <button onClick={() => handleSave(row.localId)} disabled={row.status === 'saving'}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-[var(--color-accent)] text-[var(--color-accent-foreground)] hover:opacity-90 transition-all shadow-sm disabled:opacity-40">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                  {row.status === 'saving' ? 'Guardando…' : 'Guardar RNF'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
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
          onClose={() => setTraceabilityPreview(null)}
        />
      )}
    </div>
  )
}
