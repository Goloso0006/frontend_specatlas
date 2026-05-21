import { useState } from 'react'
import type { ProjectResponse } from '../../types/projects'

interface FlipProjectCardProps {
  project: ProjectResponse
  onClick: () => void
  onDelete: () => void
}

export function FlipProjectCard({ project, onClick, onDelete }: FlipProjectCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const statusConfig: Record<string, { color: string; icon: string; label: string }> = {
    ACTIVE: {
      color: 'text-[var(--color-accent)] bg-[var(--color-accent-subtle)] border-[var(--color-border)]',
      icon: '●',
      label: 'Activo',
    },
    INACTIVE: {
      color: 'text-[var(--color-text-secondary)] bg-[var(--color-surface)] border-[var(--color-border)]',
      icon: '○',
      label: 'Inactivo',
    },
    ARCHIVED: {
      color: 'text-[var(--color-warning)] bg-[var(--color-warning-subtle)] border-[var(--color-border)]',
      icon: '◔',
      label: 'Archivado',
    },
    DRAFT: {
      color: 'text-[var(--color-text-secondary)] bg-[var(--color-surface)] border-[var(--color-border)]',
      icon: '◌',
      label: 'Borrador',
    },
  }

  const status = statusConfig[project.status] || statusConfig.ARCHIVED

  return (
    <div className="flip-card h-64 w-full cursor-pointer group/card" onClick={onClick}>
      <div className="flip-card-inner">
        <div className="flip-card-front project-card-surface flex flex-col justify-between p-5">
          <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-[var(--color-accent)] opacity-30 group-hover/card:opacity-80 transition-opacity" />
          <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-[var(--color-accent)] opacity-30 group-hover/card:opacity-80 transition-opacity" />
          <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-[var(--color-accent)] opacity-30 group-hover/card:opacity-80 transition-opacity" />
          <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-[var(--color-accent)] opacity-30 group-hover/card:opacity-80 transition-opacity" />

          <div>
            <div className="w-10 h-10 rounded-lg bg-[var(--color-accent-subtle)] flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] line-clamp-2 leading-tight">
              {project.name}
            </h3>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--color-text-muted)]">ID:</span>
              <span className="font-mono text-[var(--color-text-secondary)]">{project.id || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--color-text-muted)]">Estado:</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium ${status.color}`}>
                {status.icon} {status.label}
              </span>
            </div>
          </div>
        </div>

        <div className="flip-card-back flex flex-col overflow-hidden rounded-[var(--ocd-tweak-dashboard-card-radius,1.35rem)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <div className="absolute top-3 left-3 text-[var(--color-text-muted)] opacity-60">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>

          <div className="flex-1 min-h-0 pt-5 pb-1">
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap break-words line-clamp-5 text-left">
              {project.description || 'Sin descripción disponible'}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)] text-xs shrink-0">
            {!confirmDelete ? (
              <>
                <button
                  onClick={(event) => {
                    event.stopPropagation()
                    setConfirmDelete(true)
                  }}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-[var(--color-text-muted)] transition-colors hover:bg-red-50 hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
                  title="Eliminar proyecto"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Eliminar
                </button>
                <span className="text-[10px] text-[var(--color-text-muted)] font-mono">↵ Abrir</span>
              </>
            ) : (
              <div className="flex items-center justify-between w-full gap-2">
                <span className="text-[11px] text-[var(--color-text-muted)]">¿Eliminar?</span>
                <div className="flex gap-2">
                  <button
                    onClick={(event) => {
                      event.stopPropagation()
                      setConfirmDelete(false)
                    }}
                    className="px-2 py-1 text-[11px] rounded border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] transition-colors"
                  >
                    No
                  </button>
                  <button
                    onClick={(event) => {
                      event.stopPropagation()
                      onDelete()
                      setConfirmDelete(false)
                    }}
                    className="px-2 py-1 text-[11px] rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                  >
                    Sí
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FlipProjectCard