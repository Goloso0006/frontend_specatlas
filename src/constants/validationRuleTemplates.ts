/**
 * ISO Standards & Best Practices Catalog
 * 
 * Predefined templates for software project quality standards and best practices.
 * Users can select these templates during project onboarding, which are then
 * converted into ValidationRuleRequest objects for persistence.
 */

export interface IsoRuleTemplate {
  id: string
  code: string
  name: string
  description: string
  category: 'quality' | 'security' | 'governance' | 'agile' | 'architecture'
  level: 'essential' | 'recommended' | 'optional'
  ruleType: string
  condition: string
}

export interface IsoPreset {
  id: string
  name: string
  shortName: string
  description: string
  emoji: string
  rules: string[] // Array of rule IDs
}

/**
 * Comprehensive ISO/Best Practices Rule Catalog
 * At least 15 rules to cover quality, security, governance, and architecture domains
 */
export const ISO_RULE_CATALOG: IsoRuleTemplate[] = [
  {
    id: 'iso-9001',
    code: 'ISO 9001',
    name: 'Sistema de Gestión de la Calidad',
    description: 'Establecer procesos para asegurar calidad consistente del producto/servicio y mejora continua.',
    category: 'quality',
    level: 'essential',
    ruleType: 'ProcessManagement',
    condition: 'Definir y documentar: objetivos del proceso, responsabilidades, entradas/salidas y criterios de éxito',
  },
  {
    id: 'iso-27001',
    code: 'ISO/IEC 27001',
    name: 'Gestión de Seguridad de la Información',
    description: 'Implementar controles sistemáticos para evaluar y mitigar riesgos de seguridad de la información.',
    category: 'security',
    level: 'essential',
    ruleType: 'SecurityManagement',
    condition: 'Realizar evaluación de riesgos de seguridad, definir objetivos de control y auditar el cumplimiento cada trimestre',
  },
  {
    id: 'iso-27002',
    code: 'ISO/IEC 27002',
    name: 'Código de Buenas Prácticas de Seguridad',
    description: 'Definir controles para protección de datos, control de accesos y gestión de incidentes.',
    category: 'security',
    level: 'recommended',
    ruleType: 'SecurityPractice',
    condition: 'Implementar control de accesos, cifrado, trazabilidad de auditoría y procedimientos de respuesta a incidentes',
  },
  {
    id: 'iso-25010',
    code: 'ISO/IEC 25010',
    name: 'Modelo de Calidad del Producto de Software',
    description: 'Definir atributos de calidad del software: idoneidad funcional, fiabilidad, usabilidad, eficiencia.',
    category: 'quality',
    level: 'recommended',
    ruleType: 'QualityAttribute',
    condition: 'Definir y medir: fiabilidad, usabilidad, rendimiento, seguridad y mantenibilidad',
  },
  {
    id: 'iso-12207',
    code: 'ISO/IEC 12207',
    name: 'Procesos del Ciclo de Vida del Software',
    description: 'Estructurar el desarrollo con procesos definidos: planificación, diseño, implementación, pruebas y despliegue.',
    category: 'governance',
    level: 'essential',
    ruleType: 'LifecycleProcess',
    condition: 'Definir fases con criterios de aceptación, matriz de trazabilidad y gestión de cambios',
  },
  {
    id: 'iso-29110',
    code: 'ISO/IEC 29110',
    name: 'Ingeniería de Software para Entidades Muy Pequeñas',
    description: 'Marco ágil para equipos pequeños: requisitos, diseño, implementación, pruebas y despliegue.',
    category: 'agile',
    level: 'recommended',
    ruleType: 'AgileSprint',
    condition: 'Realizar sprints iterativos con backlog, revisiones, retrospectivas y entregas incrementales',
  },
  {
    id: 'iso-31000',
    code: 'ISO 31000',
    name: 'Marco de Gestión de Riesgos',
    description: 'Establecer procesos para identificar, evaluar, tratar y monitorear riesgos.',
    category: 'governance',
    level: 'recommended',
    ruleType: 'RiskManagement',
    condition: 'Identificar riesgos, evaluar probabilidad e impacto, definir estrategias de mitigación y hacer seguimiento del riesgo residual',
  },
  {
    id: 'iso-21502',
    code: 'ISO 21502',
    name: 'Gestión de Proyectos, Programas y Portafolios',
    description: 'Definir gestión y control de proyectos: alcance, cronograma, presupuesto, interesados y entregas.',
    category: 'governance',
    level: 'recommended',
    ruleType: 'ProjectGovernance',
    condition: 'Establecer comité directivo, definir línea base de alcance/cronograma/presupuesto y hacer seguimiento de KPI y desviaciones',
  },
  {
    id: 'iso-20000-1',
    code: 'ISO/IEC 20000-1',
    name: 'Gestión de Servicios de TI',
    description: 'Gestionar servicios TI: incidentes, cambios, disponibilidad, capacidad y continuidad.',
    category: 'governance',
    level: 'optional',
    ruleType: 'ServiceManagement',
    condition: 'Definir ANS, tiempos de respuesta a incidentes, comité de aprobación de cambios y plan de recuperación ante desastres',
  },
  {
    id: 'iso-56002',
    code: 'ISO 56002',
    name: 'Sistema de Gestión de la Innovación',
    description: 'Fomentar la innovación organizacional: cultura, procesos y gestión del portafolio de iniciativas.',
    category: 'quality',
    level: 'optional',
    ruleType: 'InnovationManagement',
    condition: 'Establecer estrategia de innovación, asignar recursos, realizar sesiones de ideación y hacer seguimiento a nuevas iniciativas',
  },
  {
    id: 'iso-14001',
    code: 'ISO 14001',
    name: 'Sistema de Gestión Ambiental',
    description: 'Gestionar aspectos ambientales del desarrollo: eficiencia de recursos y reducción de residuos.',
    category: 'quality',
    level: 'optional',
    ruleType: 'EnvironmentalManagement',
    condition: 'Evaluar impacto ambiental, optimizar el consumo de recursos e informar la huella de carbono',
  },
  {
    id: 'iso-45001',
    code: 'ISO 45001',
    name: 'Gestión de Seguridad y Salud Ocupacional',
    description: 'Garantizar seguridad y bienestar del equipo, cumpliendo regulaciones laborales.',
    category: 'governance',
    level: 'recommended',
    ruleType: 'SafetyManagement',
    condition: 'Realizar evaluaciones de seguridad, brindar capacitación, monitorear ergonomía laboral y registrar incidentes',
  },
  {
    id: 'iso-9241-210',
    code: 'ISO/IEC 9241-210',
    name: 'Diseño Centrado en el Usuario',
    description: 'Diseñar interfaces e interacciones centradas en las necesidades del usuario, usabilidad y accesibilidad.',
    category: 'quality',
    level: 'recommended',
    ruleType: 'UserCenteredDesign',
    condition: 'Realizar investigación con usuarios, prototipado, pruebas de usabilidad y cumplimiento de accesibilidad (WCAG)',
  },
  {
    id: 'iso-30401',
    code: 'ISO 30401',
    name: 'Sistema de Gestión del Conocimiento',
    description: 'Capturar, organizar y compartir conocimiento organizacional y lecciones aprendidas.',
    category: 'governance',
    level: 'optional',
    ruleType: 'KnowledgeManagement',
    condition: 'Mantener una wiki de documentación, registrar decisiones, compartir buenas prácticas y realizar sesiones de transferencia de conocimiento',
  },
  {
    id: 'iso-38500',
    code: 'ISO/IEC 38500',
    name: 'Gestión y control de TI',
    description: 'Alinear la estrategia TI con objetivos del negocio: evaluación, dirección y seguimiento.',
    category: 'governance',
    level: 'recommended',
    ruleType: 'ItGovernance',
    condition: 'Definir estrategia de TI, supervisión directiva, hoja de ruta tecnológica, auditoría de cumplimiento y alineación de interesados',
  },
  {
    id: 'best-code-review',
    code: 'Revisión de Código',
    name: 'Revisión de Código Obligatoria',
    description: 'Exigir revisión por pares en todos los cambios de código para mantener calidad y compartir conocimiento.',
    category: 'quality',
    level: 'essential',
    ruleType: 'CodeReview',
    condition: 'Todas las solicitudes de cambio requieren al menos 2 aprobaciones, atender observaciones y bloquear fusiones sin revisión',
  },
]

