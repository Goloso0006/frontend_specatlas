/**
 * requirementQualityAnalyzer.ts
 *
 * Local, pure, synchronous quality checker for requirement text.
 * No backend calls. No AI calls. No side effects.
 *
 * Rules are organized into modular rule sets for future extensibility:
 *  - ambiguityRules      → ambiguous / vague single terms
 *  - vaguePhraseRules    → multi-word phrases that are unverifiable
 *  - measurementRules    → RNF missing measurable metric
 *  - qualityAdverbRules  → RF that embed a quality condition
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type IssueField =
  | 'title'
  | 'description'
  | 'acceptanceCriteria'
  | 'category'
  | 'metricName'
  | 'operator'
  | 'targetValue'
  | 'unit'
  | 'context'
  | 'verificationMethod'
  | 'rationale'
  | 'nonFunctionalDetail'
  | 'procedural'
export type IssueSeverity = 'info' | 'warning' | 'error'

export interface RequirementQualityIssue {
  /** Stable ID for React keys */
  id: string
  severity: IssueSeverity
  field: IssueField
  /** The matched term/phrase (if applicable) */
  term?: string
  message: string
  suggestion?: string
  /** Character offset in the field text (optional, for future highlighting) */
  startIndex?: number
  endIndex?: number
  ruleId?: string
}

export interface AnalyzeRequirementInput {
  title?: string
  description?: string
  acceptanceCriteria?: string[]
  requirementType?: 'FUNCTIONAL' | 'NON_FUNCTIONAL'
}

// ── Rule data ─────────────────────────────────────────────────────────────────

/**
 * Ambiguous single terms with contextual suggestions.
 * Each entry can provide a specific suggestion; if absent, generic is used.
 */
interface AmbiguityEntry {
  terms: string[]
  message: (term: string) => string
  suggestion: string
}

