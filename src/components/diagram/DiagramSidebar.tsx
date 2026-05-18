import { useState, useEffect } from 'react'
import type { DiagramNodeDTO, DiagramClassNodeDTO, DiagramRelationDTO, DiagramType } from '../../types/diagrams'
import { NodeEditor } from './NodeEditor'
import { EdgeEditor } from './EdgeEditor'
import { ClassNodeEditor } from './ClassNodeEditor'
import { UmlEdgeEditor } from './UmlEdgeEditor'
import { UseCaseNodeEditor } from './UseCaseNodeEditor'
import { UseCaseEdgeEditor } from './UseCaseEdgeEditor'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

export type EditorTarget = 'node' | 'edge' | null

export interface DiagramSidebarProps {
  editorTarget: EditorTarget
  selectedNode: DiagramNodeDTO | null
  selectedEdge: DiagramRelationDTO | null
  nodes: DiagramNodeDTO[]
  diagramType: DiagramType
  onUpdateNode: (node: DiagramNodeDTO) => void
  onUpdateEdge: (edge: DiagramRelationDTO) => void
  onDeleteNode: (id: string) => void
  onDeleteEdge: (id: string) => void
  onClose?: () => void
}

export function DiagramSidebar({
  editorTarget,
  selectedNode,
  selectedEdge,
  nodes,
  diagramType,
  onUpdateNode,
  onUpdateEdge,
  onDeleteNode,
  onDeleteEdge,
  onClose,
}: DiagramSidebarProps) {
  const isClass = diagramType === 'CLASS'
  const isUseCase = diagramType === 'USE_CASE'

  const [draftNode, setDraftNode] = useState<DiagramNodeDTO | null>(null)
  const [draftEdge, setDraftEdge] = useState<DiagramRelationDTO | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'info'; text: string } | null>(null)
  const [isSubScreen, setIsSubScreen] = useState(false)

  useEffect(() => {
    setDraftNode(selectedNode)
    setHasChanges(false)
    setFeedbackMessage(null)
    setIsSubScreen(false)
  }, [selectedNode?.id, selectedNode])

  useEffect(() => {
    setDraftEdge(selectedEdge)
    setHasChanges(false)
    setFeedbackMessage(null)
  }, [selectedEdge?.id, selectedEdge])

  const showTemporaryFeedback = (type: 'success' | 'info', text: string) => {
    setFeedbackMessage({ type, text })
    setTimeout(() => setFeedbackMessage(null), 2000)
  }

  const handleDraftNodeChange = (updated: DiagramNodeDTO) => {
    setDraftNode(updated)
    setHasChanges(true)
  }

  const handleDraftEdgeChange = (updated: DiagramRelationDTO) => {
    setDraftEdge(updated)
    setHasChanges(true)
  }

  const applyNodeChanges = () => {
    if (draftNode) {
      onUpdateNode(draftNode)
      setHasChanges(false)
      showTemporaryFeedback('success', 'Cambios aplicados correctamente')
    }
  }

  const applyEdgeChanges = () => {
    if (draftEdge) {
      onUpdateEdge(draftEdge)
      setHasChanges(false)
      showTemporaryFeedback('success', 'Cambios aplicados correctamente')
    }
  }

  const discardNodeChanges = () => {
    setDraftNode(selectedNode)
    setHasChanges(false)
    setFeedbackMessage(null)
    showTemporaryFeedback('info', 'Cambios descartados')
  }

  const discardEdgeChanges = () => {
    setDraftEdge(selectedEdge)
    setHasChanges(false)
    setFeedbackMessage(null)
    showTemporaryFeedback('info', 'Cambios descartados')
  }

  const handleDeleteNode = () => {
    if (draftNode) {
      onDeleteNode(draftNode.id)
      showTemporaryFeedback('success', 'Elemento eliminado')
    }
  }

  const handleDeleteEdge = () => {
    if (draftEdge) {
      onDeleteEdge(draftEdge.id)
      showTemporaryFeedback('success', 'Relación eliminada')
    }
  }

  // Editor de nodos
  if (editorTarget === 'node' && draftNode) {
    const nodeTitle = draftNode.name || (draftNode.kind === 'actor' ? 'Actor' : 'Elemento')
    const nodeIcon = isClass ? '📦' : (draftNode.kind === 'actor' ? '👤' : '⚙️')

    return (
      <div className="flex flex-col h-full overflow-hidden">
        {/* Unified Header */}
        <div className="px-4 py-3.5 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 dark:bg-blue-950/30 flex items-center justify-center text-lg shrink-0 border border-blue-100/50 dark:border-blue-900/30">
              {nodeIcon}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {nodeTitle}
              </h2>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                {isClass ? 'Clase' : draftNode.kind === 'actor' ? 'Actor' : 'Caso de uso'}
              </p>
            </div>
            {hasChanges && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30 shrink-0">
                Sin aplicar
              </span>
            )}
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 ml-2 shrink-0"
              title="Cerrar panel"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
          {draftNode.kind === 'package' ? (
            <div className="space-y-4">
              <Input
                label="Nombre del Paquete"
                value={draftNode.name}
                onChange={(e) => handleDraftNodeChange({ ...draftNode, name: e.target.value })}
              />
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Color</label>
                <input
                  type="color"
                  className="w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1"
                  value={draftNode.style?.color || '#ffffff'}
                  onChange={(e) => handleDraftNodeChange({
                    ...draftNode,
                    style: {
                      width: draftNode.style?.width || 300,
                      height: draftNode.style?.height || 200,
                      color: e.target.value,
                    },
                  })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Descripción</label>
                <textarea
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:border-blue-500 outline-none min-h-[100px]"
                  value={(draftNode as any).description || ''}
                  onChange={(e) => handleDraftNodeChange({ ...draftNode, description: e.target.value } as any)}
                  placeholder="Descripción del grupo..."
                />
              </div>
            </div>
          ) : isClass ? (
            <ClassNodeEditor
              node={draftNode as DiagramClassNodeDTO}
              nodes={nodes}
              onChange={handleDraftNodeChange}
              onSubScreenChange={setIsSubScreen}
            />
          ) : isUseCase ? (
            <UseCaseNodeEditor
              node={draftNode}
              type={draftNode.kind === 'actor' ? 'actor' : 'useCase'}
              onChange={handleDraftNodeChange}
            />
          ) : (
            <NodeEditor
              node={draftNode as DiagramClassNodeDTO}
              onChange={handleDraftNodeChange as any}
            />
          )}
        </div>

        {/* Unified Footer */}
        {!isSubScreen && (
          <div className="px-4 py-3.5 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/30 dark:bg-zinc-950/30 space-y-3 shrink-0">
            {feedbackMessage && (
              <div className={`text-xs px-3 py-2 rounded-md text-center ${feedbackMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30'
                  : 'bg-sky-50 text-sky-700 dark:bg-sky-950/20 dark:text-sky-400 border border-sky-100 dark:border-sky-900/30'
                }`}>
                {feedbackMessage.text}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1 border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                onClick={handleDeleteNode}
              >
                Eliminar
              </Button>
              {hasChanges && (
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={discardNodeChanges}
                >
                  Descartar
                </Button>
              )}
              <Button
                className={`flex-1 ${!hasChanges ? 'opacity-70' : ''}`}
                onClick={applyNodeChanges}
                disabled={!hasChanges}
              >
                Aplicar cambios
              </Button>
            </div>

            <p className="text-[11px] text-center text-zinc-400 dark:text-zinc-500">
              {hasChanges
                ? 'Tienes cambios pendientes. Aplica o descarta para continuar.'
                : 'Modifica los campos para editar el elemento.'}
            </p>
          </div>
        )}
      </div>
    )
  }

  // Editor de relaciones (edges)
  if (editorTarget === 'edge' && draftEdge) {
    const sourceNode = nodes.find(n => n.id === draftEdge.source)
    const targetNode = nodes.find(n => n.id === draftEdge.target)
    const sourceName = sourceNode?.name || 'Desconocido'
    const targetName = targetNode?.name || 'Desconocido'

    const edgeIcon = isClass ? '🔗' : (isUseCase ? '➡️' : '⚡')

    return (
      <div className="flex flex-col h-full overflow-hidden">
        {/* Unified Header */}
        <div className="px-4 py-3.5 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 dark:bg-blue-950/30 flex items-center justify-center text-lg shrink-0 border border-blue-100/50 dark:border-blue-900/30">
              {edgeIcon}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {sourceName} → {targetName}
              </h2>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                Relación entre elementos
              </p>
            </div>
            {hasChanges && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30 shrink-0">
                Sin aplicar
              </span>
            )}
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 ml-2 shrink-0"
              title="Cerrar panel"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
          {isClass && (
            <UmlEdgeEditor
              edge={draftEdge}
              sourceName={sourceName}
              targetName={targetName}
              onChange={handleDraftEdgeChange}
              onDelete={onDeleteEdge}
            />
          )}
          {isUseCase && (
            <UseCaseEdgeEditor
              edge={draftEdge}
              sourceName={sourceName}
              targetName={targetName}
              onChange={handleDraftEdgeChange}
              onDelete={onDeleteEdge}
            />
          )}
          {!isClass && !isUseCase && (
            <EdgeEditor edge={draftEdge} onChange={handleDraftEdgeChange} />
          )}
        </div>

        {/* Unified Footer */}
        <div className="px-4 py-3.5 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/30 dark:bg-zinc-950/30 space-y-3 shrink-0">
          {feedbackMessage && (
            <div className={`text-xs px-3 py-2 rounded-md text-center ${feedbackMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30'
                : 'bg-sky-50 text-sky-700 dark:bg-sky-950/20 dark:text-sky-400 border border-sky-100 dark:border-sky-900/30'
              }`}>
              {feedbackMessage.text}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1 border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/30"
              onClick={handleDeleteEdge}
            >
              Eliminar relación
            </Button>
            {hasChanges && (
              <Button
                variant="secondary"
                className="flex-1"
                onClick={discardEdgeChanges}
              >
                Descartar
              </Button>
            )}
            <Button
              className={`flex-1 ${!hasChanges ? 'opacity-70' : ''}`}
              onClick={applyEdgeChanges}
              disabled={!hasChanges}
            >
              Aplicar cambios
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Estado vacío mejorado
  return (
    <div className="h-full bg-app-surface rounded-xl border border-app-border shadow-sm">
      <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-app-accent/10 flex items-center justify-center mb-5">
          <svg className="w-8 h-8 text-app-accent/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-app-text-primary mb-2">
          {isClass ? 'Editor de diagrama de clases' : 'Editor de diagrama UML'}
        </h3>
        <p className="text-sm text-app-text-secondary max-w-[220px] mx-auto leading-relaxed">
          {isClass
            ? 'Selecciona una clase o relación para ver y editar sus propiedades.'
            : 'Selecciona un actor, caso de uso o flecha de relación para modificarlo.'}
        </p>
        <div className="mt-6 flex gap-2 text-xs text-app-text-tertiary">
          <kbd className="px-2 py-1 bg-app-surface/80 rounded border border-app-border font-mono">Click</kbd>
          <span>sobre cualquier elemento del diagrama</span>
        </div>
      </div>
    </div>
  )
}