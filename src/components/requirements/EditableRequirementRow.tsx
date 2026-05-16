import React, { useState, useEffect } from 'react'
import { RequirementQualityBadge } from './RequirementQualityBadge'
import type { RequirementQualityIssue } from '../../utils/requirementQualityAnalyzer'
import type { RequirementDTO } from '../../types/requirements'

export type RowStatus = 'draft' | 'saved' | 'incomplete' | 'ai_improved' | 'error' | 'saving' | 'checking'

export interface EditableRequirementRowProps {
  requirement: RequirementDTO
  localId: string
  status: RowStatus
  errorMessage?: string
  isSelected?: boolean
  /** Live quality issues from the local analyzer. Displayed as a badge — never blocks save. */
  qualityIssues?: RequirementQualityIssue[]
  onUpdate: (updates: Partial<RequirementDTO>) => void
  onSave: () => void
  onImprove: () => void
  onCheckDuplicates?: () => void
  onViewMemory?: () => void
  onEvaluateRules?: () => void
  onManageTraceability?: () => void
  onDelete: () => void
  onSelect: () => void
}

export const EditableRequirementRow: React.FC<EditableRequirementRowProps> = ({
  requirement,
  status,
  errorMessage,
  isSelected,
  qualityIssues,
  onUpdate,
  onSave,
  onImprove,
  onCheckDuplicates,
  onViewMemory,
  onEvaluateRules,
  onManageTraceability,
  onDelete,
  onSelect
}) => {
  const [actorsInput, setActorsInput] = useState((requirement.actors || []).join(', '))

  // Sync actors input if requirement changes
  useEffect(() => {
    setActorsInput((requirement.actors || []).join(', '))
  }, [requirement.actors])

  const handleActorsBlur = () => {
    const actors = actorsInput.split(',').map(s => s.trim()).filter(Boolean)
    onUpdate({ actors })
  }

  const isInvalid = status === 'incomplete' || status === 'error'

  return (
    <tr 
      onClick={onSelect}
      className={`group border-b border-[var(--color-border)] transition-all cursor-pointer ${
        isSelected ? 'bg-[var(--color-accent-subtle)]/10 shadow-[inset_4px_0_0_0_var(--color-accent)]' : 'hover:bg-[var(--color-surface)]/30'
      } ${status === 'draft' && !isSelected ? 'bg-[var(--color-accent-subtle)]/5' : ''}`}
    >
      {/* Código */}
      <td className="px-4 py-4 text-[11px] font-mono font-bold text-[var(--color-text-muted)] w-24 align-top">
        {requirement.code || '...'}
      </td>

      {/* Título */}
      <td className="px-2 py-3 min-w-[180px] align-top">
        <textarea
          value={requirement.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          onClick={(e) => e.stopPropagation()}
          placeholder="Título del requisito..."
          rows={1}
          className={`w-full px-2 py-1 text-sm font-semibold bg-transparent border-0 focus:ring-1 focus:ring-[var(--color-accent)] rounded transition-all placeholder:text-[var(--color-text-muted)]/40 overflow-hidden resize-none whitespace-pre-wrap break-words leading-relaxed h-auto ${
            isInvalid && !requirement.title ? 'bg-rose-500/5 ring-1 ring-rose-500/30' : ''
          }`}
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
      </td>

      {/* Descripción */}
      <td className="px-2 py-3 min-w-[320px] align-top">
        <textarea
          value={requirement.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          onClick={(e) => e.stopPropagation()}
          placeholder="Describe la funcionalidad..."
          rows={1}
          className={`w-full px-2 py-1 text-[13px] bg-transparent border-0 focus:ring-1 focus:ring-[var(--color-accent)] rounded transition-all overflow-hidden resize-none whitespace-pre-wrap break-words leading-relaxed h-auto min-h-[48px] placeholder:text-[var(--color-text-muted)]/40 ${
            isInvalid && !requirement.description ? 'bg-rose-500/5 ring-1 ring-rose-500/30' : ''
          }`}
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
      </td>

      {/* Actores */}
      <td className="px-2 py-3 w-40 align-top">
        <input
          type="text"
          value={actorsInput}
          onChange={(e) => setActorsInput(e.target.value)}
          onBlur={handleActorsBlur}
          onClick={(e) => e.stopPropagation()}
          placeholder="Usuarios..."
          className="w-full px-2 py-1 text-xs bg-transparent border-0 focus:ring-1 focus:ring-[var(--color-accent)] rounded transition-all placeholder:text-[var(--color-text-muted)]/40"
        />
      </td>

      {/* Criterios */}
      <td className="px-4 py-4 text-center w-20 align-top">
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${requirement.acceptanceCriteria?.length ? 'bg-[var(--color-accent)] text-[var(--color-accent-foreground)]' : 'bg-[var(--color-surface)] text-[var(--color-text-muted)]'}`}>
          {requirement.acceptanceCriteria?.length || 0}
        </span>
      </td>

      {/* Estado + calidad */}
      <td className="px-4 py-3 w-28 align-top">
        <div className="flex flex-col gap-1 mt-1">
          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md inline-block w-fit shadow-sm ${
            status === 'saved' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
            status === 'draft' ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' :
            status === 'incomplete' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
            status === 'ai_improved' ? 'bg-purple-500/10 text-purple-600 border border-purple-500/20' :
            status === 'error' ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20' :
            status === 'saving' || status === 'checking' ? 'bg-slate-500/10 text-slate-600 animate-pulse' :
            'bg-[var(--color-surface)] text-[var(--color-text-muted)]'
          }`}>
            {status === 'saved' ? 'Guardado' :
             status === 'draft' ? 'Borrador' :
             status === 'incomplete' ? 'Incompleto' :
             status === 'ai_improved' ? 'IA ✨' :
             status === 'error' ? 'Error' :
             status === 'saving' ? 'Guardando' :
             status === 'checking' ? 'Dups' : '...'}
          </span>
          {errorMessage && (
            <span className="text-[9px] text-rose-500 leading-tight line-clamp-2" title={errorMessage}>
              {errorMessage}
            </span>
          )}
          {/* Quality badge — purely informational, never blocks save */}
          {qualityIssues && qualityIssues.length > 0 && (
            <RequirementQualityBadge issues={qualityIssues} />
          )}
        </div>
      </td>

      {/* Acciones */}
      <td className="px-4 py-3 w-44 align-top">
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); onSave(); }}
            disabled={status === 'saving'}
            title="Guardar cambios"
            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-500/10 transition-colors disabled:opacity-30"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onImprove(); }}
            disabled={status === 'saving' || !requirement.id}
            title={!requirement.id ? "Guarda el requisito antes de mejorarlo con IA" : "Mejorar con IA"}
            className={`p-1.5 rounded-lg text-purple-600 hover:bg-purple-500/10 transition-colors disabled:opacity-30 ${!requirement.id ? 'cursor-not-allowed' : ''}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </button>
          {onCheckDuplicates && (
            <button
              onClick={(e) => { e.stopPropagation(); onCheckDuplicates(); }}
              disabled={status === 'saving'}
              title="Verificar duplicados"
              className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-500/10 transition-colors disabled:opacity-30"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onViewMemory?.(); }}
            disabled={status === 'saving' || !requirement.id}
            title={!requirement.id ? "Guarda el requisito antes de consultar su memoria" : "Ver memoria del requisito"}
            className={`p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-500/10 transition-colors disabled:opacity-30 ${!requirement.id ? 'cursor-not-allowed' : ''}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </button>
          {onEvaluateRules && (
            <button
              onClick={(e) => { e.stopPropagation(); onEvaluateRules(); }}
              disabled={status === 'saving'}
              title="Validar reglas del proyecto"
              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-500/10 transition-colors disabled:opacity-30"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onManageTraceability?.(); }}
            disabled={status === 'saving' || !requirement.id}
            title={!requirement.id ? "Guarda el requisito antes de gestionar trazabilidad" : "Gestionar trazabilidad"}
            className={`p-1.5 rounded-lg text-cyan-600 hover:bg-cyan-500/10 transition-colors disabled:opacity-30 ${!requirement.id ? 'cursor-not-allowed' : ''}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
            title="Ver detalle completo"
            className={`p-1.5 rounded-lg transition-colors ${isSelected ? 'text-[var(--color-accent)] bg-[var(--color-accent-subtle)]' : 'text-blue-600 hover:bg-blue-500/10'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            disabled={status === 'saving'}
            title="Eliminar requisito"
            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-500/10 transition-colors disabled:opacity-30"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  )
}
