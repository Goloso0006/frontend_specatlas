import React from 'react'
import type { RequirementDTO } from '../../types/requirements'

const ACCEPTANCE_CRITERION_MAX_LENGTH = 100

function sanitizeAcceptanceCriterion(value: string, maxLineBreaks: number): string {
  const normalized = value.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lineLimited = maxLineBreaks > 0
    ? normalized.split('\n').slice(0, maxLineBreaks + 1).join('\n')
    : normalized.replace(/\n/g, '')

  return lineLimited.slice(0, ACCEPTANCE_CRITERION_MAX_LENGTH)
}

interface RequirementTableDetailProps {
  requirement: RequirementDTO
  status: string
  onClose: () => void
  onSave: () => void
  onImprove?: () => void
  onUpdate: (updates: Partial<RequirementDTO>) => void
}

export const RequirementTableDetail: React.FC<RequirementTableDetailProps> = ({
  requirement,
  status,
  onClose,
  onSave,
  onImprove: _onImprove,
  onUpdate
}) => {
  const acceptanceCriterionLineBreakLimit = requirement.requirementType === 'FUNCTIONAL' ? 1 : 0

  const handleCriteriaChange = (index: number, value: string) => {
    const newCriteria = [...(requirement.acceptanceCriteria || [])]
    newCriteria[index] = sanitizeAcceptanceCriterion(value, acceptanceCriterionLineBreakLimit)
    onUpdate({ acceptanceCriteria: newCriteria })
  }

  const addCriteria = () => {
    const newCriteria = [...(requirement.acceptanceCriteria || []), '']
    onUpdate({ acceptanceCriteria: newCriteria })
  }

  const removeCriteria = (index: number) => {
    const newCriteria = (requirement.acceptanceCriteria || []).filter((_, i) => i !== index)
    onUpdate({ acceptanceCriteria: newCriteria })
  }

  return (
    <div className="backdrop-blur-md bg-[var(--color-bg-card)]/90 border border-[var(--color-border)] rounded-2xl flex flex-col h-full shadow-2xl overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface)]/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--color-accent)] flex items-center justify-center text-[var(--color-accent-foreground)] shadow-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Detalle del Requisito</h3>
            <p className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase tracking-wider">{requirement.code || 'Borrador'}</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)] transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-[var(--color-border-strong)]">
        {/* Title Section */}
        <section>
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-2 block">Título Completo</label>
          <div className="focus-within:ring-1 focus-within:ring-[var(--color-accent)]/20 rounded-xl transition-all">
            <input
              type="text"
              value={requirement.title || ''}
              onChange={(e) => onUpdate({ title: e.target.value })}
              placeholder="Escribe el título del requisito..."
              maxLength={100}
              className="w-full px-3 py-2 text-sm font-semibold bg-[var(--color-surface)]/20 border border-[var(--color-border)] outline-none focus:outline-none focus:border-[var(--color-accent)]/50 focus:ring-0 rounded-xl text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]/30 transition-all"
            />
          </div>
          <span className={`block text-right text-[9px] font-mono mt-1 ${
            (requirement.title?.length ?? 0) >= 90 ? 'text-rose-500' : 'text-[var(--color-text-muted)]/50'
          }`}>
            {requirement.title?.length ?? 0}/100
          </span>
        </section>

        {/* Description Section */}
        <section>
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-3 block">Descripción Detallada</label>
          <div className="rounded-xl bg-[var(--color-surface)]/20 border border-[var(--color-border)] focus-within:border-[var(--color-accent)]/50 focus-within:ring-1 focus-within:ring-[var(--color-accent)]/20 overflow-hidden transition-all p-3">
            <textarea
              value={requirement.description || ''}
              onChange={(e) => onUpdate({ description: e.target.value })}
              placeholder="Describe detalladamente la funcionalidad del requisito..."
              rows={5}
              maxLength={500}
              className="w-full text-[13px] text-[var(--color-text-secondary)] focus:text-[var(--color-text-primary)] bg-transparent border-0 p-0 outline-none focus:outline-none focus:ring-0 resize-y leading-relaxed placeholder:text-[var(--color-text-muted)]/30"
            />
          </div>
          <span className={`block text-right text-[9px] font-mono mt-1 ${
            (requirement.description?.length ?? 0) >= 460 ? 'text-rose-500' : 'text-[var(--color-text-muted)]/50'
          }`}>
            {requirement.description?.length ?? 0}/500
          </span>
        </section>

        {/* Acceptance Criteria Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Criterios de Aceptación (BDD)</label>
            <button 
              onClick={addCriteria}
              className="p-1.5 rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white transition-all active:scale-90"
              title="Agregar criterio"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          <div className="space-y-3">
            {requirement.acceptanceCriteria && requirement.acceptanceCriteria.length > 0 ? (
              requirement.acceptanceCriteria.map((criteria, i) => (
                <div key={i} className="group relative flex gap-3 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/50 focus-within:border-[var(--color-accent)]/50 focus-within:ring-1 focus-within:ring-[var(--color-accent)]/20 transition-all">
                  <span className="text-[var(--color-accent)] font-bold text-xs mt-1.5">✓</span>
                  <textarea
                    value={criteria}
                    onChange={(e) => handleCriteriaChange(i, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && criteria.split('\n').length - 1 >= acceptanceCriterionLineBreakLimit) {
                        e.preventDefault()
                      }
                    }}
                    placeholder="Dado que... cuando... entonces..."
                    rows={1}
                    maxLength={ACCEPTANCE_CRITERION_MAX_LENGTH}
                    className="flex-1 text-[13px] text-[var(--color-text-secondary)] focus:text-[var(--color-text-primary)] bg-transparent border-0 p-0 outline-none focus:outline-none focus:ring-0 resize-none overflow-hidden leading-relaxed h-auto"
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement
                      target.style.height = 'auto'
                      target.style.height = target.scrollHeight + 'px'
                    }}
                    ref={(el) => {
                      if (el) {
                        el.style.height = 'auto'
                        el.style.height = el.scrollHeight + 'px'
                      }
                    }}
                  />
                  <button 
                    onClick={() => removeCriteria(i)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-rose-500 hover:bg-rose-500/10 transition-all absolute -top-2 -right-2 bg-[var(--color-bg-card)] border border-[var(--color-border)] shadow-sm"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))
            ) : (
              <div 
                onClick={addCriteria}
                className="text-center py-8 border-2 border-dashed border-[var(--color-border)] rounded-2xl hover:border-[var(--color-accent)]/30 hover:bg-[var(--color-accent)]/5 cursor-pointer transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-[var(--color-surface)] flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <p className="text-[12px] text-[var(--color-text-muted)] font-medium">Haz clic para agregar criterios BDD</p>
              </div>
            )}
          </div>
        </section>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-6 pt-4 border-t border-[var(--color-border)]">
          <section>
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-2 block">Actores</label>
            <div className="flex flex-wrap gap-1.5">
              {requirement.actors && requirement.actors.length > 0 ? (
                requirement.actors.map((actor, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-md bg-[var(--color-accent-subtle)] text-[var(--color-accent)] text-[11px] font-medium border border-[var(--color-accent)]/10">
                    {actor}
                  </span>
                ))
              ) : (
                <span className="text-xs text-[var(--color-text-muted)] italic">No definidos</span>
              )}
            </div>
          </section>
          <section>
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)] mb-2 block">Clasificación</label>
            <span className="px-2 py-0.5 rounded-md bg-[var(--color-surface)] text-[var(--color-text-secondary)] text-[11px] font-medium border border-[var(--color-border)]">
              {requirement.isoClassification || 'Funcional'}
            </span>
          </section>
        </div>

        {/* Project Context */}
        <section className="pt-6 border-t border-[var(--color-border)]">
           <div className="flex items-center justify-between text-[10px]">
              <div className="flex flex-col gap-1">
                <span className="font-bold uppercase tracking-widest text-[var(--color-text-muted)]">ID de Proyecto</span>
                <span className="font-mono text-[var(--color-text-secondary)]">{requirement.projectId}</span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Estado Actual</span>
                <span className={`font-bold px-2 py-0.5 rounded shadow-sm ${
                  status === 'saved' ? 'bg-emerald-500/10 text-emerald-600' :
                  status === 'draft' ? 'bg-blue-500/10 text-blue-600' :
                  'bg-[var(--color-surface)] text-[var(--color-text-muted)]'
                }`}>
                  {status === 'saved' ? 'Sincronizado' : 'Borrador Local'}
                </span>
              </div>
           </div>
        </section>
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-[var(--color-border)] bg-[var(--color-surface)]/30">
        <button 
          onClick={onSave}
          disabled={status === 'saved' || status === 'saving'}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-[var(--color-accent)] text-[var(--color-accent-foreground)] hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-[var(--color-accent)]/20 disabled:opacity-50 disabled:grayscale disabled:scale-100"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {status === 'saved' ? 'Guardado' : status === 'saving' ? 'Guardando…' : 'Guardar ahora'}
        </button>
      </div>
    </div>
  )
}