const ambiguityRules: AmbiguityEntry[] = [
  {
    terms: ['rápido', 'rápida', 'rápidamente', 'fast'],
    message: term => `El término '${term}' es ambiguo. Define un tiempo máximo medible.`,
    suggestion:
      'Ejemplo: responder en menos de 2 segundos para el 95% de las consultas bajo carga normal.',
  },
  {
    terms: ['seguro', 'segura', 'seguridad', 'secure'],
    message: term => `El término '${term}' es ambiguo. Especifica qué aspecto de seguridad se requiere.`,
    suggestion:
      'Define si se refiere a autenticación, autorización, cifrado, confidencialidad, integridad o auditoría.',
  },
  {
    terms: ['eficiente', 'eficientemente', 'efficient'],
    message: term => `El término '${term}' es ambiguo. Especifica qué métrica define la eficiencia.`,
    suggestion:
      'Ejemplo: uso de CPU < 70% o tiempo de respuesta < 500 ms en condiciones normales.',
  },
  {
    terms: ['fácil', 'fácilmente', 'easy'],
    message: term => `El término '${term}' es subjetivo. Especifica una métrica de usabilidad.`,
    suggestion:
      'Ejemplo: el usuario debe completar la tarea en menos de 3 intentos sin ayuda.',
  },
  {
    terms: ['intuitivo', 'intuitiva', 'intuitive'],
    message: term => `El término '${term}' es subjetivo. Define una métrica de experiencia de usuario.`,
    suggestion:
      'Ejemplo: el 90% de los nuevos usuarios debe completar el flujo sin consultar la documentación.',
  },
  {
    terms: ['robusto', 'robusta', 'robust'],
    message: term => `El término '${term}' es vago. Especifica las condiciones de fallo y recuperación.`,
    suggestion:
      'Ejemplo: el sistema debe recuperarse de un fallo en menos de 30 segundos sin pérdida de datos.',
  },
  {
    terms: ['óptimo', 'óptima', 'optimal'],
    message: term => `El término '${term}' es relativo. Define el criterio de optimización.`,
    suggestion:
      'Especifica la métrica, el rango aceptable y las condiciones en las que aplica.',
  },
  {
    terms: ['adecuado', 'adecuada', 'adequate'],
    message: term => `El término '${term}' es vago. Especifica qué nivel es aceptable.`,
    suggestion:
      'Reemplaza "adecuado" con un valor concreto: tiempo, porcentaje, frecuencia, etc.',
  },
  {
    terms: ['confiable', 'reliable'],
    message: term => `El término '${term}' es ambiguo. Define una métrica de confiabilidad.`,
    suggestion:
      'Ejemplo: disponibilidad ≥ 99.9% mensual (uptime de 43.8 min de caída máxima al mes).',
  },
  {
    terms: ['escalable', 'scalable'],
    message: term => `El término '${term}' es vago. Define el rango de escalabilidad requerido.`,
    suggestion:
      'Ejemplo: el sistema debe soportar de 100 a 10,000 usuarios concurrentes sin degradación.',
  },
  {
    terms: ['moderno', 'moderna', 'modern'],
    message: term => `El término '${term}' es subjetivo. Especifica el estándar tecnológico requerido.`,
    suggestion:
      'Enumera las tecnologías, protocolos o versiones concretos que definen "moderno" para este proyecto.',
  },
  {
    terms: ['simple', 'simple'],
    message: term => `El término '${term}' es relativo. Define la complejidad máxima aceptable.`,
    suggestion:
      'Ejemplo: el proceso no debe requerir más de 3 pasos para ser completado por un usuario nuevo.',
  },
  {
    terms: ['amigable', 'friendly'],
    message: term => `El término '${term}' es subjetivo. Defínelo con una métrica de usabilidad.`,
    suggestion:
      'Ejemplo: satisfacción del usuario ≥ 4/5 en pruebas de usabilidad con usuarios objetivo.',
  },
  {
    terms: ['disponible', 'available'],
    message: term => `El término '${term}' es ambiguo sin una métrica de disponibilidad.`,
    suggestion:
      'Ejemplo: disponibilidad del sistema ≥ 99.5% medida mensualmente, excluyendo mantenimiento programado.',
  },
  {
    terms: ['oportuno', 'oportunamente'],
    message: term => `El término '${term}' no define un tiempo concreto.`,
    suggestion:
      'Reemplaza por un tiempo máximo específico: "en menos de X minutos" o "en el mismo día hábil".',
  },
  {
    terms: ['flexible', 'flexible'],
    message: term => `El término '${term}' es vago. Especifica qué tipo de variabilidad se requiere.`,
    suggestion:
      'Define las dimensiones de flexibilidad: parámetros configurables, extensiones soportadas, etc.',
  },
  {
    terms: ['usable', 'usable'],
    message: term => `El término '${term}' es genérico. Define el estándar de usabilidad.`,
    suggestion:
      'Ejemplo: cumplir con WCAG 2.1 nivel AA o lograr un SUS score ≥ 75.',
  },
  {
    terms: ['correctamente', 'properly'],
    message: term => `El término '${term}' es ambiguo. Define qué comportamiento es correcto.`,
    suggestion:
      'Especifica los criterios de aceptación concretos que definen el comportamiento esperado.',
  },
  {
    terms: ['suficiente', 'enough'],
    message: term => `El término '${term}' es relativo. Define el umbral mínimo aceptable.`,
    suggestion:
      'Reemplaza por un valor concreto: porcentaje, cantidad, tiempo, etc.',
  },
  {
    terms: ['buen', 'buena', 'better', 'mejor'],
    message: term => `El término '${term}' es comparativo y subjetivo.`,
    suggestion:
      'Define la línea base y el valor mejorado concreto que se requiere.',
  },
  {
    terms: ['optimizado', 'optimizada', 'optimized'],
    message: term => `El término '${term}' es vago. Define el estado optimizado con métricas concretas.`,
    suggestion:
      'Especifica qué se optimiza, cómo se mide y cuál es el valor objetivo.',
  },
]

// ── Vague phrase rules ────────────────────────────────────────────────────────

