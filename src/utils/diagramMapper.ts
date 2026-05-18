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

export function parseDiagramSource(input: any): DiagramSourceDTO {
  if (!input) {
    return createEmptyDiagramSource()
  }

  let parsed = input

  // Safely extract from wrapped formats
  if (typeof parsed === 'object') {
    if (parsed.data && typeof parsed.data === 'object') {
      parsed = parsed.data
    }
    
    // Check multiple possible properties in the object for serialized diagram data
    if (typeof parsed.sourceJson === 'string' || (parsed.sourceJson && typeof parsed.sourceJson === 'object')) {
      parsed = parsed.sourceJson
    } else if (typeof parsed.content === 'string' || (parsed.content && typeof parsed.content === 'object')) {
      parsed = parsed.content
    }
  }

  // If we have a string (either from input or extracted), safe-parse it (handles double-stringified too)
  if (typeof parsed === 'string') {
    const safeParsed = safeParseJson(parsed)
    if (safeParsed) {
      parsed = safeParsed
    }
  }

  // If after all extraction we still don't have a valid object, return empty
  if (!parsed || typeof parsed !== 'object') {
    return createEmptyDiagramSource()
  }

  // Accept "edges", "relationships" and "relations" as field names (AI/database backends differ)
  const edgesList = Array.isArray(parsed.edges) ? parsed.edges : []
  const relationsList = Array.isArray(parsed.relations) ? parsed.relations : []
  const relationshipsList = Array.isArray((parsed as any).relationships) ? (parsed as any).relationships : []

  const diagramType = parsed.diagramType === 'USE_CASE' ? 'USE_CASE' : 'CLASS'
  
  let finalNodes = Array.isArray(parsed.nodes) ? parsed.nodes.map(normalizeNode) : []

  // Build nodeIds from parsed nodes to validate edge connectivity (Rule #6)
  const nodeIds = new Set(
    finalNodes.map((n: any) => n.id || n.data?.id).filter(Boolean)
  )

  // Merge and deduplicate edges/relations/relationships (Rule #4 & #5)
  const combinedEdges: any[] = []
  const seenIds = new Set<string>()
  const seenKeys = new Set<string>()

  const addEdge = (e: any) => {
    if (!e || typeof e !== 'object') return
    
    // Determine unique identifiers
    const id = typeof e.id === 'string' && e.id ? e.id : ''
    const source = typeof e.source === 'string' && e.source
      ? e.source
      : typeof e.from === 'string' && e.from
        ? e.from
        : typeof e.sourceId === 'string' && e.sourceId
          ? e.sourceId
          : ''
    const target = typeof e.target === 'string' && e.target
      ? e.target
      : typeof e.to === 'string' && e.to
        ? e.to
        : typeof e.targetId === 'string' && e.targetId
          ? e.targetId
          : ''

    const rawType =
      e.data?.relationshipType ??
      e.data?.relationType ??
      e.data?.type ??
      e.relationshipType ??
      e.relationType ??
      (typeof e.type === 'string' && e.type !== 'umlEdge' && e.type !== 'useCaseEdge'
        ? e.type
        : undefined) ??
      'ASSOCIATION'
    const relationshipType = String(rawType).toUpperCase()

    if (!source || !target) return // Don't add invalid relations

    if (id && seenIds.has(id)) return // Already saw this ID

    const dedupeKey = `${source}_${target}_${relationshipType}`
    if (seenKeys.has(dedupeKey)) return // Already saw this combination

    if (id) seenIds.add(id)
    seenKeys.add(dedupeKey)
    combinedEdges.push(e)
  }

  edgesList.forEach(addEdge)
  relationsList.forEach(addEdge)
  relationshipsList.forEach(addEdge)

  let finalEdges = combinedEdges
    .map((e: any) => normalizeEdge(e, diagramType))
    .filter((edge: any) => {
      // Validate node IDs but only discard if source or target is truly missing (Rule #6)
      const hasSource = edge.source && (nodeIds.size === 0 || nodeIds.has(edge.source))
      const hasTarget = edge.target && (nodeIds.size === 0 || nodeIds.has(edge.target))
      return hasSource && hasTarget
    })

  // Backup mapping for USE_CASE diagrams when nodes/edges are empty/absent
  if (diagramType === 'USE_CASE' && finalNodes.length === 0) {
    const rawActors = Array.isArray(parsed.actors) ? parsed.actors : []
    const rawUseCases = Array.isArray(parsed.useCases) ? parsed.useCases : []
    const rawRelations = Array.isArray(parsed.relations) ? parsed.relations
      : Array.isArray((parsed as any).relationships) ? (parsed as any).relationships
      : []

    const ACTOR_X = 50
    const SPACING_Y = 180
    const UC_START_X = 420
    const UC_COLS = 2
    const UC_SPACING_X = 360
    const UC_SPACING_Y = 160

    const actorNodes = rawActors.map((actor: any, index: number) => {
      const defaultPos = {
        x: ACTOR_X,
        y: index * SPACING_Y + 50
      }
      return normalizeNode({
        id: actor.id || `actor_${generateSafeId()}`,
        kind: 'actor',
        name: actor.name || `Actor ${index + 1}`,
        description: actor.description || '',
        position: actor.position || defaultPos,
        derivedFromRequirements: actor.derivedFromRequirements || [],
        actorType: actor.kind ?? "primary"
      })
    })

    const ucNodes = rawUseCases.map((uc: any, index: number) => {
      const col = index % UC_COLS
      const row = Math.floor(index / UC_COLS)
      const defaultPos = {
        x: UC_START_X + col * UC_SPACING_X,
        y: row * UC_SPACING_Y + 50
      }
      return normalizeNode({
        id: uc.id || `uc_${generateSafeId()}`,
        kind: 'useCase',
        name: uc.name || `UseCase ${index + 1}`,
        description: uc.description || '',
        position: uc.position || defaultPos,
        derivedFromRequirements: uc.derivedFromRequirements || []
      })
    })

    finalNodes = [...actorNodes, ...ucNodes]
    const nodeIds = new Set(finalNodes.map((n: any) => n.id))

    const mappedEdges = rawRelations.map((rel: any) => {
      const source = rel.source ?? rel.sourceId ?? ''
      const target = rel.target ?? rel.targetId ?? ''
      const rawType = String(rel.type ?? rel.relationType ?? rel.relationshipType ?? 'ASSOCIATION').toUpperCase()
      
      let normalizedType = 'ASSOCIATION'
      if (rawType.includes('INCLUDE')) normalizedType = 'INCLUDE'
      else if (rawType.includes('EXTEND')) normalizedType = 'EXTEND'
      else if (rawType.includes('GENERALIZATION')) normalizedType = 'GENERALIZATION'

      return {
        id: rel.id || `rel_${generateSafeId()}`,
        source,
        target,
        type: 'useCaseEdge',
        data: {
          relationType: normalizedType,
          relationshipType: normalizedType,
          label: rel.label ?? '',
          extensionPointRef: rel.extensionPointRef ?? ''
        },
        derivedFromRequirements: rel.derivedFromRequirements || []
      }
    })

    finalEdges = mappedEdges
      .map((edge: any) => {
        const normalizedEdge = normalizeEdge(edge, 'USE_CASE')
        normalizedEdge.type = 'useCaseEdge'
        return normalizedEdge
      })
      .filter((edge: any) => nodeIds.has(edge.source) && nodeIds.has(edge.target))
  }

  return {
    diagramType,
    nodes: finalNodes,
    edges: finalEdges,
    actors: parsed.actors,
    useCases: parsed.useCases,
    relations: parsed.relations,
    systemName: parsed.systemName,
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
  const source: DiagramSourceDTO = {
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

  if (diagramType === 'USE_CASE') {
    source.actors = nodes
      .filter(n => n.type === 'actorNode' || n.data.kind === 'actor')
      .map(n => ({
        id: n.id,
        name: n.data.name,
        kind: (n.data as any).actorType ?? (n.data as any).kind ?? 'primary',
        position: n.position
      }))

    source.useCases = nodes
      .filter(n => n.type === 'useCaseNode' || n.data.kind === 'useCase')
      .map(n => ({
        id: n.id,
        name: n.data.name,
        description: n.data.description || '',
        position: n.position
      }))
  }

  // Always populate relations and relationships for all diagram types to satisfy backend DTO and Neo4j sync requirements
  const mappedRelations = edges.map(e => {
    const rawData = (e.data as any)?.data ?? e.data ?? {}
    return {
      id: e.id,
      sourceId: e.source,
      targetId: e.target,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle || null,
      targetHandle: e.targetHandle || null,
      type: String((e.data as any)?.relationshipType ?? rawData.relationshipType ?? (e.data as any)?.relationType ?? 'ASSOCIATION').toUpperCase(),
      data: {
        relationshipType: String((e.data as any)?.relationshipType ?? rawData.relationshipType ?? (e.data as any)?.relationType ?? 'ASSOCIATION').toUpperCase(),
        label: rawData.label || '',
        description: rawData.description || '',
        sourceMultiplicity: rawData.sourceMultiplicity || '1',
        targetMultiplicity: rawData.targetMultiplicity || '1',
      }
    }
  })

  source.relations = mappedRelations
  ;(source as any).relationships = mappedRelations

  return source
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
    actorType: isActor ? (node.actorType ?? node.kind ?? 'primary') : undefined,
  }
}

export function normalizeEdge(edge: any, diagramType?: DiagramType): DiagramRelationDTO {
  // The AI backend returns edges with "from"/"to" and top-level "label"/"type".
  // Internally we use "source"/"target" and nested "data.relationshipType".
  // This function accepts BOTH formats.
  const source = typeof edge.source === 'string' && edge.source
    ? edge.source
    : typeof edge.from === 'string' && edge.from
      ? edge.from
      : typeof edge.sourceId === 'string' && edge.sourceId
        ? edge.sourceId
        : ''

  const target = typeof edge.target === 'string' && edge.target
    ? edge.target
    : typeof edge.to === 'string' && edge.to
      ? edge.to
      : typeof edge.targetId === 'string' && edge.targetId
        ? edge.targetId
        : ''

  // Relationship type: accept top-level or nested "type"/"relationshipType"/"relationType"
  const rawRelType =
    edge.data?.relationshipType ??
    edge.data?.relationType ??
    edge.data?.type ??
    edge.relationshipType ??
    edge.relationType ??
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
  const rendererType = diagramType === 'USE_CASE' ? 'useCaseEdge' : 'umlEdge'

  return {
    id: typeof edge.id === 'string' && edge.id ? edge.id : createEdgeId(),
    source,
    target,
    sourceHandle: edge.sourceHandle || null,
    targetHandle: edge.targetHandle || null,
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
