import type { Edge, Node } from '@xyflow/react'
import type {
  DiagramClassAttributeDTO,
  DiagramClassMethodDTO,
  DiagramClassNodeDTO,
  DiagramNodeDTO,
  DiagramPositionDTO,
  DiagramRelationDTO,
  DiagramSourceDTO,
  DiagramType,
  DiagramUmlType,
  DiagramEnumValueDTO,
  DiagramRelationshipType,
  DiagramUseCaseRelationshipType,
  DiagramValidationResult
} from '../types/diagrams'

const DEFAULT_VISIBILITY: DiagramClassAttributeDTO['visibility'] = 'private'
const DEFAULT_RELATIONSHIP: DiagramRelationshipType = 'ASSOCIATION'

function createEmptyList<T>(): T[] {
  return []
}

export function createEmptyDiagramSource(type: DiagramType = 'CLASS'): DiagramSourceDTO {
  return {
    diagramType: type,
    nodes: [],
    edges: [],
  }
}

export function generateSafeId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36)
}

export function createNodeId(): string {
  return `cls_${generateSafeId().replaceAll('-', '').slice(0, 8)}`
}

export function createEdgeId(): string {
  return `rel_${generateSafeId().replaceAll('-', '').slice(0, 8)}`
}

export function createDiagramClassNode(
  name = 'NuevaClase', 
  position: DiagramPositionDTO = { x: 100, y: 100 },
  umlType: DiagramUmlType = 'CLASS'
): DiagramClassNodeDTO {
  return {
    id: createNodeId(),
    kind: 'class',
    umlType,
    name,
    attributes: createEmptyList(),
    methods: createEmptyList(),
    enumValues: umlType === 'ENUM' ? [{ id: generateSafeId(), name: 'VALOR_1' }] : createEmptyList(),
    position,
    derivedFromRequirements: createEmptyList(),
  }
}

export function createDiagramRelation(source: string, target: string): DiagramRelationDTO {
  return {
    id: createEdgeId(),
    source,
    target,
    type: 'umlEdge',
    data: {
      relationshipType: DEFAULT_RELATIONSHIP,
      label: '',
      sourceMultiplicity: '1',
      targetMultiplicity: '1'
    },
    derivedFromRequirements: createEmptyList(),
      }
}

export function parseDiagramSource(input: DiagramSourceDTO | string | null | undefined): DiagramSourceDTO {
  if (!input) {
    return createEmptyDiagramSource()
  }

  const parsed = typeof input === 'string' ? safeParseJson(input) : input
  if (!parsed || typeof parsed !== 'object') {
    return createEmptyDiagramSource()
  }

  // Accept both "edges" and "relationships" as field names (AI backends differ)
  const rawEdges = Array.isArray(parsed.edges) ? parsed.edges
    : Array.isArray((parsed as any).relationships) ? (parsed as any).relationships
    : []

  return {
    diagramType: parsed.diagramType === 'USE_CASE' ? 'USE_CASE' : 'CLASS',
    nodes: Array.isArray(parsed.nodes) ? parsed.nodes.map(normalizeNode) : [],
    edges: rawEdges.map(normalizeEdge),
  }
}

export function serializeDiagramSource(source: DiagramSourceDTO): string {
  return JSON.stringify(source, null, 2)
}

export function validateDiagramSource(source: DiagramSourceDTO): DiagramValidationResult {
  const errors: string[] = []

  if (source.diagramType !== 'CLASS' && source.diagramType !== 'USE_CASE') {
    errors.push('El tipo de diagrama no es válido.')
  }

  if (source.nodes.length === 0) {
    errors.push('El diagrama no puede estar vacío.')
  }

  const nodeIds = new Set(source.nodes.map((node) => node.id))
  for (const edge of source.edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      errors.push(`La relacion ${edge.id} apunta a nodos inexistentes.`)
    }
  }

  return {
    valid: errors.length === 0,
    issues: errors.map(msg => ({ id: generateSafeId(), severity: 'error', message: msg, targetType: 'diagram' })),
    errors: [], // For legacy compatibility we keep them in issues
    warnings: [],
  }
}

export function diagramSourceToReactFlow(source: DiagramSourceDTO): {
  nodes: Node<DiagramNodeDTO>[]
  edges: Edge<DiagramRelationDTO>[]
} {
  return {
    nodes: source.nodes.map((node: DiagramNodeDTO) => {
      let type = 'classNode'
      if (node.kind === 'package') {
        type = 'packageNode'
      } else if (source.diagramType === 'USE_CASE') {
        type = node.kind === 'actor' ? 'actorNode' : 'useCaseNode'
      }

      // @xyflow/react uses the node-level `zIndex` for rendering order.
      // Packages must always stay behind class/actor/useCase nodes.
      const zIndex = node.kind === 'package' ? 0 : 10

      const baseReactFlowNode = {
        id: node.id,
        type,
        position: node.position,
        data: node,
        zIndex,
      }

      // For packages, assign size in node.style so React Flow uses it for resizing
      if (node.kind === 'package') {
        return {
          ...baseReactFlowNode,
          style: {
            width: (node as any).style?.width ?? 640,
            height: (node as any).style?.height ?? 420,
          },
        }
      }

      return baseReactFlowNode
    }),
    edges: source.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle || null,
      targetHandle: edge.targetHandle || null,
      type: edge.type || (source.diagramType === 'USE_CASE' ? 'useCaseEdge' : 'umlEdge'),
      data: edge,
      label: edge.data?.label || '',
      zIndex: 1000, // edges always above nodes
    })),
  }
}

