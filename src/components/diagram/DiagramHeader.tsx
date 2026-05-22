import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
  isDirty?: boolean
  lastSavedTime?: number | null
  onUndo?: () => void
  onRedo?: () => void
  canUndo?: boolean
  canRedo?: boolean
  diagramType: string // Added!
  onBack?: () => void
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
  isDirty = false,
  lastSavedTime = null,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  diagramType, // Added!
  onBack,
}: DiagramHeaderProps) {
  const [timeAgo, setTimeAgo] = useState('')
  const { projectId } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    if (!lastSavedTime) {
      setTimeAgo('')
      return
    }
    const update = () => {
      const diff = Math.floor((Date.now() - lastSavedTime) / 1000)
      if (diff < 5) {
        setTimeAgo('Guardado hace un momento')
      } else if (diff < 60) {
        setTimeAgo(`Guardado hace ${diff} segundos`)
      } else {
        const mins = Math.floor(diff / 60)
        setTimeAgo(`Guardado hace ${mins} min`)
      }
    }
    update()
    const t = setInterval(update, 10000)
    return () => clearInterval(t)
  }, [lastSavedTime])

  return (
    <header className="h-12 border-b border-(--color-border) bg-(--color-bg) flex items-center px-4 shrink-0 justify-between z-10">
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            if (onBack) {
              onBack()
            } else {
              const typePath = diagramType === 'CLASS' ? 'class' : 'use-case'
              navigate(`/app/projects/${projectId}/diagrams/${typePath}`)
            }
          }}
          className="h-8 w-8 rounded-xl border border-(--color-border-strong) bg-(--color-surface) text-(--color-text-muted) hover:bg-(--color-accent-subtle) hover:text-(--color-accent) flex items-center justify-center transition-all duration-200"
          title="Volver"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <input
            className="bg-transparent border-b border-transparent hover:border-(--color-border) focus:border-(--color-accent) text-xs font-semibold text-(--color-text-primary) focus:outline-none px-1 py-0.5 transition-colors w-40"
            value={diagramName}
            onChange={e => setDiagramName(e.target.value)}
            placeholder="Sin nombre"
            title="Editar nombre del diagrama"
          />
        </div>

        {/* Premium Save Status Indicator Bar */}
        <div className="flex items-center gap-2">
          {status === 'saving' ? (
            <span className="text-[10px] text-blue-500 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-medium animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-(--color-accent) animate-ping" />
              Guardando...
            </span>
          ) : status === 'error' ? (
            <span className="text-[10px] text-red-500 bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-medium">
              ⚠️ Error al guardar
            </span>
          ) : isDirty ? (
            <span className="text-[10px] text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-medium animate-pulse">
              ✏️ Cambios sin guardar
            </span>
          ) : lastSavedTime ? (
            <span className="text-[10px] text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-medium">
              ✓ {timeAgo}
            </span>
          ) : (
            <span className="text-[10px] text-(--color-text-muted) bg-(--color-surface) px-2.5 py-0.5 rounded-full border border-(--color-border)">
              {isGlobalLoading ? 'Sincronizando...' : 'Guardado'}
            </span>
          )}

          {saveFeedback && saveFeedback.type === 'error' && (
            <span className="text-[10px] px-2 py-0.5 rounded-full border text-red-400 bg-red-400/10 border-red-400/20 font-medium">
              {saveFeedback.message}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Undo / Redo Actions Group */}
        <div className="flex items-center gap-1 border-r border-(--color-border) pr-2.5 mr-1">
          <button
            onClick={onUndo}
            disabled={!canUndo || isGlobalLoading || status === 'saving'}
            className="h-7 w-7 rounded-md border border-(--color-border) bg-(--color-bg-card) text-(--color-text-secondary) hover:bg-(--color-surface) flex items-center justify-center transition-colors disabled:opacity-30 disabled:hover:bg-(--color-bg-card)"
            title="Deshacer (Ctrl+Z)"
          >
            <svg className="w-3.5 h-3.5 text-(--color-text-primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo || isGlobalLoading || status === 'saving'}
            className="h-7 w-7 rounded-md border border-(--color-border) bg-(--color-bg-card) text-(--color-text-secondary) hover:bg-(--color-surface) flex items-center justify-center transition-colors disabled:opacity-30 disabled:hover:bg-(--color-bg-card)"
            title="Rehacer (Ctrl+Y / Ctrl+Shift+Z)"
          >
            <svg className="w-3.5 h-3.5 text-(--color-text-primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
            </svg>
          </button>
        </div>

        <button
          onClick={onGenerateAutoDiagram}
          disabled={isGlobalLoading || status === 'saving'}
          className="h-7 px-2.5 text-[11px] font-medium rounded-md border border-(--color-border) bg-(--color-bg-card) text-(--color-text-secondary) hover:bg-(--color-surface) transition-colors disabled:opacity-50 flex items-center gap-1"
          title="Generar diagrama con IA"
        >
          <svg className="w-3.5 h-3.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          IA
        </button>

        <button
          onClick={() => onSaveDiagram(false)}
          disabled={isGlobalLoading || status === 'saving' || !diagramName.trim()}
          className="h-7 px-2.5 text-[11px] font-medium rounded-md border border-(--color-accent) bg-(--color-accent) text-white hover:bg-(--color-accent-hover) transition-colors disabled:opacity-50 flex items-center gap-1 shadow-sm font-semibold"
        >
          {status === 'saving' ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Guardando
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Guardar
            </>
          )}
        </button>

        <button
          onClick={onDeleteSelected}
          disabled={isGlobalLoading || status === 'saving' || !hasSelection}
          className="h-7 px-2.5 text-[11px] font-medium rounded-md border border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors disabled:opacity-50 flex items-center gap-1"
          title="Eliminar seleccionado"
        >
          <svg className="w-3.5 h-3.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Eliminar
        </button>
      </div>
    </header>
  )
}
