import React from 'react'
import type { DuplicateMatchResponse } from '../../types/requirements'

// ── Types ──────────────────────────────────────────────────────────────────

export type DuplicateCheckState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'none' }
  | { status: 'found'; duplicates: DuplicateMatchResponse[] }
  | { status: 'error' }

interface DuplicateWarningPanelProps {
  state: DuplicateCheckState
  onConfirm: () => void
  onEdit: () => void
  onDiscard: () => void
  isConfirmed?: boolean
  currentDraftType?: 'FUNCTIONAL' | 'NON_FUNCTIONAL'
}

// ── Helpers ────────────────────────────────────────────────────────────────

function normalizeSimilarity(score: number): number {
  if (score > 100) return score / 100;
  if (score > 1 && score <= 100) return score;
  return score * 100;
}

function getMatchLabel(dup: DuplicateMatchResponse, currentDraftType?: 'FUNCTIONAL' | 'NON_FUNCTIONAL'): { text: string, color: string } {
  if (currentDraftType === 'NON_FUNCTIONAL' && dup.requirementType === 'FUNCTIONAL') {
    return { text: 'Relacionado con funcionalidad existente', color: 'text-indigo-500' }
  }
  if (!dup.requirementType && currentDraftType) {
    return { text: 'Posible relación o duplicado', color: 'text-amber-500' }
  }
  
  const pct = normalizeSimilarity(dup.similarity)
  const displayPct = pct.toFixed(2)
  if (pct >= 85) return { text: `${displayPct}% — muy similar`, color: 'text-rose-500' }
  if (pct >= 65) return { text: `${displayPct}% — similar`, color: 'text-amber-500' }
  return { text: `${displayPct}% — posible relación`, color: 'text-[var(--color-text-muted)]' }
}

// ── Sub-components ─────────────────────────────────────────────────────────

const ActionRow: React.FC<{
  onConfirm?: () => void
  onEdit: () => void
  onDiscard: () => void
  primaryLabel?: string
}> = ({ onConfirm, onEdit, onDiscard, primaryLabel }) => (
  <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-[var(--color-border)]">
    <button
      type="button"
      onClick={onDiscard}
      className={[
        'h-8 px-3.5 rounded-lg text-[12.5px] font-medium',
        'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
        'hover:bg-[var(--color-bg)] transition-all duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
      ].join(' ')}
    >
      Descartar
    </button>
    <button
      type="button"
      onClick={onEdit}
      className={[
        'h-8 px-3.5 rounded-lg text-[12.5px] font-medium',
        'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
        'border border-[var(--color-border-strong)]',
        'hover:bg-[var(--color-bg)] transition-all duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
      ].join(' ')}
    >
      Editar antes de guardar
    </button>
    {onConfirm && primaryLabel && (
      <button
        type="button"
        onClick={onConfirm}
        className={[
          'ml-auto h-8 px-4 rounded-lg text-[12.5px] font-semibold',
          'bg-[var(--color-accent)] text-[var(--color-accent-foreground)]',
          'hover:opacity-90 transition-all duration-150',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2',
        ].join(' ')}
      >
        {primaryLabel}
      </button>
    )}
  </div>
)

// ── Main component ─────────────────────────────────────────────────────────

