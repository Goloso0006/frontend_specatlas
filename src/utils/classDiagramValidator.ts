import type { 
  DiagramNodeDTO,
  DiagramClassNodeDTO, 
  DiagramRelationDTO, 
  DiagramValidationResult, 
  DiagramValidationIssue 
} from '../types/diagrams'

export function validateClassDiagram(
  allNodes: DiagramNodeDTO[], 
  edges: DiagramRelationDTO[]
): DiagramValidationResult {
  const nodes = allNodes.filter(n => n.kind === 'class') as DiagramClassNodeDTO[]
  const issues: DiagramValidationIssue[] = []

  // 1. Diagram Level Validations
  if (nodes.length === 0) {
    issues.push({
      id: 'diagram-empty',
      severity: 'warning',
      message: 'El diagrama no contiene elementos.',
      targetType: 'diagram'
    })
  } else if (edges.length === 0) {
    issues.push({
      id: 'diagram-no-relations',
      severity: 'warning',
      message: 'El diagrama no tiene relaciones entre elementos.',
      targetType: 'diagram'
    })
  } else if (nodes.length > 8 && edges.length === 0) {
    issues.push({
      id: 'diagram-many-nodes-no-relations',
      severity: 'warning',
      message: 'El diagrama contiene varios elementos sin ninguna relación.',
      targetType: 'diagram'
    })
  }

  // 2. Node Validations
  const nodeNames = new Set<string>()
  const nodeIds = new Set(nodes.map(n => n.id))

  nodes.forEach(node => {
    // Missing name
    if (!node.name || node.name.trim() === '') {
      issues.push({
        id: `node-no-name-${node.id}`,
        severity: 'error',
        message: 'Hay un elemento UML sin nombre.',
        targetType: 'node',
        targetId: node.id
      })
    }

    // Duplicate names
    if (node.name && nodeNames.has(node.name.trim())) {
      issues.push({
        id: `node-duplicate-name-${node.id}`,
        severity: 'error',
        message: `Ya existe otro elemento con el nombre '${node.name}'.`,
        targetType: 'node',
        targetId: node.id
      })
    }
    if (node.name) nodeNames.add(node.name.trim())

    // Enum must have at least one value
    if (node.umlType === 'ENUM' && (!node.enumValues || node.enumValues.length === 0)) {
      issues.push({
        id: `node-enum-no-values-${node.id}`,
        severity: 'error',
        message: `La enumeración '${node.name}' debe tener al menos un valor.`,
        targetType: 'node',
        targetId: node.id
      })
    }

    // Generic names (Warning)
    if (/^NuevaClase\d*$/.test(node.name) || /^NuevaInterfaz\d*$/.test(node.name) || /^NuevaEnumeracion\d*$/.test(node.name)) {
      issues.push({
        id: `node-generic-name-${node.id}`,
        severity: 'warning',
        message: `La clase '${node.name}' parece tener un nombre temporal.`,
        targetType: 'node',
        targetId: node.id
      })
    }

    // Interface without methods (Warning)
    if (node.umlType === 'INTERFACE' && (!node.methods || node.methods.length === 0)) {
      issues.push({
        id: `node-interface-no-methods-${node.id}`,
        severity: 'warning',
        message: `La interfaz '${node.name}' no tiene métodos definidos.`,
        targetType: 'node',
        targetId: node.id
      })
    }

    // Abstract Class without content (Warning)
    if (node.umlType === 'ABSTRACT_CLASS' && node.attributes.length === 0 && node.methods.length === 0) {
      issues.push({
        id: `node-abstract-empty-${node.id}`,
        severity: 'warning',
        message: `La clase abstracta '${node.name}' no define atributos ni métodos.`,
        targetType: 'node',
        targetId: node.id
      })
    }

    // Generic Enum Values (Warning)
    if (node.umlType === 'ENUM' && node.enumValues?.some(v => /^VALOR_\d+$/.test(v.name))) {
      issues.push({
        id: `node-enum-generic-values-${node.id}`,
        severity: 'warning',
        message: `La enumeración '${node.name}' contiene valores temporales.`,
        targetType: 'node',
        targetId: node.id
      })
    }

    // Attribute/Method Validations (Warning)
    const attrNames = new Set<string>()
    node.attributes.forEach(attr => {
      if (!attr.name.trim()) {
        issues.push({
          id: `attr-no-name-${node.id}-${attr.id}`,
          severity: 'warning',
          message: `Un atributo de '${node.name}' no tiene nombre.`,
          targetType: 'node',
          targetId: node.id
        })
      }
      if (!attr.type.trim()) {
        issues.push({
          id: `attr-no-type-${node.id}-${attr.id}`,
          severity: 'warning',
          message: `El atributo '${attr.name}' de '${node.name}' no tiene tipo definido.`,
          targetType: 'node',
          targetId: node.id
        })
      }
      if (attr.name.trim() && attrNames.has(attr.name.trim())) {
        issues.push({
          id: `attr-duplicate-${node.id}-${attr.id}`,
          severity: 'warning',
          message: `La clase '${node.name}' tiene atributos duplicados con el nombre '${attr.name}'.`,
          targetType: 'node',
          targetId: node.id
        })
      }
      if (attr.name.trim()) attrNames.add(attr.name.trim())
    })

    const methodNames = new Set<string>()
    node.methods.forEach(method => {
      if (!method.name.trim()) {
        issues.push({
          id: `method-no-name-${node.id}-${method.id}`,
          severity: 'warning',
          message: `Un método de '${node.name}' no tiene nombre.`,
          targetType: 'node',
          targetId: node.id
        })
      }
      if (!method.returnType.trim()) {
        issues.push({
          id: `method-no-ret-${node.id}-${method.id}`,
          severity: 'warning',
          message: `El método '${method.name}' de '${node.name}' no tiene tipo de retorno definido.`,
          targetType: 'node',
          targetId: node.id
        })
      }
      if (method.name.trim() && methodNames.has(method.name.trim())) {
        issues.push({
          id: `method-duplicate-${node.id}-${method.id}`,
          severity: 'warning',
          message: `El elemento '${node.name}' tiene métodos duplicados con el nombre '${method.name}'.`,
          targetType: 'node',
          targetId: node.id
        })
      }
      if (method.name.trim()) methodNames.add(method.name.trim())
    })
  })

  // 3. Relationship Validations
  edges.forEach(edge => {
    if (!edge.source) {
      issues.push({
        id: `edge-no-source-${edge.id}`,
        severity: 'error',
        message: 'Hay una relación sin origen.',
        targetType: 'edge',
        targetId: edge.id
      })
    }
    if (!edge.target) {
      issues.push({
        id: `edge-no-target-${edge.id}`,
        severity: 'error',
        message: 'Hay una relación sin destino.',
        targetType: 'edge',
        targetId: edge.id
      })
    }
    if (edge.source && !nodeIds.has(edge.source)) {
      issues.push({
        id: `edge-source-invalid-${edge.id}`,
        severity: 'error',
        message: 'La relación apunta a un origen que no existe.',
        targetType: 'edge',
        targetId: edge.id
      })
    }
    if (edge.target && !nodeIds.has(edge.target)) {
      issues.push({
        id: `edge-target-invalid-${edge.id}`,
        severity: 'error',
        message: 'La relación apunta a un destino que no existe.',
        targetType: 'edge',
        targetId: edge.id
      })
    }

    const relType = edge.data?.relationshipType || 'ASSOCIATION'
    const sourceNode = nodes.find(n => n.id === edge.source)
    const targetNode = nodes.find(n => n.id === edge.target)

    if (relType === 'IMPLEMENTATION' && targetNode && targetNode.umlType !== 'INTERFACE') {
      issues.push({
        id: `rel-impl-no-intf-${edge.id}`,
        severity: 'warning',
        message: 'Una implementación normalmente debe apuntar hacia una interfaz.',
        targetType: 'edge',
        targetId: edge.id
      })
    }

    if (relType === 'INHERITANCE' && (sourceNode?.umlType === 'ENUM' || targetNode?.umlType === 'ENUM')) {
      issues.push({
        id: `rel-inh-enum-${edge.id}`,
        severity: 'warning',
        message: 'La herencia no suele aplicarse a enumeraciones.',
        targetType: 'edge',
        targetId: edge.id
      })
    }

    if ((relType === 'AGGREGATION' || relType === 'COMPOSITION') && targetNode?.umlType === 'INTERFACE') {
      issues.push({
        id: `rel-agg-comp-intf-${edge.id}`,
        severity: 'warning',
        message: 'La agregación o composición normalmente se aplica entre clases concretas.',
        targetType: 'edge',
        targetId: edge.id
      })
    }

    const isStructural = relType === 'ASSOCIATION' || relType === 'AGGREGATION' || relType === 'COMPOSITION'
    if (isStructural && (!edge.data?.label || edge.data.label.trim() === '')) {
      issues.push({
        id: `rel-no-label-${edge.id}`,
        severity: 'warning',
        message: `La relación entre '${sourceNode?.name}' y '${targetNode?.name}' no tiene etiqueta descriptiva.`,
        targetType: 'edge',
        targetId: edge.id
      })
    }

    if (isStructural && (!edge.data?.sourceMultiplicity || !edge.data?.targetMultiplicity)) {
      issues.push({
        id: `rel-no-mult-${edge.id}`,
        severity: 'warning',
        message: `La relación entre '${sourceNode?.name}' y '${targetNode?.name}' no tiene multiplicidades completas.`,
        targetType: 'edge',
        targetId: edge.id
      })
    }
  })

  return {
    valid: !issues.some(i => i.severity === 'error'),
    issues,
    errors: issues.filter(i => i.severity === 'error'),
    warnings: issues.filter(i => i.severity === 'warning'),
  }
}
