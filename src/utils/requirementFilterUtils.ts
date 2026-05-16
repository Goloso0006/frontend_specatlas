import type { RequirementDTO } from '../types/requirements'

// ── Filter shape ──────────────────────────────────────────────────────────────

/**
 * Unified filter state for both functional and non-functional requirements.
 * RNF-specific fields (category, metricName, verificationMethod) are only
 * applied when they contain a non-empty value.
 *
 * Fields are intentionally kept optional/'' (never undefined internally)
 * so that a simple Object.values(filters).some(v => v !== '') check suffices
 * to know whether any filter is active.
 */
export interface RequirementFilters {
  /** Free-text: matches code, title, or description (case-insensitive) */
  search: string
  /** Actor filter: requirement must include this actor */
  actor: string
  /** ISO 25010 / functional classification exact match */
  isoClassification: string
  /** BDD acceptance criteria presence */
  hasCriteria: '' | 'yes' | 'no'
  // ── RNF-specific ──────────────────────────────────────────────────────────
  /** nonFunctionalDetail.category exact match */
  category: string
  /** nonFunctionalDetail.metricName: contains match (case-insensitive) */
  metricName: string
  /** nonFunctionalDetail.verificationMethod: contains match (case-insensitive) */
  verificationMethod: string
}

export const EMPTY_FILTERS: RequirementFilters = {
  search: '',
  actor: '',
  isoClassification: '',
  hasCriteria: '',
  category: '',
  metricName: '',
  verificationMethod: '',
}

// ── Filter options derived from data ──────────────────────────────────────────

export interface RequirementFilterOptions {
  actors: string[]
  isoClassifications: string[]
  categories: string[]
  metricNames: string[]
  verificationMethods: string[]
}

/**
 * RNF category preferred display order. Categories present in this list
 * are sorted by position; unknown categories are appended alphabetically.
 */
const CATEGORY_ORDER = [
  'PERFORMANCE',
  'SECURITY',
  'RELIABILITY',
  'USABILITY',
  'MAINTAINABILITY',
  'COMPATIBILITY',
  'PORTABILITY',
]

function sortCategories(cats: string[]): string[] {
  return [...cats].sort((a, b) => {
    const ia = CATEGORY_ORDER.indexOf(a.toUpperCase())
    const ib = CATEGORY_ORDER.indexOf(b.toUpperCase())
    if (ia !== -1 && ib !== -1) return ia - ib
    if (ia !== -1) return -1
    if (ib !== -1) return 1
    return a.localeCompare(b)
  })
}

/**
 * Builds all possible filter option lists from a requirements array.
 * Call this on the full (unfiltered) list so that all options remain stable
 * even when filters are active.
 */
export function buildFilterOptions(requirements: RequirementDTO[]): RequirementFilterOptions {
  const actors = new Set<string>()
  const isoClassifications = new Set<string>()
  const categories = new Set<string>()
  const metricNames = new Set<string>()
  const verificationMethods = new Set<string>()

  for (const r of requirements) {
    r.actors?.forEach(a => { if (a?.trim()) actors.add(a.trim()) })
    if (r.isoClassification?.trim()) isoClassifications.add(r.isoClassification.trim())
    if (r.nonFunctionalDetail?.category?.trim()) categories.add(r.nonFunctionalDetail.category.trim())
    if (r.nonFunctionalDetail?.metricName?.trim()) metricNames.add(r.nonFunctionalDetail.metricName.trim())
    if (r.nonFunctionalDetail?.verificationMethod?.trim()) verificationMethods.add(r.nonFunctionalDetail.verificationMethod.trim())
  }

  return {
    actors: [...actors].sort((a, b) => a.localeCompare(b)),
    isoClassifications: [...isoClassifications].sort((a, b) => a.localeCompare(b)),
    categories: sortCategories([...categories]),
    metricNames: [...metricNames].sort((a, b) => a.localeCompare(b)),
    verificationMethods: [...verificationMethods].sort((a, b) => a.localeCompare(b)),
  }
}

// ── Core filter function ───────────────────────────────────────────────────────

/**
 * Applies the active filters to a requirements list.
 *
 * Rules:
 * - Empty filter value → skip that filter (show all).
 * - Text search is case-insensitive substring match on code + title + description.
 * - Actor is case-insensitive contains match (allows partial actor names).
 * - isoClassification is exact match (trimmed).
 * - hasCriteria: 'yes' requires ≥1 criterion; 'no' requires 0.
 * - category / metricName / verificationMethod apply only to RNF requirements.
 * - Does NOT mutate the input array. Preserves original order.
 */
export function filterRequirements(
  requirements: RequirementDTO[],
  filters: RequirementFilters,
): RequirementDTO[] {
  const { search, actor, isoClassification, hasCriteria, category, metricName, verificationMethod } = filters

  // Fast path: no active filters
  if (!search && !actor && !isoClassification && !hasCriteria && !category && !metricName && !verificationMethod) {
    return requirements
  }

  return requirements.filter(r => {
    // ── Text search ───────────────────────────────────────────────────────
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      const hit =
        r.code?.toLowerCase().includes(q) ||
        r.title?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q)
      if (!hit) return false
    }

    // ── Actor ──────────────────────────────────────────────────────────────
    if (actor) {
      const match = r.actors?.some(a => a.toLowerCase().includes(actor.toLowerCase()))
      if (!match) return false
    }

    // ── ISO classification ──────────────────────────────────────────────────
    if (isoClassification) {
      if ((r.isoClassification?.trim() ?? '') !== isoClassification.trim()) return false
    }

    // ── BDD criteria ───────────────────────────────────────────────────────
    if (hasCriteria === 'yes' && !(r.acceptanceCriteria?.length)) return false
    if (hasCriteria === 'no' && (r.acceptanceCriteria?.length ?? 0) > 0) return false

    // ── RNF-specific ───────────────────────────────────────────────────────
    if (category) {
      if ((r.nonFunctionalDetail?.category?.trim() ?? '') !== category.trim()) return false
    }

    if (metricName) {
      const metric = r.nonFunctionalDetail?.metricName ?? ''
      if (!metric.toLowerCase().includes(metricName.toLowerCase())) return false
    }

    if (verificationMethod) {
      const vm = r.nonFunctionalDetail?.verificationMethod ?? ''
      if (!vm.toLowerCase().includes(verificationMethod.toLowerCase())) return false
    }

    return true
  })
}

// ── Active-filter count helper ─────────────────────────────────────────────────

/**
 * Returns the number of active (non-empty) filter fields.
 * Used for the badge in the filter bar.
 */
export function countActiveFilters(filters: RequirementFilters): number {
  return Object.values(filters).filter(v => v !== '').length
}

/** Returns true if at least one filter is active. */
export function hasActiveFilters(filters: RequirementFilters): boolean {
  return Object.values(filters).some(v => v !== '')
}