/**
 * Enforces correct z-order on a list of React Flow nodes:
 * - packageNode  → zIndex 0  (background container)
 * - everything else → zIndex 10 (always in front of packages)
 *
 * Call this after loading a diagram or after any operation that may have
 * changed node types (e.g. drag-stop reassignment of packageId).
 * It is a pure function and does NOT mutate the input array.
 */
export function normalizeNodeLayering<T extends { type?: string; zIndex?: number }>(
  nodes: T[]
): T[] {
  let changed = false
  const next = nodes.map(n => {
    const expected = n.type === 'packageNode' ? 0 : 10
    if (n.zIndex !== expected) {
      changed = true
      return { ...n, zIndex: expected }
    }
    return n
  })
  return changed ? next : nodes
}

export function reactFlowToDiagramSource(
  nodes: Node<DiagramNodeDTO>[],
  edges: Edge<DiagramRelationDTO>[],
  diagramType: DiagramType
): DiagramSourceDTO {
  return {
    diagramType,
    nodes: nodes.map((node) => {
      const baseNode = {
        ...node.data,
        position: node.position,
      }

      if (node.type === 'packageNode') {
        return {
          ...baseNode,
          kind: 'package' as const,
          style: {
            width: (node.style?.width as number) ?? 640,
            height: (node.style?.height as number) ?? 420,
            color: (node.data as any)?.style?.color ?? 'neutral',
          },
        }
      }

      return baseNode
    }),
    edges: edges.map((edge) => ({
      ...(edge.data ?? createDiagramRelation(edge.source, edge.target)),
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle || null,
      targetHandle: edge.targetHandle || null,
      type: edge.type || (diagramType === 'USE_CASE' ? 'useCaseEdge' : 'umlEdge'),
    })),
  }
}

function safeParseJson(value: string): DiagramSourceDTO | null {
  try {
    let parsed = JSON.parse(value)
    // Handle double-stringified JSON which happens if backend doesn't deserialize correctly
    while (typeof parsed === 'string') {
      parsed = JSON.parse(parsed)
    }
    return parsed as DiagramSourceDTO
  } catch {
    return null
  }
}

export function normalizeNode(node: any): DiagramNodeDTO {
  // Determine if it's a class node or use case node
  const isClass = node.kind === 'class' || Array.isArray(node.attributes) || Array.isArray(node.methods)
  const isPackage = node.kind === 'package'
  const isActor = node.kind?.toLowerCase() === 'actor'

  if (isPackage) {
    const width = typeof node.style?.width === 'number' ? node.style.width : 300
    const height = typeof node.style?.height === 'number' ? node.style.height : 200
    const color = typeof node.style?.color === 'string'
      ? node.style.color
      : typeof node.style?.backgroundColor === 'string'
        ? node.style.backgroundColor
        : '#ffffff'

    return {
      id: typeof node.id === 'string' ? node.id : `pkg-${generateSafeId()}`,
      kind: 'package',
      name: typeof node.name === 'string' ? node.name : 'Nuevo Paquete',
      description: typeof node.description === 'string' ? node.description : '',
      position: normalizePosition(node.position),
      derivedFromRequirements: Array.isArray(node.derivedFromRequirements) ? node.derivedFromRequirements : [],
      style: { width, height, color },
    }
  }

  if (isClass) {
    return {
      id: typeof node.id === 'string' ? node.id : createNodeId(),
      kind: 'class',
      umlType: typeof node.umlType === 'string' ? node.umlType : 'CLASS',
      name: typeof node.name === 'string' && node.name.trim().length > 0 ? node.name : 'NuevaClase',
      attributes: Array.isArray(node.attributes) ? node.attributes.map(normalizeAttribute) : [],
      methods: Array.isArray(node.methods) ? node.methods.map(normalizeMethod) : [],
      enumValues: Array.isArray(node.enumValues) ? node.enumValues.map(normalizeEnumValue) : [],
      position: normalizePosition(node.position),
      description: typeof node.description === 'string' ? node.description : '',
      derivedFromRequirements: Array.isArray(node.derivedFromRequirements) ? node.derivedFromRequirements : [],
      packageId: typeof node.packageId === 'string' ? node.packageId : typeof node.data?.packageId === 'string' ? node.data.packageId : undefined,
    }
  }

  // Use Case or Actor
  return {
    id: typeof node.id === 'string' ? node.id : createNodeId(),
    kind: isActor ? 'actor' : 'useCase',
    name: typeof node.name === 'string' && node.name.trim().length > 0 ? node.name : (isActor ? 'Actor' : 'Nuevo caso de uso'),
    description: typeof node.description === 'string' ? node.description : '',
    position: normalizePosition(node.position),
    derivedFromRequirements: Array.isArray(node.derivedFromRequirements) ? node.derivedFromRequirements : [],
  }
}

