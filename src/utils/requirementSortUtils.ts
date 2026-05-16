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
 * 3. Fallback to createdAt ASC for requirements without valid numeric codes
 * 4. If createdAt is also missing, preserve stable original order
 *
 * Does NOT mutate the original array.
 */
export function sortRequirements(requirements: RequirementDTO[]): RequirementDTO[] {
  return [...requirements].sort((a, b) => {
    const prefixA = extractCodePrefix(a.code)
    const prefixB = extractCodePrefix(b.code)

    // Requirements without any code prefix sort last
    if (!prefixA && prefixB) return 1
    if (prefixA && !prefixB) return -1

    if (prefixA !== prefixB) {
      return prefixA.localeCompare(prefixB)
    }

    const numA = extractCodeNumber(a.code)
    const numB = extractCodeNumber(b.code)

    if (numA !== numB) {
      // Both Infinity (unparseable) → fall through to createdAt
      if (numA !== Infinity && numB !== Infinity) return numA - numB
    } else if (numA !== Infinity) {
      // Same valid number, preserve order
      return 0
    }

    // Fallback: sort by createdAt ASC for requirements without valid codes
    const dateA = (a as any).createdAt ? new Date((a as any).createdAt).getTime() : Infinity
    const dateB = (b as any).createdAt ? new Date((b as any).createdAt).getTime() : Infinity
    if (dateA !== dateB) return dateA - dateB

    // Stable fallback: preserve original relative order
    return 0
  })
}
