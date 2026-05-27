import { DiagramSidebar } from './DiagramSidebar'
import type { DiagramNodeDTO, DiagramRelationDTO, DiagramType } from '../../types/diagrams'

interface DiagramPropertiesPanelProps {
  isSidebarOpen: boolean
  setIsSidebarOpen: (open: boolean) => void
  editorTarget: 'node' | 'edge' | null
  selectedNode: DiagramNodeDTO | null
  selectedEdge: DiagramRelationDTO | null
  nodes: DiagramNodeDTO[]
  diagramType: DiagramType
  updateNode: (nextNode: DiagramNodeDTO) => void
  updateEdge: (nextEdge: DiagramRelationDTO) => void
  onDeleteNode: (id: string) => void
  onDeleteEdge: (id: string) => void
  /** Called when the X button is pressed — should close sidebar AND clear selection */
  onClose?: () => void
  sidebarTabPreference?: string | null
  setSidebarTabPreference?: (val: string | null) => void
  projectId?: string
}

export function DiagramPropertiesPanel({
  isSidebarOpen,
  setIsSidebarOpen,
  editorTarget,
  selectedNode,
  selectedEdge,
  nodes,
  diagramType,
  updateNode,
  updateEdge,
  onDeleteNode,
  onDeleteEdge,
  onClose,
  sidebarTabPreference,
  setSidebarTabPreference,
  projectId,
}: DiagramPropertiesPanelProps) {

  const handleClose = () => {
    if (onClose) {
      onClose()
    } else {
      setIsSidebarOpen(false)
    }
  }

  // Si no hay un elemento seleccionado y no es de tipo USE_CASE, no tiene sentido renderizar la estructura
  if (!editorTarget && diagramType !== 'USE_CASE') {
    return null
  }

  return (
    <>
      {/* Panel Lateral de Propiedades */}
      <aside
        className={`absolute right-4 top-4 bottom-4 z-30 w-99 transition-all duration-300 ease-in-out transform ${
          isSidebarOpen ? 'translate-x-0 opacity-100' : 'translate-x-[120%] opacity-0 pointer-events-none'
        }`}
      >
        <div className="h-full bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl shadow-xl flex flex-col overflow-hidden">
          <DiagramSidebar
            editorTarget={editorTarget}
            selectedNode={selectedNode ?? null}
            selectedEdge={selectedEdge ?? null}
            nodes={nodes}
            diagramType={diagramType}
            onUpdateNode={updateNode}
            onUpdateEdge={updateEdge}
            onDeleteNode={onDeleteNode}
            onDeleteEdge={onDeleteEdge}
            onClose={handleClose}
            sidebarTabPreference={sidebarTabPreference}
            setSidebarTabPreference={setSidebarTabPreference}
            projectId={projectId}
          />
        </div>
      </aside>

      {/* Botón flotante para volver a abrir (Solo si está cerrado) */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="absolute right-4 top-4 z-20 w-10 h-10 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-md flex items-center justify-center text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 transition-all active:scale-95"
          title="Abrir propiedades"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 12h9.75M10.5 18h9.75M3 5.25h2.25V7.5H3V5.25zm0 6h2.25v2.25H3V11.25zm0 6h2.25v2.25H3v-2.25z" />
          </svg>
        </button>
      )}
    </>
  )
}