interface VaguePhraseRule {
  phrase: string
  message: string
  suggestion: string
}

const vaguePhraseRules: VaguePhraseRule[] = [
  {
    phrase: 'de forma adecuada',
    message: "La frase 'de forma adecuada' no es suficientemente verificable.",
    suggestion: 'Define el criterio concreto de corrección o calidad requerido.',
  },
  {
    phrase: 'de manera adecuada',
    message: "La frase 'de manera adecuada' no es suficientemente verificable.",
    suggestion: 'Define el criterio concreto de corrección o calidad requerido.',
  },
  {
    phrase: 'cuando sea necesario',
    message: "La frase 'cuando sea necesario' no tiene una condición verificable.",
    suggestion: 'Especifica la condición exacta que activa el comportamiento.',
  },
  {
    phrase: 'según corresponda',
    message: "La frase 'según corresponda' es ambigua.",
    suggestion: 'Define los casos concretos y el comportamiento esperado para cada uno.',
  },
  {
    phrase: 'lo más pronto posible',
    message: "La frase 'lo más pronto posible' no define un tiempo máximo.",
    suggestion: 'Reemplaza por un tiempo máximo concreto: "en menos de X horas/días".',
  },
  {
    phrase: 'lo antes posible',
    message: "La frase 'lo antes posible' no define un tiempo máximo.",
    suggestion: 'Reemplaza por un tiempo máximo concreto: "en menos de X horas/días".',
  },
  {
    phrase: 'alta disponibilidad',
    message: "La frase 'alta disponibilidad' necesita un porcentaje o SLA concreto.",
    suggestion: 'Ejemplo: disponibilidad ≥ 99.9% mensual (Three Nines).',
  },
  {
    phrase: 'buen rendimiento',
    message: "La frase 'buen rendimiento' no define una métrica verificable.",
    suggestion: 'Ejemplo: tiempo de respuesta < 500 ms para el percentil 95 bajo carga normal.',
  },
  {
    phrase: 'en tiempo real',
    message: "La frase 'en tiempo real' es ambigua sin una latencia máxima definida.",
    suggestion: 'Define la latencia máxima aceptable: "con latencia < 100 ms" o "con actualización en menos de 1 segundo".',
  },
  {
    phrase: 'de forma eficiente',
    message: "La frase 'de forma eficiente' no especifica qué se optimiza.",
    suggestion: 'Define la métrica de eficiencia: CPU, memoria, tiempo, ancho de banda, etc.',
  },
  {
    phrase: 'de manera eficiente',
    message: "La frase 'de manera eficiente' no especifica qué se optimiza.",
    suggestion: 'Define la métrica de eficiencia: CPU, memoria, tiempo, ancho de banda, etc.',
  },
  {
    phrase: 'de forma segura',
    message: "La frase 'de forma segura' no especifica qué aspecto de seguridad aplica.",
    suggestion: 'Define el control de seguridad concreto: autenticación, autorización, cifrado, etc.',
  },
  {
    phrase: 'de manera segura',
    message: "La frase 'de manera segura' no especifica qué aspecto de seguridad aplica.",
    suggestion: 'Define el control de seguridad concreto: autenticación, autorización, cifrado, etc.',
  },
  {
    phrase: 'de forma rápida',
    message: "La frase 'de forma rápida' no define un tiempo máximo.",
    suggestion: 'Reemplaza por un tiempo específico: "en menos de X segundos".',
  },
  {
    phrase: 'de manera rápida',
    message: "La frase 'de manera rápida' no define un tiempo máximo.",
    suggestion: 'Reemplaza por un tiempo específico: "en menos de X segundos".',
  },
]

// ── Mixed RF/RNF Rules ────────────────────────────────────────────────────────

