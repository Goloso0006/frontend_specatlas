import React, { useState, useEffect } from 'react'
import { EditableRequirementRow, type RowStatus } from './EditableRequirementRow'
import { RequirementAiImprovePreview } from './RequirementAiImprovePreview'
import { RequirementTableDetail } from './RequirementTableDetail'
import { DeleteConfirmationModal } from './DeleteConfirmationModal'
import { requirementFacade } from '../../facades/requirement.facade'
import { generateNextCode } from '../../utils/requirementCodeUtils'
import { sortRequirements } from '../../utils/requirementSortUtils'
import type { RequirementDTO } from '../../types/requirements'

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

// ── Filter types ─────────────────────────────────────────────────────────────

interface FilterState {
  search: string
  actor: string
  isoClass: string
  hasCriteria: '' | 'yes' | 'no'
}

const EMPTY_FILTERS: FilterState = { search: '', actor: '', isoClass: '', hasCriteria: '' }

function toTableRows(requirements: RequirementDTO[]): TableRow[] {
  return sortRequirements(requirements).map(r => ({
    localId: r.id || crypto.randomUUID(),
    requirement: r,
    status: 'saved' as RowStatus,
  }))
}

function applyFilters(rows: TableRow[], f: FilterState): TableRow[] {
  return rows.filter(({ requirement: r }) => {
    if (f.search) {
      const q = f.search.toLowerCase()
      const hit = r.code?.toLowerCase().includes(q)
        || r.title?.toLowerCase().includes(q)
        || r.description?.toLowerCase().includes(q)
      if (!hit) return false
    }
    if (f.actor) {
      const actorMatch = r.actors?.some(a => a.toLowerCase().includes(f.actor.toLowerCase()))
      if (!actorMatch) return false
    }
    if (f.isoClass) {
      if (!r.isoClassification?.toLowerCase().includes(f.isoClass.toLowerCase())) return false
    }
    if (f.hasCriteria === 'yes' && !(r.acceptanceCriteria?.length)) return false
    if (f.hasCriteria === 'no' && (r.acceptanceCriteria?.length ?? 0) > 0) return false
    return true
  })
}

// ── Collect unique filter values ──────────────────────────────────────────────

function uniqueActors(rows: TableRow[]): string[] {
  const set = new Set<string>()
  rows.forEach(({ requirement: r }) => r.actors?.forEach(a => a && set.add(a)))
  return [...set].sort()
}

function uniqueIsoClasses(rows: TableRow[]): string[] {
  const set = new Set<string>()
  rows.forEach(({ requirement: r }) => r.isoClassification && set.add(r.isoClassification))
  return [...set].sort()
}

// ── FilterBar component ───────────────────────────────────────────────────────

