import type { ReactNode } from 'react'

/**
 * Renders a styled empty-state message when no data is available.
 */
export function EmptyState({ message = 'No se encontraron datos.' }: { message?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-dashed app-border-strong p-4 text-sm app-text-muted">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full app-surface text-base">
        ∅
      </span>
      <p>{message}</p>
    </div>
  )
}

/**
 * Renders a key-value pair in a consistent format.
 */
export function DataField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs font-medium uppercase tracking-wider app-text-muted">{label}</dt>
      <dd className="text-sm app-text-primary">{children || <span className="app-text-muted opacity-80">—</span>}</dd>
    </div>
  )
}

/**
 * Renders a horizontal list of tags/badges.
 */
export function TagList({ items, emptyMessage = 'Sin elementos' }: { items: string[]; emptyMessage?: string }) {
  if (items.length === 0) {
    return <span className="text-xs app-text-muted opacity-80">{emptyMessage}</span>
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, index) => (
        <span
          key={`${item}-${index}`}
          className="rounded-md app-surface px-2 py-0.5 text-xs app-text-primary"
        >
          {item}
        </span>
      ))}
    </div>
  )
}

/**
 * Renders a percentage bar with label.
 */
export function SimilarityBadge({ value }: { value: number }) {
  let percent = value;
  if (value > 100) percent = value / 100;
  else if (value <= 1) percent = value * 100;
  
  const displayPct = percent.toFixed(2);
  const color = percent >= 85 ? 'bg-rose-500' : percent >= 65 ? 'bg-amber-500' : 'bg-emerald-500'

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-app-surface">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>
      <span className="text-xs app-text-secondary">{displayPct}%</span>
    </div>
  )
}

/**
 * Generic card wrapper for data items.
 */
export function DataCard({ title, subtitle, children, onClick }: {
  title: string
  subtitle?: string
  children?: ReactNode
  onClick?: () => void
}) {
  return (
    <div
      className={`rounded-xl border app-border-strong app-bg/50 p-3 transition-colors ${onClick ? 'cursor-pointer hover:border-app-accent' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold app-text-primary">{title}</h4>
        {subtitle && <span className="shrink-0 text-xs app-text-muted">{subtitle}</span>}
      </div>
      {children}
    </div>
  )
}
