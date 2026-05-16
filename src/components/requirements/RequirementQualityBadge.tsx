import React, { useState, useRef, useEffect } from 'react'
import type { RequirementQualityIssue, IssueSeverity } from '../../utils/requirementQualityAnalyzer'

// ── Props ─────────────────────────────────────────────────────────────────────

interface RequirementQualityBadgeProps {
  issues: RequirementQualityIssue[]
  /** If true, renders the badge inline in a table cell. Default true. */
  inline?: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function severityIcon(severity: IssueSeverity) {
  if (severity === 'error') {
    return (
      <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    )
  }
  if (severity === 'warning') {
    return (
      <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    )
  }
  // info
  return (
    <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  )
}

function severityColor(severity: IssueSeverity): string {
  if (severity === 'error') return 'text-rose-600'
  if (severity === 'warning') return 'text-amber-600'
  return 'text-blue-500'
}

function severityBg(severity: IssueSeverity): string {
  if (severity === 'error') return 'bg-rose-500/10 border-rose-500/20 text-rose-600'
  if (severity === 'warning') return 'bg-amber-500/10 border-amber-500/20 text-amber-600'
  return 'bg-blue-500/10 border-blue-500/20 text-blue-600'
}

/** Returns the worst severity in the list */
function dominantSeverity(issues: RequirementQualityIssue[]): IssueSeverity {
  if (issues.some(i => i.severity === 'error')) return 'error'
  if (issues.some(i => i.severity === 'warning')) return 'warning'
  return 'info'
}

/** Human-readable field label */
function fieldLabel(field: RequirementQualityIssue['field']): string {
  switch (field) {
    case 'title': return 'Título'
    case 'description': return 'Descripción'
    case 'acceptanceCriteria': return 'Criterio'
    case 'category': return 'Categoría'
    case 'metricName': return 'Nombre de métrica'
    case 'operator': return 'Operador'
    case 'targetValue': return 'Valor objetivo'
    case 'unit': return 'Unidad'
    case 'context': return 'Contexto'
    case 'verificationMethod': return 'Método de verificación'
    case 'rationale': return 'Justificación'
    case 'nonFunctionalDetail': return 'Detalle RNF'
    case 'procedural': return 'Regla del proyecto'
    default: return field
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Compact quality badge that opens a floating popover listing all issues.
 *
 * - Zero-width when no issues.
 * - Shows "N observación(es)" badge with color based on dominant severity.
 * - Popover lists all issues with icon, field, message, and suggestion.
 * - Clicking outside closes the popover.
 * - Save is NEVER blocked — this is purely informational.
 */
export const RequirementQualityBadge: React.FC<RequirementQualityBadgeProps> = ({
  issues,
  inline = true,
}) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  if (issues.length === 0) return null

  const dom = dominantSeverity(issues)
  const count = issues.length
  const label = count === 1 ? '1 observación' : `${count} observaciones`

  return (
    <div
      ref={ref}
      className={`relative ${inline ? 'inline-flex' : 'flex'} items-center`}
      // Stop row-click from propagating when interacting with badge
      onClick={e => e.stopPropagation()}
    >
      {/* Badge trigger */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={[
          'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border',
          'text-[9px] font-bold uppercase tracking-wider cursor-pointer',
          'transition-colors hover:opacity-80',
          severityBg(dom),
        ].join(' ')}
        title="Ver observaciones de calidad"
        aria-label={`${label} de calidad`}
        aria-expanded={open}
      >
        {severityIcon(dom)}
        {label}
      </button>

      {/* Popover */}
      {open && (
        <div
          className={[
            'absolute z-50 bottom-full mb-1.5 left-0',
            'w-80 max-h-72 overflow-y-auto',
            'bg-[var(--color-bg-card)] border border-[var(--color-border)]',
            'rounded-xl shadow-2xl shadow-black/20',
            'flex flex-col divide-y divide-[var(--color-border)]',
          ].join(' ')}
          role="dialog"
          aria-label="Observaciones de calidad"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              Análisis de calidad
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
              aria-label="Cerrar"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Issue list */}
          {issues.map((issue, idx) => (
            <div key={issue.id ?? idx} className="px-3 py-2.5 flex flex-col gap-1">
              {/* Issue header line */}
              <div className="flex items-start gap-1.5">
                <span className={`mt-0.5 ${severityColor(issue.severity)}`}>
                  {severityIcon(issue.severity)}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mr-1.5">
                    {fieldLabel(issue.field)}
                    {issue.term && (
                      <>
                        {' · '}
                        <span className={`font-mono ${severityColor(issue.severity)}`}>
                          "{issue.term}"
                        </span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Message */}
              <p className="text-[11px] text-[var(--color-text-primary)] leading-snug pl-4">
                {issue.message}
              </p>

              {/* Suggestion */}
              {issue.suggestion && (
                <p className="text-[10px] text-[var(--color-text-muted)] leading-snug pl-4 italic">
                  💡 {issue.suggestion}
                </p>
              )}
            </div>
          ))}

          {/* Footer: save is not blocked */}
          <div className="px-3 py-2 bg-[var(--color-surface)]/40 rounded-b-xl">
            <p className="text-[9px] text-[var(--color-text-muted)] italic">
              Estas observaciones son informativas. Puedes guardar el requisito aunque existan.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default RequirementQualityBadge