const FUNCTIONAL_ACTIONS = [
  'permitir', 'registrar', 'crear', 'consultar', 'mostrar', 'actualizar',
  'eliminar', 'enviar', 'generar', 'procesar', 'gestionar', 'autenticar',
  'iniciar sesión', 'cerrar sesión', 'seleccionar', 'reservar', 'pagar',
  'calificar', 'buscar', 'filtrar', 'visualizar', 'descargar', 'cargar',
  'subir', 'asignar', 'completar',
  'allow', 'create', 'update', 'delete', 'show', 'search', 'send',
  'generate', 'process', 'manage', 'authenticate', 'login', 'reserve', 'pay'
]

const QUALITY_INDICATORS = [
  'rápidamente', 'rápido', 'rápida', 'eficiente', 'eficientemente', 'fácil',
  'fácilmente', 'seguro', 'segura', 'de forma segura', 'de manera segura',
  'disponible', 'confiable', 'escalable', 'robusto', 'intuitivo',
  'óptimo', 'buen rendimiento', 'alta disponibilidad', 'en tiempo real',
  'fast', 'quickly', 'secure', 'efficiently', 'available', 'reliable',
  'scalable', 'robust', 'intuitive'
]

function getNonFunctionalSuggestion(qualityTerm: string): string {
  const q = qualityTerm.toLowerCase()
  if (q.includes('rápid') || q.includes('tiempo real') || q.includes('fast') || q.includes('quick') || q.includes('rendimiento')) {
    return 'El proceso debe completarse dentro de un tiempo máximo medible bajo condiciones normales de operación.'
  }
  if (q.includes('segur') || q.includes('secure')) {
    return 'El proceso debe proteger la información sensible mediante controles de seguridad verificables.'
  }
  if (q.includes('disponib') || q.includes('availab')) {
    return 'El sistema debe cumplir con un acuerdo de nivel de servicio (SLA) de disponibilidad medible.'
  }
  if (q.includes('eficient') || q.includes('óptim') || q.includes('efficient')) {
    return 'El sistema debe optimizar el uso de recursos y cumplir con métricas de rendimiento bajo carga.'
  }
  if (q.includes('fácil') || q.includes('intuitiv') || q.includes('amigable')) {
    return 'La interfaz debe cumplir con criterios medibles de usabilidad y accesibilidad.'
  }
  if (q.includes('confiable') || q.includes('robust') || q.includes('reliab')) {
    return 'El sistema debe tener mecanismos de recuperación de fallos y un tiempo máximo de inactividad definido.'
  }
  if (q.includes('escalable') || q.includes('scalab')) {
    return 'El sistema debe soportar un volumen definido de usuarios concurrentes sin degradación del servicio.'
  }
  return 'La restricción de calidad debe definirse con una métrica concreta, un valor objetivo y un método de verificación.'
}

function buildMixedRequirementSuggestion(text: string, qualityTerm: string): { functionalSuggestion: string; nonFunctionalSuggestion: string } {
  // Remove the quality term from the text
  const escaped = qualityTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`\\s*(?:de forma|de manera|en)\\s+${escaped}\\b|\\s*${escaped}\\b`, 'ig')
  let funcSugg = text.replace(regex, '').trim()
  
  // Cleanup punctuation
  funcSugg = funcSugg.replace(/\s+,/g, ',').replace(/\s+\.$/, '')
  if (!funcSugg.endsWith('.')) funcSugg += '.'

  const nfSugg = getNonFunctionalSuggestion(qualityTerm)

  return {
    functionalSuggestion: funcSugg,
    nonFunctionalSuggestion: nfSugg,
  }
}

// ── Quality adverbs for functional requirements ───────────────────────────────

/**
 * Quality adverbs that suggest a non-functional concern embedded in an RF.
 * Only triggered when requirementType === 'FUNCTIONAL'.
 */
const qualityAdverbs = [
  'rápidamente',
  'eficientemente',
  'fácilmente',
  'de forma segura',
  'de manera segura',
  'de forma rápida',
  'de manera rápida',
  'de forma eficiente',
  'de manera eficiente',
  'correctamente',
  'oportunamente',
]

// ── Measurement hint patterns ─────────────────────────────────────────────────

