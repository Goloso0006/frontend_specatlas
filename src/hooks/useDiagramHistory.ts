import { useState, useCallback, useRef } from 'react'
import type { Node, Edge } from '@xyflow/react'
import type { DiagramNodeDTO, DiagramRelationDTO } from '../types/diagrams'

export interface HistorySnapshot {
  nodes: Node<DiagramNodeDTO>[]
  edges: Edge<DiagramRelationDTO>[]
  selectedNodeId: string | null
  selectedEdgeId: string | null
  timestamp: number
  reason: string
}

export function useDiagramHistory() {
  const pastRef = useRef<HistorySnapshot[]>([])
  const futureRef = useRef<HistorySnapshot[]>([])
  const [historySize, setHistorySize] = useState({ past: 0, future: 0 })

  const updateSizes = () => {
    setHistorySize({
      past: pastRef.current.length,
      future: futureRef.current.length
    })
  }

  const pushSnapshot = useCallback((
    currentNodes: Node<DiagramNodeDTO>[],
    currentEdges: Edge<DiagramRelationDTO>[],
    selectedNodeId: string | null,
    selectedEdgeId: string | null,
    reason: string
  ) => {
    // Create deep clones to isolate diagram mutations
    const clonedNodes = JSON.parse(JSON.stringify(currentNodes))
    const clonedEdges = JSON.parse(JSON.stringify(currentEdges))

    console.log("[HISTORY] push", reason, { nodes: currentNodes.length, edges: currentEdges.length })

    pastRef.current.push({
      nodes: clonedNodes,
      edges: clonedEdges,
      selectedNodeId,
      selectedEdgeId,
      timestamp: Date.now(),
      reason,
    })

    if (pastRef.current.length > 50) {
      pastRef.current.shift() // Limit to 50 snapshots
    }

    futureRef.current = [] // Clear future redo branch on new action
    updateSizes()
  }, [])

  const undo = useCallback((
    currentNodes: Node<DiagramNodeDTO>[],
    currentEdges: Edge<DiagramRelationDTO>[],
    selectedNodeId: string | null,
    selectedEdgeId: string | null
  ): HistorySnapshot | null => {
    if (pastRef.current.length === 0) {
      console.log("[HISTORY] undo ignored: past is empty")
      return null
    }

    const previous = pastRef.current.pop()!
    
    // Save current present into future before rolling back
    const clonedCurrentNodes = JSON.parse(JSON.stringify(currentNodes))
    const clonedCurrentEdges = JSON.parse(JSON.stringify(currentEdges))

    futureRef.current.unshift({
      nodes: clonedCurrentNodes,
      edges: clonedCurrentEdges,
      selectedNodeId,
      selectedEdgeId,
      timestamp: Date.now(),
      reason: previous.reason,
    })

    console.log("[HISTORY] undo", { past: pastRef.current.length, future: futureRef.current.length })
    updateSizes()
    return previous
  }, [])

  const redo = useCallback((
    currentNodes: Node<DiagramNodeDTO>[],
    currentEdges: Edge<DiagramRelationDTO>[],
    selectedNodeId: string | null,
    selectedEdgeId: string | null
  ): HistorySnapshot | null => {
    if (futureRef.current.length === 0) {
      console.log("[HISTORY] redo ignored: future is empty")
      return null
    }

    const next = futureRef.current.shift()!

    // Save current present into past before rolling forward
    const clonedCurrentNodes = JSON.parse(JSON.stringify(currentNodes))
    const clonedCurrentEdges = JSON.parse(JSON.stringify(currentEdges))

    pastRef.current.push({
      nodes: clonedCurrentNodes,
      edges: clonedCurrentEdges,
      selectedNodeId,
      selectedEdgeId,
      timestamp: Date.now(),
      reason: next.reason,
    })

    console.log("[HISTORY] redo", { past: pastRef.current.length, future: futureRef.current.length })
    updateSizes()
    return next
  }, [])

  const clearHistory = useCallback(() => {
    pastRef.current = []
    futureRef.current = []
    updateSizes()
  }, [])

  return {
    canUndo: historySize.past > 0,
    canRedo: historySize.future > 0,
    pushSnapshot,
    undo,
    redo,
    clearHistory
  }
}
