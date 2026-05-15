import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
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
import { useApiOperation } from './useLoadingError'
import { isValidProjectId } from '../context/ProjectContext'
import { useDiagramEditorStore } from '../state/diagramEditor.store'
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
import { mapGeneratedClassDiagramToCanvas, mapGeneratedUseCaseDiagramToCanvas, type GeneratedCanvas } from '../utils/generatedDiagramMapper'
import { mergeDiagramSources } from '../utils/diagramMergeUtils'
import { createActorNode, createUseCaseNode } from '../utils/useCaseDiagramUtils'

export type SaveFeedback = {
  type: 'success' | 'error' | 'info'
  message: string
} | null

export interface DiagramEditorController {
  state: ReturnType<typeof useDiagramEditorStore>['state']
  actions: ReturnType<typeof useDiagramEditorStore>['actions']
  isClass: boolean
  isUseCase: boolean
  isTypeSupported: boolean
  projectId: string
  diagramId: string
  diagramName: string
  diagramType: DiagramType
  selectedNodeId: string | null
  selectedEdgeId: string | null
  selectedNode: Node<DiagramNodeDTO> | null
  selectedEdge: Edge<DiagramRelationDTO> | null
  editorTarget: 'node' | 'edge' | null
  validationResult: DiagramValidationResult | null
  showValidationModal: boolean
  aiProposal: GeneratedCanvas | null
  showAiModal: boolean
  isSidebarOpen: boolean
  saveFeedback: SaveFeedback
  currentTipIndex: number
  nodes: Node<DiagramNodeDTO>[]
  edges: Edge<DiagramRelationDTO>[]
  validation: DiagramValidationResult
  isGlobalLoading: boolean
  handleNodesChange: OnNodesChange
  handleEdgesChange: OnEdgesChange
  handleSelectionChange: OnSelectionChangeFunc
  handleConnect: (connection: Connection) => void
  handleAddElement: (umlType: DiagramUmlType) => void
  handleAddActor: () => void
  handleAddUseCase: () => void
  handleAddPackage: () => void
  handleAddPackageWithOptions: (opts: { width: number; height: number; color?: string }) => void
  handleDeleteSelected: () => void
  handleDeleteNode: (id: string) => void
  handleDeleteEdge: (id: string) => void
  handleNodeDragStop: (_e: unknown, node: { id: string; type?: string; position: { x: number; y: number }; data?: unknown; width?: number; height?: number }) => void
  updateNode: (nextNode: DiagramNodeDTO) => void
  updateEdge: (nextEdge: DiagramRelationDTO) => void
  handleSaveDiagram: (force?: boolean) => Promise<void>
  handleGenerateAutoDiagram: () => Promise<void>
  handleApplyAiReplace: () => void
  handleApplyAiMerge: () => void
  handleCloseAiModal: () => void
  handleSelectIssue: (targetType: 'node' | 'edge' | 'diagram', targetId?: string) => void
  setDiagramName: (value: string) => void
  setIsSidebarOpen: (value: boolean) => void
  setShowValidationModal: (value: boolean) => void
  setShowAiModal: (value: boolean) => void
  clearSelection: () => void
}

const HELP_TIPS = [
  'Arrastra elementos para organizarlos',
  'Conecta nodos desde sus puntos de enlace',
  'Selecciona un elemento para editarlo',
  'Guarda antes de generar PlantUML',
] as const

function useSafeTimeoutFeedback() {
  const [saveFeedback, setSaveFeedback] = useState<SaveFeedback>(null)

  const showFeedback = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    setSaveFeedback({ type, message })
    setTimeout(() => setSaveFeedback(null), 3500)
  }, [])

  return { saveFeedback, showFeedback }
}

