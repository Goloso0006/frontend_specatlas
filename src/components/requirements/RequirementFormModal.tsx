import React, { useState, useEffect } from 'react'
import type { RequirementDTO } from '../../types/requirements'
import { NonFunctionalDetailEditor, CriteriaList } from './RequirementDraftEditor'

// ── Types ──────────────────────────────────────────────────────────────────

interface RequirementFormModalProps {
  isOpen: boolean
  initial: RequirementDTO
  isLoading: boolean
  /** Called with the updated DTO when user saves */
  onSave: (dto: RequirementDTO) => void
  /** Called when user cancels */
  onClose: () => void
  /** Called to convert text with AI */
  onConvert: (text: string, onResult: (dto: RequirementDTO) => void) => void
}

// ── Component ──────────────────────────────────────────────────────────────

export const RequirementFormModal: React.FC<RequirementFormModalProps> = ({
  isOpen,
  initial,
  isLoading,
  onSave,
  onClose,
  onConvert,
}) => {
  const [form, setForm] = useState<RequirementDTO>(initial)
  const [aiText, setAiText] = useState('')
  const [isConverting, setIsConverting] = useState(false)

  // Sync when opening with a different initial
  useEffect(() => { setForm(initial); setAiText('') }, [initial.id, isOpen])

  if (!isOpen) return null

  function handleConvert() {
    if (!aiText.trim()) return
    setIsConverting(true)
    onConvert(aiText, (result) => {
      setForm(result)
      setIsConverting(false)
    })
  }

  const isEdit = Boolean(form.id)
  const canSave = form.title.trim().length > 0

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? 'Editar requisito' : 'Nuevo requisito'}
    >
      {/* Click-outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal */}
      <div
        className={[
          'relative z-10 w-full max-w-xl',
          'bg-[var(--color-bg-card)] border border-[var(--color-border-strong)]',
          'rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.25)]',
          'flex flex-col max-h-[90vh] overflow-hidden',
        ].join(' ')}
        style={{ animation: 'modalIn 180ms cubic-bezier(0.16,1,0.3,1) both' }}
      >
        <style>{`
          @keyframes modalIn {
            from { opacity: 0; transform: scale(0.96) translateY(8px); }
            to   { opacity: 1; transform: scale(1)    translateY(0); }
          }
        `}</style>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
          <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)]">
            {isEdit ? 'Editar requisito' : 'Nuevo requisito'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* AI conversion section — only for new */}
          {!isEdit && (
            <div className="p-4 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                Asistente IA
              </p>
              <textarea
                value={aiText}
                onChange={e => setAiText(e.target.value)}
                placeholder="Describe el requerimiento en lenguaje natural y convierte con IA…"
                rows={3}
                className={[
                  'w-full resize-none text-[13px] px-3 py-2.5 rounded-lg',
                  'bg-[var(--color-bg-card)] border border-[var(--color-border-strong)]',
                  'text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]',
                  'focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]',
                  'transition-all duration-150',
                ].join(' ')}
              />
              <button
                type="button"
                onClick={handleConvert}
                disabled={!aiText.trim() || isConverting}
                className={[
                  'inline-flex items-center gap-2 h-8 px-3 rounded-lg text-[12px] font-medium',
                  'bg-[var(--color-surface)] border border-[var(--color-border-strong)]',
                  'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
                  'hover:bg-[var(--color-bg-card)] transition-all duration-150',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
                ].join(' ')}
              >
                {isConverting
                  ? <><div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> Convirtiendo…</>
                  : <><svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> Convertir con IA</>
                }
              </button>
            </div>
          )}

          {/* Form fields */}
          <div className="grid grid-cols-2 gap-3">
            {/* Code */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Código</label>
              <input
                value={form.code}
                onChange={e => setForm({ ...form, code: e.target.value })}
                placeholder="REQ-001"
                className={inputCls}
              />
            </div>
            {/* Classification */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Clasificación ISO</label>
              <input
                value={form.isoClassification}
                onChange={e => setForm({ ...form, isoClassification: e.target.value })}
                placeholder="ISO 25010"
                className={inputCls}
              />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
              Título <span className="text-[var(--color-danger)] ml-0.5">*</span>
            </label>
            <input
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="El sistema debe…"
              className={inputCls}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Descripción</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Descripción detallada del requerimiento…"
              rows={4}
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Acceptance Criteria */}
          <div className="pt-2">
            <CriteriaList 
              items={form.acceptanceCriteria || []} 
              isEditing={true} 
              onChange={(updated) => setForm({ ...form, acceptanceCriteria: updated })}
            />
          </div>

          {/* RNF Detail */}
          {form.requirementType === 'NON_FUNCTIONAL' && (
            <div className="pt-2 border-t border-[var(--color-border)]">
              <NonFunctionalDetailEditor
                detail={form.nonFunctionalDetail}
                isEditing={true}
                onChange={(updated) => setForm({ ...form, nonFunctionalDetail: updated })}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex items-center justify-end gap-2 px-5 py-4 border-t border-[var(--color-border)]">
          <button
            type="button"
            onClick={onClose}
            className={[
              'h-8 px-4 rounded-lg text-[12.5px] font-medium',
              'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
              'hover:bg-[var(--color-surface)] transition-all duration-150',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
            ].join(' ')}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onSave(form)}
            disabled={!canSave || isLoading}
            className={[
              'h-8 px-4 rounded-lg text-[12.5px] font-semibold',
              'bg-[var(--color-accent)] text-[var(--color-accent-foreground)]',
              'hover:opacity-90 transition-all duration-150',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2',
            ].join(' ')}
          >
            {isLoading
              ? <span className="flex items-center gap-1.5"><div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> Guardando…</span>
              : isEdit ? 'Guardar cambios' : 'Crear requisito'
            }
          </button>
        </div>
      </div>
    </div>
  )
}

// shared input class
const inputCls = [
  'w-full h-9 px-3 text-[13px] rounded-lg',
  'bg-[var(--color-bg)] border border-[var(--color-border-strong)]',
  'text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]',
  'focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]',
  'transition-all duration-150',
].join(' ')
