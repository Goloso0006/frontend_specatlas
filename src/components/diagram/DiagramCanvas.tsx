import {
  Background,
  MiniMap,
  ReactFlow,
  useReactFlow,
  ReactFlowProvider,
  BackgroundVariant,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
  type OnEdgesChange,
  type OnNodesChange,
  type OnSelectionChangeFunc,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useEffect, useState, useMemo } from 'react'

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
  onReconnect?: (oldEdge: any, newConnection: any) => void
  onSelectionChange: OnSelectionChangeFunc
  onNodeDragStart?: (event: any, node: Node) => void
  onNodeDrag?: (event: any, node: Node) => void
  onNodeDragStop?: (event: any, node: Node) => void
  onPaneClick?: () => void
  onOpenQualityPanel?: () => void
  onAlignNodes?: (direction: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void
  onDistributeNodes?: (axis: 'horizontal' | 'vertical') => void
  onGroupIntoPackage?: () => void
  onDuplicateSelected?: () => void
  onDeleteSelected?: () => void
  onEditNode?: (id: string) => void
  onDuplicateNode?: (id: string) => void
  onAddAttribute?: (id: string) => void
  onAddMethod?: (id: string) => void
  onCreateRelation?: (id: string) => void
  onAddInclude?: (id: string) => void
  onAddExtend?: (id: string) => void
  onAddToPackage?: (id: string, pkgId: string | null) => void
  onDeleteNode?: (id: string) => void
  onUpdateEdge?: (nextEdge: DiagramRelationDTO) => void
  onUndo?: () => void
  onRedo?: () => void
  canUndo?: boolean
  canRedo?: boolean
  onSaveDiagram?: () => void
  onAddActor?: (name?: string, position?: { x: number; y: number }) => void
}

export function DiagramCanvas(props: DiagramCanvasProps) {
  const isEmpty = props.nodes.length === 0

  return (
    <ReactFlowProvider>
      <div className="w-full h-full relative flex flex-col flex-1">
        {isEmpty && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto">
              <DiagramEditorEmptyState type={props.diagramType} />
            </div>
          </div>
        )}
        <DiagramCanvasInner {...props} />
      </div>
    </ReactFlowProvider>
  )
}

