import React from 'react'
import type { RequirementDTO } from '../../types/requirements'

interface RequirementAiImprovePreviewProps {
  current: RequirementDTO
  suggested: RequirementDTO
  onApply: () => void
  onCancel: () => void
}

export const RequirementAiImprovePreview: React.FC<RequirementAiImprovePreviewProps> = ({
  current,
  suggested,
  onApply,
  onCancel
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-surface)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center text-[var(--color-accent-foreground)]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Mejora con IA</h3>
              <p className="text-xs text-[var(--color-text-muted)]">Compara la versión actual con la sugerencia de Gemini.</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 grid md:grid-cols-2 gap-8">
          {/* Version Actual */}
          <div className="space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] bg-[var(--color-surface)] px-2 py-1 rounded">Versión Actual</span>
            <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/50 opacity-70">
              <h4 className="font-bold text-sm mb-2">{current.title || '(Sin título)'}</h4>
              <p className="text-xs leading-relaxed text-[var(--color-text-secondary)] whitespace-pre-wrap">
                {current.description || '(Sin descripción)'}
              </p>
            </div>
          </div>

          {/* Versión IA */}
          <div className="space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-accent)] bg-[var(--color-accent-subtle)] px-2 py-1 rounded">Sugerencia Gemini</span>
            <div className="p-4 rounded-xl border-2 border-[var(--color-accent)] bg-[var(--color-accent-subtle)]/5 shadow-sm">
              <h4 className="font-bold text-sm mb-2 text-[var(--color-text-primary)]">{suggested.title}</h4>
              <p className="text-xs leading-relaxed text-[var(--color-text-primary)] whitespace-pre-wrap">
                {suggested.description}
              </p>
              {suggested.acceptanceCriteria && suggested.acceptanceCriteria.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[var(--color-accent)]/20">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-accent)] mb-2">Criterios sugeridos</p>
                  <ul className="space-y-1">
                    {suggested.acceptanceCriteria.map((c, i) => (
                      <li key={i} className="text-[11px] flex gap-2">
                        <span className="text-[var(--color-accent)]">✓</span> {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--color-border)] bg-[var(--color-surface)] flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] transition-colors"
          >
            Mantener actual
          </button>
          <button
            onClick={onApply}
            className="px-4 py-2 rounded-xl text-sm font-bold bg-[var(--color-accent)] text-[var(--color-accent-foreground)] hover:opacity-90 shadow-lg transition-all active:scale-95"
          >
            Aplicar mejora
          </button>
        </div>
      </div>
    </div>
  )
}
