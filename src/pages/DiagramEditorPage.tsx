import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import {
  applyEdgeChanges,
  applyNodeChanges,
  addEdge,
  type Connection,
  type Edge,
  type Node,
  type OnEdgesChange,
  type OnNodesChange,
  type OnSelectionChangeFunc,
} from '@xyflow/react'
import { diagramFacade } from '../facades/diagram.facade'
import { useApiOperation } from '../hooks/useLoadingError'
import { isValidProjectId } from '../context/ProjectContext'
import { NoProjectSelected } from '../components/ui/NoProjectSelected'
import { DiagramCanvas } from '../components/diagram/DiagramCanvas'
import { DiagramSidebar, type EditorTarget } from '../components/diagram/DiagramSidebar'
import { DiagramToolbar } from '../components/diagram/DiagramToolbar'
import { useDiagramEditorStore } from '../state/diagramEditor.store'
import { Button } from '../components/ui/Button'
import type {
  DiagramNodeDTO,
  DiagramRelationDTO,
  DiagramType,
  DiagramUmlType,
  DiagramResponse,
  DiagramValidationResult,
  DiagramRelationshipType,
  DiagramUseCaseRelationshipType,
} from '../types/diagrams'
import {
  createDiagramClassNode,
  createDiagramRelation,
  diagramSourceToReactFlow,
  parseDiagramSource,
  reactFlowToDiagramSource,
  serializeDiagramSource,
  validateDiagramSource,
} from '../utils/diagramMapper'
import { validateClassDiagram } from '../utils/classDiagramValidator'
import { validateUseCaseDiagram } from '../utils/useCaseDiagramValidator'
import { DiagramValidationModal } from '../components/diagram/DiagramValidationModal'
import { mapGeneratedClassDiagramToCanvas, mapGeneratedUseCaseDiagramToCanvas, type GeneratedCanvas } from '../utils/generatedDiagramMapper'
import { mergeDiagramSources } from '../utils/diagramMergeUtils'
import { GeneratedDiagramReviewModal } from '../components/diagram/GeneratedDiagramReviewModal'
import { createActorNode, createUseCaseNode } from '../utils/useCaseDiagramUtils'
import { DiagramErrorBoundary } from '../components/diagram/DiagramErrorBoundary'

/* ── Tipos locales ── */
type SaveFeedback = {
  type: 'success' | 'error' | 'info'
  message: string
} | null

/* ── Constantes ── */
const HELP_TIPS = [
  'Arrastra elementos para organizarlos',
  'Conecta nodos desde sus puntos de enlace',
  'Selecciona un elemento para editarlo',
  'Guarda antes de generar PlantUML',
] as const

