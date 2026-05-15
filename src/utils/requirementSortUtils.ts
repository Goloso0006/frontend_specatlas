import type { RequirementDTO } from '../types/requirements'

/**
 * Extracts the numeric part from a requirement code.
 * Examples: "RF-003" → 3, "RNF-012" → 12, "RF-10" → 10
 * Returns Infinity when the code cannot be parsed so unparseable codes sort last.
 */
function extractCodeNumber(code: string | undefined | null): number {
  if (!code) return Infinity
  const match = code.match(/-(\d+)$/)
  return match ? parseInt(match[1], 10) : Infinity
}

/**
 * Extracts the prefix from a requirement code.
 * Examples: "RF-003" → "RF", "RNF-012" → "RNF"
 */
function extractCodePrefix(code: string | undefined | null): string {
  if (!code) return ''
  const match = code.match(/^([A-Z]+)-/)
  return match ? match[1] : code
}

/**
 * Stable sort for requirements:
 * 1. Sort by code prefix (RF before RNF alphabetically)
 * 2. Then by numeric part ascending (RF-001 < RF-002 < RF-010)
 * 3. Fallback: requirements without valid codes sort last
 *
 * Does NOT mutate the original array.
 */
export function sortRequirements(requirements: RequirementDTO[]): RequirementDTO[] {
  return [...requirements].sort((a, b) => {
    const prefixA = extractCodePrefix(a.code)
    const prefixB = extractCodePrefix(b.code)

    if (prefixA !== prefixB) {
      return prefixA.localeCompare(prefixB)
    }

    const numA = extractCodeNumber(a.code)
    const numB = extractCodeNumber(b.code)

    if (numA !== numB) return numA - numB

    // Fallback: preserve original relative order (stable sort)
    return 0
  })
}
