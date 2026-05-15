import type { DiagramEditorState } from '../../state/diagramEditor.machine'
import type { SaveFeedback } from '../../hooks/useDiagramEditorController'

interface DiagramHeaderProps {
  diagramName: string
  setDiagramName: (name: string) => void
  isGlobalLoading: boolean
  status: DiagramEditorState['status']
  saveFeedback: SaveFeedback | null
  hasSelection: boolean
  onGenerateAutoDiagram: () => void
  onSaveDiagram: (force: boolean) => void
  onDeleteSelected: () => void
}

export function DiagramHeader({
  diagramName,
  setDiagramName,
  isGlobalLoading,
  status,
  saveFeedback,
  hasSelection,
  onGenerateAutoDiagram,
  onSaveDiagram,
  onDeleteSelected,
}: DiagramHeaderProps) {
  return (
    <header className="h-12 border-b border-(--color-border) bg-(--color-bg) flex items-center px-4 shrink-0 justify-between z-10">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <input
            className="bg-transparent border-b border-transparent hover:border-(--color-border) focus:border-(--color-accent) text-xs font-semibold text-(--color-text-primary) focus:outline-none px-1 py-0.5 transition-colors w-40"
            value={diagramName}
            onChange={e => setDiagramName(e.target.value)}
            placeholder="Sin nombre"
            title="Editar nombre del diagrama"
          />
        </div>

        <div className="flex items-center gap-2">
          {isGlobalLoading ? (
            <span className="text-[10px] text-(--color-accent) animate-pulse bg-(--color-accent-subtle) px-2 py-0.5 rounded-full border border-(--color-accent)/20">
              Sincronizando
            </span>
          ) : status === 'editing' ? (
            <span className="text-[10px] text-(--color-text-muted) bg-(--color-surface) px-2 py-0.5 rounded-full border border-(--color-border)">
              Editando
            </span>
          ) : (
            <span className="text-[10px] text-(--color-text-muted) bg-(--color-surface) px-2 py-0.5 rounded-full border border-(--color-border)">
              Guardado
            </span>
          )}

          {saveFeedback && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
              saveFeedback.type === 'success' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' :
              saveFeedback.type === 'error' ? 'text-red-400 bg-red-400/10 border-red-400/20' :
              'text-(--color-accent) bg-(--color-accent-subtle) border-(--color-border)'
            }`}>
              {saveFeedback.message}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={onGenerateAutoDiagram}
          disabled={isGlobalLoading}
          className="h-7 px-2.5 text-[11px] font-medium rounded-md border border-(--color-border) bg-(--color-bg-card) text-(--color-text-secondary) hover:bg-(--color-surface) transition-colors disabled:opacity-50"
          title="Generar diagrama con IA"
        >
          <svg className="w-3.5 h-3.5 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          IA
        </button>
        <button
          onClick={() => onSaveDiagram(false)}
          disabled={isGlobalLoading || !diagramName.trim()}
          className="h-7 px-2.5 text-[11px] font-medium rounded-md border border-(--color-accent) bg-(--color-accent) text-white hover:bg-(--color-accent-hover) transition-colors disabled:opacity-50"
        >
          <svg className="w-3.5 h-3.5 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          Guardar
        </button>
        <button
          onClick={onDeleteSelected}
          disabled={isGlobalLoading || !hasSelection}
          className="h-7 px-2.5 text-[11px] font-medium rounded-md border border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors disabled:opacity-50"
          title="Eliminar seleccionado"
        >
          <svg className="w-3.5 h-3.5 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Eliminar
        </button>
      </div>
    </header>
  )
}
