import { describe, expect, it } from 'vitest'
import {
  ACCEPTANCE_CRITERION_MAX_LENGTH,
  clampAcceptanceCriterionValue,
  getAcceptanceCriterionLineBreakLimit,
  shouldBlockAcceptanceCriterionEnter,
} from '../utils/acceptanceCriteria'

describe('acceptanceCriteria helpers', () => {
  it('limits functional criteria to one line break', () => {
    const value = 'Linea 1\nLinea 2\nLinea 3\nLinea 4'
    expect(clampAcceptanceCriterionValue(value, 1)).toBe('Linea 1\nLinea 2')
    expect(shouldBlockAcceptanceCriterionEnter('Linea 1', 1)).toBe(false)
    expect(shouldBlockAcceptanceCriterionEnter('Linea 1\nLinea 2', 1)).toBe(true)
  })

  it('removes line breaks for non-functional criteria', () => {
    const value = 'Primera linea\nSegunda linea\nTercera linea'
    expect(clampAcceptanceCriterionValue(value, 0)).toBe('Primera lineaSegunda lineaTercera linea')
    expect(shouldBlockAcceptanceCriterionEnter('Criterio simple', 0)).toBe(true)
  })

  it('caps the text at 100 characters', () => {
    const longValue = 'a'.repeat(ACCEPTANCE_CRITERION_MAX_LENGTH + 25)
    expect(clampAcceptanceCriterionValue(longValue, 1)).toHaveLength(ACCEPTANCE_CRITERION_MAX_LENGTH)
  })

  it('returns the expected line break limit by requirement type', () => {
    expect(getAcceptanceCriterionLineBreakLimit('FUNCTIONAL')).toBe(1)
    expect(getAcceptanceCriterionLineBreakLimit('NON_FUNCTIONAL')).toBe(0)
  })
})
