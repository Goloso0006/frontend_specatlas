import { MarkerType, type Edge, type Node } from 'reactflow'
import type {
  DiagramClassAttributeDTO,
  DiagramClassMethodDTO,
  DiagramClassNodeDTO,
  DiagramPositionDTO,
  DiagramRelationDTO,
  DiagramRelationType,
  DiagramSourceDTO,
} from '../types/diagrams'

export interface DiagramValidationResult {
  isValid: boolean
  errors: string[]
}

const DEFAULT_VISIBILITY: DiagramClassAttributeDTO['visibility'] = 'private'
const DEFAULT_RELATION_TYPE: DiagramRelationType = 'association'

function createEmptyList<T>(): T[] {
  return []
}

export function createEmptyDiagramSource(): DiagramSourceDTO {
  return {
    diagramType: 'CLASS',
    nodes: [],
    edges: [],
  }
}

export function createNodeId(): string {
  return `cls_${crypto.randomUUID().replaceAll('-', '').slice(0, 8)}`
}

export function createEdgeId(): string {
  return `rel_${crypto.randomUUID().replaceAll('-', '').slice(0, 8)}`
}

export function createDiagramClassNode(name = 'NuevaClase', position: DiagramPositionDTO = { x: 100, y: 100 }): DiagramClassNodeDTO {
  return {
    id: createNodeId(),
    kind: 'class',
    name,
    attributes: createEmptyList(),
    methods: createEmptyList(),
    position,
    derivedFromRequirements: createEmptyList(),
  }
}

export function createDiagramRelation(from: string, to: string): DiagramRelationDTO {
  return {
    id: createEdgeId(),
    from,
    to,
    type: DEFAULT_RELATION_TYPE,
    label: '',
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

  return {
    diagramType: parsed.diagramType === 'CLASS' ? 'CLASS' : 'CLASS',
    nodes: Array.isArray(parsed.nodes) ? parsed.nodes.map(normalizeNode) : [],
    edges: Array.isArray(parsed.edges) ? parsed.edges.map(normalizeEdge) : [],
  }
}

export function serializeDiagramSource(source: DiagramSourceDTO): string {
  return JSON.stringify(source, null, 2)
}

export function validateDiagramSource(source: DiagramSourceDTO): DiagramValidationResult {
  const errors: string[] = []

  if (source.diagramType !== 'CLASS') {
    errors.push('El diagrama debe ser de tipo CLASS.')
  }

  if (source.nodes.length === 0) {
    errors.push('El diagrama no puede estar vacío.')
  }

  const nodeIds = new Set(source.nodes.map((node) => node.id))
  for (const edge of source.edges) {
    if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) {
      errors.push(`La relacion ${edge.id} apunta a nodos inexistentes.`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function diagramSourceToReactFlow(source: DiagramSourceDTO): {
  nodes: Node<DiagramClassNodeDTO>[]
  edges: Edge<DiagramRelationDTO>[]
} {
  return {
    nodes: source.nodes.map((node) => ({
      id: node.id,
      type: 'classNode',
      position: node.position,
      data: node,
    })),
    edges: source.edges.map((edge) => ({
      id: edge.id,
      source: edge.from,
      target: edge.to,
      type: 'smoothstep',
      label: edge.label || undefined,
      data: edge,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: {
        stroke: relationStrokeColor(edge.type),
      },
    })),
  }
}

export function reactFlowToDiagramSource(
  nodes: Node<DiagramClassNodeDTO>[],
  edges: Edge<DiagramRelationDTO>[],
): DiagramSourceDTO {
  return {
    diagramType: 'CLASS',
    nodes: nodes.map((node) => ({
      ...node.data,
      position: node.position,
    })),
    edges: edges.map((edge) => ({
      ...(edge.data ?? createDiagramRelation(edge.source, edge.target)),
      from: edge.source,
      to: edge.target,
      label: typeof edge.label === 'string' ? edge.label : edge.data?.label ?? '',
      type: edge.data?.type ?? DEFAULT_RELATION_TYPE,
    })),
  }
}

function safeParseJson(value: string): DiagramSourceDTO | null {
  try {
    return JSON.parse(value) as DiagramSourceDTO
  } catch {
    return null
  }
}

function normalizeNode(node: DiagramClassNodeDTO): DiagramClassNodeDTO {
  return {
    id: typeof node.id === 'string' ? node.id : createNodeId(),
    kind: node.kind === 'class' ? 'class' : 'class',
    name: typeof node.name === 'string' && node.name.trim().length > 0 ? node.name : 'NuevaClase',
    attributes: Array.isArray(node.attributes) ? node.attributes.map(normalizeAttribute) : [],
    methods: Array.isArray(node.methods) ? node.methods.map(normalizeMethod) : [],
    position: normalizePosition(node.position),
    derivedFromRequirements: Array.isArray(node.derivedFromRequirements) ? node.derivedFromRequirements : [],
  }
}

function normalizeEdge(edge: DiagramRelationDTO): DiagramRelationDTO {
  return {
    id: typeof edge.id === 'string' ? edge.id : createEdgeId(),
    from: typeof edge.from === 'string' ? edge.from : '',
    to: typeof edge.to === 'string' ? edge.to : '',
    type: normalizeRelationType(edge.type),
    label: typeof edge.label === 'string' ? edge.label : '',
    derivedFromRequirements: Array.isArray(edge.derivedFromRequirements) ? edge.derivedFromRequirements : [],
  }
}

function normalizeAttribute(attribute: DiagramClassAttributeDTO): DiagramClassAttributeDTO {
  return {
    name: typeof attribute.name === 'string' ? attribute.name : '',
    type: typeof attribute.type === 'string' ? attribute.type : '',
    visibility: normalizeVisibility(attribute.visibility),
  }
}

function normalizeMethod(method: DiagramClassMethodDTO): DiagramClassMethodDTO {
  return {
    name: typeof method.name === 'string' ? method.name : '',
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

function normalizeRelationType(value: string): DiagramRelationType {
  if (
    value === 'association' ||
    value === 'inheritance' ||
    value === 'aggregation' ||
    value === 'composition' ||
    value === 'dependency'
  ) {
    return value
  }

  return DEFAULT_RELATION_TYPE
}

function relationStrokeColor(type: DiagramRelationType): string {
  switch (type) {
    case 'inheritance':
      return '#7dd3fc'
    case 'aggregation':
      return '#a78bfa'
    case 'composition':
      return '#f472b6'
    case 'dependency':
      return '#facc15'
    case 'association':
    default:
      return '#60a5fa'
  }
}
