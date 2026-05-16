import type { RequirementDTO } from '../types/requirements'
import type { RequirementQualityIssue } from './requirementQualityAnalyzer'

let issueCounter = 0
function nextId(): string {
  return `rnf-val-${++issueCounter}-${Math.random().toString(36).slice(2, 6)}`
}

// The NF table in Phase 2/3 used: 'Rendimiento', 'Seguridad', 'Usabilidad', 'Confiabilidad', etc.
// But the user explicitely said: "Allowed category values: PERFORMANCE, SECURITY... If the UI currently supports different operator labels, normalize them safely."
// Wait, the UI in `NonFunctionalRequirementsTable.tsx` has `const ISO_CATEGORIES = ['Rendimiento', 'Seguridad', 'Usabilidad', 'Confiabilidad', 'Mantenibilidad', 'Portabilidad', 'Compatibilidad', 'Funcionalidad']`
// So we should accept both English keys and Spanish labels.
const ALLOWED_CATEGORY_VALUES = new Set([
  'PERFORMANCE', 'SECURITY', 'RELIABILITY', 'USABILITY',
  'MAINTAINABILITY', 'COMPATIBILITY', 'PORTABILITY',
  'Rendimiento', 'Seguridad', 'Usabilidad', 'Confiabilidad',
  'Mantenibilidad', 'Portabilidad', 'Compatibilidad', 'Funcionalidad'
])

const ALLOWED_OPERATORS = new Set(['<', '<=', '>', '>=', '=', '!=', '≠'])

/**
 * Validates the `nonFunctionalDetail` of a NON_FUNCTIONAL requirement.
 * Returns an array of issues using the same `RequirementQualityIssue` type
 * to seamlessly integrate with the `RequirementQualityBadge`.
 *
 * Does not block saving.
 */
export function validateNonFunctionalDetail(
  requirement: RequirementDTO
): RequirementQualityIssue[] {
  // Only validate NON_FUNCTIONAL requirements
  if (requirement.requirementType !== 'NON_FUNCTIONAL') {
    return []
  }

  const issues: RequirementQualityIssue[] = []
  const detail = requirement.nonFunctionalDetail

  if (!detail) {
    issues.push({
      id: nextId(),
      severity: 'error',
      field: 'nonFunctionalDetail',
      message: 'Este RNF no tiene detalle no funcional.',
      suggestion:
        'Completa categoría, métrica, operador, valor objetivo, unidad, contexto, método de verificación y justificación.',
      ruleId: 'RNF_MISSING_DETAIL',
    })
    return issues
  }

  // category
  if (!detail.category || !detail.category.trim()) {
    issues.push({
      id: nextId(),
      severity: 'error',
      field: 'category',
      message: 'Falta la categoría de calidad.',
      suggestion: 'Selecciona una categoría ISO 25010 como PERFORMANCE, SECURITY o USABILITY.',
      ruleId: 'RNF_MISSING_CATEGORY',
    })
  } else if (!ALLOWED_CATEGORY_VALUES.has(detail.category)) {
    issues.push({
      id: nextId(),
      severity: 'error',
      field: 'category',
      message: 'La categoría no coincide con los valores permitidos.',
      suggestion: 'Usa una de las categorías permitidas: PERFORMANCE, SECURITY, RELIABILITY, USABILITY, MAINTAINABILITY, COMPATIBILITY, PORTABILITY.',
      ruleId: 'RNF_INVALID_CATEGORY',
    })
  }

  // metricName
  if (!detail.metricName || !detail.metricName.trim()) {
    issues.push({
      id: nextId(),
      severity: 'error',
      field: 'metricName',
      message: 'Falta el nombre de la métrica.',
      suggestion: 'Ejemplo: tiempo de respuesta, disponibilidad, cobertura de cifrado.',
      ruleId: 'RNF_MISSING_METRIC_NAME',
    })
  }

  // operator
  if (!detail.operator || !detail.operator.trim()) {
    issues.push({
      id: nextId(),
      severity: 'error',
      field: 'operator',
      message: 'Falta el operador de comparación.',
      suggestion: 'Usa operadores como <=, >=, =, < o >.',
      ruleId: 'RNF_MISSING_OPERATOR',
    })
  } else if (!ALLOWED_OPERATORS.has(detail.operator.trim())) {
    issues.push({
      id: nextId(),
      severity: 'error',
      field: 'operator',
      message: 'El operador no es válido.',
      suggestion: 'Usa operadores como <=, >=, =, < o >.',
      ruleId: 'RNF_INVALID_OPERATOR',
    })
  }

  // targetValue
  if (!detail.targetValue || !detail.targetValue.trim()) {
    issues.push({
      id: nextId(),
      severity: 'error',
      field: 'targetValue',
      message: 'Falta el valor objetivo.',
      suggestion: 'Ejemplo: 2, 99.5, TLS 1.2, AES-256.',
      ruleId: 'RNF_MISSING_TARGET_VALUE',
    })
  }

  // unit
  if (!detail.unit || !detail.unit.trim()) {
    issues.push({
      id: nextId(),
      severity: 'error',
      field: 'unit',
      message: 'Falta la unidad de medida.',
      suggestion: 'Ejemplo: segundos, %, ms, solicitudes/minuto, TLS/AES.',
      ruleId: 'RNF_MISSING_UNIT',
    })
  }

  // context
  if (!detail.context || !detail.context.trim()) {
    issues.push({
      id: nextId(),
      severity: 'error',
      field: 'context',
      message: 'Falta el contexto de aplicación.',
      suggestion: 'Indica en qué escenario debe cumplirse la métrica.',
      ruleId: 'RNF_MISSING_CONTEXT',
    })
  }

  // verificationMethod
  if (!detail.verificationMethod || !detail.verificationMethod.trim()) {
    issues.push({
      id: nextId(),
      severity: 'error',
      field: 'verificationMethod',
      message: 'Falta el método de verificación.',
      suggestion: 'Ejemplo: prueba de carga, revisión de seguridad, monitoreo, auditoría.',
      ruleId: 'RNF_MISSING_VERIFICATION_METHOD',
    })
  }

  // rationale
  if (!detail.rationale || !detail.rationale.trim()) {
    issues.push({
      id: nextId(),
      severity: 'error',
      field: 'rationale',
      message: 'Falta la justificación.',
      suggestion: 'Explica por qué esta restricción de calidad es necesaria.',
      ruleId: 'RNF_MISSING_RATIONALE',
    })
  }

  return issues
}
