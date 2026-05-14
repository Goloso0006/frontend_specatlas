import {
  Background,
  MiniMap,
  ReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
  type OnEdgesChange,
  type OnNodesChange,
  type OnSelectionChangeFunc,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { DiagramEditorEmptyState } from './DiagramEditorEmptyState'
import { ClassNode } from './ClassNode'
import { ActorNode } from './ActorNode'
import { UseCaseNode } from './UseCaseNode'
import { PackageNode } from './PackageNode'
import { UmlEdge } from './UmlEdge'
import { UseCaseEdge } from './UseCaseEdge'
import { UmlMarkers } from './UmlMarkers'

import type { DiagramNodeDTO, DiagramRelationDTO, DiagramType } from '../../types/diagrams'

const nodeTypes: NodeTypes = {
  classNode: ClassNode,
  actorNode: ActorNode,
  useCaseNode: UseCaseNode,
  packageNode: PackageNode,
}

const edgeTypes = {
  umlEdge: UmlEdge,
  useCaseEdge: UseCaseEdge,
}

export interface DiagramCanvasProps {
  nodes: Node<DiagramNodeDTO>[]
  edges: Edge<DiagramRelationDTO>[]
  diagramType: DiagramType
  onNodesChange: OnNodesChange
  onEdgesChange: OnEdgesChange
  onConnect: (connection: Connection) => void
  onSelectionChange: OnSelectionChangeFunc
  onNodeDragStop?: (event: any, node: Node) => void
}

export function DiagramCanvas({
  nodes,
  edges,
  diagramType,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onSelectionChange,
  onNodeDragStop,
}: DiagramCanvasProps) {
  const isEmpty = nodes.length === 0
    if (import.meta.env.DEV) {
      console.debug('[DiagramCanvas] render:', {
        nodesCount: nodes.length,
        edgesCount: edges.length,
        isEmpty,
        diagramType,
        nodes: nodes.slice(0, 3) // mostrar primeros 3 para debugging
      })
    }

  return (
    <div className="w-full h-full min-h-[400px] relative flex-1 min-h-0">
        <ReactFlow
          className="w-full h-full"
          style={{ width: '100%', height: '100%' }}
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onSelectionChange={onSelectionChange}
            onNodeDragStop={onNodeDragStop}
          fitView
          nodesConnectable={true}
          minZoom={0.05}
          maxZoom={2}
          colorMode="dark"
          defaultEdgeOptions={{
          type: 'smoothstep',
          animated: false,
        }}
      >
        <UmlMarkers />
        <Background gap={24} size={1} color="#cbd5e1" className="dark:opacity-10" />
        <MiniMap
          nodeColor={(n) => {
            if (n.type === 'packageNode') return '#94a3b8'
            if (n.type === 'classNode') return '#3b82f6'
            if (n.type === 'actorNode') return '#10b981'
            return '#6366f1'
          }}
          maskColor="rgba(15, 23, 42, 0.7)"
          style={{
            backgroundColor: 'var(--color-bg-card)',
            borderRadius: '12px',
            border: '1px solid var(--color-border)',
          }}
          pannable
          zoomable
        />
      </ReactFlow>

      {isEmpty && (
        <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
          <DiagramEditorEmptyState type={diagramType} />
        </div>
      )}
    </div>
  )
}
