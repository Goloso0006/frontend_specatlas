import React, { useRef } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────

interface RequirementsSearchBarProps {
  /** Current search query value */
  value: string
  /** Called when user types */
  onChange: (value: string) => void
  /** Called when user submits the search (Enter or button) */
  onSearch: () => void
  /** Called when clearing the search */
  onClear: () => void
  /** Loading state */
  isLoading?: boolean
}

// ── Component ──────────────────────────────────────────────────────────────

export const RequirementsSearchBar: React.FC<RequirementsSearchBarProps> = ({
  value,
  onChange,
  onSearch,
  onClear,
  isLoading = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') onSearch()
    if (e.key === 'Escape') { onClear(); inputRef.current?.blur() }
  }

  const hasValue = value.trim().length > 0

  return (
    <div className="flex items-center gap-2">
      {/* Search input */}
      <div className="relative flex-1 min-w-0">
        {/* Search icon */}
        <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-muted)]">
          <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Busca tu requerimiento solo con palabras relacionadas"
          aria-label="Buscar requisitos"
          disabled={isLoading}
          className={[
            'w-full h-8 pl-8 pr-3 text-[12.5px]',
            'bg-[var(--color-bg)] border border-[var(--color-border-strong)]',
            'rounded-lg',
            'text-[var(--color-text-primary)]',
            'placeholder:text-[var(--color-text-muted)]',
            'focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent',
            'transition-all duration-150',
            isLoading ? 'opacity-60 cursor-not-allowed' : '',
          ].join(' ')}
        />
      </div>

      {/* Clear / X button */}
      <button
        type="button"
        onClick={hasValue ? onClear : onSearch}
        aria-label={hasValue ? 'Limpiar búsqueda' : 'Buscar'}
        title={hasValue ? 'Limpiar búsqueda' : 'Buscar'}
        disabled={isLoading}
        className={[
          'flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg',
          'border border-[var(--color-border-strong)]',
          'bg-[var(--color-bg-card)]',
          'text-[var(--color-text-secondary)]',
          'hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]',
          'transition-all duration-150',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
          isLoading ? 'opacity-50 cursor-not-allowed' : '',
        ].join(' ')}
      >
        {hasValue ? (
          // X icon
          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          // Search / enter icon
          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        )}
      </button>
    </div>
  )
}
