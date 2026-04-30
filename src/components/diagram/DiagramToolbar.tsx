export interface DiagramToolbarProps {
  /** Whether the diagram has been persisted (has a valid diagramId). */
  isSaved: boolean
  /** Whether the diagram source passes validation. */
  isValid: boolean
  /** Whether an element (node or edge) is currently selected. */
  hasSelection: boolean
  /** Current editor status used to disable actions while busy. */
  status: string

  onAddNode: () => void
  onSave: () => void
  onCreateManual: () => void
  onGenerateAuto: () => void
  onCreateUseCaseManual: () => void
  onGenerateUseCaseAuto: () => void
  onDeleteSelected: () => void
}

export function DiagramToolbar({
  isSaved: _isSaved,
  isValid,
  hasSelection,
  status,
  onAddNode,
  onSave,
  onCreateManual,
  onGenerateAuto,
  onCreateUseCaseManual,
  onGenerateUseCaseAuto,
  onDeleteSelected,
}: DiagramToolbarProps) {
  const isBusy = status === 'loading' || status === 'saving' || status === 'exporting'

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        className="rounded-md bg-cyan-600 px-3 py-2 text-sm font-medium transition-colors hover:bg-cyan-500 disabled:opacity-50"
        onClick={onAddNode}
        disabled={isBusy}
      >
        Agregar clase
      </button>

      <button
        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium transition-colors hover:bg-indigo-500 disabled:opacity-50"
        onClick={onSave}
        disabled={isBusy || !isValid}
      >
        Guardar
      </button>

      <button
        className="rounded-md bg-slate-700 px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-600 disabled:opacity-50"
        onClick={onCreateManual}
        disabled={isBusy || !isValid}
      >
        Crear clase manual
      </button>

      <button
        className="rounded-md bg-slate-700 px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-600 disabled:opacity-50"
        onClick={onGenerateAuto}
        disabled={isBusy}
      >
        Generar clase automática
      </button>

      <button
        className="rounded-md bg-slate-700 px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-600 disabled:opacity-50"
        onClick={onCreateUseCaseManual}
        disabled={isBusy || !isValid}
      >
        Crear caso de uso manual
      </button>

      <button
        className="rounded-md bg-slate-700 px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-600 disabled:opacity-50"
        onClick={onGenerateUseCaseAuto}
        disabled={isBusy}
      >
        Generar caso de uso automático
      </button>

      <button
        className="rounded-md bg-rose-600 px-3 py-2 text-sm font-medium transition-colors hover:bg-rose-500 disabled:opacity-50"
        onClick={onDeleteSelected}
        disabled={isBusy || !hasSelection}
      >
        Eliminar seleccionado
      </button>
    </div>
  )
}
