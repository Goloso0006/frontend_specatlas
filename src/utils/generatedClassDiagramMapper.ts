import type { 
  DiagramSourceDTO, 
  DiagramNodeDTO, 
  DiagramRelationDTO 
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
  const SPACING_X = 400
  const SPACING_Y = 400

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

  // 2. Normalize Edges
  const edges = (source.edges || []).map(edge => {
    return normalizeEdge(edge)
  })

  return {
    nodes,
    edges,
    warnings
  }
}
