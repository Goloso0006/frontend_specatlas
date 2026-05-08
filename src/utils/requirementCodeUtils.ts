import type { RequirementDTO } from '../types/requirements'

/**
 * Generates the next requirement code (e.g., RF-004) based on existing requirements.
 */
export function generateNextCode(requirements: RequirementDTO[], prefix: string = 'RF'): string {
  const codes = requirements
    .filter(r => r.code && r.code.startsWith(`${prefix}-`))
    .map(r => {
      const match = r.code.match(new RegExp(`${prefix}-(\\d+)`))
      return match ? parseInt(match[1], 10) : 0
    })

  const maxNumber = codes.length > 0 ? Math.max(...codes) : 0
  const nextNumber = maxNumber + 1
  
  // Pad with zeros to maintain 3-digit format (e.g., 001, 002...)
  return `${prefix}-${nextNumber.toString().padStart(3, '0')}`
}
