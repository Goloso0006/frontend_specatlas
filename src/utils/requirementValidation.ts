import type { RequirementDTO } from '../types/requirements'

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

const FUNCTIONAL_PHRASES = [
  'el sistema debe permitir',
  'el sistema debe mostrar',
  'el sistema debe crear',
  'el sistema debe gestionar',
  'el sistema debe registrar',
  'el sistema debe consultar'
]

export function validateRequirementBeforeSave(
  requirement: RequirementDTO,
  expectedType: 'FUNCTIONAL' | 'NON_FUNCTIONAL'
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!requirement.title || !requirement.title.trim()) {
    errors.push('El título es obligatorio.')
  }
  if (!requirement.description || !requirement.description.trim()) {
    errors.push('La descripción es obligatoria.')
  }
  if (!requirement.projectId || !requirement.projectId.trim()) {
    errors.push('El ID del proyecto es obligatorio.')
  }

  // Type mismatch validation
  if (requirement.requirementType && requirement.requirementType !== expectedType) {
    errors.push(`Se esperaba un requisito de tipo ${expectedType} pero se encontró ${requirement.requirementType}.`)
  }

  if (expectedType === 'NON_FUNCTIONAL') {
    if (!requirement.nonFunctionalDetail) {
      errors.push('Los requisitos no funcionales necesitan detalle de calidad (nonFunctionalDetail) antes de guardarse.')
    } else {
      const detail = requirement.nonFunctionalDetail
      if (!detail.category?.trim()) errors.push('La categoría del requisito no funcional es obligatoria.')
      if (!detail.metricName?.trim()) errors.push('El nombre de la métrica es obligatorio.')
      if (!detail.operator?.trim()) errors.push('El operador es obligatorio.')
      if (!detail.targetValue?.trim()) errors.push('El valor objetivo es obligatorio.')
      if (!detail.unit?.trim()) errors.push('La unidad es obligatoria.')
      if (!detail.verificationMethod?.trim()) errors.push('El método de verificación es obligatorio.')
    }

    const lowerDesc = (requirement.description || '').toLowerCase()
    const hasFunctionalPhrase = FUNCTIONAL_PHRASES.some(phrase => lowerDesc.includes(phrase))
    if (hasFunctionalPhrase) {
      warnings.push('Este requisito parece describir una funcionalidad. Revisa si debe ser funcional o reformúlalo como una métrica de calidad.')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}
