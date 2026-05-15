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
}: DiagramPropertiesPanelProps) {
  return (
    <>
      <aside
        className={`absolute right-4 top-6 bottom-6 z-30 transition-all duration-500 ease-in-out transform ${
          isSidebarOpen ? 'translate-x-0 opacity-100' : 'translate-x-[120%] opacity-0'
        }`}
      >
        <div className="w-80 h-full bg-(--color-bg-card) dark:bg-[#0b0f12] border border-(--color-border) rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Propiedades
              </h3>
              {editorTarget && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800/50">
                  {editorTarget === 'node' ? 'Elemento' : 'Relación'}
                </span>
              )}
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar p-1">
            {!editorTarget ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-800">
                  <svg className="w-8 h-8 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
                  Selecciona un elemento para editar sus propiedades
                </p>
              </div>
            ) : (
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
              />
            )}
          </div>
        </div>
      </aside>

      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="absolute right-4 top-4 z-20 w-10 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg flex items-center justify-center text-slate-500 hover:text-blue-500 transition-all hover:scale-110"
          title="Abrir propiedades"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}
    </>
  )
}
