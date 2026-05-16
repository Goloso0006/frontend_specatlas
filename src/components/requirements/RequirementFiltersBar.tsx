import React from 'react'
import {
  EMPTY_FILTERS,
  countActiveFilters,
  hasActiveFilters,
  type RequirementFilters,
  type RequirementFilterOptions,
} from '../../utils/requirementFilterUtils'

// ── CSS class constants ───────────────────────────────────────────────────────

const INP =
  'h-7 px-2.5 text-[11px] rounded-lg border border-[var(--color-border)] ' +
  'bg-[var(--color-bg)] text-[var(--color-text-primary)] ' +
  'focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] ' +
  'placeholder:text-[var(--color-text-muted)]'
const SEL = INP + ' cursor-pointer'

// ── Props ─────────────────────────────────────────────────────────────────────

interface RequirementFiltersBarProps {
  /** Current filter state */
  filters: RequirementFilters
  /** Available options derived from the full (unfiltered) requirements list */
  options: RequirementFilterOptions
  /** Called whenever any filter changes */
  onFiltersChange: (filters: RequirementFilters) => void
  /** Number of rows shown after filtering */
  totalShown: number
  /** Total rows before filtering (used for the "N / M" counter) */
  totalAll: number
  /**
   * When true, shows RNF-specific filter fields:
   * category, metricName, verificationMethod.
   * Defaults to false (functional mode).
   */
  showRnfFilters?: boolean
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Compact, reusable filter bar for both functional and non-functional
 * requirements tables.
 *
 * - Shared filters: text search, actor, ISO classification, BDD criteria.
 * - RNF-specific filters (shown when showRnfFilters=true):
 *   category, metricName, verificationMethod.
 * - Shows active filter count badge.
 * - "Clear" button resets to EMPTY_FILTERS.
 * - Does NOT manage its own state; all state flows through props.
 */
export const RequirementFiltersBar: React.FC<RequirementFiltersBarProps> = ({
  filters,
  options,
  onFiltersChange,
  totalShown,
  totalAll,
  showRnfFilters = false,
}) => {
  const isActive = hasActiveFilters(filters)
  const activeCount = countActiveFilters(filters)

  function set<K extends keyof RequirementFilters>(key: K, value: RequirementFilters[K]) {
    onFiltersChange({ ...filters, [key]: value })
  }

  return (
    <div
      className={[
        'flex flex-wrap items-center gap-2 px-3 py-2.5',
        'bg-[var(--color-surface)]/40 border border-[var(--color-border)] rounded-xl',
        'transition-colors',
      ].join(' ')}
    >
      {/* ── Filter icon + active badge ── */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <svg
          className={`w-3.5 h-3.5 ${isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'} transition-colors`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"
          />
        </svg>
        {isActive && (
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[var(--color-accent)] text-[var(--color-accent-foreground)] text-[9px] font-bold leading-none">
            {activeCount}
          </span>
        )}
      </div>

      {/* ── Text search ── */}
      <input
        id="req-filter-search"
        type="search"
        value={filters.search}
        onChange={e => set('search', e.target.value)}
        placeholder="Buscar código, título, descripción…"
        className={`${INP} w-52`}
        aria-label="Buscar requisito"
      />

      {/* ── Actor dropdown ── */}
      {options.actors.length > 0 && (
        <select
          id="req-filter-actor"
          value={filters.actor}
          onChange={e => set('actor', e.target.value)}
          className={SEL}
          aria-label="Filtrar por actor"
        >
          <option value="">Todos los actores</option>
          {options.actors.map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      )}

      {/* ── ISO classification dropdown ── */}
      {options.isoClassifications.length > 0 && (
        <select
          id="req-filter-iso"
          value={filters.isoClassification}
          onChange={e => set('isoClassification', e.target.value)}
          className={SEL}
          aria-label="Filtrar por clasificación ISO"
        >
          <option value="">Clasificación ISO</option>
          {options.isoClassifications.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      )}

      {/* ── BDD criteria (functional only, hidden in RNF mode) ── */}
      {!showRnfFilters && (
        <select
          id="req-filter-criteria"
          value={filters.hasCriteria}
          onChange={e => set('hasCriteria', e.target.value as RequirementFilters['hasCriteria'])}
          className={SEL}
          aria-label="Filtrar por criterios BDD"
        >
          <option value="">BDD: todos</option>
          <option value="yes">Con criterios</option>
          <option value="no">Sin criterios</option>
        </select>
      )}

      {/* ── RNF-specific filters ── */}
      {showRnfFilters && (
        <>
          {/* Category */}
          {options.categories.length > 0 && (
            <select
              id="req-filter-category"
              value={filters.category}
              onChange={e => set('category', e.target.value)}
              className={SEL}
              aria-label="Filtrar por categoría ISO 25010"
            >
              <option value="">Todas las categorías</option>
              {options.categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}

          {/* Metric name */}
          {options.metricNames.length > 0 && (
            <select
              id="req-filter-metric"
              value={filters.metricName}
              onChange={e => set('metricName', e.target.value)}
              className={SEL}
              aria-label="Filtrar por métrica"
            >
              <option value="">Todas las métricas</option>
              {options.metricNames.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          )}

          {/* Verification method */}
          {options.verificationMethods.length > 0 && (
            <select
              id="req-filter-verification"
              value={filters.verificationMethod}
              onChange={e => set('verificationMethod', e.target.value)}
              className={SEL}
              aria-label="Filtrar por método de verificación"
            >
              <option value="">Todos los métodos</option>
              {options.verificationMethods.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          )}
        </>
      )}

      {/* ── Clear filters ── */}
      {isActive && (
        <button
          id="req-filter-clear"
          onClick={() => onFiltersChange(EMPTY_FILTERS)}
          className="h-7 px-2.5 text-[11px] rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors font-medium flex items-center gap-1 flex-shrink-0"
          title="Limpiar todos los filtros"
          aria-label="Limpiar filtros"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Limpiar
        </button>
      )}

      {/* ── Results counter ── */}
      <span className="ml-auto text-[10px] text-[var(--color-text-muted)] font-mono whitespace-nowrap flex-shrink-0">
        {isActive ? (
          <span>
            <span className={totalShown === 0 ? 'text-rose-500' : 'text-[var(--color-accent)]'}>
              {totalShown}
            </span>
            {' '}/ {totalAll}
          </span>
        ) : (
          `${totalAll} total`
        )}
      </span>
    </div>
  )
}

export default RequirementFiltersBar
