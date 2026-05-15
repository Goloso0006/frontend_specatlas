import React, { useState, useEffect } from 'react'
import { requirementFacade } from '../../facades/requirement.facade'
import { generateNextCode } from '../../utils/requirementCodeUtils'
import { sortRequirements } from '../../utils/requirementSortUtils'
import { DeleteConfirmationModal } from './DeleteConfirmationModal'
import { RequirementAiImprovePreview } from './RequirementAiImprovePreview'
import type { RequirementDTO, NonFunctionalDetailDTO } from '../../types/requirements'

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

interface FilterState {
  search: string
  category: string
  metric: string
  verification: string
}
const EMPTY_FILTERS: FilterState = { search: '', category: '', metric: '', verification: '' }

function toRows(reqs: RequirementDTO[]): TableRow[] {
  return sortRequirements(reqs).map(r => ({ localId: r.id || crypto.randomUUID(), requirement: r, status: 'saved' as RowStatus }))
}

function applyFilters(rows: TableRow[], f: FilterState): TableRow[] {
  return rows.filter(({ requirement: r }) => {
    if (f.search) {
      const q = f.search.toLowerCase()
      if (!r.code?.toLowerCase().includes(q) && !r.title?.toLowerCase().includes(q) && !r.description?.toLowerCase().includes(q)) return false
    }
    if (f.category && r.nonFunctionalDetail?.category !== f.category) return false
    if (f.metric) {
      if (!r.nonFunctionalDetail?.metricName?.toLowerCase().includes(f.metric.toLowerCase())) return false
    }
    if (f.verification) {
      if (!r.nonFunctionalDetail?.verificationMethod?.toLowerCase().includes(f.verification.toLowerCase())) return false
    }
    return true
  })
}

function uniqueCategories(rows: TableRow[]): string[] {
  const set = new Set<string>()
  rows.forEach(r => r.requirement.nonFunctionalDetail?.category && set.add(r.requirement.nonFunctionalDetail.category))
  return [...set].sort()
}

function NfFilterBar({ filters, onChange, categories, totalShown, totalAll }: {
  filters: FilterState; onChange: (f: FilterState) => void
  categories: string[]; totalShown: number; totalAll: number
}) {
  const isActive = Object.values(filters).some(v => v !== '')
  const inp = 'h-7 px-2.5 text-[11px] rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] placeholder:text-[var(--color-text-muted)]'
  return (
    <div className="flex flex-wrap items-center gap-2 px-2 py-2 bg-[var(--color-surface)]/40 border border-[var(--color-border)] rounded-xl">
      <svg className="w-3.5 h-3.5 text-[var(--color-text-muted)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
      </svg>
      <input value={filters.search} onChange={e => onChange({ ...filters, search: e.target.value })} placeholder="Buscar código, título, descripción…" className={`${inp} w-52`} />
      {categories.length > 0 && (
        <select value={filters.category} onChange={e => onChange({ ...filters, category: e.target.value })} className={`${inp} cursor-pointer`}>
          <option value="">Todas las categorías</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      )}
      <input value={filters.metric} onChange={e => onChange({ ...filters, metric: e.target.value })} placeholder="Métrica…" className={`${inp} w-32`} />
      <input value={filters.verification} onChange={e => onChange({ ...filters, verification: e.target.value })} placeholder="Verificación…" className={`${inp} w-32`} />
      {isActive && (
        <button onClick={() => onChange(EMPTY_FILTERS)} className="h-7 px-2.5 text-[11px] rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors font-medium flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          Limpiar
        </button>
      )}
      <span className="ml-auto text-[10px] text-[var(--color-text-muted)] font-mono whitespace-nowrap">
        {isActive ? `${totalShown} / ${totalAll}` : `${totalAll} total`}
      </span>
    </div>
  )
}

interface Props {
  projectId: string
  initialRequirements: RequirementDTO[]
  onRequirementsChange?: () => void
}