export function DiagramEditorPage() {
  const { projectId: routeProjectId, diagramId: routeDiagramId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const newType = searchParams.get('type') as DiagramType | null
  const actionParam = searchParams.get('action')

  const { state: editorState, actions: editorActions } = useDiagramEditorStore()
  const { run, isLoading: isGlobalLoading } = useApiOperation()

  const [projectId, setProjectId] = useState(routeProjectId ?? '')
  const [diagramId, setDiagramId] = useState(routeDiagramId ?? '')
  const [diagramName, setDiagramName] = useState('Nuevo Diagrama')
  const [diagramType, setDiagramType] = useState<DiagramType>(newType || 'CLASS')

  const isClass = diagramType === 'CLASS'
  const isUseCase = diagramType === 'USE_CASE'
  const isTypeSupported = isClass || isUseCase

  // plantUmlPreview removed: UI no longer shows PlantUML export/preview
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [editorTarget, setEditorTarget] = useState<EditorTarget>(null)

  const [validationResult, setValidationResult] = useState<DiagramValidationResult | null>(null)
  const [showValidationModal, setShowValidationModal] = useState(false)
  const [aiProposal, setAiProposal] = useState<GeneratedCanvas | null>(null)
  const [showAiModal, setShowAiModal] = useState(false)

  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [saveFeedback, setSaveFeedback] = useState<SaveFeedback>(null)
  const [currentTipIndex, setCurrentTipIndex] = useState(0)

  const [nodes, setNodes] = useState<Node<DiagramNodeDTO>[]>([])
  const [edges, setEdges] = useState<Edge<DiagramRelationDTO>[]>([])

  const selectedNode = useMemo(() => nodes.find(n => n.id === selectedNodeId) ?? null, [nodes, selectedNodeId])
  const selectedEdge = useMemo(() => edges.find(e => e.id === selectedEdgeId) ?? null, [edges, selectedEdgeId])

  /* ── Validación unificada ── */
  const validation = useMemo(() => {
    const source = reactFlowToDiagramSource(nodes, edges, diagramType)
    if (isClass) return validateClassDiagram(source.nodes, source.edges)
    if (isUseCase) return validateUseCaseDiagram(source.nodes, source.edges)
    return validateDiagramSource(source)
  }, [nodes, edges, diagramType, isClass, isUseCase])

  /* ── Helpers ── */
  const showFeedback = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    setSaveFeedback({ type, message })
    setTimeout(() => setSaveFeedback(null), 3500)
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedNodeId(null)
    setSelectedEdgeId(null)
    setEditorTarget(null)
  }, [])

  /* ── Sincronización segura ── */
  const syncDiagramResponse = useCallback(
    (response: DiagramResponse, message = 'Diagrama cargado.') => {
      if (response.id !== diagramId) {
        navigate(`/app/projects/${response.projectId}/diagrams/${response.id}`, { replace: true })
      }
      setDiagramId(response.id)
      setProjectId(response.projectId)
      setDiagramName(response.name)
      setDiagramType(response.diagramType)

      const source = parseDiagramSource(response.sourceJson)
      const flow = diagramSourceToReactFlow(source)
      setNodes(flow.nodes)
      setEdges(flow.edges)
     
       if (import.meta.env.DEV) {
         console.debug('[DiagramEditor] syncDiagramResponse:', {
           diagramId: response.id,
           diagramType: response.diagramType,
           sourceJsonType: typeof response.sourceJson,
           sourceJson: response.sourceJson,
           parsedSource: source,
           flowNodes: flow.nodes,
           flowEdges: flow.edges,
           nodesCount: flow.nodes.length,
           edgesCount: flow.edges.length
         })
       }
      clearSelection()
      editorActions.editing(message)
      showFeedback('success', message)
    },
    [diagramId, navigate, clearSelection, editorActions, showFeedback]
  )

  /* ── Carga inicial ── */
  const handleLoadDiagram = useCallback(
    async (id: string) => {
      if (import.meta.env.DEV) console.debug('[DiagramEditor] handleLoadDiagram id=', id)
      const data = await run(() => diagramFacade.getById(id), { errorMessage: 'Error al cargar el diagrama.' })
      if (import.meta.env.DEV) console.debug('[DiagramEditor] handleLoadDiagram response=', data)
      if (data) syncDiagramResponse(data)
    },
    [run, syncDiagramResponse]
  )

  useEffect(() => {
    if (import.meta.env.DEV) console.debug('[DiagramEditor] useEffect routeDiagramId,newType,actionParam=', { routeDiagramId, newType, actionParam })
    if (routeDiagramId) {
      handleLoadDiagram(routeDiagramId)
    } else if (newType) {
      setDiagramType(newType)
      setDiagramName(`Nuevo Diagrama de ${newType === 'CLASS' ? 'Clases' : 'Casos de Uso'}`)
      if (actionParam === 'generate' && isValidProjectId(routeProjectId)) {
        setTimeout(() => {
          handleGenerateAutoDiagram()
        }, 300)
      }
    }
  }, [routeDiagramId, newType, actionParam, routeProjectId])

  /* ── Guards ── */
  if (!isValidProjectId(routeProjectId)) {
    return <NoProjectSelected message="Selecciona un proyecto válido para administrar diagramas." />
  }

  if (!isTypeSupported && !routeDiagramId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--color-bg)]">
        <div className="text-center p-8 bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border)] max-w-md">
          <div className="w-16 h-16 rounded-full bg-[var(--color-accent-subtle)] text-[var(--color-accent)] flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">Tipo de diagrama no soportado</h2>
          <p className="text-[var(--color-text-secondary)] mb-6">Solo se pueden crear diagramas de Clases o de Casos de Uso en esta fase.</p>
          <Button onClick={() => navigate(`/app/projects/${projectId}/diagrams`)}>Volver a la biblioteca</Button>
        </div>
      </div>
    )
  }

  /* ── Manejadores de React Flow ── */
  const handleNodesChange: OnNodesChange = useCallback((changes) => {
    setNodes(nds => applyNodeChanges(changes, nds) as Node<DiagramNodeDTO>[])
  }, [])

  const handleEdgesChange: OnEdgesChange = useCallback((changes) => {
    setEdges(eds => applyEdgeChanges(changes, eds) as Edge<DiagramRelationDTO>[])
  }, [])

  const handleSelectIssue = useCallback((targetType: 'node' | 'edge' | 'diagram', targetId?: string) => {
    if (targetType === 'diagram' || !targetId) return
    if (targetType === 'node') {
      setSelectedNodeId(targetId)
      setSelectedEdgeId(null)
      setEditorTarget('node')
    } else {
      setSelectedEdgeId(targetId)
      setSelectedNodeId(null)
      setEditorTarget('edge')
    }
    setShowValidationModal(false)
  }, [])

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return

      setEdges(eds => {
        const duplicate = eds.find(
          e => e.source === connection.source && e.target === connection.target
        )
        if (duplicate) return eds

        const relDTO = createDiagramRelation(connection.source, connection.target)

        if (diagramType === 'USE_CASE') {
          const sourceNode = nodes.find(n => n.id === connection.source)
          const targetNode = nodes.find(n => n.id === connection.target)
          let relType: DiagramRelationshipType | DiagramUseCaseRelationshipType = 'ASSOCIATION'
          if (sourceNode?.data.kind === 'useCase' && targetNode?.data.kind === 'useCase') {
            relType = 'INCLUDE'
          } else if (sourceNode?.data.kind === 'actor' && targetNode?.data.kind === 'actor') {
            relType = 'GENERALIZATION'
          }
          relDTO.type = 'useCaseEdge'
          relDTO.data = { relationshipType: relType, label: '', description: '' }
        }

        const newEdge: Edge<DiagramRelationDTO> = {
          id: relDTO.id,
          source: relDTO.source,
          target: relDTO.target,
          type: relDTO.type || (diagramType === 'USE_CASE' ? 'useCaseEdge' : 'umlEdge'),
          data: relDTO,
          label: relDTO.data?.label || '',
        }

        return addEdge(newEdge, eds)
      })
    },
    [diagramType, nodes]
  )

  const handleSelectionChange: OnSelectionChangeFunc = useCallback(
    ({ nodes: selectedNodes, edges: selectedEdges }) => {
      const hasSelection = selectedNodes.length > 0 || selectedEdges.length > 0
      setSelectedNodeId(selectedNodes[0]?.id ?? null)
      setSelectedEdgeId(selectedEdges[0]?.id ?? null)
      setEditorTarget(selectedNodes[0] ? 'node' : selectedEdges[0] ? 'edge' : null)

      if (hasSelection && !isSidebarOpen) {
        setIsSidebarOpen(true)
      }
    },
    [isSidebarOpen]
  )

  /* ── Operaciones con nodos ── */
  const getNextNodeName = useCallback(
    (base: string) => {
      let name = base
      let counter = 1
      const names = new Set(nodes.map(n => n.data.name.toLowerCase()))
      while (names.has(name.toLowerCase())) {
        counter++
        name = `${base}${counter}`
      }
      return name
    },
    [nodes]
  )

  const getNextNodePosition = useCallback(() => {
    const x = 120 + (nodes.length % 4) * 280
    const y = 120 + Math.floor(nodes.length / 4) * 250
    return { x, y }
  }, [nodes.length])

  const addNodeToCanvas = useCallback(
    (nodeDTO: DiagramNodeDTO, nodeType: string) => {
      const newNode: Node<DiagramNodeDTO> = {
        id: nodeDTO.id,
        type: nodeType,
        position: nodeDTO.position,
        data: nodeDTO,
        selected: true,
      }
      setNodes(nds => [...nds.map(n => ({ ...n, selected: false })), newNode])
      setSelectedNodeId(newNode.id)
      setEditorTarget('node')
    },
    []
  )

  const handleAddElement = useCallback(
    (umlType: DiagramUmlType) => {
      const names: Record<string, string> = {
        CLASS: 'NuevaClase',
        ABSTRACT_CLASS: 'NuevaClaseAbstracta',
        INTERFACE: 'NuevaInterfaz',
        ENUM: 'NuevaEnumeracion',
      }
      const baseName = names[umlType] || 'NuevoElemento'
      const name = getNextNodeName(baseName)
      const position = getNextNodePosition()
      const nodeDTO = createDiagramClassNode(name, position, umlType)
      addNodeToCanvas(nodeDTO, 'classNode')
    },
    [getNextNodeName, getNextNodePosition, addNodeToCanvas]
  )

  const handleAddActor = useCallback(() => {
    const name = getNextNodeName('Actor')
    const position = getNextNodePosition()
    const nodeDTO = createActorNode(name)
    nodeDTO.position = position
    addNodeToCanvas(nodeDTO, 'actorNode')
  }, [getNextNodeName, getNextNodePosition, addNodeToCanvas])

  const handleAddUseCase = useCallback(() => {
    const name = getNextNodeName('Nuevo caso de uso')
    const position = getNextNodePosition()
    const nodeDTO = createUseCaseNode(name)
    nodeDTO.position = position
    addNodeToCanvas(nodeDTO, 'useCaseNode')
  }, [getNextNodeName, getNextNodePosition, addNodeToCanvas])

  const handleAddPackage = useCallback(() => {
    const name = getNextNodeName('Paquete')
    const position = getNextNodePosition()
    const nodeDTO: any = {
      id: `pkg-${crypto.randomUUID()}`,
      kind: 'package',
      name,
      description: '',
      position,
      derivedFromRequirements: [],
      style: { width: 640, height: 420, color: 'neutral' }
    }
    addNodeToCanvas(nodeDTO, 'packageNode')
  }, [getNextNodeName, getNextNodePosition, addNodeToCanvas])

  /* ── Eliminación ── */
  const handleDeleteNode = useCallback(
    (id: string) => {
      setNodes(nds => nds.filter(n => n.id !== id))
      setEdges(eds => eds.filter(e => e.source !== id && e.target !== id))
      if (selectedNodeId === id || selectedEdgeId) {
        clearSelection()
      }
    },
    [selectedNodeId, selectedEdgeId, clearSelection]
  )

  const handleDeleteEdge = useCallback(
    (id: string) => {
      setEdges(eds => eds.filter(e => e.id !== id))
      if (selectedEdgeId === id) {
        setSelectedEdgeId(null)
        setEditorTarget(null)
      }
    },
    [selectedEdgeId]
  )

  const handleDeleteSelected = useCallback(() => {
    if (selectedNodeId) {
      handleDeleteNode(selectedNodeId)
    } else if (selectedEdgeId) {
      handleDeleteEdge(selectedEdgeId)
    }
  }, [selectedNodeId, selectedEdgeId, handleDeleteNode, handleDeleteEdge])

  /* ── Actualización ── */
  const updateNode = useCallback((nextNode: DiagramNodeDTO) => {
    setNodes(nds =>
      nds.map(node =>
        node.id === nextNode.id
          ? { ...node, data: { ...nextNode, position: node.position } }
          : node
      )
    )
  }, [])

  const updateEdge = useCallback((nextEdge: DiagramRelationDTO) => {
    setEdges(eds =>
      eds.map(edge =>
        edge.id === nextEdge.id ? { ...edge, data: nextEdge, label: nextEdge.data?.label || '' } : edge
      )
    )
  }, [])

  // Maintain package child counts for UI (childCount stored in package node.data)
  useEffect(() => {
    setNodes(prev => {
      const pkgNodes = prev.filter(n => n.type === 'packageNode')
      if (pkgNodes.length === 0) return prev
      let changed = false
      const next = prev.map(n => {
        if (n.type === 'packageNode') {
          const count = prev.filter(x => (x.data as any)?.packageId === n.id).length
          if ((n.data as any)?.childCount !== count) {
            changed = true
            return { ...n, data: { ...n.data, childCount: count } }
          }
        }
        return n
      })
      return changed ? next : prev
    })
  }, [nodes])

  /* ── IA ── */
  const convertAiNodes = useCallback(
    (proposal: GeneratedCanvas) =>
      proposal.nodes.map(nodeDTO => ({
        id: nodeDTO.id,
        type: diagramType === 'USE_CASE' ? (nodeDTO.kind === 'actor' ? 'actorNode' : 'useCaseNode') : 'classNode',
        position: nodeDTO.position,
        data: nodeDTO,
      })),
    [diagramType]
  )

  const convertAiEdges = useCallback(
    (proposal: GeneratedCanvas) =>
      proposal.edges.map(edgeDTO => ({
        id: edgeDTO.id,
        source: edgeDTO.source,
        target: edgeDTO.target,
        type: edgeDTO.type || (diagramType === 'USE_CASE' ? 'useCaseEdge' : 'umlEdge'),
        data: edgeDTO,
        label: edgeDTO.data?.label || '',
      })),
    [diagramType]
  )

  async function handleGenerateAutoDiagram(): Promise<void> {
    if (!isValidProjectId(projectId)) return
    const generator = isClass
      ? () => diagramFacade.generateClassDiagram(projectId.trim())
      : () => diagramFacade.generateUseCaseDiagram(projectId.trim())

    const data = await run(generator, {
      errorMessage: 'No fue posible generar el diagrama con IA. Verifica que el proyecto tenga requisitos definidos.',
    })
    if (data) {
      const source = parseDiagramSource(data.sourceJson)
      const proposal = isClass
        ? mapGeneratedClassDiagramToCanvas(source)
        : mapGeneratedUseCaseDiagramToCanvas(source)
      setAiProposal(proposal)
      setShowAiModal(true)
      editorActions.editing('Propuesta de IA recibida.')
    }
  }

  function handleApplyAiReplace() {
    if (!aiProposal) return
    setNodes(convertAiNodes(aiProposal))
    setEdges(convertAiEdges(aiProposal))
    setShowAiModal(false)
    setAiProposal(null)
    editorActions.editing('Propuesta de IA aplicada.')
    showFeedback('success', 'Diagrama reemplazado con propuesta IA.')
  }

  function handleApplyAiMerge() {
    if (!aiProposal) return
    const currentSource = reactFlowToDiagramSource(nodes, edges, diagramType)
    const result = mergeDiagramSources(currentSource, aiProposal)
    const flow = diagramSourceToReactFlow({ ...currentSource, nodes: result.nodes, edges: result.edges })
    setNodes(flow.nodes)
    setEdges(flow.edges)
    setShowAiModal(false)
    setAiProposal(null)
    editorActions.editing(`Fusionado: +${result.addedNodesCount} elementos, +${result.addedEdgesCount} relaciones.`)
    showFeedback('success', `Fusionado: +${result.addedNodesCount} / +${result.addedEdgesCount}`)
  }

  /* ── Guardado ── */
  async function handleSaveDiagram(force = false): Promise<void> {
    if (!isValidProjectId(projectId)) return

    if (!diagramName.trim()) {
      showFeedback('error', 'El nombre del diagrama no puede estar vacío.')
      return
    }

    if (!force) {
      const source = reactFlowToDiagramSource(nodes, edges, diagramType)
      const result = isClass
        ? validateClassDiagram(source.nodes, source.edges)
        : isUseCase
          ? validateUseCaseDiagram(source.nodes, source.edges)
          : validateDiagramSource(source)

      if (!result.valid || result.warnings.length > 0) {
        setValidationResult(result)
        setShowValidationModal(true)
        return
      }
    }

    const source = reactFlowToDiagramSource(nodes, edges, diagramType)
    const payload = {
      projectId: projectId.trim(),
      name: diagramName.trim(),
      sourceJson: serializeDiagramSource(source),
      plantUmlCode: null,
    }

    const data = await run(
      () => diagramFacade.saveOrUpdate(diagramId.trim() || null, payload, diagramType),
      { errorMessage: 'Error al guardar el diagrama en el servidor.' }
    )

    if (data) {
      syncDiagramResponse(data, 'Diagrama guardado correctamente.')
      setShowValidationModal(false)
    } else {
      showFeedback('error', 'Error del servidor al guardar.')
    }
  }

  /* PlantUML export removed from editor UI (kept server APIs intact). */

  /* ── Rotación de tips ── */
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex(prev => (prev + 1) % HELP_TIPS.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  /* ── Render ── */
  return (
    <DiagramErrorBoundary>
      <div className="flex flex-col h-[calc(100vh-96px)] min-h-0 bg-[var(--color-bg)] overflow-hidden">
        {/* ── Estilos internos ── */}
        <style>{`
          .canvas-bg {
            background-image: radial-gradient(circle, var(--color-border) 1px, transparent 1px);
            background-size: 20px 20px;
          }
        `}</style>

        {/* ── Header compacto (sin botón volver) ── */}
        <header className="h-12 border-b border-[var(--color-border)] bg-[var(--color-bg)] flex items-center px-4 shrink-0 justify-between z-10">
            <div className="flex items-center gap-3">
            {/* Nombre editable (tipo oculto por petición) */}
            <div className="flex items-center gap-2">
              <input
                className="bg-transparent border-b border-transparent hover:border-[var(--color-border)] focus:border-[var(--color-accent)] text-xs font-semibold text-[var(--color-text-primary)] focus:outline-none px-1 py-0.5 transition-colors w-40"
                value={diagramName}
                onChange={e => setDiagramName(e.target.value)}
                placeholder="Sin nombre"
                title="Editar nombre del diagrama"
              />
            </div>

            {/* Estado + feedback */}
            <div className="flex items-center gap-2">
              {isGlobalLoading ? (
                <span className="text-[10px] text-[var(--color-accent)] animate-pulse bg-[var(--color-accent-subtle)] px-2 py-0.5 rounded-full border border-[var(--color-accent)]/20">
                  Sincronizando
                </span>
              ) : editorState.status === 'editing' ? (
                <span className="text-[10px] text-[var(--color-text-muted)] bg-[var(--color-surface)] px-2 py-0.5 rounded-full border border-[var(--color-border)]">
                  Editando
                </span>
              ) : (
                <span className="text-[10px] text-[var(--color-text-muted)] bg-[var(--color-surface)] px-2 py-0.5 rounded-full border border-[var(--color-border)]">
                  Guardado
                </span>
              )}

              {saveFeedback && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${saveFeedback.type === 'success' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' :
                  saveFeedback.type === 'error' ? 'text-red-400 bg-red-400/10 border-red-400/20' :
                    'text-[var(--color-accent)] bg-[var(--color-accent-subtle)] border-[var(--color-border)]'
                  }`}>
                  {saveFeedback.message}
                </span>
              )}
            </div>
          </div>

          {/* Acciones compactas */}
            <div className="flex items-center gap-1.5">
            <button
              onClick={handleGenerateAutoDiagram}
              disabled={isGlobalLoading}
              className="h-7 px-2.5 text-[11px] font-medium rounded-md border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] transition-colors disabled:opacity-50"
              title="Generar diagrama con IA"
            >
              <svg className="w-3.5 h-3.5 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              IA
            </button>
            <button
              onClick={() => handleSaveDiagram(false)}
              disabled={isGlobalLoading || !diagramName.trim()}
              className="h-7 px-2.5 text-[11px] font-medium rounded-md border border-[var(--color-accent)] bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50"
            >
              <svg className="w-3.5 h-3.5 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Guardar
            </button>
            <button
              onClick={handleDeleteSelected}
              disabled={isGlobalLoading || !(selectedNodeId || selectedEdgeId)}
              className="h-7 px-2.5 text-[11px] font-medium rounded-md border border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors disabled:opacity-50"
              title="Eliminar seleccionado"
            >
              <svg className="w-3.5 h-3.5 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Eliminar
            </button>
            {/* Properties button removed—panel opens on selection automatically */}
          </div>
        </header>

        <div className="flex-1 min-h-0 flex overflow-hidden relative">
          {/* Floating add button (replaces left toolbar). DiagramToolbar shows a single + and expands into cards */}
          <div className="absolute left-4 top-6 z-30">
            <DiagramToolbar
              isSaved={Boolean(diagramId.trim())}
              isValid={validation.valid}
              hasSelection={Boolean(selectedNodeId || selectedEdgeId)}
              status={editorState.status}
              diagramType={diagramType}
              onAddElement={handleAddElement}
              onAddActor={handleAddActor}
              onAddUseCase={handleAddUseCase}
              onAddPackage={handleAddPackage}
              onAddPackageWithOptions={(opts) => {
                const name = getNextNodeName('Paquete')
                const position = getNextNodePosition()
                const nodeDTO: any = {
                  id: `pkg-${crypto.randomUUID()}`,
                  kind: 'package',
                  name,
                  description: '',
                  position,
                  derivedFromRequirements: [],
                  style: { width: opts.width, height: opts.height, color: opts.color || '#ffffff' }
                }
                addNodeToCanvas(nodeDTO, 'packageNode')
              }}
            />
          </div>

          {/* Área principal: Canvas */}
          <main className="flex-1 min-h-0 relative bg-[var(--color-bg)] overflow-hidden">
            <DiagramCanvas
              nodes={nodes}
              edges={edges}
              diagramType={diagramType}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              onConnect={handleConnect}
                onSelectionChange={handleSelectionChange}
                onNodeDragStop={(_e, node) => {
                  try {
                    // If a package was moved, move its child nodes by the same delta
                    if (node.type === 'packageNode') {
                      setNodes(prevNodes => {
                        const prev = prevNodes.find(n => n.id === node.id)
                        if (!prev) return prevNodes
                        const dx = node.position.x - (prev.position?.x || 0)
                        const dy = node.position.y - (prev.position?.y || 0)
                        if (dx === 0 && dy === 0) return prevNodes
                        return prevNodes.map(n => {
                          if ((n.data as any)?.packageId === node.id) {
                            return { ...n, position: { x: n.position.x + dx, y: n.position.y + dy } }
                          }
                          if (n.id === node.id) {
                            return { ...n, position: node.position }
                          }
                          return n
                        })
                      })
                    } else {
                      // Non-package node moved: detect containing package by center point
                      // Use current nodes snapshot
                      setNodes(prevNodes => {
                        const pkgNodes = prevNodes.filter(p => p.type === 'packageNode')
                        const movedNode = prevNodes.find(n => n.id === node.id) ?? node
                        const nodeWidth = (movedNode.data as any)?.style?.width || (movedNode.width ?? 160)
                        const nodeHeight = (movedNode.data as any)?.style?.height || (movedNode.height ?? 60)
                        const centerX = node.position.x + nodeWidth / 2
                        const centerY = node.position.y + nodeHeight / 2
                        let containing = null
                        for (const p of pkgNodes) {
                          const w = (p.data as any)?.style?.width || 520
                          const h = (p.data as any)?.style?.height || 360
                          if (centerX >= p.position.x && centerX <= p.position.x + w && centerY >= p.position.y && centerY <= p.position.y + h) {
                            containing = p
                            break
                          }
                        }
                        return prevNodes.map(n => n.id === node.id ? { ...n, position: node.position, data: { ...n.data, packageId: containing ? containing.id : undefined } } : n)
                      })
                    }
                  } catch (err) {
                    console.error('onNodeDragStop error', err)
                  }
                }}
            />
          </main>

          {/* Panel de propiedades flotante (Derecha) */}
          <aside
            className={`absolute right-4 top-6 bottom-6 z-30 transition-all duration-500 ease-in-out transform ${isSidebarOpen ? 'translate-x-0 opacity-100' : 'translate-x-[120%] opacity-0'
              }`}
          >
            <div className="w-80 h-full bg-[var(--color-bg-card)] dark:bg-[#0b0f12] border border-[var(--color-border)] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Propiedades</h3>
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
                    <p className="text-sm font-medium text-slate-400 dark:text-slate-500">Selecciona un elemento para editar sus propiedades</p>
                  </div>
                ) : (
                  <DiagramSidebar
                    editorTarget={editorTarget}
                    selectedNode={selectedNode?.data ?? null}
                    selectedEdge={selectedEdge?.data ?? null}
                    nodes={nodes.map(n => n.data)}
                    diagramType={diagramType}
                    onUpdateNode={updateNode}
                    onUpdateEdge={updateEdge}
                    onDeleteNode={handleDeleteNode}
                    onDeleteEdge={handleDeleteEdge}
                  />
                )}
              </div>
            </div>
          </aside>

          {/* Botón flotante para reabrir sidebar si está cerrada */}
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
        </div>
        {/* ── Barra de ayuda flotante (overlay, no ocupa layout) ── */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-4 z-40">
          <div className="px-4 py-1 rounded-full bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[10px] text-[var(--color-text-muted)]">
            💡 {HELP_TIPS[currentTipIndex]}
          </div>
        </div>

        {/* ── Modales ── */}
        {showValidationModal && validationResult && (
          <DiagramValidationModal
            result={validationResult}
            onClose={() => setShowValidationModal(false)}
            onConfirm={() => handleSaveDiagram(true)}
            onSelectIssue={handleSelectIssue}
          />
        )}

        {showAiModal && aiProposal && (
          <GeneratedDiagramReviewModal
            nodes={aiProposal.nodes}
            edges={aiProposal.edges}
            warnings={aiProposal.warnings}
            isCanvasEmpty={nodes.length === 0}
            diagramType={diagramType}
            onClose={() => {
              setShowAiModal(false)
              setAiProposal(null)
            }}
            onApplyReplace={handleApplyAiReplace}
            onApplyMerge={handleApplyAiMerge}
          />
        )}
      </div>
    </DiagramErrorBoundary>
  )
}

