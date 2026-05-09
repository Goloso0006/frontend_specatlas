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
    condition: 'Define and document: process objectives, responsibility, input/output, success criteria',
  },
  {
    id: 'iso-27001',
    code: 'ISO/IEC 27001',
    name: 'Gestión de Seguridad de la Información',
    description: 'Implementar controles sistemáticos para evaluar y mitigar riesgos de seguridad de la información.',
    category: 'security',
    level: 'essential',
    ruleType: 'SecurityManagement',
    condition: 'Conduct security risk assessment, define control objectives, audit compliance quarterly',
  },
  {
    id: 'iso-27002',
    code: 'ISO/IEC 27002',
    name: 'Código de Buenas Prácticas de Seguridad',
    description: 'Definir controles para protección de datos, control de accesos y gestión de incidentes.',
    category: 'security',
    level: 'recommended',
    ruleType: 'SecurityPractice',
    condition: 'Implement access control, encryption, audit trails, incident response procedures',
  },
  {
    id: 'iso-25010',
    code: 'ISO/IEC 25010',
    name: 'Modelo de Calidad del Producto de Software',
    description: 'Definir atributos de calidad del software: idoneidad funcional, fiabilidad, usabilidad, eficiencia.',
    category: 'quality',
    level: 'recommended',
    ruleType: 'QualityAttribute',
    condition: 'Define and measure: reliability, usability, performance, security, maintainability',
  },
  {
    id: 'iso-12207',
    code: 'ISO/IEC 12207',
    name: 'Procesos del Ciclo de Vida del Software',
    description: 'Estructurar el desarrollo con procesos definidos: planificación, diseño, implementación, pruebas y despliegue.',
    category: 'governance',
    level: 'essential',
    ruleType: 'LifecycleProcess',
    condition: 'Define phases with acceptance criteria, traceability matrix, change management',
  },
  {
    id: 'iso-29110',
    code: 'ISO/IEC 29110',
    name: 'Ingeniería de Software para Entidades Muy Pequeñas',
    description: 'Marco ágil para equipos pequeños: requisitos, diseño, implementación, pruebas y despliegue.',
    category: 'agile',
    level: 'recommended',
    ruleType: 'AgileSprint',
    condition: 'Conduct iterative sprints with backlog, reviews, retrospectives, and incremental delivery',
  },
  {
    id: 'iso-31000',
    code: 'ISO 31000',
    name: 'Marco de Gestión de Riesgos',
    description: 'Establecer procesos para identificar, evaluar, tratar y monitorear riesgos.',
    category: 'governance',
    level: 'recommended',
    ruleType: 'RiskManagement',
    condition: 'Identify risks, assess probability/impact, define mitigation strategies, track residual risk',
  },
  {
    id: 'iso-21502',
    code: 'ISO 21502',
    name: 'Gestión de Proyectos, Programas y Portafolios',
    description: 'Definir gobernanza de proyectos: alcance, cronograma, presupuesto, interesados y entregas.',
    category: 'governance',
    level: 'recommended',
    ruleType: 'ProjectGovernance',
    condition: 'Establish steering committee, baseline scope/schedule/budget, track KPIs and deviations',
  },
  {
    id: 'iso-20000-1',
    code: 'ISO/IEC 20000-1',
    name: 'Gestión de Servicios de TI',
    description: 'Gestionar servicios TI: incidentes, cambios, disponibilidad, capacidad y continuidad.',
    category: 'governance',
    level: 'optional',
    ruleType: 'ServiceManagement',
    condition: 'Define SLAs, incident response times, change approval board, disaster recovery plan',
  },
  {
    id: 'iso-56002',
    code: 'ISO 56002',
    name: 'Sistema de Gestión de la Innovación',
    description: 'Fomentar la innovación organizacional: cultura, procesos y gestión del portafolio de iniciativas.',
    category: 'quality',
    level: 'optional',
    ruleType: 'InnovationManagement',
    condition: 'Establish innovation strategy, allocate resources, run ideation sessions, track new initiatives',
  },
  {
    id: 'iso-14001',
    code: 'ISO 14001',
    name: 'Sistema de Gestión Ambiental',
    description: 'Gestionar aspectos ambientales del desarrollo: eficiencia de recursos y reducción de residuos.',
    category: 'quality',
    level: 'optional',
    ruleType: 'EnvironmentalManagement',
    condition: 'Assess environmental impact, optimize resource consumption, report carbon footprint',
  },
  {
    id: 'iso-45001',
    code: 'ISO 45001',
    name: 'Gestión de Seguridad y Salud Ocupacional',
    description: 'Garantizar seguridad y bienestar del equipo, cumpliendo regulaciones laborales.',
    category: 'governance',
    level: 'recommended',
    ruleType: 'SafetyManagement',
    condition: 'Conduct safety assessments, provide training, monitor workplace ergonomics, incident tracking',
  },
  {
    id: 'iso-9241-210',
    code: 'ISO/IEC 9241-210',
    name: 'Diseño Centrado en el Usuario',
    description: 'Diseñar interfaces e interacciones centradas en las necesidades del usuario, usabilidad y accesibilidad.',
    category: 'quality',
    level: 'recommended',
    ruleType: 'UserCenteredDesign',
    condition: 'Conduct user research, prototyping, usability testing, accessibility compliance (WCAG)',
  },
  {
    id: 'iso-30401',
    code: 'ISO 30401',
    name: 'Sistema de Gestión del Conocimiento',
    description: 'Capturar, organizar y compartir conocimiento organizacional y lecciones aprendidas.',
    category: 'governance',
    level: 'optional',
    ruleType: 'KnowledgeManagement',
    condition: 'Maintain documentation wiki, record decision logs, share best practices, conduct knowledge transfer sessions',
  },
  {
    id: 'iso-38500',
    code: 'ISO/IEC 38500',
    name: 'Gobernanza de TI',
    description: 'Alinear la estrategia TI con objetivos del negocio: evaluación, dirección y seguimiento.',
    category: 'governance',
    level: 'recommended',
    ruleType: 'ItGovernance',
    condition: 'Define IT strategy, board oversight, technology roadmap, compliance audit, stakeholder alignment',
  },
  {
    id: 'best-code-review',
    code: 'Revisión de Código',
    name: 'Revisión de Código Obligatoria',
    description: 'Exigir revisión por pares en todos los cambios de código para mantener calidad y compartir conocimiento.',
    category: 'quality',
    level: 'essential',
    ruleType: 'CodeReview',
    condition: 'All pull requests require 2+ approvals, address feedback, auto-block merges without reviews',
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
      'iso-29110',  // Agile-friendly framework
      'iso-9001',   // Quality management
      'iso-27001',  // Security basics
      'best-code-review', // Code review
      'iso-9241-210', // UX focus
    ],
  },
  {
    id: 'preset-enterprise',
    name: 'Empresa / Desarrollo Gobernado',
    shortName: 'Empresa',
    description: 'Gobernanza, seguridad y cumplimiento integral para sistemas a gran escala.',
    emoji: '🏢',
    rules: [
      'iso-12207',  // Software lifecycle
      'iso-27001',  // Security management
      'iso-25010',  // Quality model
      'iso-31000',  // Risk management
      'iso-21502',  // Project management
      'iso-38500',  // IT governance
      'iso-45001',  // Safety management
    ],
  },
  {
    id: 'preset-regulated',
    name: 'Industria Regulada / Cumplimiento',
    shortName: 'Regulado',
    description: 'Cumplimiento estricto, auditabilidad y trazabilidad para industrias reguladas.',
    emoji: '⚖️',
    rules: [
      'iso-27001',  // Security compliance
      'iso-27002',  // Security controls
      'iso-20000-1', // Service management
      'iso-12207',  // Lifecycle documentation
      'iso-31000',  // Risk management
      'iso-30401',  // Knowledge/audit trails
      'iso-38500',  // IT governance
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