export const NonFunctionalRequirementsTable: React.FC<Props> = ({ projectId, initialRequirements, onRequirementsChange }) => {
  const [rows, setRows] = useState<TableRow[]>(() => toRows(initialRequirements))
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ localId: string; requirement: RequirementDTO } | null>(null)
  const [aiPreview, setAiPreview] = useState<{ current: RequirementDTO; suggested: RequirementDTO; localId: string } | null>(null)

  // Fix: sync rows when parent refetches (re-entering the screen)
  useEffect(() => {
    setRows(prev => {
      const drafts = prev.filter(r => !r.requirement.id && r.status !== 'saved')
      return [...drafts, ...toRows(initialRequirements)]
    })
  }, [initialRequirements])

  const visibleRows = applyFilters(rows, filters)
  const isFiltering = Object.values(filters).some(v => v !== '')

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
    setRows(prev => [{ localId: lid, requirement: req, status: 'draft' }, ...prev])
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
          const drafts = updated.filter(r => !r.requirement.id && r.status !== 'saved')
          const savedRows = sortRequirements(updated.filter(r => r.requirement.id || r.status === 'saved').map(r => r.requirement))
            .map(req => updated.find(r => r.requirement.id === req.id)!).filter(Boolean)
          return [...drafts, ...savedRows]
        })
        onRequirementsChange?.()
      } else setStatus(localId, 'error', 'Error al guardar')
    } catch (e: any) {
      setStatus(localId, 'error', e.message || 'Error de servidor')
    }
  }

  const handleImprove = async (localId: string) => {
    const row = rows.find(r => r.localId === localId)
    if (!row) return
    setStatus(localId, 'checking')
    try {
      const text = `Código: ${row.requirement.code}\nTítulo: ${row.requirement.title}\nDescripción: ${row.requirement.description}`
      const improved = await requirementFacade.convertManualRequirement(text, projectId)
      if (improved) {
        setAiPreview({ current: row.requirement, suggested: improved, localId })
        setStatus(localId, 'draft')
      } else setStatus(localId, 'error', 'IA no respondió')
    } catch { setStatus(localId, 'error', 'Error IA') }
  }

  const handleDeleteRequest = (localId: string) => {
    const row = rows.find(r => r.localId === localId)
    if (!row) return
    if (row.requirement.id) setDeleteConfirm({ localId, requirement: row.requirement })
    else { setRows(prev => prev.filter(r => r.localId !== localId)); if (expandedId === localId) setExpandedId(null) }
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return
    const { localId, requirement } = deleteConfirm
    setStatus(localId, 'saving'); setDeleteConfirm(null)
    try {
      await requirementFacade.deleteRequirement(requirement.id!)
      setRows(prev => prev.filter(r => r.localId !== localId))
      if (expandedId === localId) setExpandedId(null)
      onRequirementsChange?.()
    } catch { setStatus(localId, 'error', 'Error al borrar') }
  }

  const applyAi = () => {
    if (!aiPreview) return
    setRows(prev => prev.map(r => r.localId === aiPreview.localId
      ? { ...r, requirement: { ...r.requirement, ...aiPreview.suggested, code: r.requirement.code }, status: 'ai_improved' }
      : r))
    setAiPreview(null)
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
      <NfFilterBar filters={filters} onChange={setFilters} categories={uniqueCategories(rows)} totalShown={visibleRows.length} totalAll={rows.length} />

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
                  <div className="flex flex-col items-center gap-3 opacity-30">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    <p className="text-sm italic font-medium">{isFiltering ? 'Sin resultados para los filtros actuales' : 'No hay requisitos no funcionales en este proyecto'}</p>
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
                      <td className="px-4 py-3">{statusBadge(row.status)}{row.errorMessage && <p className="text-[9px] text-rose-500 mt-0.5">{row.errorMessage}</p>}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={e => { e.stopPropagation(); handleSave(row.localId) }} disabled={row.status === 'saving'} title="Guardar" className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-500/10 transition-colors disabled:opacity-30">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          </button>
                          <button onClick={e => { e.stopPropagation(); handleImprove(row.localId) }} disabled={row.status === 'saving'} title="Mejorar con IA" className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-500/10 transition-colors disabled:opacity-30">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
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
      {aiPreview && <RequirementAiImprovePreview current={aiPreview.current} suggested={aiPreview.suggested} onApply={applyAi} onCancel={() => setAiPreview(null)} />}
    </div>
  )
}
