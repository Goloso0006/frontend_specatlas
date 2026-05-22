import React, { useState, useEffect, useRef } from 'react'
import { RequirementQualityStatusBadge } from './RequirementQualityStatusBadge'
import type { RequirementDTO, RequirementQualityAnalysisDTO } from '../../types/requirements'
import { analyzeRequirementText } from '../../utils/requirementQualityAnalyzer'

export type RowStatus = 'draft' | 'saved' | 'incomplete' | 'ai_improved' | 'error' | 'saving' | 'checking'

export interface EditableRequirementRowProps {
  requirement: RequirementDTO
  localId: string
  status: RowStatus
  errorMessage?: string
  isSelected?: boolean
  /** Live quality issues from the local analyzer. Displayed as a badge — never blocks save. */
  qualityAnalysis?: RequirementQualityAnalysisDTO | null
  duplicateInfo?: { status: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH'; matches: any[] }
  traceabilityCount?: number
  onUpdate: (updates: Partial<RequirementDTO>) => void
  onSave: () => void
  onImprove: () => void
  onCheckDuplicates?: () => void
  onOpenQualityAnalysis?: () => void
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
  qualityAnalysis,
  duplicateInfo,
  traceabilityCount,
  onUpdate,
  onSave,
  onImprove,
  onCheckDuplicates,
  onOpenQualityAnalysis,
  onEvaluateRules,
  onManageTraceability,
  onDelete,
  onSelect
}) => {
  const [actorsInput, setActorsInput] = useState((requirement.actors || []).join(', '))

  const titleRef = useRef<HTMLTextAreaElement | null>(null)
  const descRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = 'auto'
      titleRef.current.style.height = titleRef.current.scrollHeight + 'px'
    }
  }, [requirement.title])

  useEffect(() => {
    if (descRef.current) {
      descRef.current.style.height = 'auto'
      descRef.current.style.height = descRef.current.scrollHeight + 'px'
    }
  }, [requirement.description])

  const localIssues = analyzeRequirementText({
    title: requirement.title,
    description: requirement.description,
    acceptanceCriteria: requirement.acceptanceCriteria,
    requirementType: requirement.requirementType ?? 'FUNCTIONAL',
  })

  const localAnalysis: RequirementQualityAnalysisDTO = {
    id: `local-${requirement.id || 'draft'}`,
    requirementId: requirement.id || 'draft',
    requirementCode: requirement.code || 'REQ',
    requirementType: requirement.requirementType ?? 'FUNCTIONAL',
    qualityStatus: localIssues.some(i => i.severity === 'error') ? 'ERROR' : localIssues.length > 0 ? 'WARNING' : 'OK',
    totalViolations: localIssues.length,
    errorCount: localIssues.filter(i => i.severity === 'error').length,
    warningCount: localIssues.filter(i => i.severity === 'warning').length,
    infoCount: 0,
    analyzedAt: new Date().toISOString(),
    analysisSource: 'RULES',
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
  const [showMenu, setShowMenu] = useState(false)

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
          maxLength={100}
          className={`w-full px-2 py-1 text-sm font-semibold bg-transparent border-0 focus:ring-1 focus:ring-[var(--color-accent)] rounded transition-all placeholder:text-[var(--color-text-muted)]/40 overflow-hidden resize-none whitespace-pre-wrap break-words leading-relaxed h-auto ${
            isInvalid && !requirement.title ? 'bg-rose-500/5 ring-1 ring-rose-500/30' : ''
          }`}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement
            target.style.height = 'auto'
            target.style.height = target.scrollHeight + 'px'
          }}
          ref={(el) => {
            titleRef.current = el
            if (el) {
              el.style.height = 'auto'
              el.style.height = el.scrollHeight + 'px'
            }
          }}
        />
        <span className={`block text-right text-[9px] font-mono mt-0.5 px-2 ${
          (requirement.title?.length ?? 0) >= 90 ? 'text-rose-500' : 'text-[var(--color-text-muted)]/50'
        }`}>
          {requirement.title?.length ?? 0}/100
        </span>

        {/* Horizontal Badges */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2 px-2">

          {/* Duplicados Badge */}
          {duplicateInfo && (
            <span
              onClick={(e) => {
                e.stopPropagation()
                onCheckDuplicates?.()
              }}
              title="Click para reanalizar duplicados"
              className={`cursor-pointer inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border transition-colors ${
                duplicateInfo.status === 'NONE'
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20'
                  : duplicateInfo.status === 'LOW'
                  ? 'bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20'
                  : duplicateInfo.status === 'MEDIUM'
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20'
                  : 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20'
              }`}
            >
              <span className="w-1 h-1 rounded-full bg-current shrink-0" />
              {duplicateInfo.status === 'NONE' && 'Dups: Sin riesgo'}
              {duplicateInfo.status === 'LOW' && `Dups: Bajo (${duplicateInfo.matches[0] ? Math.round(duplicateInfo.matches[0].similarityPercentage || duplicateInfo.matches[0].similarity * 100) : 0}%)`}
              {duplicateInfo.status === 'MEDIUM' && `Dups: Relacionado (${duplicateInfo.matches[0] ? Math.round(duplicateInfo.matches[0].similarityPercentage || duplicateInfo.matches[0].similarity * 100) : 0}%)`}
              {duplicateInfo.status === 'HIGH' && `Dups: Alto (${duplicateInfo.matches[0] ? Math.round(duplicateInfo.matches[0].similarityPercentage || duplicateInfo.matches[0].similarity * 100) : 0}%)`}
            </span>
          )}

          {/* Trazabilidad Badge */}
          {requirement.id && (
            <span
              onClick={(e) => {
                e.stopPropagation()
                onManageTraceability?.()
              }}
              title="Click para gestionar trazabilidad"
              className={`cursor-pointer inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border transition-colors bg-cyan-500/10 text-cyan-500 border-cyan-500/20 hover:bg-cyan-500/20`}
            >
              <span className="w-1 h-1 rounded-full bg-current shrink-0" />
              Traza: {traceabilityCount || 0}
            </span>
          )}
        </div>
      </td>

      {/* Descripción */}
      <td className="px-2 py-3 min-w-[320px] align-top">
        <textarea
          value={requirement.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          onClick={(e) => e.stopPropagation()}
          placeholder="Describe la funcionalidad..."
          rows={1}
          maxLength={500}
          className={`w-full px-2 py-1 text-[13px] bg-transparent border-0 focus:ring-1 focus:ring-[var(--color-accent)] rounded transition-all overflow-hidden resize-none whitespace-pre-wrap break-words leading-relaxed h-auto min-h-[48px] placeholder:text-[var(--color-text-muted)]/40 ${
            isInvalid && !requirement.description ? 'bg-rose-500/5 ring-1 ring-rose-500/30' : ''
          }`}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement
            target.style.height = 'auto'
            target.style.height = target.scrollHeight + 'px'
          }}
          ref={(el) => {
            descRef.current = el
            if (el) {
              el.style.height = 'auto'
              el.style.height = el.scrollHeight + 'px'
            }
          }}
        />
        <span className={`block text-right text-[9px] font-mono mt-0.5 px-2 ${
          (requirement.description?.length ?? 0) >= 460 ? 'text-rose-500' : 'text-[var(--color-text-muted)]/50'
        }`}>
          {requirement.description?.length ?? 0}/500
        </span>
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
      <td className="px-4 py-3 w-36 align-top">
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
          {/* Quality badge — live client-side ambiguity/quality analysis */}
          <RequirementQualityStatusBadge 
            analysis={(status === 'saved' && qualityAnalysis && localAnalysis.totalViolations === 0) ? qualityAnalysis : localAnalysis} 
            onClick={onOpenQualityAnalysis}
          />
        </div>
      </td>

      {/* Acciones */}
      <td className="px-4 py-3 w-44 align-top">
        {showMenu && (
          <div 
            className="fixed inset-0 z-30 cursor-default" 
            onClick={(e) => { e.stopPropagation(); setShowMenu(false); }} 
          />
        )}
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity mt-0.5 relative z-40">
          {/* Primary Action: Guardar */}
          <button
            onClick={(e) => { e.stopPropagation(); onSave(); }}
            disabled={status === 'saving' || status === 'saved'}
            title={status === 'saved' ? "Guardado" : "Guardar cambios"}
            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-500/10 transition-colors disabled:opacity-30"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>

          {/* Primary Action: Mejorar con IA */}
          <button
            onClick={(e) => { e.stopPropagation(); onImprove(); }}
            disabled={status === 'saving' || !requirement.id}
            title={!requirement.id ? "Guarda el requisito antes de mejorarlo con IA" : "Mejorar con IA"}
            className="p-1.5 rounded-lg text-purple-400 hover:bg-purple-500/10 transition-colors disabled:opacity-30"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </button>

          {/* Primary Action: Trazabilidad */}
          <button
            onClick={(e) => { e.stopPropagation(); onManageTraceability?.(); }}
            disabled={status === 'saving' || !requirement.id}
            title={!requirement.id ? "Guarda el requisito antes de gestionar trazabilidad" : "Trazabilidad"}
            className="p-1.5 rounded-lg text-cyan-400 hover:bg-cyan-500/10 transition-colors disabled:opacity-30"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </button>

          {/* Secondary Actions Trigger */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              title="Más opciones"
              className={`p-1.5 rounded-lg transition-colors ${showMenu ? 'text-[var(--color-accent)] bg-[var(--color-accent-subtle)]' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-1 w-56 bg-[var(--color-bg-card)] border border-[var(--color-border-strong)] rounded-xl shadow-2xl p-1.5 z-50 flex flex-col gap-0.5 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Detail View */}
                <button
                  onClick={(e) => { e.stopPropagation(); setShowMenu(false); onSelect(); }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-colors text-blue-400 hover:bg-blue-500/10"
                >
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>Ver detalle completo</span>
                </button>

                {/* Duplicates Search */}
                {onCheckDuplicates && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowMenu(false); onCheckDuplicates(); }}
                    disabled={status === 'saving'}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-colors text-amber-500 hover:bg-amber-500/10 disabled:opacity-40"
                  >
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Reanalizar duplicados</span>
                  </button>
                )}

                {/* Rules Validation */}
                {onEvaluateRules && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowMenu(false); onEvaluateRules(); }}
                    disabled={status === 'saving'}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-colors text-emerald-500 hover:bg-emerald-500/10 disabled:opacity-40"
                  >
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Revalidar reglas</span>
                  </button>
                )}

                {/* Requirement Quality Analysis / Observaciones */}
                <button
                  onClick={(e) => { e.stopPropagation(); setShowMenu(false); }}
                  disabled={true}
                  title="El detalle de análisis estará disponible próximamente."
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-colors text-indigo-400/40 cursor-not-allowed"
                >
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Análisis de calidad</span>
                </button>

                {/* Separator */}
                <div className="h-[1px] bg-[var(--color-border)] my-1" />

                {/* Delete */}
                <button
                  onClick={(e) => { e.stopPropagation(); setShowMenu(false); onDelete(); }}
                  disabled={status === 'saving'}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-colors text-rose-500 hover:bg-rose-500/10 disabled:opacity-40"
                >
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Eliminar requisito</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  )
}