export const DuplicateWarningPanel: React.FC<DuplicateWarningPanelProps> = ({
  state,
  onConfirm,
  onEdit,
  onDiscard,
  isConfirmed,
  currentDraftType,
}) => {
  // ── Checking ──
  if (state.status === 'checking') {
    return (
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[12.5px] text-[var(--color-text-muted)]">
        <div className="w-3.5 h-3.5 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin flex-shrink-0" />
        Verificando duplicados en el proyecto…
      </div>
    )
  }

  // If user already confirmed to ignore warnings for this draft
  if (isConfirmed && (state.status === 'found' || state.status === 'error')) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[12.5px] text-[var(--color-text-secondary)]">
          <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Advertencia de duplicados ignorada.
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="text-[11px] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          Editar requisito
        </button>
      </div>
    )
  }

  // ── Check failed ──
  if (state.status === 'error') {
    return (
      <div className="rounded-xl border border-amber-400/30 bg-amber-50/10 dark:bg-amber-900/10 p-4 space-y-3">
        <div className="flex items-start gap-2.5">
          <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-[13px] font-semibold text-amber-600 dark:text-amber-400">No fue posible verificar duplicados</p>
            <p className="text-[12px] text-[var(--color-text-muted)] mt-0.5 leading-relaxed">
              Revisa manualmente si ya existe un requisito similar antes de confirmar su guardado.
            </p>
          </div>
        </div>
        <ActionRow
          onConfirm={onConfirm}
          onEdit={onEdit}
          onDiscard={onDiscard}
          primaryLabel="Confirmar de todas formas"
        />
      </div>
    )
  }

  // ── No duplicates ──
  if (state.status === 'none') {
    return (
      <div className="rounded-xl border border-emerald-400/30 bg-emerald-50/10 dark:bg-emerald-900/10 p-4 space-y-3">
        <div className="flex items-center gap-2.5">
          <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-[13px] font-semibold text-emerald-600 dark:text-emerald-400">Sin duplicados detectados</p>
        </div>
        <p className="text-[12px] text-[var(--color-text-muted)] leading-relaxed pl-6">
          No se encontraron requisitos similares en este proyecto. Puedes guardarlo.
        </p>
        <ActionRow
          onEdit={onEdit}
          onDiscard={onDiscard}
        />
      </div>
    )
  }

  // ── Duplicates found ──
  if (state.status === 'found') {
    const hasCrossMatch = state.duplicates.some(dup => currentDraftType === 'NON_FUNCTIONAL' && dup.requirementType === 'FUNCTIONAL')
    const hasUnknownMatch = state.duplicates.some(dup => !dup.requirementType)

    let headerTitle = "Posibles duplicados detectados"
    let headerText = "Este requisito podría parecerse a requisitos ya existentes en el proyecto. Debes confirmar antes de guardarlo."
    let headerColor = "text-rose-500"
    let headerBg = "border-rose-400/30 bg-rose-50/10 dark:bg-rose-900/10"
    let headerTextClass = "text-rose-600 dark:text-rose-400"

    if (hasCrossMatch) {
      headerTitle = "Relación detectada"
      headerText = "Este RNF parece complementar un requisito funcional existente. Revisa si debe guardarse como requisito de calidad asociado."
      headerColor = "text-indigo-500"
      headerBg = "border-indigo-400/30 bg-indigo-50/10 dark:bg-indigo-900/10"
      headerTextClass = "text-indigo-600 dark:text-indigo-400"
    } else if (hasUnknownMatch) {
      headerTitle = "Similitud detectada"
      headerText = "Posible relación o duplicado. Revisa antes de guardar."
      headerColor = "text-amber-500"
      headerBg = "border-amber-400/30 bg-amber-50/10 dark:bg-amber-900/10"
      headerTextClass = "text-amber-600 dark:text-amber-400"
    }

    return (
      <div className={`rounded-xl border p-4 space-y-4 ${headerBg}`}>
        {/* Warning header */}
        <div className="flex items-start gap-2.5">
          <svg className={`w-4 h-4 flex-shrink-0 mt-0.5 ${headerColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className={`text-[13px] font-semibold ${headerTextClass}`}>{headerTitle}</p>
            <p className="text-[12px] text-[var(--color-text-muted)] mt-0.5 leading-relaxed">
              {headerText}
            </p>
          </div>
        </div>

        {/* Duplicate list */}
        <ul className="space-y-2">
          {state.duplicates.map((dup) => (
            <li
              key={dup.requirementId}
              className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border)]"
            >
              {dup.code && (
                <span className="flex-shrink-0 inline-flex items-center h-5 px-1.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)] mt-0.5">
                  {dup.code}
                </span>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-semibold text-[var(--color-text-primary)] leading-snug truncate">
                  {dup.title}
                </p>
                {typeof dup.similarity === 'number' && (() => {
                  const label = getMatchLabel(dup, currentDraftType)
                  return (
                    <p className={`text-[11px] font-medium mt-0.5 ${label.color}`}>
                      {label.text}
                    </p>
                  )
                })()}
              </div>
            </li>
          ))}
        </ul>

        <ActionRow
          onConfirm={onConfirm}
          onEdit={onEdit}
          onDiscard={onDiscard}
          primaryLabel="Ignorar advertencia y confirmar"
        />
      </div>
    )
  }

  return null
}