/**
 * Patterns that suggest a measurable metric is present in the text.
 * Used to avoid false positives in the no-measurement rule for RNFs.
 */
const MEASUREMENT_PATTERNS = [
  /\d+(\.\d+)?/,           // any number: 2, 3.5, 99.9
  /<=|>=|<|>|=/,           // operators
  /\b(ms|segundos?|minutos?|horas?|días?|semanas?|meses?|años?)\b/i,
  /\b(percent|%|uptime|downtime|availability|disponibilidad)\b/i,
  /\b(requests?|peticiones?|transacciones?|usuarios?)\b/i,
]

const QUALITY_TERMS_FOR_RNF = [
  'rápido', 'rápida', 'seguro', 'segura', 'disponible', 'eficiente',
  'confiable', 'escalable', 'reliable', 'scalable', 'fast', 'secure', 'available',
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function containsMeasurement(text: string): boolean {
  return MEASUREMENT_PATTERNS.some(p => p.test(text))
}

/**
 * Finds first occurrence of a term in text (whole-word, case-insensitive).
 * Returns { index } or null.
 */
function findTerm(text: string, term: string): { startIndex: number; endIndex: number } | null {
  // Use word-boundary-aware search for terms without spaces
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const isPhrase = term.includes(' ')
  const pattern = isPhrase
    ? new RegExp(escaped, 'i')
    : new RegExp(`(?<![a-záéíóúüñA-ZÁÉÍÓÚÜÑ])${escaped}(?![a-záéíóúüñA-ZÁÉÍÓÚÜÑ])`, 'i')
  const match = pattern.exec(text)
  if (!match) return null
  return { startIndex: match.index, endIndex: match.index + match[0].length }
}

let issueCounter = 0
function nextId(): string {
  return `qi-${++issueCounter}-${Math.random().toString(36).slice(2, 6)}`
}

// ── Main analyzer ─────────────────────────────────────────────────────────────

/**
 * Analyzes a requirement's text fields and returns an array of quality issues.
 *
 * Rules applied:
 * 1. Ambiguous terms (all fields, all types)
 * 2. Vague phrases (all fields, all types)
 * 3. RNF without measurable metric (description, requirementType=NON_FUNCTIONAL)
 * 4. RF with embedded quality adverb (description, requirementType=FUNCTIONAL)
 *
 * Pure function — no side effects, no async, no external calls.
 */
export function analyzeRequirementText(
  input: AnalyzeRequirementInput,
): RequirementQualityIssue[] {
  const issues: RequirementQualityIssue[] = []
  const { title = '', description = '', acceptanceCriteria = [], requirementType } = input

  const fieldsToCheck: { field: IssueField; text: string }[] = [
    { field: 'title', text: title },
    { field: 'description', text: description },
    ...acceptanceCriteria.map(c => ({ field: 'acceptanceCriteria' as IssueField, text: c })),
  ]

  // ── Rule 1: Ambiguous terms ─────────────────────────────────────────────────
  for (const rule of ambiguityRules) {
    for (const { field, text } of fieldsToCheck) {
      if (!text) continue
      for (const term of rule.terms) {
        const pos = findTerm(text, term)
        if (pos) {
          issues.push({
            id: nextId(),
            severity: 'warning',
            field,
            term,
            message: rule.message(term),
            suggestion: rule.suggestion,
            startIndex: pos.startIndex,
            endIndex: pos.endIndex,
            ruleId: 'AMBIGUOUS_TERM',
          })
          break // one issue per rule per field (first matching term wins)
        }
      }
    }
  }

  // ── Rule 2: Vague phrases ───────────────────────────────────────────────────
  for (const rule of vaguePhraseRules) {
    for (const { field, text } of fieldsToCheck) {
      if (!text) continue
      const pos = findTerm(text, rule.phrase)
      if (pos) {
        issues.push({
          id: nextId(),
          severity: 'warning',
          field,
          term: rule.phrase,
          message: rule.message,
          suggestion: rule.suggestion,
          startIndex: pos.startIndex,
          endIndex: pos.endIndex,
          ruleId: 'VAGUE_PHRASE',
        })
      }
    }
  }

  // Keep track of fields that triggered MIXED_RF_RNF to avoid duplicate quality adverb warnings
  const mixedTriggeredFields = new Set<IssueField>()

  // ── Rule 4: Mixed RF/RNF ────────────────────────────────────────────────────
  for (const { field, text } of fieldsToCheck) {
    if (!text) continue
    
    let foundAction: string | null = null
    let foundQuality: string | null = null
    let posQuality: { startIndex: number; endIndex: number } | null = null

    for (const action of FUNCTIONAL_ACTIONS) {
      if (findTerm(text, action)) {
        foundAction = action
        break
      }
    }

    for (const qual of QUALITY_INDICATORS) {
      const pos = findTerm(text, qual)
      if (pos) {
        foundQuality = qual
        posQuality = pos
        break
      }
    }

    if (foundAction && foundQuality && posQuality) {
      mixedTriggeredFields.add(field)
      const suggestions = buildMixedRequirementSuggestion(text, foundQuality)
      
      issues.push({
        id: nextId(),
        severity: 'warning',
        field,
        term: foundQuality,
        message: 'Este requisito mezcla una acción del sistema con una condición de calidad.',
        suggestion: `RF sugerido: ${suggestions.functionalSuggestion} RNF sugerido: ${suggestions.nonFunctionalSuggestion}`,
        startIndex: posQuality.startIndex,
        endIndex: posQuality.endIndex,
        ruleId: 'MIXED_RF_RNF',
      })
    }
  }

  // ── Rule 5: RNF without measurable metric ───────────────────────────────────
  if (requirementType === 'NON_FUNCTIONAL' && description) {
    const hasQualityTerm = QUALITY_TERMS_FOR_RNF.some(t => findTerm(description, t) !== null)
    const hasMeasurement = containsMeasurement(description)
    if (hasQualityTerm && !hasMeasurement) {
      issues.push({
        id: nextId(),
        severity: 'warning',
        field: 'description',
        message:
          'Este requisito no funcional parece no tener una métrica verificable.',
        suggestion:
          'Agrega un operador (≤, ≥, =), un valor objetivo numérico, una unidad y el método de verificación.',
        ruleId: 'RNF_NO_METRIC',
      })
    }
  }

  // ── Rule 6: RF with embedded quality adverb ─────────────────────────────────
  if (requirementType === 'FUNCTIONAL' && description && !mixedTriggeredFields.has('description')) {
    for (const adverb of qualityAdverbs) {
      const pos = findTerm(description, adverb)
      if (pos) {
        issues.push({
          id: nextId(),
          severity: 'info',
          field: 'description',
          term: adverb,
          message:
            'Este requisito funcional contiene una condición de calidad. Considera separar esa parte como RNF.',
          suggestion:
            'Ejemplo: RF para la funcionalidad (qué hace el sistema) y RNF para el tiempo, seguridad o rendimiento.',
          startIndex: pos.startIndex,
          endIndex: pos.endIndex,
          ruleId: 'RF_QUALITY_ADVERB',
        })
        break // one such issue per description is enough
      }
    }
  }

  // De-duplicate by (ruleId + field + term) to avoid multiple identical issues
  const seen = new Set<string>()
  return issues.filter(issue => {
    const key = `${issue.ruleId}|${issue.field}|${issue.term ?? ''}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// ── Convenience helpers ────────────────────────────────────────────────────────

/** Returns true if the issue list has any warnings or errors (not just info). */
export function hasQualityWarnings(issues: RequirementQualityIssue[]): boolean {
  return issues.some(i => i.severity === 'warning' || i.severity === 'error')
}

/** Count issues by severity. */
export function countBySeverity(issues: RequirementQualityIssue[]): Record<IssueSeverity, number> {
  const counts: Record<IssueSeverity, number> = { info: 0, warning: 0, error: 0 }
  for (const i of issues) counts[i.severity]++
  return counts
}
