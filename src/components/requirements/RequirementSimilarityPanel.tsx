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

function getLevelColor(level?: string): string {
  switch (level) {
    case 'DUPLICATE': return 'bg-rose-500 text-white'
    case 'VERY_SIMILAR': return 'bg-amber-500 text-white'
    case 'RELATED': return 'bg-blue-500 text-white'
    case 'LOW': return 'bg-slate-200 text-slate-700'
    default: return 'bg-slate-200 text-slate-700'
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="p-4 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 flex items-center justify-between shadow-sm w-full max-w-lg">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
            <span className="text-sm font-medium">No se encontraron requisitos similares relevantes.</span>
          </div>
          <button onClick={onClose} className="text-emerald-700 hover:text-emerald-900 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>
    )
  }

  // Find if there's any high similarity match
  const hasHighSimilarity = matches.some(m => m.level === 'DUPLICATE' || m.level === 'VERY_SIMILAR')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="border border-[var(--color-border)] rounded-xl bg-[var(--color-surface)] shadow-lg overflow-hidden flex flex-col w-full max-w-2xl">
        <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between bg-slate-50/50">
        <h3 className="font-bold text-sm text-[var(--color-text-primary)] flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Posibles requisitos similares
        </h3>
        <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <div className="p-4 space-y-4 max-h-[300px] overflow-y-auto">
        {matches.map((match) => {
          const pct = formatSimilarityPercentage(match)
          return (
            <div key={match.requirementId} className="border border-[var(--color-border)] rounded-lg p-4 bg-[var(--color-bg)]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {match.code}
                  </span>
                  <span className="font-bold text-sm text-[var(--color-text-primary)]">{match.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-500">{pct}%</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${getLevelColor(match.level)}`}>
                    {getLevelLabel(match.level)}
                  </span>
                </div>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] mb-3 leading-relaxed">
                {match.explanation || getFallbackExplanation()}
              </p>
              <div className="bg-[var(--color-surface)] rounded p-2.5 border border-[var(--color-border)] mb-3">
                <p className="text-xs text-[var(--color-text-secondary)]">
                  <span className="font-bold text-[var(--color-text-primary)]">Recomendación:</span> {match.recommendation || getFallbackRecommendation(match.level)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    // Try to scroll to row
                    const row = document.getElementById(`req-row-${match.requirementId}`)
                    if (row) {
                      row.scrollIntoView({ behavior: 'smooth', block: 'center' })
                      row.classList.add('ring-2', 'ring-[var(--color-accent)]', 'transition-all')
                      setTimeout(() => row.classList.remove('ring-2', 'ring-[var(--color-accent)]'), 2000)
                    }
                  }}
                  className="text-xs text-[var(--color-accent)] font-medium hover:underline transition-colors"
                >
                  Ver requisito
                </button>
              </div>
            </div>
          )
        })}
      </div>
      {hasHighSimilarity && onImproveWithAi && (
        <div className="px-5 py-4 bg-indigo-50/50 border-t border-[var(--color-border)] flex items-start gap-3">
          <svg className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          <div>
            <p className="text-[11px] text-indigo-800 font-medium mb-1.5 leading-relaxed">
              Puedes usar Mejorar con IA para diferenciar o precisar este requisito.
            </p>
            <button
              onClick={onImproveWithAi}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider transition-colors"
            >
              Mejorar con IA →
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