/**
 * Preset templates: Fixed combinations of rules for common project profiles
 */
export const ISO_PRESETS: IsoPreset[] = [
  {
    id: 'preset-startup',
    name: 'Startup / Desarrollo Ágil',
    shortName: 'Ágil',
    description: 'Desarrollo flexible y rápido con controles esenciales de calidad y seguridad.',
    emoji: '🚀',
    rules: [
      'iso-29110',
      'iso-9001',
      'iso-27001',
      'best-code-review',
      'iso-9241-210',
    ],
  },
  {
    id: 'preset-enterprise',
    name: 'Empresa / Desarrollo Gobernado',
    shortName: 'Empresa',
    description: 'Gestión y control, seguridad y cumplimiento integral para sistemas a gran escala.',
    emoji: '🏢',
    rules: [
      'iso-12207',
      'iso-27001',
      'iso-25010',
      'iso-31000',
      'iso-21502',
      'iso-38500',
      'iso-45001',
    ],
  },
  {
    id: 'preset-regulated',
    name: 'Industria Regulada / Cumplimiento',
    shortName: 'Regulado',
    description: 'Cumplimiento estricto, auditabilidad y trazabilidad para industrias reguladas.',
    emoji: '⚖️',
    rules: [
      'iso-27001',
      'iso-27002',
      'iso-20000-1',
      'iso-12207',
      'iso-31000',
      'iso-30401',
      'iso-38500',
    ],
  },
]

/**
 * Get a preset by ID and expand its rules
 */
export function getPresetWithRules(presetId: string): {
  preset: IsoPreset
  rules: IsoRuleTemplate[]
} | null {
  const preset = ISO_PRESETS.find((p) => p.id === presetId)
  if (!preset) return null

  const rules = preset.rules
    .map((ruleId) => ISO_RULE_CATALOG.find((r) => r.id === ruleId))
    .filter((r): r is IsoRuleTemplate => r !== undefined)

  return { preset, rules }
}

/**
 * Search rules by code, name, or description
 */
export function searchIsoRules(query: string): IsoRuleTemplate[] {
  if (!query.trim()) return ISO_RULE_CATALOG

  const lowerQuery = query.toLowerCase()
  return ISO_RULE_CATALOG.filter(
    (rule) =>
      rule.code.toLowerCase().includes(lowerQuery) ||
      rule.name.toLowerCase().includes(lowerQuery) ||
      rule.description.toLowerCase().includes(lowerQuery) ||
      rule.category.toLowerCase().includes(lowerQuery)
  )
}

/**
 * Filter rules by category
 */
export function filterRulesByCategory(
  category: IsoRuleTemplate['category']
): IsoRuleTemplate[] {
  return ISO_RULE_CATALOG.filter((r) => r.category === category)
}