function FilterBar({
  filters, onChange, actors, isoClasses, totalShown, totalAll,
}: {
  filters: FilterState
  onChange: (f: FilterState) => void
  actors: string[]
  isoClasses: string[]
  totalShown: number
  totalAll: number
}) {
  const isActive = Object.values(filters).some(v => v !== '')
  const inp = 'h-7 px-2.5 text-[11px] rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] placeholder:text-[var(--color-text-muted)]'
  const sel = inp + ' cursor-pointer'

  return (
    <div className="flex flex-wrap items-center gap-2 px-2 py-2 bg-[var(--color-surface)]/40 border border-[var(--color-border)] rounded-xl">
      <svg className="w-3.5 h-3.5 text-[var(--color-text-muted)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
      </svg>

      <input
        value={filters.search}
        onChange={e => onChange({ ...filters, search: e.target.value })}
        placeholder="Buscar código, título, descripción…"
        className={`${inp} w-52`}
      />

      {actors.length > 0 && (
        <select value={filters.actor} onChange={e => onChange({ ...filters, actor: e.target.value })} className={sel}>
          <option value="">Todos los actores</option>
          {actors.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      )}

      {isoClasses.length > 0 && (
        <select value={filters.isoClass} onChange={e => onChange({ ...filters, isoClass: e.target.value })} className={sel}>
          <option value="">Clasificación ISO</option>
          {isoClasses.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      )}

      <select value={filters.hasCriteria} onChange={e => onChange({ ...filters, hasCriteria: e.target.value as FilterState['hasCriteria'] })} className={sel}>
        <option value="">BDD: todos</option>
        <option value="yes">Con criterios</option>
        <option value="no">Sin criterios</option>
      </select>

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

// ── Main component ────────────────────────────────────────────────────────────

export const FunctionalRequirementsTable: React.FC<FunctionalRequirementsTableProps> = ({
  projectId,
  initialRequirements,
  onRequirementsChange,
}) => {
  // Fix: sync rows whenever initialRequirements changes (re-enter screen / refetch).
  // We don't use a lazy initializer because it only runs once on mount.
  const [rows, setRows] = useState<TableRow[]>(() => toTableRows(initialRequirements))

  useEffect(() => {
    // When parent refetches and passes new requirements, rebuild rows.
    // Keep unsaved drafts (rows without a backend id) so the user doesn't lose work.
    setRows(prev => {
      const drafts = prev.filter(r => !r.requirement.id && r.status !== 'saved')
      const saved = toTableRows(initialRequirements)
      // Merge: saved rows first (sorted), then any unsaved drafts on top
      return [...drafts, ...saved]
    })
  }, [initialRequirements])

  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS)
  const [aiPreview, setAiPreview] = useState<{ current: RequirementDTO; suggested: RequirementDTO; localId: string } | null>(null)
  const [selectedLocalId, setSelectedLocalId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ localId: string; requirement: RequirementDTO } | null>(null)

  const visibleRows = applyFilters(rows, filters)
  const selectedRow = rows.find(r => r.localId === selectedLocalId)
  const isFiltering = Object.values(filters).some(v => v !== '')

  // ── Helpers ──────────────────────────────────────────────────────────────

  const updateRow = (localId: string, updates: Partial<RequirementDTO>) =>
    setRows(prev => prev.map(row =>
      row.localId === localId
        ? { ...row, requirement: { ...row.requirement, ...updates }, status: row.status === 'saved' ? 'draft' : row.status }
        : row,
    ))

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
    // New draft goes to top; saved rows stay sorted
    setRows(prev => [{ localId: newLocalId, requirement: newReq, status: 'draft' }, ...prev])
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
        setRows(prev => {
          const updated = prev.map(r =>
            r.localId === localId ? { ...r, requirement: saved, status: 'saved' as RowStatus, errorMessage: undefined } : r,
          )
          // Re-sort after save so new items land in the right position
          const drafts = updated.filter(r => !r.requirement.id && r.status !== 'saved')
          const savedRows = sortRequirements(updated.filter(r => r.requirement.id || r.status === 'saved').map(r => r.requirement))
            .map(req => updated.find(r => r.requirement.id === req.id)!)
            .filter(Boolean)
          return [...drafts, ...savedRows]
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
    if (!requirement.title.trim() && !requirement.description.trim()) {
      setRowStatus(localId, 'incomplete', 'Escribe algo primero')
      return
    }
    setRowStatus(localId, 'checking')
    try {
      const text = `Código: ${requirement.code}\nTítulo: ${requirement.title}\nDescripción: ${requirement.description}`
      const improved = await requirementFacade.convertManualRequirement(text, projectId)
      if (improved) {
        setAiPreview({ current: requirement, suggested: improved, localId })
        setRowStatus(localId, 'draft')
      } else {
        setRowStatus(localId, 'error', 'IA no respondió')
      }
    } catch {
      setRowStatus(localId, 'error', 'Error IA')
    }
  }

  const applyAiImprovement = () => {
    if (!aiPreview) return
    const { suggested, localId } = aiPreview
    setRows(prev => prev.map(r =>
      r.localId === localId
        ? { ...r, requirement: { ...r.requirement, ...suggested, code: r.requirement.code }, status: 'ai_improved' }
        : r,
    ))
    setAiPreview(null)
  }

  // ── Delete ───────────────────────────────────────────────────────────────

  const handleDeleteRequest = (localId: string) => {
    const row = rows.find(r => r.localId === localId)
    if (!row) return
    if (row.requirement.id) {
      setDeleteConfirm({ localId, requirement: row.requirement })
    } else {
      setRows(prev => prev.filter(r => r.localId !== localId))
      if (selectedLocalId === localId) setSelectedLocalId(null)
    }
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return
    const { localId, requirement } = deleteConfirm
    setRowStatus(localId, 'saving')
    setDeleteConfirm(null)
    try {
      await requirementFacade.deleteRequirement(requirement.id!)
      setRows(prev => prev.filter(r => r.localId !== localId))
      if (selectedLocalId === localId) setSelectedLocalId(null)
      onRequirementsChange?.()
    } catch {
      setRowStatus(localId, 'error', 'Error al borrar')
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
      <FilterBar
        filters={filters}
        onChange={setFilters}
        actors={uniqueActors(rows)}
        isoClasses={uniqueIsoClasses(rows)}
        totalShown={visibleRows.length}
        totalAll={rows.length}
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
                        <div className="flex flex-col items-center gap-3 opacity-30">
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-sm italic font-medium">
                            {isFiltering ? 'Sin resultados para los filtros actuales' : 'No hay requisitos funcionales en este proyecto'}
                          </p>
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
                        onUpdate={updates => updateRow(row.localId, updates)}
                        onSave={() => handleSave(row.localId)}
                        onImprove={() => handleImprove(row.localId)}
                        onDelete={() => handleDeleteRequest(row.localId)}
                        onSelect={() => setSelectedLocalId(row.localId)}
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
    </div>
  )
}
