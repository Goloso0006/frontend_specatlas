import type { ReactNode } from 'react'

/**
 * Renders a styled empty-state message when no data is available.
 */
export function EmptyState({ message = 'No se encontraron datos.' }: { message?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-700 p-4 text-sm text-slate-400">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-base">
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
      <dt className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</dt>
      <dd className="text-sm text-slate-100">{children || <span className="text-slate-500">—</span>}</dd>
    </div>
  )
}

/**
 * Renders a horizontal list of tags/badges.
 */
export function TagList({ items, emptyMessage = 'Sin elementos' }: { items: string[]; emptyMessage?: string }) {
  if (items.length === 0) {
    return <span className="text-xs text-slate-500">{emptyMessage}</span>
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, index) => (
        <span
          key={`${item}-${index}`}
          className="rounded-md bg-slate-800 px-2 py-0.5 text-xs text-slate-200"
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
  const percent = Math.round(value * 100)
  const color = percent >= 80 ? 'bg-emerald-500' : percent >= 50 ? 'bg-amber-500' : 'bg-rose-500'

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-700">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
      <span className="text-xs text-slate-300">{percent}%</span>
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
      className={`rounded-xl border border-slate-700 bg-slate-950/50 p-3 transition-colors ${onClick ? 'cursor-pointer hover:border-cyan-400' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold text-slate-100">{title}</h4>
        {subtitle && <span className="shrink-0 text-xs text-slate-400">{subtitle}</span>}
      </div>
      {children}
    </div>
  )
}
