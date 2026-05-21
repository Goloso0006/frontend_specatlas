import { useState, useEffect, useRef } from 'react'
import type { DiagramNodeDTO, DiagramClassNodeDTO, DiagramRelationDTO, DiagramType, ModelingAsset } from '../../types/diagrams'
import { NodeEditor } from './NodeEditor'
import { EdgeEditor } from './EdgeEditor'
import { ClassNodeEditor } from './ClassNodeEditor'
import { UmlEdgeEditor } from './UmlEdgeEditor'
import { UseCaseNodeEditor } from './UseCaseNodeEditor'
import { UseCaseEdgeEditor } from './UseCaseEdgeEditor'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { diagramsApi } from '../../api/services/diagramsApi'

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
  sidebarTabPreference?: string | null
  setSidebarTabPreference?: (val: string | null) => void
  projectId?: string
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
  sidebarTabPreference,
  setSidebarTabPreference,
  projectId,
}: DiagramSidebarProps) {
  const isClass = diagramType === 'CLASS'
  const isUseCase = diagramType === 'USE_CASE'

  const [draftNode, setDraftNode] = useState<DiagramNodeDTO | null>(null)
  const [draftEdge, setDraftEdge] = useState<DiagramRelationDTO | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'info'; text: string } | null>(null)
  const [isSubScreen, setIsSubScreen] = useState(false)

  const [assets, setAssets] = useState<ModelingAsset[]>([])
  const [isLoadingAssets, setIsLoadingAssets] = useState(false)
  const [assetsError, setAssetsError] = useState<string | null>(null)

  useEffect(() => {
    if (isUseCase && editorTarget === null && projectId) {
      let isMounted = true
      setIsLoadingAssets(true)
      setAssetsError(null)
      diagramsApi.getModelingAssets(projectId)
        .then(res => {
          if (isMounted) {
            setAssets(res || [])
          }
        })
        .catch(err => {
          console.error("Error loading modeling assets:", err)
          if (isMounted) {
            setAssetsError("Error al cargar recursos del proyecto.")
          }
        })
        .finally(() => {
          if (isMounted) {
            setIsLoadingAssets(false)
          }
        })
      return () => {
        isMounted = false
      }
    }
  }, [isUseCase, editorTarget, projectId])

  const prevSelectedNodeIdRef = useRef<string | null>(null)

  useEffect(() => {
    // Only reset draftNode and hasChanges when switching to a DIFFERENT node
    if (selectedNode?.id !== prevSelectedNodeIdRef.current) {
      setDraftNode(selectedNode)
      setHasChanges(false)
      setFeedbackMessage(null)
      setIsSubScreen(false)
      prevSelectedNodeIdRef.current = selectedNode?.id ?? null
    } else {
      // ID is the same, but check if there was an external change (e.g., Undo/Redo)
      // that makes selectedNode structurally different from our draftNode
      if (selectedNode && JSON.stringify(selectedNode) !== JSON.stringify(draftNode)) {
        setDraftNode(selectedNode)
        setHasChanges(false)
      }
    }
  }, [selectedNode, draftNode])

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
    if (import.meta.env.DEV) {
      console.log("[METHOD_GENERATE_EDITOR_DRAFT]", (updated as any).methods)
    }
    setDraftNode(updated)
    setHasChanges(true)
    onUpdateNode(updated)
    if (import.meta.env.DEV) {
      console.log("[METHOD_GENERATE_NODE_DATA]", {
        nodeId: updated.id,
        methods: (updated as any).methods
      })
    }
  }

  const handleDraftEdgeChange = (updated: DiagramRelationDTO) => {
    setDraftEdge(updated)
    setHasChanges(true)
    onUpdateEdge(updated)
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

  // Recursos del proyecto para diagramas de casos de uso (si no hay elemento seleccionado)
  if (isUseCase && editorTarget === null) {
    const actors = assets.filter(a => a.type === 'ACTOR')

    return (
      <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-zinc-950">
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 dark:bg-purple-950/30 flex items-center justify-center text-lg shrink-0 border border-purple-100/50 dark:border-purple-900/30">
              👤
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Recursos del Proyecto
              </h2>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                Arrastra actores al lienzo
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 ml-2"
              title="Cerrar panel"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {isLoadingAssets ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3 text-center">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-zinc-400 dark:text-zinc-500">Cargando recursos...</p>
            </div>
          ) : assetsError ? (
            <div className="text-center py-8 text-xs text-red-500">{assetsError}</div>
          ) : actors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-400 dark:text-zinc-500 space-y-2">
              <span className="text-3xl opacity-30">👤</span>
              <p className="text-xs font-medium">No se encontraron actores en este proyecto.</p>
              <p className="text-[10px] opacity-75 max-w-[200px]">Crea requisitos que involucren actores para que la IA los detecte automáticamente.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {actors.map(asset => (
                <div
                  key={asset.id}
                  draggable={true}
                  onDragStart={(event) => {
                    event.dataTransfer.setData("application/reactflow", JSON.stringify({ type: 'actorNode', name: asset.name }));
                    event.dataTransfer.effectAllowed = 'move';
                  }}
                  className="group relative flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl cursor-grab active:cursor-grabbing hover:border-purple-500/50 hover:shadow-[0_0_12px_rgba(139,92,246,0.15)] transition-all duration-300"
                >
                  <div className="w-7 h-7 rounded-md bg-purple-500/10 dark:bg-purple-950/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0 border border-purple-200/20">
                     👤
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-zinc-700 dark:text-zinc-350 truncate">
                      {asset.name}
                    </p>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                      Actor del proyecto
                    </p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-purple-500 dark:text-purple-400 font-medium shrink-0 flex items-center gap-1">
                    <span>Arrastrar</span>
                    <svg className="w-3 h-3 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Footer helper */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/30 dark:bg-zinc-950/30 text-center shrink-0">
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
            💡 Consejo: Arrastra y suelta un actor sobre el lienzo de diagramas para agregarlo instantáneamente.
          </p>
        </div>
      </div>
    )
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
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <Input
                label="Nombre del Paquete"
                value={draftNode.name}
                onChange={(e) => handleDraftNodeChange({ ...draftNode, name: e.target.value })}
              />

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Preajustes de Color</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Azul', value: '#3b82f6' },
                    { label: 'Verde', value: '#10b981' },
                    { label: 'Gris', value: '#64748b' },
                    { label: 'Violeta', value: '#8b5cf6' },
                    { label: 'Rojo', value: '#ef4444' },
                    { label: 'Dorado', value: '#d97706' },
                  ].map(preset => (
                    <button
                      key={preset.value}
                      onClick={() => handleDraftNodeChange({
                        ...draftNode,
                        style: {
                          width: draftNode.style?.width || 300,
                          height: draftNode.style?.height || 200,
                          color: preset.value,
                        },
                      })}
                      className={`w-6 h-6 rounded-full border border-zinc-200 dark:border-zinc-800 transition-all ${draftNode.style?.color === preset.value ? 'ring-2 ring-blue-500 scale-110 shadow' : 'hover:scale-105'}`}
                      style={{ backgroundColor: preset.value }}
                      title={preset.label}
                    />
                  ))}
                  <input
                    type="color"
                    className="w-6 h-6 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white p-0.5 cursor-pointer"
                    value={draftNode.style?.color || '#ffffff'}
                    onChange={(e) => handleDraftNodeChange({
                      ...draftNode,
                      style: {
                        width: draftNode.style?.width || 300,
                        height: draftNode.style?.height || 200,
                        color: e.target.value,
                      },
                    })}
                    title="Color personalizado"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Descripción</label>
                <textarea
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:border-blue-500 outline-none min-h-[80px]"
                  value={(draftNode as any).description || ''}
                  onChange={(e) => handleDraftNodeChange({ ...draftNode, description: e.target.value } as any)}
                  placeholder="Descripción del grupo..."
                />
              </div>

              <label className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-850 cursor-pointer select-none nodrag">
                <input
                  type="checkbox"
                  checked={!!(draftNode as any).locked}
                  onChange={(e) => handleDraftNodeChange({ ...draftNode, locked: e.target.checked } as any)}
                  className="w-4 h-4 text-blue-600 rounded border-zinc-300"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-350">Bloquear paquete</span>
                  <span className="text-[9px] text-zinc-400">Previene arrastres o traslados en el lienzo</span>
                </div>
              </label>

              {nodes.filter(n => (n as any).packageId === draftNode.id).length > 0 && (
                <button
                  onClick={() => {
                    const contained = nodes.filter(n => (n as any).packageId === draftNode.id)
                    if (contained.length === 0) return
                    let minX = Infinity
                    let maxX = -Infinity
                    let minY = Infinity
                    let maxY = -Infinity
                    contained.forEach(node => {
                      const w = node.kind === 'class' ? 260 : node.kind === 'useCase' ? 160 : 120
                      const h = node.kind === 'class' ? 200 : node.kind === 'useCase' ? 80 : 120
                      const x = node.position.x
                      const y = node.position.y
                      if (x < minX) minX = x
                      if (x + w > maxX) maxX = x + w
                      if (y < minY) minY = y
                      if (y + h > maxY) maxY = y + h
                    })
                    handleDraftNodeChange({
                      ...draftNode,
                      position: { x: minX - 30, y: minY - 50 },
                      style: {
                        ...draftNode.style,
                        width: maxX - minX + 60,
                        height: maxY - minY + 80
                      }
                    })
                  }}
                  className="w-full py-2 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 rounded-xl font-bold text-xs hover:bg-blue-100 transition-colors"
                >
                  ⚡ Auto-ajustar a elementos hijos
                </button>
              )}

              <div className="space-y-2 border-t border-zinc-100 dark:border-zinc-900 pt-3">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Elementos Contenidos</span>
                <div className="space-y-1.5 max-h-[150px] overflow-y-auto custom-scrollbar">
                  {nodes.filter(n => (n as any).packageId === draftNode.id).map(child => (
                    <div key={child.id} className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 text-[11px]">
                      <span className="font-bold text-zinc-700 dark:text-zinc-300 truncate pr-2">
                        {child.name}
                      </span>
                      <button
                        onClick={() => {
                          const updatedChild = {
                            ...child,
                            packageId: undefined
                          }
                          onUpdateNode(updatedChild)
                        }}
                        className="text-rose-500 hover:text-rose-600 font-bold shrink-0"
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                  {nodes.filter(n => (n as any).packageId === draftNode.id).length === 0 && (
                    <p className="text-[11px] italic text-zinc-400 text-center py-2">Ningún elemento dentro del paquete</p>
                  )}
                </div>
              </div>
            </div>
          ) : isClass ? (
            <ClassNodeEditor
              node={draftNode as DiagramClassNodeDTO}
              nodes={nodes}
              onChange={handleDraftNodeChange}
              onSubScreenChange={setIsSubScreen}
              initialTabPreference={sidebarTabPreference}
              onClearTabPreference={() => setSidebarTabPreference?.(null)}
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
              nodes={nodes}
              onChange={handleDraftEdgeChange}
              onDelete={onDeleteEdge}
            />
          )}
          {isUseCase && (
            <UseCaseEdgeEditor
              edge={draftEdge}
              sourceName={sourceName}
              targetName={targetName}
              nodes={nodes}
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