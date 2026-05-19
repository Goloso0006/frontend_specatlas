import React, { useState, useEffect } from 'react'
import type { RequirementDTO, RequirementQualityAnalysisDTO } from '../../types/requirements'
import { qualityAnalysisApi } from '../../api/services/qualityAnalysisApi'
import { analyzeRequirementText } from '../../utils/requirementQualityAnalyzer'

interface RequirementQualityDetailModalProps {
  requirement: RequirementDTO
  analysis: RequirementQualityAnalysisDTO | null
  isOpen: boolean
  onClose: () => void
  onReanalized?: (updatedAnalysis: RequirementQualityAnalysisDTO) => void
  status?: string
}

export const RequirementQualityDetailModal: React.FC<RequirementQualityDetailModalProps> = ({
  requirement,
  analysis: initialAnalysis,
  isOpen,
  onClose,
  onReanalized,
  status
}) => {
  const [analysis, setAnalysis] = useState<RequirementQualityAnalysisDTO | null>(initialAnalysis)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'violations' | 'preview'>('violations')

  // Generate local quality analysis based on the live text
  const localIssues = analyzeRequirementText({
    title: requirement.title,
    description: requirement.description,
    acceptanceCriteria: requirement.acceptanceCriteria,
    requirementType: requirement.requirementType ?? 'FUNCTIONAL',
  })

  const localAnalysis: RequirementQualityAnalysisDTO = {
    id: `local-analysis-${requirement.id || 'draft'}`,
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

  const activeAnalysis = (localAnalysis.violations && localAnalysis.violations.length > 0) ? localAnalysis : (analysis || localAnalysis)

  // Sync state if initial analysis prop changes
  useEffect(() => {
    setAnalysis(initialAnalysis)
    setError(null)
    setSuccess(null)
  }, [initialAnalysis])

  if (!isOpen) return null

  const handleReanalyze = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const isSaved = status === 'saved'
      if (!requirement.id || !isSaved) {
        setAnalysis(localAnalysis)
        setSuccess(
          !isSaved 
            ? '¡Análisis en Vivo completado de forma local! Guarda el requisito para reanalizar con la IA del servidor.' 
            : '¡Reanálisis en Vivo completado de forma local!'
        )
        onReanalized?.(localAnalysis)
        return
      }
      const result = await qualityAnalysisApi.reanalyzeRequirement(requirement.id)
      setAnalysis(result)
      setSuccess('El requisito ha sido reanalizado exitosamente contra las reglas de calidad.')
      onReanalized?.(result)
    } catch (err: any) {
      // Fallback to local analysis rather than throwing error
      setAnalysis(localAnalysis)
      setSuccess('El servidor de análisis está temporalmente inactivo. Se completó el Análisis en Vivo de forma local.')
      onReanalized?.(localAnalysis)
    } finally {
      setLoading(false)
    }
  }

  // Helper to map severity to CSS classes
  const getSeverityStyle = (severity: 'INFO' | 'WARNING' | 'ERROR') => {
    switch (severity) {
      case 'ERROR':
        return {
          bg: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
          dot: 'bg-rose-500',
          text: 'text-rose-400',
          label: 'Error',
        }
      case 'WARNING':
        return {
          bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
          dot: 'bg-amber-500',
          text: 'text-amber-400',
          label: 'Advertencia',
        }
      case 'INFO':
      default:
        return {
          bg: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
          dot: 'bg-blue-500',
          text: 'text-blue-400',
          label: 'Sugerencia',
        }
    }
  }

  const getFieldLabel = (field: string) => {
    switch (field) {
      case 'title': return 'Título'
      case 'description': return 'Descripción'
      case 'acceptanceCriteria': return 'Criterios de Aceptación'
      case 'actors': return 'Actores'
      case 'nonFunctionalDetail': return 'Detalle RNF'
      default: return field
    }
  }

  // Bulletproof ambiguity highlighting helper with tooltip hover problems & suggestions
  const renderHighlightedText = (text: string) => {
    if (!text) return <span className="text-[var(--color-text-muted)] italic">Vacío</span>
    if (!activeAnalysis || !activeAnalysis.violations) return <span>{text}</span>

    // Extract all fragments that we need to highlight
    const fragments = activeAnalysis.violations
      .map(v => v.fragment)
      .filter((f): f is string => typeof f === 'string' && f.trim().length > 0)

    if (fragments.length === 0) return <span>{text}</span>

    // Sort descending by length to avoid nested highlight replacements
    const sortedFragments = [...new Set(fragments)].sort((a, b) => b.length - a.length)

    // Escape regex characters
    const escaped = sortedFragments.map(f => f.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'))
    const regex = new RegExp(`(${escaped.join('|')})`, 'gi')

    const parts = text.split(regex)
    return (
      <span>
        {parts.map((part, idx) => {
          const isMatch = sortedFragments.some(f => f.toLowerCase() === part.toLowerCase())
          if (isMatch) {
            const violation = activeAnalysis.violations.find(v => v.fragment && v.fragment.toLowerCase() === part.toLowerCase())
            const tooltipText = violation 
              ? `Problema: ${violation.message}${violation.suggestion ? `\nSugerencia: ${violation.suggestion}` : ''}`
              : "Término ambiguo detectado"

            return (
              <mark
                key={idx}
                className="bg-amber-500/20 text-amber-300 font-medium px-1 py-0.5 rounded border border-amber-500/30 shadow-sm inline cursor-help hover:bg-amber-500/30 transition-colors"
                title={tooltipText}
              >
                {part}
              </mark>
            )
          }
          return part
        })}
      </span>
    )
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in"
      onClick={onClose}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { 
            opacity: 0; 
            transform: scale(0.96) translateY(8px); 
          }
          to { 
            opacity: 1; 
            transform: scale(1) translateY(0); 
          }
        }
        .animate-fade-in {
          animation: fadeIn 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-scale-up {
          animation: scaleUp 260ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
      
      <div 
        className="w-full max-w-[540px] max-h-[85vh] bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl shadow-2xl flex flex-col relative overflow-hidden animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface)]/20">
          <div className="flex items-center gap-2.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {requirement.code || 'REQ'}
            </span>
            <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
              Análisis de Calidad
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors p-1.5 rounded-lg hover:bg-[var(--color-surface)]/50"
            aria-label="Cerrar panel"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 p-5 overflow-y-auto overflow-x-hidden flex flex-col gap-5">
          {/* Notifications */}
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 flex items-start gap-2.5">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-start gap-2.5">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{success}</span>
            </div>
          )}

          {/* Quick Summary Card */}
          <div className="p-4 bg-[var(--color-surface)]/20 border border-[var(--color-border)] rounded-xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-widest">
                Requisito
              </span>
              {activeAnalysis ? (
                <span className={[
                  'px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider',
                  activeAnalysis.qualityStatus === 'OK' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  activeAnalysis.qualityStatus === 'WARNING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                  'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                ].join(' ')}>
                  {activeAnalysis.qualityStatus === 'OK' ? 'Correcto' : 'Observaciones'}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-gray-500/10 text-gray-400 border border-gray-500/20">
                  Sin análisis
                </span>
              )}
            </div>
            
            <div className="text-sm font-semibold text-[var(--color-text-primary)] leading-snug">
              {requirement.title || <span className="italic text-[var(--color-text-muted)]">Sin título</span>}
            </div>

            {activeAnalysis && (
              <div className="mt-1 pt-3 border-t border-[var(--color-border)]/50 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-[var(--color-text-muted)]">
                <div><strong className="text-[var(--color-text-secondary)]">Origen:</strong> {activeAnalysis.analysisSource === 'RULES' ? 'Análisis en Vivo (Local)' : activeAnalysis.analysisSource}</div>
                <div><strong className="text-[var(--color-text-secondary)]">Fecha:</strong> {new Date(activeAnalysis.analyzedAt).toLocaleDateString()}</div>
              </div>
            )}
          </div>

          {/* Metric Counts Grid */}
          {activeAnalysis && (
            <div className="grid grid-cols-4 gap-2 text-center p-3 bg-[var(--color-surface)]/30 border border-[var(--color-border)] rounded-xl">
              <div className="flex flex-col">
                <span className="text-base font-bold text-[var(--color-text-primary)]">{activeAnalysis.totalViolations}</span>
                <span className="text-[9px] text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">Total</span>
              </div>
              <div className="flex flex-col border-l border-[var(--color-border)]/55">
                <span className="text-base font-bold text-rose-400">{activeAnalysis.errorCount}</span>
                <span className="text-[9px] text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">Errores</span>
              </div>
              <div className="flex flex-col border-l border-[var(--color-border)]/55">
                <span className="text-base font-bold text-amber-400">{activeAnalysis.warningCount}</span>
                <span className="text-[9px] text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">Advs</span>
              </div>
              <div className="flex flex-col border-l border-[var(--color-border)]/55">
                <span className="text-base font-bold text-blue-400">{activeAnalysis.infoCount}</span>
                <span className="text-[9px] text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">Sugs</span>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b border-[var(--color-border)]">
            <button
              onClick={() => setActiveTab('violations')}
              className={[
                'flex-1 text-center py-2 text-xs font-semibold border-b-2 transition-all duration-200',
                activeTab === 'violations' 
                  ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
                  : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              ].join(' ')}
            >
              Detalles ({activeAnalysis ? activeAnalysis.violations.length : 0})
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={[
                'flex-1 text-center py-2 text-xs font-semibold border-b-2 transition-all duration-200',
                activeTab === 'preview' 
                  ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
                  : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              ].join(' ')}
            >
              Resaltado Visual
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'violations' ? (
            <div className="flex flex-col gap-4">
              {!activeAnalysis || activeAnalysis.violations.length === 0 ? (
                <div className="p-8 border border-dashed border-[var(--color-border)] rounded-xl flex flex-col items-center justify-center text-center bg-[var(--color-surface)]/10">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="text-xs font-bold text-[var(--color-text-primary)] mb-1">
                    ¡Calidad Excelente!
                  </h4>
                  <p className="text-[11px] text-[var(--color-text-muted)] max-w-xs leading-relaxed">
                    No se encontraron observaciones de ambigüedad o claridad.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {activeAnalysis.violations.map((violation) => {
                    const style = getSeverityStyle(violation.severity)
                    const displayedRule = violation.ruleName || violation.ruleCode || "Regla del proyecto"
                    return (
                      <div 
                        key={violation.id} 
                        className="p-4 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl flex flex-col gap-3.5 relative overflow-hidden group hover:border-[var(--color-border-hover)] transition-all duration-200 shadow-sm"
                      >
                        {/* Decorative severity left border */}
                        <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${violation.severity === 'ERROR' ? 'bg-rose-500' : violation.severity === 'WARNING' ? 'bg-amber-500' : 'bg-blue-500'}`} />

                        {/* Header: Severity & Rule */}
                        <div className="flex items-center justify-between gap-2 pl-2">
                          <div className="flex items-center gap-2">
                            <span className={['w-2 h-2 rounded-full', style.dot].join(' ')} />
                            <span className={['text-[10px] font-bold uppercase tracking-wider', style.text].join(' ')}>
                              {style.label}
                            </span>
                            <span className="text-[var(--color-text-muted)] text-[10px]">·</span>
                            <span className="text-[var(--color-text-muted)] text-[10px] font-bold uppercase tracking-wider">
                              {getFieldLabel(violation.field)}
                            </span>
                          </div>
                          <span className="text-[9px] font-mono font-bold bg-[var(--color-surface)] px-2 py-0.5 rounded text-[var(--color-text-muted)] border border-[var(--color-border)]/50">
                            {displayedRule}
                          </span>
                        </div>

                        {/* Fragment Block */}
                        {violation.fragment && (
                          <div className="pl-2 flex flex-col gap-1">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                              Fragmento detectado
                            </div>
                            <div className="inline-flex">
                              <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 shadow-sm whitespace-pre-wrap break-all">
                                "{violation.fragment}"
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Message / Problem */}
                        <div className="pl-2 flex flex-col gap-1">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                            Problema
                          </div>
                          <p className="text-xs text-[var(--color-text-primary)] leading-relaxed font-medium">
                            {violation.message}
                          </p>
                        </div>

                        {/* Suggestion */}
                        {violation.suggestion && (
                          <div className="pl-2">
                            <div className="p-3 bg-[var(--color-surface)]/60 rounded-xl border border-[var(--color-border)]/55 text-xs text-[var(--color-text-muted)] leading-relaxed shadow-sm">
                              <div className="flex items-center gap-1.5 font-semibold text-[var(--color-text-secondary)] mb-1 uppercase tracking-wider text-[10px]">
                                <span>💡 Sugerencia de mejora</span>
                              </div>
                              <p className="italic text-[var(--color-text-muted)]">
                                {violation.suggestion}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            /* PREVIEW TAB */
            <div className="p-4 bg-[var(--color-surface)]/20 border border-[var(--color-border)] rounded-xl flex flex-col gap-4">
              <div className="flex flex-col gap-1 pb-3 border-b border-[var(--color-border)]">
                <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Título</span>
                <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {renderHighlightedText(requirement.title)}
                </h4>
              </div>

              <div className="flex flex-col gap-1 py-1 pb-3 border-b border-[var(--color-border)]">
                <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Descripción</span>
                <p className="text-xs text-[var(--color-text-primary)] leading-relaxed whitespace-pre-line">
                  {renderHighlightedText(requirement.description)}
                </p>
              </div>

              <div className="flex flex-col gap-2 py-1">
                <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Criterios de Aceptación</span>
                {requirement.acceptanceCriteria && requirement.acceptanceCriteria.length > 0 ? (
                  <ul className="list-disc pl-4 flex flex-col gap-2">
                    {requirement.acceptanceCriteria.map((criterion, index) => (
                      <li key={index} className="text-xs text-[var(--color-text-primary)] leading-relaxed">
                        {renderHighlightedText(criterion)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-xs text-[var(--color-text-muted)] italic">Ninguno especificado</span>
                )}
              </div>
            </div>
          )}

          {/* Improved Suggestion Section */}
          {analysis && analysis.improvedSuggestion && (
            <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                    Propuesta Mejorada
                  </span>
                </div>
                <button
                  onClick={() => {
                    if (analysis.improvedSuggestion) {
                      navigator.clipboard.writeText(analysis.improvedSuggestion)
                      setSuccess('¡Propuesta copiada al portapapeles!')
                      setTimeout(() => setSuccess(null), 3000)
                    }
                  }}
                  className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20"
                >
                  Copiar
                </button>
              </div>
              <pre className="text-xs bg-black/30 border border-[var(--color-border)] p-3 rounded-lg text-indigo-200 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                {analysis.improvedSuggestion}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[var(--color-border)] bg-[var(--color-surface)]/20 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReanalyze}
            disabled={loading}
            className={[
              'flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all duration-200 shadow-sm',
              loading 
                ? 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)] cursor-not-allowed'
                : 'bg-indigo-600 border-indigo-500 hover:bg-indigo-500 hover:scale-102 active:scale-98 text-white'
            ].join(' ')}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-[var(--color-text-muted)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analizando...
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3 3L22 4" />
                </svg>
                Reanalizar Calidad
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 border border-[var(--color-border)] rounded-xl text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-all duration-200"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