export function normalizeEdge(edge: any): DiagramRelationDTO {
  // The AI backend returns edges with "from"/"to" and top-level "label"/"type".
  // Internally we use "source"/"target" and nested "data.relationshipType".
  // This function accepts BOTH formats.
  const source = typeof edge.source === 'string' && edge.source
    ? edge.source
    : typeof edge.from === 'string' && edge.from
      ? edge.from
      : ''

  const target = typeof edge.target === 'string' && edge.target
    ? edge.target
    : typeof edge.to === 'string' && edge.to
      ? edge.to
      : ''

  // Relationship type: accept top-level "type"/"relationshipType" or nested data.relationshipType
  // (the AI emits {"type": "association"} at the edge root, not inside "data")
  const rawRelType =
    edge.data?.relationshipType ??
    edge.relationshipType ??
    (typeof edge.type === 'string' && edge.type !== 'umlEdge' && edge.type !== 'useCaseEdge'
      ? edge.type
      : undefined) ??
    'ASSOCIATION'

  // Label: accept top-level "label" or nested data.label
  const label =
    typeof edge.data?.label === 'string' ? edge.data.label :
    typeof edge.label === 'string' ? edge.label :
    ''

  // Edge renderer type: umlEdge for class diagrams, useCaseEdge for use case diagrams
  // If AI sent a semantic type ("association"), keep "umlEdge" as the renderer
  const semanticTypes = ['association','aggregation','composition','inheritance','implementation','dependency','include','extend','generalization','ASSOCIATION','AGGREGATION','COMPOSITION','INHERITANCE','IMPLEMENTATION','DEPENDENCY','INCLUDE','EXTEND','GENERALIZATION']
  const rendererType = typeof edge.type === 'string' && !semanticTypes.includes(edge.type)
    ? edge.type
    : 'umlEdge'

  return {
    id: typeof edge.id === 'string' && edge.id ? edge.id : createEdgeId(),
    source,
    target,
    type: rendererType,
    data: {
      relationshipType: normalizeRelationshipType(rawRelType),
      label,
      description: typeof edge.data?.description === 'string' ? edge.data.description :
                   typeof edge.description === 'string' ? edge.description : '',
      sourceMultiplicity: typeof edge.data?.sourceMultiplicity === 'string' ? edge.data.sourceMultiplicity : '1',
      targetMultiplicity: typeof edge.data?.targetMultiplicity === 'string' ? edge.data.targetMultiplicity : '1',
    },
    derivedFromRequirements: Array.isArray(edge.derivedFromRequirements) ? edge.derivedFromRequirements : [],
  }
}
function normalizeEnumValue(value: DiagramEnumValueDTO): DiagramEnumValueDTO {
  return {
    id: typeof value.id === 'string' ? value.id : generateSafeId(),
    name: typeof value.name === 'string' ? value.name : '',
  }
}

function normalizeAttribute(attribute: DiagramClassAttributeDTO): DiagramClassAttributeDTO {
  return {
    id: typeof attribute.id === 'string' ? attribute.id : crypto.randomUUID(),
    name: typeof attribute.name === 'string' ? attribute.name : '',
    type: typeof attribute.type === 'string' ? attribute.type : '',
    visibility: normalizeVisibility(attribute.visibility),
    required: Boolean(attribute.required)
  }
}

function normalizeMethod(method: DiagramClassMethodDTO): DiagramClassMethodDTO {
  return {
    id: typeof method.id === 'string' ? method.id : generateSafeId(),
    name: typeof method.name === 'string' ? method.name : '',
    parameters: typeof method.parameters === 'string' ? method.parameters : '',
    returnType: typeof method.returnType === 'string' ? method.returnType : '',
    visibility: normalizeVisibility(method.visibility),
  }
}

function normalizePosition(position: DiagramPositionDTO): DiagramPositionDTO {
  return {
    x: typeof position?.x === 'number' ? position.x : 100,
    y: typeof position?.y === 'number' ? position.y : 100,
  }
}

function normalizeVisibility(value: string): DiagramClassAttributeDTO['visibility'] {
  if (value === 'public' || value === 'private' || value === 'protected' || value === 'package') {
    return value
  }

  return DEFAULT_VISIBILITY
}

function normalizeRelationshipType(value: any): DiagramRelationshipType | DiagramUseCaseRelationshipType {
  const validTypes = [
    'ASSOCIATION',
    'AGGREGATION',
    'COMPOSITION',
    'INHERITANCE',
    'IMPLEMENTATION',
    'DEPENDENCY',
    'INCLUDE',
    'EXTEND',
    'GENERALIZATION'
  ]
  if (typeof value === 'string' && validTypes.includes(value.toUpperCase())) {
    return value.toUpperCase() as any
  }
  return 'ASSOCIATION'
}
