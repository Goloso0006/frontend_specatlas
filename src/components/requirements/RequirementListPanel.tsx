import React from 'react'
import type { RequirementDTO } from '../../types/requirements'

// ── Types ──────────────────────────────────────────────────────────────────

interface RequirementListItemProps {
  requirement: RequirementDTO
  isSelected: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}

interface RequirementListPanelProps {
  requirements: RequirementDTO[]
  selectedId: string | null
  isLoading: boolean
  onSelect: (req: RequirementDTO) => void
  onEdit: (req: RequirementDTO) => void
  onDelete: (req: RequirementDTO) => void
  onAddNew: () => void
}

// ── Skeleton ───────────────────────────────────────────────────────────────

const ItemSkeleton: React.FC = () => (
  <div className="animate-pulse mx-3 my-2 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] space-y-2.5">
    <div className="flex items-center gap-2">
      <div className="h-4 w-14 bg-[var(--color-surface)] rounded-md" />
      <div className="h-4 w-36 bg-[var(--color-surface)] rounded-md" />
    </div>
    <div className="h-3 bg-[var(--color-surface)] rounded w-full" />
    <div className="h-3 bg-[var(--color-surface)] rounded w-5/6" />
    <div className="h-3 bg-[var(--color-surface)] rounded w-2/3" />
  </div>
)

// ── Card item ──────────────────────────────────────────────────────────────

const RequirementListItem: React.FC<RequirementListItemProps> = ({
  requirement,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}) => {
  function handleEditClick(e: React.MouseEvent) {
    e.stopPropagation()
    onEdit()
  }

  function handleDeleteClick(e: React.MouseEvent) {
    e.stopPropagation()
    onDelete()
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={e => e.key === 'Enter' && onSelect()}
      aria-selected={isSelected}
      className={[
        'group relative mx-3 my-2 p-4 rounded-xl',
        'border cursor-pointer',
        'transition-all duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-1',
        isSelected
          ? 'border-[var(--color-accent)] bg-[var(--color-surface)] shadow-sm'
          : 'border-[var(--color-border)] bg-[var(--color-bg-card)] hover:border-[var(--color-border-strong)] hover:shadow-sm',
      ].join(' ')}
    >
      {/* Left accent bar on selected */}
      {isSelected && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-[var(--color-accent)]"
        />
      )}

      {/* Row 1: Code badge + title + action buttons */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {requirement.code && (
            <span className={[
              'inline-flex items-center flex-shrink-0 h-5 px-2 rounded-md text-[10px] font-bold uppercase tracking-wider',
              isSelected
                ? 'bg-[var(--color-accent)] text-[var(--color-accent-foreground)]'
                : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]',
              'transition-colors duration-100',
            ].join(' ')}>
              {requirement.code}
            </span>
          )}
          <span className={[
            'text-[13px] font-semibold leading-snug',
            isSelected
              ? 'text-[var(--color-text-primary)]'
              : 'text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]',
            'transition-colors duration-100',
          ].join(' ')}>
            {requirement.title || 'Sin título'}
          </span>
        </div>

        {/* Action buttons — visible on hover/selected */}
        <div className={[
          'flex-shrink-0 flex items-center gap-1',
          'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
          isSelected ? 'opacity-100' : '',
        ].join(' ')}>
          {/* Edit */}
          <button
            type="button"
            onClick={handleEditClick}
            aria-label="Editar requisito"
            title="Editar"
            className="w-6 h-6 flex items-center justify-center rounded-md text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)] transition-colors duration-100"
          >
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={handleDeleteClick}
            aria-label="Eliminar requisito"
            title="Eliminar"
            className="w-6 h-6 flex items-center justify-center rounded-md text-[var(--color-text-muted)] hover:bg-[var(--color-danger-subtle)] hover:text-[var(--color-danger)] transition-colors duration-100"
          >
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Full description */}
      {requirement.description && (
        <p className="text-[12px] text-[var(--color-text-muted)] leading-relaxed whitespace-pre-wrap break-words line-clamp-3">
          {requirement.description}
        </p>
      )}

      {/* Footer row: Actors + Criteria count */}
      <div className="flex items-center justify-between gap-2 mt-2.5">
        {/* Actors */}
        <div className="flex flex-wrap gap-1">
          {(requirement.actors ?? []).length > 0 ? (
            requirement.actors.map(actor => (
              <span key={actor}
                className="inline-flex h-4 items-center px-1.5 rounded text-[10px] font-medium bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-muted)]">
                {actor}
              </span>
            ))
          ) : (
            <span className="text-[10px] text-[var(--color-text-muted)] opacity-40 italic">Sin actores</span>
          )}
        </div>

        {/* Criteria count badge */}
        {(requirement.acceptanceCriteria ?? []).length > 0 && (
          <div className="flex-shrink-0 flex items-center gap-1.5" title="Criterios de aceptación">
            <span className="text-[10px] font-bold text-[var(--color-text-muted)]">
              {(requirement.acceptanceCriteria ?? []).length}
            </span>
            <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} className="text-[var(--color-accent)]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Panel ──────────────────────────────────────────────────────────────────

/**
 * Left-column panel showing the list of requirements as cards.
 *
 * ── WIDTH ──────────────────────────────────────────────────────────────────
 * The width of this panel is controlled in RequirementsPage.tsx.
 * Look for the div with comment "Left column: requirement list" and the
 * inline style: style={{ width: 'clamp(280px, 35%, 420px)' }}
 * ─  Increase the second/third value to make the column wider.
 * ─  e.g. clamp(300px, 40%, 480px)  →  wider column
 * ──────────────────────────────────────────────────────────────────────────
 */
export const RequirementListPanel: React.FC<RequirementListPanelProps> = ({
  requirements,
  selectedId,
  isLoading,
  onSelect,
  onEdit,
  onDelete,
  onAddNew,
}) => {
  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Scrollable card list */}
      <div className="flex-1 overflow-y-auto min-h-0 py-1">
        {isLoading ? (
          <>
            <ItemSkeleton />
            <ItemSkeleton />
            <ItemSkeleton />
          </>
        ) : requirements.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
            <span className="text-3xl opacity-30">📋</span>
            <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">
              No hay requisitos en este proyecto todavía.
              <br />Crea el primero con el botón de abajo.
            </p>
          </div>
        ) : (
          requirements.map(req => (
            <RequirementListItem
              key={req.id || req.code}
              requirement={req}
              isSelected={selectedId === req.id}
              onSelect={() => onSelect(req)}
              onEdit={() => onEdit(req)}
              onDelete={() => onDelete(req)}
            />
          ))
        )}
      </div>

      {/* Footer: Add new button */}
      <div className="flex-shrink-0 border-t border-[var(--color-border)] p-2.5">
        <button
          type="button"
          onClick={onAddNew}
          className={[
            'w-full flex items-center justify-center gap-2 h-9',
            'text-[12.5px] font-medium',
            'text-[var(--color-text-secondary)]',
            'rounded-xl border border-dashed border-[var(--color-border-strong)]',
            'hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-accent)]',
            'transition-all duration-150',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
          ].join(' ')}
        >
          <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo requisito
        </button>
      </div>
    </div>
  )
}
