import type { 
  DiagramSourceDTO, 
  DiagramNodeDTO, 
  DiagramActorNodeDTO,
  DiagramUseCaseNodeDTO
} from '../types/diagrams'
import { 
  normalizeNode, 
  normalizeEdge 
} from './diagramMapper'
import type { 
  GeneratedCanvas
} from './generatedClassDiagramMapper'

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

  // 5. Normalize Edges
  const edges = (source.edges || []).map(edge => normalizeEdge(edge))

  return {
    nodes: mappedNodes,
    edges,
    warnings
  }
}
