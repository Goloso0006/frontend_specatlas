import type { 
  DiagramNodeDTO, 
  DiagramRelationDTO, 
  DiagramValidationResult,
  DiagramValidationIssue,
  DiagramUseCaseNodeDTO
} from '../types/diagrams'

/**
 * Formal validator for Use Case diagrams in SpecAtlas.
 * Ensures structural and semantic consistency according to UML standards.
 */
export function validateUseCaseDiagram(
  nodes: DiagramNodeDTO[],
  edges: DiagramRelationDTO[]
): DiagramValidationResult {
  const issues: DiagramValidationIssue[] = []

  // --- 1. GLOBAL DIAGRAM VALIDATIONS ---
  if (nodes.length === 0) {
    issues.push({ id: crypto.randomUUID(), severity: 'warning', message: 'El diagrama no contiene actores ni casos de uso.', targetType: 'diagram' })
  } else {
    const actorCount = nodes.filter(n => n.kind === 'actor').length
    const ucCount = nodes.filter(n => n.kind === 'useCase').length

    if (actorCount === 0) issues.push({ id: crypto.randomUUID(), severity: 'warning', message: 'El diagrama no contiene actores.', targetType: 'diagram' })
    if (ucCount === 0) issues.push({ id: crypto.randomUUID(), severity: 'warning', message: 'El diagrama no contiene casos de uso.', targetType: 'diagram' })
    if (edges.length === 0 && nodes.length > 1) {
      issues.push({ id: crypto.randomUUID(), severity: 'warning', message: 'El diagrama no tiene relaciones entre actores y casos de uso.', targetType: 'diagram' })
    }
  }

  // --- 2. NODE VALIDATIONS (ACTORS & USE CASES) ---
  const namesSet = new Set<string>()
  const temporalActorNames = ['actor', 'actor2', 'actor3', 'nuevoactor', 'nuevo actor', 'actor1']
  const temporalUcNames = ['nuevo caso de uso', 'caso de uso', 'usecase', 'use case', 'uc1', 'uc2']

  nodes.forEach(node => {
    const name = node.name.trim()
    const isActor = node.kind === 'actor'
    const label = isActor ? 'actor' : 'caso de uso'

    // Errors
    if (!name) {
      issues.push({
        id: crypto.randomUUID(),
        severity: 'error',
        message: `Hay un ${label} sin nombre.`,
        targetId: node.id,
        targetType: 'node'
      })
    } else if (namesSet.has(name.toLowerCase())) {
      issues.push({
        id: crypto.randomUUID(),
        severity: 'error',
        message: `Ya existe otro ${label} con el nombre '${name}'.`,
        targetId: node.id,
        targetType: 'node'
      })
    }
    namesSet.add(name.toLowerCase())

    // Warnings
    if (name && (isActor ? temporalActorNames : temporalUcNames).includes(name.toLowerCase())) {
      issues.push({
        id: crypto.randomUUID(),
        severity: 'warning',
        message: `El ${label} '${name}' parece tener un nombre temporal.`,
        targetId: node.id,
        targetType: 'node'
      })
    }

    // Connections check
    const connections = edges.filter(e => e.source === node.id || e.target === node.id)
    if (connections.length === 0) {
      issues.push({
        id: crypto.randomUUID(),
        severity: 'warning',
        message: `El ${label} '${name || 'sin nombre'}' no está conectado a ningún elemento.`,
        targetId: node.id,
        targetType: 'node'
      })
    } else if (!isActor) {
      // Check if UC has at least one actor connection (direct or indirect)
      const hasActorConnection = edges.some(e => {
        if (e.source === node.id || e.target === node.id) {
          const otherId = e.source === node.id ? e.target : e.source
          const other = nodes.find(n => n.id === otherId)
          return other?.kind === 'actor'
        }
        return false
      })
      if (!hasActorConnection) {
        issues.push({
          id: crypto.randomUUID(),
          severity: 'warning',
          message: `El caso de uso '${name || 'sin nombre'}' no está asociado directamente a ningún actor.`,
          targetId: node.id,
          targetType: 'node'
        })
      }
    }

    // Description check for Use Cases
    if (!isActor) {
      const uc = node as DiagramUseCaseNodeDTO
      if (!uc.description?.trim()) {
        issues.push({
          id: crypto.randomUUID(),
          severity: 'warning',
          message: `El caso de uso '${name || 'sin nombre'}' no tiene descripción.`,
          targetId: node.id,
          targetType: 'node'
        })
      }
    }
  })

  // --- 3. RELATION VALIDATIONS ---
  edges.forEach(edge => {
    const sourceNode = nodes.find(n => n.id === edge.source)
    const targetNode = nodes.find(n => n.id === edge.target)

    // Structural Errors
    if (!edge.source) {
      issues.push({ id: crypto.randomUUID(), severity: 'error', message: 'Hay una relación sin origen.', targetId: edge.id, targetType: 'edge' })
      return
    }
    if (!edge.target) {
      issues.push({ id: crypto.randomUUID(), severity: 'error', message: 'Hay una relación sin destino.', targetId: edge.id, targetType: 'edge' })
      return
    }
    if (!sourceNode || !targetNode) {
      issues.push({ id: crypto.randomUUID(), severity: 'error', message: 'La relación apunta a un elemento que no existe.', targetId: edge.id, targetType: 'edge' })
      return
    }

    const relType = edge.data?.relationshipType
    const sKind = sourceNode.kind
    const tKind = targetNode.kind

    if (!relType) {
      issues.push({ id: crypto.randomUUID(), severity: 'error', message: 'Hay una relación con tipo de caso de uso no soportado o nulo.', targetId: edge.id, targetType: 'edge' })
      return
    }

    // Semantic Warnings
    if (relType === 'ASSOCIATION') {
      if (sKind === 'actor' && tKind === 'actor') {
        issues.push({ id: crypto.randomUUID(), severity: 'warning', message: 'Una asociación normalmente conecta un actor con un caso de uso. Considera usar Generalización para actores.', targetId: edge.id, targetType: 'edge' })
      } else if (sKind === 'useCase' && tKind === 'useCase') {
        issues.push({ id: crypto.randomUUID(), severity: 'warning', message: 'Una asociación entre casos de uso puede ser ambigua. Considera usar include o extend.', targetId: edge.id, targetType: 'edge' })
      }
    }

    if (relType === 'INCLUDE' || relType === 'EXTEND') {
      if (sKind === 'actor' || tKind === 'actor') {
        issues.push({ id: crypto.randomUUID(), severity: 'warning', message: `La relación ${relType.toLowerCase()} debe conectar casos de uso, no involucrar actores.`, targetId: edge.id, targetType: 'edge' })
      }
    }

    if (relType === 'GENERALIZATION') {
      if (sKind !== tKind) {
        issues.push({ id: crypto.randomUUID(), severity: 'warning', message: 'La generalización normalmente conecta elementos del mismo tipo (Actor-Actor o UC-UC).', targetId: edge.id, targetType: 'edge' })
      } else if (sKind === 'useCase') {
        issues.push({ id: crypto.randomUUID(), severity: 'warning', message: 'Revisa si la generalización entre casos de uso representa una especialización real.', targetId: edge.id, targetType: 'edge' })
      }
    }
  })

  return {
    valid: issues.filter(i => i.severity === 'error').length === 0,
    issues,
    errors: issues.filter(i => i.severity === 'error'),
    warnings: issues.filter(i => i.severity === 'warning')
  }
}
