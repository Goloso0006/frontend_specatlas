import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
  type OnEdgesChange,
  type OnNodesChange,
  type OnSelectionChangeFunc,
} from 'reactflow'
import 'reactflow/dist/style.css'
import type { DiagramClassNodeDTO, DiagramRelationDTO } from '../../types/diagrams'
import { ClassDiagramNode } from './ClassDiagramNode'

const nodeTypes: NodeTypes = {
  classNode: ClassDiagramNode,
}

export interface DiagramCanvasProps {
  nodes: Node<DiagramClassNodeDTO>[]
  edges: Edge<DiagramRelationDTO>[]
  onNodesChange: OnNodesChange
  onEdgesChange: OnEdgesChange
  onConnect: (connection: Connection) => void
  onSelectionChange: OnSelectionChangeFunc
}

export function DiagramCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onSelectionChange,
}: DiagramCanvasProps) {
  return (
    <section className="overflow-hidden rounded-2xl border app-border-strong app-card">
      <div className="border-b app-border-strong px-4 py-3">
        <h2 className="font-semibold">Canvas visual</h2>
        <p className="text-xs app-text-muted">
          Arrastra nodos, conecta relaciones y selecciona para editar.
        </p>
      </div>

      <div className="h-[calc(100vh-260px)] min-h-180">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onSelectionChange={onSelectionChange}
          fitView
        >
          <Background gap={18} size={1} color="#1f2937" />
          <Controls />
          <MiniMap
            nodeColor="#22d3ee"
            maskColor="rgba(15, 23, 42, 0.65)"
            pannable
            zoomable
          />
        </ReactFlow>
      </div>
    </section>
  )
}
