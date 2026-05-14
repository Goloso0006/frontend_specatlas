import type { 
  DiagramSourceDTO, 
  DiagramNodeDTO, 
  DiagramRelationDTO 
} from '../types/diagrams'

export interface MergeResult {
  nodes: DiagramNodeDTO[]
  edges: DiagramRelationDTO[]
  addedNodesCount: number
  addedEdgesCount: number
  skippedNodesCount: number
  skippedEdgesCount: number
}

/**
 * Fuses two diagram sources, avoiding duplicates by name for nodes and 
 * by source/target/type/label for edges.
 */
export function mergeDiagramSources(
  current: DiagramSourceDTO,
  proposal: { nodes: DiagramNodeDTO[], edges: DiagramRelationDTO[] }
): MergeResult {
  const resultNodes = [...current.nodes]
  const resultEdges = [...current.edges]
  
  let addedNodesCount = 0
  let addedEdgesCount = 0
  let skippedNodesCount = 0
  let skippedEdgesCount = 0

  // Merge Nodes
  // We distinguish by name + kind to avoid skipping an actor if a use case has the same name
  const getNodeKey = (n: { name: string, kind: string }) => `${n.kind.toLowerCase()}|${n.name.trim().toLowerCase()}`
  
  const currentKeys = new Set(current.nodes.map(n => getNodeKey(n)))
  
  proposal.nodes.forEach(node => {
    const key = getNodeKey(node)
    if (currentKeys.has(key)) {
      skippedNodesCount++
    } else {
      resultNodes.push(node)
      currentKeys.add(key)
      addedNodesCount++
    }
  })

  // Merge Edges
  // Rule: compare sourceKey + targetKey + relationshipType + label
  const getNameById = (id: string, list: DiagramNodeDTO[]) => {
    const node = list.find(n => n.id === id)
    return node ? getNodeKey(node) : id
  }

  const getEdgeKey = (edge: DiagramRelationDTO, nodeList: DiagramNodeDTO[]) => {
    const sKey = getNameById(edge.source, nodeList)
    const tKey = getNameById(edge.target, nodeList)
    const type = edge.data?.relationshipType || 'ASSOCIATION'
    const label = edge.data?.label?.trim().toLowerCase() || ''
    return `${sKey}|${tKey}|${type}|${label}`
  }

  const currentEdgeKeys = new Set(current.edges.map(e => getEdgeKey(e, current.nodes)))

  proposal.edges.forEach(edge => {
    // We need to be careful with IDs in edges if we merged nodes. 
    // If the proposal uses its own node IDs, and we skipped a node, 
    // we must redirect the edge to the existing node ID.
    
    const sKey = getNameById(edge.source, proposal.nodes)
    const tKey = getNameById(edge.target, proposal.nodes)
    
    const existingSource = resultNodes.find(n => getNodeKey(n) === sKey)
    const existingTarget = resultNodes.find(n => getNodeKey(n) === tKey)

    if (!existingSource || !existingTarget) {
      skippedEdgesCount++
      return
    }

    const redirectedEdge: DiagramRelationDTO = {
      ...edge,
      source: existingSource.id,
      target: existingTarget.id
    }

    const key = getEdgeKey(redirectedEdge, resultNodes)
    if (currentEdgeKeys.has(key)) {
      skippedEdgesCount++
    } else {
      resultEdges.push(redirectedEdge)
      currentEdgeKeys.add(key)
      addedEdgesCount++
    }
  })

  return {
    nodes: resultNodes,
    edges: resultEdges,
    addedNodesCount,
    addedEdgesCount,
    skippedNodesCount,
    skippedEdgesCount
  }
}
