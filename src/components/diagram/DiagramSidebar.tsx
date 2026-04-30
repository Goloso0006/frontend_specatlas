import type { DiagramClassNodeDTO, DiagramRelationDTO } from '../../types/diagrams'
import { NodeEditor } from './NodeEditor'
import { EdgeEditor } from './EdgeEditor'

export type EditorTarget = 'node' | 'edge' | null

export interface DiagramSidebarProps {
  editorTarget: EditorTarget
  selectedNode: DiagramClassNodeDTO | null
  selectedEdge: DiagramRelationDTO | null
  onUpdateNode: (node: DiagramClassNodeDTO) => void
  onUpdateEdge: (edge: DiagramRelationDTO) => void
}

export function DiagramSidebar({
  editorTarget,
  selectedNode,
  selectedEdge,
  onUpdateNode,
  onUpdateEdge,
}: DiagramSidebarProps) {
  if (editorTarget === 'node' && selectedNode) {
    return (
      <aside className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900 p-4">
        <NodeEditor node={selectedNode} onChange={onUpdateNode} />
      </aside>
    )
  }

  if (editorTarget === 'edge' && selectedEdge) {
    return (
      <aside className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900 p-4">
        <EdgeEditor edge={selectedEdge} onChange={onUpdateEdge} />
      </aside>
    )
  }

  return (
    <aside className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900 p-4">
      <div className="rounded-xl border border-dashed border-slate-700 p-4 text-sm text-slate-400">
        Selecciona un nodo o una relación para editar sus propiedades.
      </div>
    </aside>
  )
}
