import React, { useState } from 'react'
import { EditableRequirementRow, type RowStatus } from './EditableRequirementRow'
import { RequirementAiImprovePreview } from './RequirementAiImprovePreview'
import { RequirementTableDetail } from './RequirementTableDetail'
import { DeleteConfirmationModal } from './DeleteConfirmationModal'
import { requirementFacade } from '../../facades/requirement.facade'
import { generateNextCode } from '../../utils/requirementCodeUtils'
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

export const FunctionalRequirementsTable: React.FC<FunctionalRequirementsTableProps> = ({
  projectId,
  initialRequirements,
  onRequirementsChange
}) => {
  // We map initial requirements to our internal TableRow structure
  const [rows, setRows] = useState<TableRow[]>(() => 
    initialRequirements.map(r => ({
      localId: r.id || crypto.randomUUID(),
      requirement: r,
      status: 'saved'
    }))
  )

  const [aiPreview, setAiPreview] = useState<{ current: RequirementDTO, suggested: RequirementDTO, localId: string } | null>(null)
  const [selectedLocalId, setSelectedLocalId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ localId: string, requirement: RequirementDTO } | null>(null)

  const selectedRow = rows.find(r => r.localId === selectedLocalId)

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleAddRow = () => {
    const nextCode = generateNextCode(rows.map(r => r.requirement), 'RF')
    const newReq: RequirementDTO = {
      id: '', 
      code: nextCode,
      title: '',
      description: '',
      actors: [],
      acceptanceCriteria: [],
      isoClassification: 'Funcional',
      requirementType: 'FUNCTIONAL',
      nonFunctionalDetail: null,
      projectId,
      relatedCodes: []
    }

    const newLocalId = crypto.randomUUID()
    setRows(prev => [
      { localId: newLocalId, requirement: newReq, status: 'draft' },
      ...prev
    ])
    setSelectedLocalId(newLocalId)
  }

  const updateRow = (localId: string, updates: Partial<RequirementDTO>) => {
    setRows(prev => prev.map(row => 
      row.localId === localId 
        ? { ...row, requirement: { ...row.requirement, ...updates }, status: row.status === 'saved' ? 'draft' : row.status }
        : row
    ))
  }

  const setRowStatus = (localId: string, status: RowStatus, errorMessage?: string) => {
    setRows(prev => prev.map(row => 
      row.localId === localId ? { ...row, status, errorMessage } : row
    ))
  }

  const handleSave = async (localId: string) => {
    const row = rows.find(r => r.localId === localId)
    if (!row) return

    const { requirement } = row

    // Validation
    if (!requirement.title.trim() || !requirement.description.trim()) {
      setRowStatus(localId, 'incomplete', 'Título y descripción requeridos')
      return
    }

    setRowStatus(localId, 'saving')

    try {
      const payload = { ...requirement, id: requirement.id || '' }
      const saved = await requirementFacade.saveRequirement(payload)
      
      if (saved) {
        setRows(prev => prev.map(r => 
          r.localId === localId 
            ? { ...r, requirement: saved, status: 'saved', errorMessage: undefined }
            : r
        ))
        onRequirementsChange?.()
      } else {
        setRowStatus(localId, 'error', 'Error al guardar')
      }
    } catch (e: any) {
      setRowStatus(localId, 'error', e.message || 'Error de servidor')
    }
  }

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
    } catch (e: any) {
      setRowStatus(localId, 'error', 'Error IA')
    }
  }

  const applyAiImprovement = () => {
    if (!aiPreview) return
    const { suggested, localId } = aiPreview
    
    setRows(prev => prev.map(r => 
      r.localId === localId 
        ? { ...r, requirement: { ...r.requirement, ...suggested, code: r.requirement.code }, status: 'ai_improved' }
        : r
    ))
    setAiPreview(null)
  }

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
    } catch (e) {
      setRowStatus(localId, 'error', 'Error al borrar')
    }
  }

  return (
    <div className="flex flex-col gap-6">
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

      <div className="relative flex-1 flex">
        {/* Table Container */}
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
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-24 text-center">
                        <div className="flex flex-col items-center gap-3 opacity-30">
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-sm italic font-medium">No hay requisitos funcionales en este proyecto</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    rows.map(row => (
                      <EditableRequirementRow
                        key={row.localId}
                        localId={row.localId}
                        requirement={row.requirement}
                        status={row.status}
                        errorMessage={row.errorMessage}
                        isSelected={selectedLocalId === row.localId}
                        onUpdate={(updates) => updateRow(row.localId, updates)}
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

        {/* Floating Detail Panel Container */}
        <div 
          className={`fixed inset-y-0 right-0 w-[420px] z-50 transform transition-all duration-500 ease-in-out p-6 pointer-events-none ${
            selectedLocalId ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
          }`}
        >
          {selectedRow && (
            <div className="h-full pointer-events-auto">
               <RequirementTableDetail 
                 requirement={selectedRow.requirement}
                 status={selectedRow.status}
                 onClose={() => setSelectedLocalId(null)}
                 onSave={() => handleSave(selectedRow.localId)}
                 onImprove={() => handleImprove(selectedRow.localId)}
                 onUpdate={(updates) => updateRow(selectedRow.localId, updates)}
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
