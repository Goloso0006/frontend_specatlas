import React from 'react'
import type { DuplicateMatchResponse } from '../../types/requirements'

interface RequirementSimilarityPanelProps {
  matches: DuplicateMatchResponse[]
  onClose: () => void
  onImproveWithAi?: () => void
}

export function formatSimilarityPercentage(match: DuplicateMatchResponse): number {
  if (match.similarityPercentage !== undefined) return Math.round(match.similarityPercentage)
  if (match.similarity <= 1) return Math.round(match.similarity * 100)
  return Math.round(match.similarity)
}

function getLevelLabel(level?: string): string {
  switch (level) {
    case 'DUPLICATE': return 'Duplicado probable'
    case 'VERY_SIMILAR': return 'Muy similar'
    case 'RELATED': return 'Relacionado'
    case 'LOW': return 'Baja similitud'
    default: return 'Similitud detectada'
  }
}

function getLevelColorClass(level?: string): string {
  switch (level) {
    case 'DUPLICATE':
    case 'VERY_SIMILAR':
      return 'bg-[var(--color-danger-subtle)] text-[var(--color-danger)] border border-[var(--color-danger)]/20'
    case 'RELATED':
      return 'bg-[var(--color-warning-subtle)] text-[var(--color-warning)] border border-[var(--color-warning)]/20'
    case 'LOW':
    default:
      return 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)]'
  }
}

function getFallbackExplanation(): string {
  return 'Este requisito tiene una similitud semántica alta con el requisito existente.'
}

function getFallbackRecommendation(level?: string): string {
  switch (level) {
    case 'DUPLICATE': return 'Revisa si este requisito ya existe antes de guardarlo.'
    case 'VERY_SIMILAR': return 'Compara ambos requisitos para evitar duplicidad.'
    case 'RELATED': return 'Puede estar relacionado, pero no necesariamente es duplicado.'
    case 'LOW': return 'La similitud es baja.'
    default: return 'Revisa el requisito antes de guardarlo.'
  }
}

export const RequirementSimilarityPanel: React.FC<RequirementSimilarityPanelProps> = ({ matches, onClose, onImproveWithAi }) => {
  if (matches.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
        <div className="p-5 bg-[var(--color-bg-card)] border border-[var(--color-success)]/20 rounded-2xl flex items-center justify-between shadow-2xl w-full max-w-lg transition-all transform scale-100 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--color-success-subtle)] flex items-center justify-center text-[var(--color-success)] shrink-0">
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">Análisis completado</p>
              <p className="text-xs text-[var(--color-text-secondary)]">No se encontraron requisitos similares relevantes.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  const hasHighSimilarity = matches.some(m => m.level === 'DUPLICATE' || m.level === 'VERY_SIMILAR')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="border border-[var(--color-border-strong)] rounded-2xl bg-[var(--color-bg-card)] shadow-2xl overflow-hidden flex flex-col w-full max-w-2xl transition-all transform scale-100 duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-surface)]/40">
          <h3 className="font-bold text-sm text-[var(--color-text-primary)] flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[var(--color-warning-subtle)] flex items-center justify-center text-[var(--color-warning)]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <span>Posibles requisitos similares</span>
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[400px] overflow-y-auto">
          {matches.map((match) => {
            const pct = formatSimilarityPercentage(match)
            return (
              <div key={match.requirementId} className="border border-[var(--color-border)] rounded-xl p-4 bg-[var(--color-bg)]/30 hover:bg-[var(--color-bg)]/70 transition-all duration-150 group">
                
                {/* Match Header */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-mono text-[10px] font-bold text-[var(--color-text-primary)] bg-[var(--color-surface)] px-2.5 py-1 rounded border border-[var(--color-border)] shrink-0">
                      {match.code}
                    </span>
                    <span className="font-bold text-sm text-[var(--color-text-primary)] truncate">{match.title}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-extrabold text-[var(--color-text-primary)]">{pct}%</span>
                    <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${getLevelColorClass(match.level)}`}>
                      {getLevelLabel(match.level)}
                    </span>
                  </div>
                </div>

                {/* Explanation */}
                <p className="text-xs text-[var(--color-text-secondary)] mb-3 leading-relaxed">
                  {match.explanation || getFallbackExplanation()}
                </p>

                {/* Recommendation Panel */}
                <div className="bg-[var(--color-surface)]/50 rounded-lg p-3 border border-[var(--color-border)] mb-3">
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    <span className="font-bold text-[var(--color-text-primary)]">Recomendación:</span> {match.recommendation || getFallbackRecommendation(match.level)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const row = document.getElementById(`req-row-${match.requirementId}`)
                      if (row) {
                        onClose()
                        row.scrollIntoView({ behavior: 'smooth', block: 'center' })
                        row.classList.add('ring-2', 'ring-[var(--color-accent)]', 'transition-all', 'duration-300')
                        setTimeout(() => row.classList.remove('ring-2', 'ring-[var(--color-accent)]'), 2000)
                      }
                    }}
                    className="text-xs font-semibold text-[var(--color-text-primary)] hover:underline flex items-center gap-1 transition-all"
                  >
                    <span>Ver requisito original</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* AI Action footer */}
        {hasHighSimilarity && onImproveWithAi && (
          <div className="px-5 py-4 bg-[var(--color-accent-subtle)]/20 border-t border-[var(--color-border)] flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--color-accent-subtle)] flex items-center justify-center text-[var(--color-text-primary)] shrink-0 mt-0.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-secondary)] mb-1 leading-relaxed">
                Puedes utilizar el asistente inteligente **Mejorar con IA** para refinar y diferenciar la redacción de este requisito y evitar conflictos.
              </p>
              <button
                onClick={onImproveWithAi}
                className="text-[11px] font-extrabold text-[var(--color-text-primary)] hover:text-[var(--color-accent-hover)] uppercase tracking-wider flex items-center gap-1 transition-all mt-1.5"
              >
                <span>Mejorar con IA</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