function DiagramCanvasInner({
  nodes,
  edges,
  diagramType: _diagramType,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onReconnect,
  onSelectionChange,
  onNodeDragStart,
  onNodeDrag,
  onNodeDragStop,
  onPaneClick,
  onOpenQualityPanel,
  onAlignNodes,
  onDistributeNodes,
  onGroupIntoPackage,
  onDuplicateSelected,
  onDeleteSelected,
  onEditNode,
  onDuplicateNode,
  onAddAttribute,
  onAddMethod,
  onCreateRelation,
  onAddInclude,
  onAddExtend,
  onAddToPackage,
  onDeleteNode,
  onUpdateEdge,
  onUndo,
  onRedo,
  onSaveDiagram,
  onAddActor,
}: DiagramCanvasProps) {
  const { fitView, zoomTo, setCenter, getNodes, screenToFlowPosition } = useReactFlow()

  // 1. Local/Saved preferences
  const [gridType, setGridType] = useState<BackgroundVariant>(() => {
    return (localStorage.getItem('specatlas-grid-type') as BackgroundVariant) || BackgroundVariant.Dots
  })
  const [labelMode, setLabelMode] = useState<'always' | 'hover' | 'hide'>(() => {
    return (localStorage.getItem('specatlas-label-mode') as any) || 'always'
  })
  const [highlightConnectionsEnabled, setHighlightConnectionsEnabled] = useState(false)

  const handleGridTypeChange = (type: BackgroundVariant) => {
    setGridType(type)
    localStorage.setItem('specatlas-grid-type', type)
  }

  const handleLabelModeChange = (mode: 'always' | 'hover' | 'hide') => {
    setLabelMode(mode)
    localStorage.setItem('specatlas-label-mode', mode)
  }

  // Keyboard Shortcuts Hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement
      const isTyping =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
         activeEl.tagName === 'TEXTAREA' ||
         (activeEl as HTMLElement).contentEditable === 'true' ||
         activeEl.tagName === 'SELECT')

      if (isTyping) return

      const isMac = navigator.userAgent.toLowerCase().includes('mac')
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey

      // Ctrl+S / Cmd+S: Save Diagram
      if (cmdOrCtrl && e.key.toLowerCase() === 's') {
        e.preventDefault()
        onSaveDiagram?.()
        return
      }

      // Ctrl+Z / Cmd+Z: Undo
      if (cmdOrCtrl && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        onUndo?.()
        return
      }

      // Ctrl+Shift+Z / Cmd+Shift+Z / Ctrl+Y: Redo
      if (
        (cmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'z') ||
        (cmdOrCtrl && e.key.toLowerCase() === 'y')
      ) {
        e.preventDefault()
        onRedo?.()
        return
      }

      // Ctrl+D / Cmd+D: Duplicate Selected
      if (cmdOrCtrl && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        onDuplicateSelected?.()
        return
      }

      // Delete / Backspace: Delete selected
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const hasSelection = getNodes().some(n => n.selected) || edges.some(edge => edge.selected)
        if (hasSelection) {
          e.preventDefault()
          onDeleteSelected?.()
        }
        return
      }

      // Esc: Clear selection
      if (e.key === 'Escape') {
        e.preventDefault()
        onPaneClick?.()
        return
      }

      // F: Fit view
      if (e.key.toLowerCase() === 'f') {
        e.preventDefault()
        fitView({ padding: 0.15, duration: 400 })
        return
      }

      // C: Center selected
      if (e.key.toLowerCase() === 'c') {
        e.preventDefault()
        handleCenterSelection()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    onSaveDiagram,
    onUndo,
    onRedo,
    onDuplicateSelected,
    onDeleteSelected,
    onPaneClick,
    fitView,
    edges,
    getNodes
  ])

  // 2. Navigation Actions
  const handleCenterSelection = () => {
    const selected = getNodes().find(n => n.selected)
    if (selected) {
      const w = (selected.data as any)?.style?.width || 160
      const h = (selected.data as any)?.style?.height || 60
      const x = selected.position.x + w / 2
      const y = selected.position.y + h / 2
      setCenter(x, y, { zoom: 1, duration: 400 })
    }
  }

  const selectedNodes = useMemo(() => nodes.filter(n => n.selected), [nodes])
  const selectedNodeId = selectedNodes[0]?.id || null

  const highlightInfo = useMemo(() => {
    if (!highlightConnectionsEnabled || !selectedNodeId) {
      return { enabled: false, nodeIds: new Set<string>(), edgeIds: new Set<string>() }
    }

    const edgeIds = new Set<string>()
    const nodeIds = new Set<string>([selectedNodeId])

    edges.forEach(edge => {
      if (edge.source === selectedNodeId || edge.target === selectedNodeId) {
        edgeIds.add(edge.id)
        nodeIds.add(edge.source)
        nodeIds.add(edge.target)
      }
    })

    return {
      enabled: true,
      nodeIds,
      edgeIds
    }
  }, [highlightConnectionsEnabled, selectedNodeId, edges])

  // 3. Enrich edges with current labelMode & Highlight styles
  const enrichedEdges = useMemo(() => {
    return edges.map(edge => {
      const isConnected = highlightInfo.enabled && highlightInfo.edgeIds.has(edge.id)
      const shouldDim = highlightInfo.enabled && !isConnected

      return {
        ...edge,
        className: [
          edge.className || '',
          isConnected ? 'edge-highlighted' : '',
          shouldDim ? 'edge-dimmed' : ''
        ].join(' ').trim(),
        style: {
          ...edge.style,
          opacity: shouldDim ? 0.25 : 1,
          strokeWidth: isConnected ? 3 : (edge.style?.strokeWidth ?? 1.5),
        },
        data: {
          ...edge.data,
          labelMode,
          onUpdateEdge,
        }
      }
    })
  }, [edges, labelMode, onUpdateEdge, highlightInfo])

  const enrichedNodes = useMemo(() => {
    const availablePackages = nodes.filter(n => n.data.kind === 'package').map(n => ({ id: n.id, name: n.data.name }))
    return nodes.map(node => {
      const isSelected = node.id === selectedNodeId
      const isConnected = highlightInfo.enabled && highlightInfo.nodeIds.has(node.id)
      const shouldDim = highlightInfo.enabled && !isConnected

      return {
        ...node,
        className: [
          node.className || '',
          isConnected ? 'node-highlighted' : '',
          isSelected && highlightInfo.enabled ? 'node-highlighted-selected' : '',
          isConnected && !isSelected && highlightInfo.enabled ? 'node-highlighted-connected' : '',
          shouldDim ? 'node-dimmed' : ''
        ].join(' ').trim(),
        data: {
          ...node.data,
          onEditNode,
          onDuplicateNode,
          onAddAttribute,
          onAddMethod,
          onCreateRelation,
          onAddInclude,
          onAddExtend,
          onAddToPackage,
          onDeleteNode,
          availablePackages,
        }
      }
    })
  }, [nodes, onEditNode, onDuplicateNode, onAddAttribute, onAddMethod, onCreateRelation, onAddInclude, onAddExtend, onAddToPackage, onDeleteNode, selectedNodeId, highlightInfo])


  useEffect(() => {
    if (import.meta.env.DEV) {
      console.debug('[DiagramCanvas] inner state changed:', {
        nodesCount: nodes.length,
        edgesCount: edges.length,
      })
    }
  }, [nodes.length, edges.length])

  const hasSelectedNode = getNodes().some(n => n.selected)

  return (
    <div className="w-full h-full min-h-[400px] relative flex-1 min-h-0">
      {selectedNodes.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[3000] bg-zinc-900/95 dark:bg-zinc-950/95 border border-zinc-800 text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md animate-in slide-in-from-top-4 duration-300 scale-90 md:scale-100 select-none">
          <div className="flex items-center gap-1.5 border-r border-zinc-800 pr-3">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{selectedNodes.length} Nodos Seleccionados</span>
          </div>
          
          <div className="flex items-center gap-1" title="Alineación">
            <button onClick={() => onAlignNodes?.('left')} className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-300 hover:text-white transition-colors font-bold text-xs" title="Alinear izquierda">
              |←
            </button>
            <button onClick={() => onAlignNodes?.('center')} className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-300 hover:text-white transition-colors font-bold text-xs" title="Alinear centro vertical">
              →|←
            </button>
            <button onClick={() => onAlignNodes?.('right')} className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-300 hover:text-white transition-colors font-bold text-xs" title="Alinear derecha">
              →|
            </button>
            <div className="h-4 w-px bg-zinc-800 mx-1" />
            <button onClick={() => onAlignNodes?.('top')} className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-300 hover:text-white transition-colors font-bold text-xs" title="Alinear arriba">
              ↑
            </button>
            <button onClick={() => onAlignNodes?.('middle')} className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-300 hover:text-white transition-colors font-bold text-xs" title="Alinear centro horizontal">
              ↕
            </button>
            <button onClick={() => onAlignNodes?.('bottom')} className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-300 hover:text-white transition-colors font-bold text-xs" title="Alinear abajo">
              ↓
            </button>
          </div>

          <div className="h-5 w-px bg-zinc-800 mx-1" />

          <div className="flex items-center gap-1" title="Distribución">
            <button onClick={() => onDistributeNodes?.('horizontal')} className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-300 hover:text-white transition-colors font-bold text-xs" title="Distribuir horizontalmente">
              ↔
            </button>
            <button onClick={() => onDistributeNodes?.('vertical')} className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-300 hover:text-white transition-colors font-bold text-xs" title="Distribuir verticalmente">
              ↨
            </button>
          </div>

          <div className="h-5 w-px bg-zinc-800 mx-1" />

          <div className="flex items-center gap-1.5">
            <button onClick={onGroupIntoPackage} className="px-2.5 py-1.5 hover:bg-zinc-800 rounded-lg text-zinc-300 hover:text-white transition-colors text-xs font-bold flex items-center gap-1" title="Agrupar en Paquete">
              📦 Agrupar
            </button>
            <button onClick={onDuplicateSelected} className="px-2.5 py-1.5 hover:bg-zinc-800 rounded-lg text-zinc-300 hover:text-white transition-colors text-xs font-bold flex items-center gap-1" title="Duplicar elementos">
              📋 Duplicar
            </button>
            <button onClick={onDeleteSelected} className="px-2.5 py-1.5 hover:bg-rose-950/30 hover:text-rose-400 rounded-lg text-rose-500 transition-colors text-xs font-bold flex items-center gap-1" title="Eliminar seleccionados">
              🗑️ Eliminar
            </button>
          </div>
        </div>
      )}

      <ReactFlow
        className="w-full h-full"
        style={{ width: '100%', height: '100%' }}
        nodes={enrichedNodes}
        edges={enrichedEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onReconnect={onReconnect}
        onSelectionChange={onSelectionChange}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onPaneClick={onPaneClick}
        onDragOver={(event) => {
          event.preventDefault()
          event.dataTransfer.dropEffect = 'move'
        }}
        onDrop={(event) => {
          event.preventDefault()
          try {
            const dataStr = event.dataTransfer.getData('application/reactflow')
            if (!dataStr) return
            const { type, name } = JSON.parse(dataStr)
            if (type === 'actorNode' && onAddActor) {
              const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
              })
              onAddActor(name, position)
            }
          } catch (err) {
            console.error('Error handling drop on reactflow:', err)
          }
        }}
        fitView
        nodesConnectable={true}
        edgesReconnectable={true}
        minZoom={0.02}
        maxZoom={2.0}
        colorMode="dark"
        elevateEdgesOnSelect={false}
        elevateNodesOnSelect={false}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: false,
          zIndex: 1000,
        }}
      >
        <UmlMarkers />
        {gridType !== ('none' as any) && (
          <Background 
            variant={gridType} 
            gap={24} 
            size={gridType === BackgroundVariant.Lines ? 1 : 1.5} 
            color="currentColor" 
            className="text-slate-400/10 dark:text-slate-600/10" 
          />
        )}
        <MiniMap
          nodeColor={(n) => {
            if (n.type === 'packageNode') return '#475569'
            if (n.type === 'classNode') return '#3b82f6'
            if (n.type === 'actorNode') return '#10b981'
            return '#6366f1'
          }}
          maskColor="rgba(15, 23, 42, 0.4)"
          style={{
            backgroundColor: 'var(--color-bg-card)',
            borderRadius: '16px',
            border: '1.5px solid var(--color-border)',
            bottom: '16px',
            right: '16px',
          }}
          pannable
          zoomable
        />
      </ReactFlow>

      {/* Floating navigation controls panel (Bottom-Left) */}
      <div className="absolute bottom-4 left-4 z-30 flex items-center gap-1.5 p-1 rounded-2xl bg-white/90 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-2xl transition-all duration-300">
        <button
          onClick={() => fitView({ padding: 0.15, duration: 400 })}
          className="px-2.5 py-1.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-500 dark:hover:text-blue-400 transition-all font-bold text-[11px] flex items-center gap-1"
          title="Ajustar vista"
        >
          🔍 Ajustar
        </button>

        <button
          onClick={() => zoomTo(1, { duration: 400 })}
          className="px-2.5 py-1.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-500 dark:hover:text-blue-400 transition-all font-bold text-[11px]"
          title="Zoom 1:1"
        >
          1:1
        </button>

        {hasSelectedNode && (
          <button
            onClick={handleCenterSelection}
            className="px-2.5 py-1.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-500 dark:hover:text-blue-400 transition-all font-bold text-[11px] flex items-center gap-1"
            title="Centrar elemento seleccionado"
          >
            🎯 Centrar
          </button>
        )}

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-800/60 mx-1" />

        <button
          onClick={() => {
            const nextGrid = 
              gridType === BackgroundVariant.Dots 
                ? BackgroundVariant.Lines 
                : gridType === BackgroundVariant.Lines 
                  ? 'none' 
                  : BackgroundVariant.Dots
            handleGridTypeChange(nextGrid as any)
          }}
          className="px-2.5 py-1.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-500 dark:hover:text-blue-400 transition-all font-bold text-[11px] flex items-center gap-1"
          title="Cambiar cuadrícula"
        >
          🌐 <span className="capitalize">{gridType === BackgroundVariant.Dots ? 'puntos' : gridType === BackgroundVariant.Lines ? 'cuadrícula' : 'liso'}</span>
        </button>

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-800/60 mx-1" />

        <button
          onClick={() => {
            const nextMode = 
              labelMode === 'always' 
                ? 'hover' 
                : labelMode === 'hover' 
                  ? 'hide' 
                  : 'always'
            handleLabelModeChange(nextMode)
          }}
          className="px-2.5 py-1.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-500 dark:hover:text-blue-400 transition-all font-bold text-[11px]"
          title="Visibilidad de etiquetas"
        >
          🏷️ <span className="capitalize">{labelMode === 'always' ? 'ver' : labelMode === 'hover' ? 'cursor' : 'ocultar'}</span>
        </button>

        {onOpenQualityPanel && (
          <>
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-800/60 mx-1" />
            <button
              onClick={onOpenQualityPanel}
              className="px-2.5 py-1.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-500 dark:hover:text-blue-400 transition-all font-bold text-[11px] flex items-center gap-1"
              title="Calidad y advertencias del diagrama"
            >
              📊 Calidad
            </button>
          </>
        )}

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-800/60 mx-1" />
        <button
          disabled={!selectedNodeId}
          onClick={() => setHighlightConnectionsEnabled(prev => !prev)}
          className={`px-2.5 py-1.5 rounded-xl transition-all font-bold text-[11px] flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed ${
            highlightConnectionsEnabled && selectedNodeId
              ? 'bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-500 dark:hover:text-blue-400'
          }`}
          title={selectedNodeId ? "Destacar relaciones del nodo seleccionado" : "Selecciona un elemento para destacar sus relaciones"}
        >
          ✨ {highlightConnectionsEnabled && selectedNodeId ? 'Enfocado' : 'Destacar relaciones'}
        </button>
      </div>
    </div>
  )
}
