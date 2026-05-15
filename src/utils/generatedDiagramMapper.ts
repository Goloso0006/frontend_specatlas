import type { 
  DiagramSourceDTO, 
  DiagramNodeDTO, 
  DiagramRelationDTO,
  DiagramActorNodeDTO,
  DiagramUseCaseNodeDTO
} from '../types/diagrams'
import { 
  normalizeNode, 
  normalizeEdge 
} from './diagramMapper'

export interface GeneratedCanvas {
  nodes: DiagramNodeDTO[]
  edges: DiagramRelationDTO[]
  warnings: string[]
}

/**
 * Maps a generated diagram DTO to a canvas-compatible format with an initial grid layout.
 */
export function mapGeneratedClassDiagramToCanvas(source: DiagramSourceDTO): GeneratedCanvas {
  const warnings: string[] = []
  
  // 1. Normalize Nodes and assign positions
  const COLS = 4
  const SPACING_X = 360
  const SPACING_Y = 240

  const nodes = (source.nodes || []).map((node, index) => {
    const normalized = normalizeNode(node)
    
    // Assign grid position
    const col = index % COLS
    const row = Math.floor(index / COLS)
    
    return {
      ...normalized,
      position: {
        x: col * SPACING_X,
        y: row * SPACING_Y
      }
    }
  })

  // 2. Normalize Edges — validate that source/target IDs exist among generated nodes
  const nodeIdSet = new Set(nodes.map(n => n.id))
  const edges = (source.edges || [])
    .map(edge => normalizeEdge(edge))
    .filter(edge => {
      const srcOk = nodeIdSet.has(edge.source)
      const tgtOk = nodeIdSet.has(edge.target)
      if (!srcOk || !tgtOk) {
        const msg = `[DiagramMapper] Skipping edge "${edge.id}": ${!srcOk ? `source "${edge.source}" not found` : ''} ${!tgtOk ? `target "${edge.target}" not found` : ''}`.trim()
        warnings.push(msg)
        console.warn(msg)
        return false
      }
      return true
    })

  return {
    nodes,
    edges,
    warnings
  }
}

/**
 * Maps a generated Use Case diagram DTO to a canvas-compatible format.
 * Positions actors on the left and use cases on the right.
 */
export function mapGeneratedUseCaseDiagramToCanvas(source: DiagramSourceDTO): GeneratedCanvas {
  const warnings: string[] = []
  
  if (!source || !source.nodes) {
    return { nodes: [], edges: [], warnings: ['No se recibió información del diagrama.'] }
  }

  // 1. Separate nodes
  const actors = (source.nodes || []).filter(n => n.kind?.toLowerCase() === 'actor')
  const useCases = (source.nodes || []).filter(n => n.kind?.toLowerCase() !== 'actor')

  // 2. Constants for positioning
  const ACTOR_X = 50
  const SPACING_Y = 180
  
  const UC_START_X = 420
  const UC_COLS = 2
  const UC_SPACING_X = 360
  const UC_SPACING_Y = 160

  const mappedNodes: DiagramNodeDTO[] = []

  // 3. Position Actors
  actors.forEach((node, index) => {
    const normalized = normalizeNode(node) as DiagramActorNodeDTO
    mappedNodes.push({
      ...normalized,
      position: {
        x: ACTOR_X,
        y: index * SPACING_Y + 50
      }
    })
  })

  // 4. Position Use Cases
  useCases.forEach((node, index) => {
    const normalized = normalizeNode(node) as DiagramUseCaseNodeDTO
    const col = index % UC_COLS
    const row = Math.floor(index / UC_COLS)
    
    mappedNodes.push({
      ...normalized,
      position: {
        x: UC_START_X + col * UC_SPACING_X,
        y: row * UC_SPACING_Y + 50
      }
    })
  })

  // 5. Normalize Edges — validate source/target IDs exist
  const ucNodeIdSet = new Set(mappedNodes.map(n => n.id))
  const edges = (source.edges || [])
    .map(edge => normalizeEdge(edge))
    .filter(edge => {
      const srcOk = ucNodeIdSet.has(edge.source)
      const tgtOk = ucNodeIdSet.has(edge.target)
      if (!srcOk || !tgtOk) {
        const msg = `[DiagramMapper] Skipping edge "${edge.id}": ${!srcOk ? `source "${edge.source}" not found` : ''} ${!tgtOk ? `target "${edge.target}" not found` : ''}`.trim()
        warnings.push(msg)
        console.warn(msg)
        return false
      }
      return true
    })

  return {
    nodes: mappedNodes,
    edges,
    warnings
  }
}