export function useDiagramEditorController(): DiagramEditorController {
  const { projectId: routeProjectId, diagramId: routeDiagramId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const newType = searchParams.get('type') as DiagramType | null
  const actionParam = searchParams.get('action')

  const { state: editorState, actions: editorActions } = useDiagramEditorStore()
  const { run, isLoading: isGlobalLoading } = useApiOperation()
  const { saveFeedback, showFeedback } = useSafeTimeoutFeedback()

  const [projectId, setProjectId] = useState(routeProjectId ?? '')
  const [diagramId, setDiagramId] = useState(routeDiagramId ?? '')
  const [diagramName, setDiagramName] = useState('Nuevo Diagrama')
  const [diagramType, setDiagramType] = useState<DiagramType>(newType || 'CLASS')
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [editorTarget, setEditorTarget] = useState<'node' | 'edge' | null>(null)
  const [validationResult, setValidationResult] = useState<DiagramValidationResult | null>(null)
  const [showValidationModal, setShowValidationModal] = useState(false)
  const [aiProposal, setAiProposal] = useState<GeneratedCanvas | null>(null)
  const [showAiModal, setShowAiModal] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [currentTipIndex, setCurrentTipIndex] = useState(0)
  const [nodes, setNodes] = useState<Node<DiagramNodeDTO>[]>([])
  const [edges, setEdges] = useState<Edge<DiagramRelationDTO>[]>([])

  const isClass = diagramType === 'CLASS'
  const isUseCase = diagramType === 'USE_CASE'
  const isTypeSupported = isClass || isUseCase

  const selectedNode = useMemo(() => nodes.find(n => n.id === selectedNodeId) ?? null, [nodes, selectedNodeId])
  const selectedEdge = useMemo(() => edges.find(e => e.id === selectedEdgeId) ?? null, [edges, selectedEdgeId])

  const validation = useMemo(() => {
    const source = reactFlowToDiagramSource(nodes, edges, diagramType)
    if (isClass) return validateClassDiagram(source.nodes, source.edges)
    if (isUseCase) return validateUseCaseDiagram(source.nodes, source.edges)
    return validateDiagramSource(source)
  }, [nodes, edges, diagramType, isClass, isUseCase])

  const clearSelection = useCallback(() => {
    setSelectedNodeId(null)
    setSelectedEdgeId(null)
    setEditorTarget(null)
  }, [])

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
      clearSelection()
      editorActions.editing(message)
      showFeedback('success', message)
    },
    [diagramId, navigate, clearSelection, editorActions, showFeedback],
  )

  const handleLoadDiagram = useCallback(
    async (id: string) => {
      const data = await run(() => diagramFacade.getById(id), { errorMessage: 'Error al cargar el diagrama.' })
      if (data) syncDiagramResponse(data)
    },
    [run, syncDiagramResponse],
  )

  useEffect(() => {
    if (routeDiagramId) {
      handleLoadDiagram(routeDiagramId)
    } else if (newType) {
      setDiagramType(newType)
      setDiagramName(`Nuevo Diagrama de ${newType === 'CLASS' ? 'Clases' : 'Casos de Uso'}`)
      if (actionParam === 'generate' && isValidProjectId(routeProjectId)) {
        setTimeout(() => {
          void handleGenerateAutoDiagram()
        }, 300)
      }
    }
  }, [routeDiagramId, newType, actionParam, routeProjectId, handleLoadDiagram])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex(prev => (prev + 1) % HELP_TIPS.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleNodesChange: OnNodesChange = useCallback((changes) => {
    setNodes(nds => applyNodeChanges(changes, nds) as Node<DiagramNodeDTO>[])
  }, [])

  const handleEdgesChange: OnEdgesChange = useCallback((changes) => {
    setEdges(eds => applyEdgeChanges(changes, eds) as Edge<DiagramRelationDTO>[])
  }, [])

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
    [isSidebarOpen],
  )

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

  const handleConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return

    setEdges(eds => {
      const duplicate = eds.find(e => e.source === connection.source && e.target === connection.target)
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
        relDTO.data = { ...relDTO.data, relationshipType: relType, label: '', description: '' }
      }

      // Important: store sourceHandle and targetHandle so React Flow knows which dot was connected
      relDTO.sourceHandle = connection.sourceHandle || null
      relDTO.targetHandle = connection.targetHandle || null

      const newEdge: Edge<DiagramRelationDTO> = {
        id: relDTO.id,
        source: relDTO.source,
        target: relDTO.target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        type: relDTO.type || (diagramType === 'USE_CASE' ? 'useCaseEdge' : 'umlEdge'),
        data: relDTO,
        label: relDTO.data?.label || '',
      }

      return addEdge(newEdge, eds)
    })
  }, [diagramType, nodes])

  const getNextNodeName = useCallback((base: string) => {
    let name = base
    let counter = 1
    const names = new Set(nodes.map(n => n.data.name.toLowerCase()))
    while (names.has(name.toLowerCase())) {
      counter++
      name = `${base}${counter}`
    }
    return name
  }, [nodes])

  const getNextNodePosition = useCallback(() => {
    const x = 120 + (nodes.length % 4) * 280
    const y = 120 + Math.floor(nodes.length / 4) * 250
    return { x, y }
  }, [nodes.length])

  const addNodeToCanvas = useCallback((nodeDTO: DiagramNodeDTO, nodeType: string) => {
    // Packages stay behind class nodes: zIndex 0 vs 10
    const zIndex = nodeType === 'packageNode' ? 0 : 10
    const newNode: Node<DiagramNodeDTO> = {
      id: nodeDTO.id,
      type: nodeType,
      position: nodeDTO.position,
      data: nodeDTO,
      selected: true,
      zIndex,
      // For packages: set style.width/height so React Flow renders at the correct size
      ...(nodeType === 'packageNode' && {
        style: {
          width: (nodeDTO as any).style?.width ?? 640,
          height: (nodeDTO as any).style?.height ?? 420,
        },
      }),
    }
    setNodes(nds => [...nds.map(n => ({ ...n, selected: false })), newNode])
    setSelectedNodeId(newNode.id)
    setEditorTarget('node')
  }, [])

  const handleAddElement = useCallback((umlType: DiagramUmlType) => {
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
  }, [getNextNodeName, getNextNodePosition, addNodeToCanvas])

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
      style: { width: 640, height: 420, color: 'neutral' },
    }
    addNodeToCanvas(nodeDTO, 'packageNode')
  }, [getNextNodeName, getNextNodePosition, addNodeToCanvas])

  const handleAddPackageWithOptions = useCallback((opts: { width: number; height: number; color?: string }) => {
    const name = getNextNodeName('Paquete')
    const position = getNextNodePosition()
    const nodeDTO: any = {
      id: `pkg-${crypto.randomUUID()}`,
      kind: 'package',
      name,
      description: '',
      position,
      derivedFromRequirements: [],
      style: { width: opts.width, height: opts.height, color: opts.color || '#ffffff' },
    }
    addNodeToCanvas(nodeDTO, 'packageNode')
  }, [getNextNodeName, getNextNodePosition, addNodeToCanvas])

  const handleDeleteNode = useCallback((id: string) => {
    setNodes(nds => nds.filter(n => n.id !== id))
    setEdges(eds => eds.filter(e => e.source !== id && e.target !== id))
    if (selectedNodeId === id || selectedEdgeId) {
      clearSelection()
    }
  }, [selectedNodeId, selectedEdgeId, clearSelection])

  const handleDeleteEdge = useCallback((id: string) => {
    setEdges(eds => eds.filter(e => e.id !== id))
    if (selectedEdgeId === id) {
      setSelectedEdgeId(null)
      setEditorTarget(null)
    }
  }, [selectedEdgeId])

  const handleNodeDragStop = useCallback((_e: unknown, node: { id: string; type?: string; position: { x: number; y: number }; data?: unknown; width?: number; height?: number }) => {
    try {
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
        setNodes(prevNodes => {
          const pkgNodes = prevNodes.filter(p => p.type === 'packageNode')
          const movedNode = prevNodes.find(n => n.id === node.id) ?? node
          const nodeWidth = (movedNode.data as any)?.style?.width || (movedNode.width ?? 160)
          const nodeHeight = (movedNode.data as any)?.style?.height || (movedNode.height ?? 60)
          const centerX = node.position.x + nodeWidth / 2
          const centerY = node.position.y + nodeHeight / 2
          let containing: { id: string } | null = null
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
  }, [])

  const handleDeleteSelected = useCallback(() => {
    if (selectedNodeId) {
      handleDeleteNode(selectedNodeId)
    } else if (selectedEdgeId) {
      handleDeleteEdge(selectedEdgeId)
    }
  }, [selectedNodeId, selectedEdgeId, handleDeleteNode, handleDeleteEdge])

  const updateNode = useCallback((nextNode: DiagramNodeDTO) => {
    setNodes(nds => nds.map(node => node.id === nextNode.id ? { ...node, data: { ...nextNode, position: node.position } } : node))
  }, [])

  const updateEdge = useCallback((nextEdge: DiagramRelationDTO) => {
    setEdges(eds => eds.map(edge => edge.id === nextEdge.id ? { ...edge, data: nextEdge, label: nextEdge.data?.label || '' } : edge))
  }, [])

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

  const convertAiNodes = useCallback((proposal: GeneratedCanvas) => proposal.nodes.map(nodeDTO => ({
    id: nodeDTO.id,
    type: diagramType === 'USE_CASE' ? (nodeDTO.kind === 'actor' ? 'actorNode' : 'useCaseNode') : 'classNode',
    position: nodeDTO.position,
    data: nodeDTO,
  })), [diagramType])

  const convertAiEdges = useCallback((proposal: GeneratedCanvas) => proposal.edges.map(edgeDTO => ({
    id: edgeDTO.id,
    source: edgeDTO.source,
    target: edgeDTO.target,
    type: edgeDTO.type || (diagramType === 'USE_CASE' ? 'useCaseEdge' : 'umlEdge'),
    data: edgeDTO,
    label: edgeDTO.data?.label || '',
  })), [diagramType])

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

  function handleCloseAiModal() {
    setShowAiModal(false)
    setAiProposal(null)
  }

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
      { errorMessage: 'Error al guardar el diagrama en el servidor.' },
    )

    if (data) {
      syncDiagramResponse(data, 'Diagrama guardado correctamente.')
      setShowValidationModal(false)
    } else {
      showFeedback('error', 'Error del servidor al guardar.')
    }
  }

  return {
    state: editorState,
    actions: editorActions,
    isClass,
    isUseCase,
    isTypeSupported,
    projectId,
    diagramId,
    diagramName,
    diagramType,
    selectedNodeId,
    selectedEdgeId,
    selectedNode,
    selectedEdge,
    editorTarget,
    validationResult,
    showValidationModal,
    aiProposal,
    showAiModal,
    isSidebarOpen,
    saveFeedback,
    currentTipIndex,
    nodes,
    edges,
    validation,
    isGlobalLoading,
    handleNodesChange,
    handleEdgesChange,
    handleSelectionChange,
    handleConnect,
    handleAddElement,
    handleAddActor,
    handleAddUseCase,
    handleAddPackage,
    handleAddPackageWithOptions,
    handleDeleteSelected,
    handleDeleteNode,
    handleDeleteEdge,
    handleNodeDragStop,
    updateNode,
    updateEdge,
    handleSaveDiagram,
    handleGenerateAutoDiagram,
    handleApplyAiReplace,
    handleApplyAiMerge,
    handleCloseAiModal,
    handleSelectIssue,
    setDiagramName,
    setIsSidebarOpen,
    setShowValidationModal,
    setShowAiModal,
    clearSelection,
  }
}