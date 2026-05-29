import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useDiagramHistory } from './useDiagramHistory'
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
import { diagramsApi } from '../api/services/diagramsApi'
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
  generateSafeId,
} from '../utils/diagramMapper'
import { validateClassDiagram } from '../utils/classDiagramValidator'
import { validateUseCaseDiagram } from '../utils/useCaseDiagramValidator'
import { mapGeneratedClassDiagramToCanvas, mapGeneratedUseCaseDiagramToCanvas, type GeneratedCanvas } from '../utils/generatedDiagramMapper'
import { mergeDiagramSources } from '../utils/diagramMergeUtils'
import { autoLayoutDiagram } from '../utils/diagramLayoutUtils'
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
  handleReconnect: (oldEdge: Edge<DiagramRelationDTO>, newConnection: Connection) => void
  handleAddElement: (umlType: DiagramUmlType) => void
  handleAddActor: (name?: string, position?: { x: number; y: number }) => void
  handleAddUseCase: () => void
  handleAddPackage: () => void
  handleDeleteSelected: () => void
  handleDeleteNode: (id: string) => void
  handleDeleteEdge: (id: string) => void
  handleNodeDragStart: (_e: any, node: any) => void
  handleNodeDrag: (_e: any, node: any) => void
  handleNodeDragStop: (_e: unknown, node: { id: string; type?: string; position: { x: number; y: number }; data?: unknown; width?: number; height?: number }) => void
  updateNode: (nextNode: DiagramNodeDTO) => void
  updateEdge: (nextEdge: DiagramRelationDTO) => void
  handleSaveDiagram: (force?: boolean) => Promise<void>
  handleGenerateAutoDiagram: () => Promise<void>
  handleAutoLayout: () => void
  handleCleanDuplicateEdges: () => void
  handleApplyAiReplace: () => void
  handleApplyAiMerge: () => void
  handleCloseAiModal: () => void
  handleSelectIssue: (targetType: 'node' | 'edge' | 'diagram', targetId?: string) => void
  setDiagramName: (value: string) => void
  setIsSidebarOpen: (value: boolean) => void
  setShowValidationModal: (value: boolean) => void
  setShowAiModal: (value: boolean) => void
  sidebarTabPreference: string | null
  setSidebarTabPreference: (value: string | null) => void
  sidebarSubViewPreference: string | null
  setSidebarSubViewPreference: (value: string | null) => void
  handleAlignNodes: (direction: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void
  handleDistributeNodes: (axis: 'horizontal' | 'vertical') => void
  handleGroupIntoPackage: () => void
  handleDuplicateSelected: () => void
  handleDuplicateNode: (id: string) => void
  handleQuickAddAttribute: (id: string) => void
  handleQuickAddMethod: (id: string) => void
  handleQuickCreateRelation: (id: string) => void
  handleQuickAddInclude: (id: string) => void
  handleQuickAddExtend: (id: string) => void
  handleQuickAddToPackage: (id: string, pkgId: string | null) => void
  setSelectedNodeId: (id: string | null) => void
  setEditorTarget: (target: 'node' | 'edge' | null) => void
  clearSelection: () => void
  canUndo: boolean
  canRedo: boolean
  isDirty: boolean
  lastSavedTime: number | null
  handleUndo: () => void
  handleRedo: () => void
  handleBack: () => Promise<void>
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
  const { projectId: routeProjectId, diagramId: routeDiagramId, diagramTypePath } = useParams<{
    projectId: string
    diagramId?: string
    diagramTypePath?: string
  }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const newType = (
    searchParams.get('type') ||
    (diagramTypePath === 'class' ? 'CLASS' : diagramTypePath === 'use-case' ? 'USE_CASE' : '')
  ) as DiagramType | null
  const actionParam = searchParams.get('action')

  const { state: editorState, actions: editorActions } = useDiagramEditorStore()
  const { run, isLoading: isGlobalLoading } = useApiOperation()
  const { saveFeedback, showFeedback } = useSafeTimeoutFeedback()

  const [projectId, setProjectId] = useState(routeProjectId ?? '')
  const [diagramId, setDiagramId] = useState(routeDiagramId ?? '')
  
  const [diagramName, setDiagramNameState] = useState('Nuevo Diagrama')
  const setDiagramName = useCallback((name: string) => {
    setDiagramNameState(name)
    localStorage.setItem('active_diagram_name', name)
    const currentId = routeDiagramId || ''
    if (currentId) {
      localStorage.setItem(`active_diagram_name_${currentId}`, name)
    }
  }, [routeDiagramId])

  const [diagramType, setDiagramType] = useState<DiagramType>(newType || 'CLASS')
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [editorTarget, setEditorTarget] = useState<'node' | 'edge' | null>(null)
  const [validationResult, setValidationResult] = useState<DiagramValidationResult | null>(null)
  const [showValidationModal, setShowValidationModal] = useState(false)
  const [aiProposal, setAiProposal] = useState<GeneratedCanvas | null>(null)
  const [showAiModal, setShowAiModal] = useState(false)
  const [aiResponse, setAiResponse] = useState<DiagramResponse | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [currentTipIndex, setCurrentTipIndex] = useState(0)
  const [nodes, setNodes] = useState<Node<DiagramNodeDTO>[]>([])
  const [edges, setEdges] = useState<Edge<DiagramRelationDTO>[]>([])
  const [sidebarTabPreference, setSidebarTabPreference] = useState<string | null>(null)
  const [sidebarSubViewPreference, setSidebarSubViewPreference] = useState<string | null>(null)

  const [isDirty, setIsDirty] = useState(false)
  const [lastSavedTime, setLastSavedTime] = useState<number | null>(null)

  const {
    canUndo,
    canRedo,
    pushSnapshot,
    undo: popUndo,
    redo: popRedo,
    clearHistory
  } = useDiagramHistory()

  const isRestoringHistoryRef = useRef(false)
  const isDraggingRef = useRef(false)
  const lastValidationRef = useRef<any>({ valid: true, errors: [] })
  const hasGeneratedRef = useRef(false)

  const captureHistorySnapshot = useCallback((reason: string) => {
    if (isRestoringHistoryRef.current) return
    pushSnapshot(nodes, edges, selectedNodeId, selectedEdgeId, reason)
    setIsDirty(true)
  }, [nodes, edges, selectedNodeId, selectedEdgeId, pushSnapshot])


  // Before unload protection (reload/external)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = 'Tienes cambios sin guardar. ¿Deseas salir de todas formas?'
        return e.returnValue
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  // Save on unmount protection for internal navigation
  const saveOnUnmountRef = useRef({
    isDirty,
    nodes,
    edges,
    diagramType,
    diagramName,
    diagramId,
    projectId,
  })

  useEffect(() => {
    saveOnUnmountRef.current = {
      isDirty,
      nodes,
      edges,
      diagramType,
      diagramName,
      diagramId,
      projectId,
    }
  }, [isDirty, nodes, edges, diagramType, diagramName, diagramId, projectId])

  useEffect(() => {
    return () => {
      const current = saveOnUnmountRef.current
      if (current.isDirty && current.projectId && current.diagramName.trim()) {
        const source = reactFlowToDiagramSource(current.nodes, current.edges, current.diagramType)
        const payload = {
          projectId: current.projectId.trim(),
          name: current.diagramName.trim(),
          sourceJson: serializeDiagramSource(source),
          plantUmlCode: null,
        }

        void diagramFacade.saveOrUpdate(current.diagramId.trim() || null, payload, current.diagramType)
          .then((data) => {
            if (data && current.diagramType === 'USE_CASE') {
              const relations = current.edges
                .map(edge => {
                  const sourceNode = current.nodes.find(n => n.id === edge.source)
                  const targetNode = current.nodes.find(n => n.id === edge.target)
                  if (!sourceNode || !targetNode) return null

                  let actorNode = null
                  let useCaseNode = null

                  if (sourceNode.data?.kind === 'actor') {
                    actorNode = sourceNode
                  } else if (targetNode.data?.kind === 'actor') {
                    actorNode = targetNode
                  }

                  if (sourceNode.data?.kind === 'useCase') {
                    useCaseNode = sourceNode
                  } else if (targetNode.data?.kind === 'useCase') {
                    useCaseNode = targetNode
                  }

                  if (actorNode && useCaseNode) {
                    const actorName = actorNode.data?.name || ''
                    const requirementCode = useCaseNode.data?.derivedFromRequirements?.[0] || ''
                    if (actorName && requirementCode) {
                      return { actorName, requirementCode }
                    }
                  }
                  return null
                })
                .filter((r): r is { actorName: string; requirementCode: string } => r !== null)

              void diagramsApi.saveRelations(data.id, relations).catch(err => {
                console.error('Error saving relations on unmount:', err)
              })
            }
          })
          .catch((err) => {
            console.error('Failed to autosave diagram on unmount:', err)
          })
      }
    }
  }, [])



  const isClass = diagramType === 'CLASS'
  const isUseCase = diagramType === 'USE_CASE'
  const isTypeSupported = isClass || isUseCase

  const selectedNode = useMemo(() => nodes.find(n => n.id === selectedNodeId) ?? null, [nodes, selectedNodeId])
  const selectedEdge = useMemo(() => edges.find(e => e.id === selectedEdgeId) ?? null, [edges, selectedEdgeId])

  const validation = useMemo(() => {
    if (isDraggingRef.current && lastValidationRef.current) {
      return lastValidationRef.current
    }
    const source = reactFlowToDiagramSource(nodes, edges, diagramType)
    const result = isClass
      ? validateClassDiagram(source.nodes, source.edges)
      : isUseCase
      ? validateUseCaseDiagram(source.nodes, source.edges)
      : validateDiagramSource(source)
    lastValidationRef.current = result
    return result
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
      localStorage.setItem(`diagram_type_${response.id}`, response.diagramType)

      if (import.meta.env.DEV) {
        console.log("[CLASS_LOAD] raw diagram response", response)
        console.log("[CLASS_LOAD] raw sourceJson/content", {
          sourceJson: (response as any).sourceJson ?? (response as any).data?.sourceJson,
          content: (response as any).content ?? (response as any).data?.content
        })
      }

      const source = parseDiagramSource(response)
      const flow = diagramSourceToReactFlow(source)

      // Helper: Merge methods, preserving parameters from local state if response methods lack them
      const mergeMethodsPreservingParameters = (localMethod: any, responseMethod: any): any => {
        const localParams = Array.isArray(localMethod?.parameters) ? localMethod.parameters : []
        const responseParams = Array.isArray(responseMethod?.parameters) ? responseMethod.parameters : []
        
        if (import.meta.env.DEV) {
          console.log("[METHOD_MERGE]", {
            methodName: responseMethod?.name || localMethod?.name,
            localParamsCount: localParams.length,
            responseParamsCount: responseParams.length,
            willPreserveLocal: responseParams.length === 0 && localParams.length > 0
          })
        }
        
        return {
          ...responseMethod,
          parameters: responseParams.length > 0 ? responseParams : localParams
        }
      }

      if (import.meta.env.DEV) {
        source.nodes.forEach((n: any) => {
          if (n.kind === 'class') {
            console.log("[METHOD_LOAD] methods", n.methods)
          }
        })
        console.log("[CLASS_LOAD] parsed source", source)
        console.log("[METHOD_PARAMS_AFTER_FLOW_CONVERSION]", flow.nodes
          .filter((n: any) => n.type === 'classNode')
          .map((n: any) => ({
            id: n.id,
            name: n.data?.name,
            methodsCount: n.data?.methods?.length || 0,
            methods: n.data?.methods?.map((m: any) => ({
              id: m.id,
              name: m.name,
              parametersCount: Array.isArray(m.parameters) ? m.parameters.length : 0,
              parameters: m.parameters,
              returnType: m.returnType
            }))
          }))
        )
        console.log("[CLASS_LOAD] mapped", {
          nodes: flow.nodes.length,
          edges: flow.edges.length,
          edgePreview: flow.edges.map(e => ({
            id: e.id,
            source: e.source,
            target: e.target,
            type: e.type,
            relationshipType: (e.data as any)?.relationshipType ?? (e.data as any)?.data?.relationshipType
          }))
        })
      }

      setNodes(prevNodes => {
        return flow.nodes.map((flowNode: any) => {
          const localNode = prevNodes.find((n: any) => n.id === flowNode.id)
          if (!localNode || flowNode.type !== 'classNode') return flowNode
          
          const localData = localNode.data as any
          const responseData = flowNode.data as any
          
          const localMethods = Array.isArray(localData?.methods) ? localData.methods : []
          const responseMethods = Array.isArray(responseData?.methods) ? responseData.methods : []
          
          if (localMethods.length > 0 && responseMethods.length > 0) {
            const mergedMethods = responseMethods.map((respMethod: any) => {
              const localMethod = localMethods.find((m: any) => 
                m.id === respMethod.id || 
                (m.name === respMethod.name && m.returnType === respMethod.returnType) ||
                (m.name === flowNode.data.name && respMethod.name === flowNode.data.name) ||
                (m.name.startsWith('set') && respMethod.name.startsWith('set') && m.name === respMethod.name)
              )
              if (!localMethod) return respMethod
              return mergeMethodsPreservingParameters(localMethod, respMethod)
            })
            
            if (import.meta.env.DEV) {
              const paramsBefore = responseMethods.reduce((sum: number, m: any) => 
                sum + (Array.isArray(m.parameters) ? m.parameters.length : 0), 0)
              const paramsAfter = mergedMethods.reduce((sum: number, m: any) => 
                sum + (Array.isArray(m.parameters) ? m.parameters.length : 0), 0)
              if (paramsBefore !== paramsAfter) {
                console.log("[METHOD_MERGE_RESULT]", {
                  methodsCount: mergedMethods.length,
                  paramsBefore,
                  paramsAfter,
                  recovered: paramsAfter - paramsBefore
                })
              }
            }
            
            return {
              ...flowNode,
              data: {
                ...responseData,
                methods: mergedMethods
              }
            }
          }
          return flowNode
        })
      })

      // Prevent disappearing edges if the backend response didn't include them, but they existed before saving (Rule #3)
      setEdges(prevEdges => {
        if (prevEdges.length > 0 && flow.edges.length === 0) {
          if (import.meta.env.DEV) {
            console.log("[CLASS_SAVE] backend response returned 0 edges but current state had edges. Keeping current edges.", prevEdges)
          }
          return prevEdges
        }
        return flow.edges
      })

      clearSelection()
      
      // Clean dirty, reset history and record last saved time
      setIsDirty(false)
      clearHistory()
      setLastSavedTime(Date.now())

      // Clean autosave drafts
      const key = `specatlas.diagramDraft.${response.projectId}.${response.id}`
      localStorage.removeItem(key)
      localStorage.removeItem(`specatlas.diagramDraft.${response.projectId}.new`)

      editorActions.editing(message)
      showFeedback('success', message)
    },
    [diagramId, navigate, clearSelection, editorActions, showFeedback, clearHistory],
  )

  const handleLoadDiagram = useCallback(
    async (id: string) => {
      const data = await run(() => diagramFacade.getById(id), { errorMessage: 'Error al cargar el diagrama.' })
      if (data) syncDiagramResponse(data)
    },
    [run, syncDiagramResponse],
  )

  // Sincronizar projectId con la ruta si cambia externamente
  useEffect(() => {
    if (routeProjectId && routeProjectId !== projectId) {
      setProjectId(routeProjectId)
    }
  }, [routeProjectId, projectId])

  useEffect(() => {
    if (routeDiagramId) {
      if (routeDiagramId !== diagramId || nodes.length === 0) {
        handleLoadDiagram(routeDiagramId)
      }
    } else if (newType) {
      setDiagramType(newType)
      localStorage.setItem('diagram_type_new', newType)
      setDiagramName(`Nuevo Diagrama de ${newType === 'CLASS' ? 'Clases' : 'Casos de Uso'}`)
      if (actionParam === 'generate' && isValidProjectId(routeProjectId) && !hasGeneratedRef.current) {
        hasGeneratedRef.current = true
        // Clear search parameters to avoid re-triggering on future renders
        const newParams = new URLSearchParams(searchParams)
        newParams.delete('action')
        setSearchParams(newParams, { replace: true })

        setTimeout(() => {
          void handleGenerateAutoDiagram()
        }, 300)
      }
    }
  }, [routeDiagramId, diagramId, nodes.length, newType, actionParam, routeProjectId, handleLoadDiagram, searchParams, setSearchParams])

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

    if (connection.source === connection.target) {
      showFeedback('error', 'Un elemento no se puede relacionar consigo mismo.')
      return
    }

    captureHistorySnapshot('Crear relación')
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
  }, [diagramType, nodes, showFeedback, captureHistorySnapshot])

  const handleReconnect = useCallback((oldEdge: Edge<DiagramRelationDTO>, newConnection: Connection) => {
    if (!newConnection.source || !newConnection.target) return

    if (newConnection.source === newConnection.target) {
      showFeedback('error', 'Un elemento no se puede relacionar consigo mismo.')
      return
    }

    captureHistorySnapshot('Reconectar relación')
    setEdges((eds) => {
      return eds.map((edge) => {
        if (edge.id === oldEdge.id) {
          const updatedData = {
            ...edge.data,
            source: newConnection.source,
            target: newConnection.target,
            sourceHandle: newConnection.sourceHandle || null,
            targetHandle: newConnection.targetHandle || null,
          } as DiagramRelationDTO

          return {
            ...edge,
            source: newConnection.source,
            target: newConnection.target,
            sourceHandle: newConnection.sourceHandle,
            targetHandle: newConnection.targetHandle,
            data: updatedData,
          }
        }
        return edge
      })
    })
  }, [showFeedback, captureHistorySnapshot])

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
    captureHistorySnapshot('Agregar elemento')
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
  }, [captureHistorySnapshot])

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

  const handleAddActor = useCallback((customName?: string, customPosition?: { x: number; y: number }) => {
    const name = customName || getNextNodeName('Actor')
    const position = customPosition || getNextNodePosition()
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


  const handleDeleteNode = useCallback((id: string) => {
    captureHistorySnapshot('Eliminar elemento')
    setNodes(nds => nds.filter(n => n.id !== id))
    setEdges(eds => eds.filter(e => e.source !== id && e.target !== id))
    if (selectedNodeId === id || selectedEdgeId) {
      clearSelection()
    }
  }, [selectedNodeId, selectedEdgeId, clearSelection, captureHistorySnapshot])

  const handleDeleteEdge = useCallback((id: string) => {
    captureHistorySnapshot('Eliminar relación')
    setEdges(eds => eds.filter(e => e.id !== id))
    if (selectedEdgeId === id) {
      setSelectedEdgeId(null)
      setEditorTarget(null)
    }
  }, [selectedEdgeId, captureHistorySnapshot])

  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null)
  const lastPkgCheckTimeRef = useRef(0)

  const handleNodeDragStart = useCallback((_e: unknown, node: Node) => {
    isDraggingRef.current = true
    dragStartPosRef.current = { x: node.position.x, y: node.position.y }
  }, [])

  const handleNodeDrag = useCallback((_e: unknown, node: Node) => {
    if (node.type === 'packageNode') return

    const now = Date.now()
    if (now - lastPkgCheckTimeRef.current < 60) {
      return // Limit package containment hover check rate to ~16fps during drag
    }
    lastPkgCheckTimeRef.current = now

    const pkgNodes = nodes.filter(p => p.type === 'packageNode')
    const nodeWidth = (node.data as any)?.style?.width || 160
    const nodeHeight = (node.data as any)?.style?.height || 60
    const centerX = node.position.x + nodeWidth / 2
    const centerY = node.position.y + nodeHeight / 2

    let overPkgId: string | null = null
    for (const p of pkgNodes) {
      const w = (p.data as any)?.style?.width || 640
      const h = (p.data as any)?.style?.height || 420
      if (centerX >= p.position.x && centerX <= p.position.x + w && centerY >= p.position.y && centerY <= p.position.y + h) {
        overPkgId = p.id
        break
      }
    }

    setNodes(prev => {
      let changed = false
      const next = prev.map(n => {
        if (n.type === 'packageNode') {
          const isOver = n.id === overPkgId
          if ((n.data as any)?.isDraggedOver !== isOver) {
            changed = true
            return { ...n, data: { ...n.data, isDraggedOver: isOver } }
          }
        }
        return n
      })
      return changed ? next : prev
    })
  }, [nodes])

  const handleNodeDragStop = useCallback((_e: unknown, node: { id: string; type?: string; position: { x: number; y: number }; data?: unknown; width?: number; height?: number }) => {
    try {
      isDraggingRef.current = false
      const startPos = dragStartPosRef.current || node.position
      const dx = node.position.x - startPos.x
      const dy = node.position.y - startPos.y
      dragStartPosRef.current = null

      if (dx !== 0 || dy !== 0) {
        captureHistorySnapshot('Mover elemento')
      }

      if (node.type === 'packageNode') {
        setNodes(prevNodes => {
          return prevNodes.map(n => {
            if (n.type === 'packageNode') {
              const isSelf = n.id === node.id
              return { 
                ...n, 
                position: isSelf ? node.position : n.position,
                data: { 
                  ...n.data, 
                  isDraggedOver: false,
                  position: isSelf ? node.position : (n.data as any)?.position 
                } 
              }
            }
            if ((n.data as any)?.packageId === node.id) {
              const nextPos = { x: n.position.x + dx, y: n.position.y + dy }
              return { 
                ...n, 
                position: nextPos, 
                data: { ...n.data, position: nextPos } 
              }
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
            const w = (p.data as any)?.style?.width || 640
            const h = (p.data as any)?.style?.height || 420
            if (centerX >= p.position.x && centerX <= p.position.x + w && centerY >= p.position.y && centerY <= p.position.y + h) {
              containing = p
              break
            }
          }
          return prevNodes.map(n => {
            const isPackage = n.type === 'packageNode'
            const isSelf = n.id === node.id
            if (isPackage) {
              return { ...n, data: { ...n.data, isDraggedOver: false } }
            }
            if (isSelf) {
              return { 
                ...n, 
                position: node.position, 
                data: { 
                  ...n.data, 
                  position: node.position, 
                  packageId: containing ? containing.id : undefined 
                } 
              }
            }
            return n
          })
        })
      }
    } catch (err) {
      console.error('onNodeDragStop error', err)
    }
  }, [captureHistorySnapshot])

  const handleAutoLayout = useCallback(() => {
    const hasWaypoints = edges.some(e => ((e.data as any)?.waypoints || []).length > 0)
    if (hasWaypoints) {
      const confirm = window.confirm(
        'Reorganizar puede modificar la distribución visual del diagrama y eliminar los puntos de ruta manuales. ¿Deseas continuar?'
      )
      if (!confirm) return
    }

    captureHistorySnapshot('Reorganizar layout')
    setNodes(nds => autoLayoutDiagram(nds, edges, diagramType))

    // Clear waypoints on layout to ensure clean straight routing
    setEdges(eds => eds.map(e => ({
      ...e,
      data: {
        ...e.data!,
        waypoints: []
      }
    })))

    showFeedback('info', 'Diagrama reorganizado. Recuerda guardar los cambios.')
  }, [edges, diagramType, showFeedback, captureHistorySnapshot])

  const handleCleanDuplicateEdges = useCallback(() => {
    const seen = new Set<string>()
    const uniqueEdges: typeof edges = []
    let duplicateCount = 0

    edges.forEach(edge => {
      const relType = edge.data?.data?.relationshipType || 'ASSOCIATION'
      const key = `${edge.source}->${edge.target}:${relType}`
      if (seen.has(key)) {
        duplicateCount++
      } else {
        uniqueEdges.push(edge)
        seen.add(key)
      }
    })

    if (duplicateCount === 0) {
      showFeedback('info', 'No se encontraron relaciones duplicadas.')
      return
    }

    const confirm = window.confirm(`Se encontraron ${duplicateCount} relaciones duplicadas. ¿Deseas eliminarlas todas?`)
    if (confirm) {
      captureHistorySnapshot('Eliminar relaciones duplicadas')
      setEdges(uniqueEdges)
      showFeedback('success', `${duplicateCount} relaciones duplicadas eliminadas.`)
    }
  }, [edges, showFeedback, captureHistorySnapshot])

  const handleDeleteSelected = useCallback(() => {
    if (selectedNodeId) {
      handleDeleteNode(selectedNodeId)
    } else if (selectedEdgeId) {
      handleDeleteEdge(selectedEdgeId)
    }
  }, [selectedNodeId, selectedEdgeId, handleDeleteNode, handleDeleteEdge])

  const updateNode = useCallback((nextNode: DiagramNodeDTO) => {
    captureHistorySnapshot('Editar elemento')
    setNodes(nds => nds.map(node => node.id === nextNode.id ? { ...node, data: { ...nextNode, position: node.position } } : node))
  }, [captureHistorySnapshot])

  const updateEdge = useCallback((nextEdge: DiagramRelationDTO) => {
    captureHistorySnapshot('Editar relación')
    setEdges(eds => eds.map(edge => edge.id === nextEdge.id ? { ...edge, data: nextEdge, label: nextEdge.data?.label || '' } : edge))
  }, [captureHistorySnapshot])

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

    let data = null
    let retries = 0
    const maxRetries = 2

    while (retries <= maxRetries) {
      data = await run(generator)
      if (data) break
      
      retries++
      if (retries <= maxRetries) {
        showFeedback('info', `La IA tardó en responder. Reintentando... (${retries}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, 2000 * retries))
      }
    }

    if (data) {
      setAiResponse(data)
      const source = parseDiagramSource(data.sourceJson)
      const proposal = isClass
        ? mapGeneratedClassDiagramToCanvas(source)
        : mapGeneratedUseCaseDiagramToCanvas(data)
      setAiProposal(proposal)
      setShowAiModal(true)
      editorActions.editing('Propuesta de IA recibida.')
      if (isUseCase) {
        showFeedback('success', 'Diagrama de casos de uso generado correctamente.')
      }
    }
  }

  function handleApplyAiReplace() {
    if (!aiProposal) return
    captureHistorySnapshot('Reemplazar con propuesta IA')
    
    const newNodes = convertAiNodes(aiProposal)
    const newEdges = convertAiEdges(aiProposal)
    const laidOutNodes = autoLayoutDiagram(newNodes, newEdges, diagramType)
    
    setNodes(laidOutNodes)
    setEdges(newEdges)
    setShowAiModal(false)
    setAiProposal(null)

    if (aiResponse) {
      const savedId = aiResponse.id
      const savedName = aiResponse.name
      const savedType = aiResponse.diagramType

      setDiagramName(savedName)
      if (savedType) {
        setDiagramType(savedType)
      }

      if (!diagramId || diagramId === 'new') {
        setDiagramId(savedId)
        navigate(`/app/projects/${projectId}/diagrams/${savedId}`, { replace: true })
      }
      setAiResponse(null)
    }

    editorActions.editing('Propuesta de IA aplicada.')
    showFeedback('success', 'Diagrama reemplazado con propuesta IA.')
  }

  function handleApplyAiMerge() {
    if (!aiProposal) return
    captureHistorySnapshot('Fusionar propuesta IA')
    const currentSource = reactFlowToDiagramSource(nodes, edges, diagramType)
    const result = mergeDiagramSources(currentSource, aiProposal)
    const flow = diagramSourceToReactFlow({ ...currentSource, nodes: result.nodes, edges: result.edges })
    
    const laidOutNodes = autoLayoutDiagram(flow.nodes, flow.edges, diagramType)
    
    setNodes(laidOutNodes)
    setEdges(flow.edges)
    setShowAiModal(false)
    setAiProposal(null)

    if (aiResponse) {
      const savedId = aiResponse.id
      const savedName = aiResponse.name
      const savedType = aiResponse.diagramType

      setDiagramName(savedName)
      if (savedType) {
        setDiagramType(savedType)
      }

      if (!diagramId || diagramId === 'new') {
        setDiagramId(savedId)
        navigate(`/app/projects/${projectId}/diagrams/${savedId}`, { replace: true })
      }
      setAiResponse(null)
    }

    editorActions.editing(`Fusionado: +${result.addedNodesCount} elementos, +${result.addedEdgesCount} relaciones.`)
    showFeedback('success', `Fusionado: +${result.addedNodesCount} / +${result.addedEdgesCount}`)
  }

  function handleCloseAiModal() {
    setShowAiModal(false)
    setAiProposal(null)
    setAiResponse(null)
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

    if (import.meta.env.DEV) {
      console.log("[METHOD_BEFORE_MAIN_SAVE_FROM_NODES]", nodes
        .filter(n => n.type === "classNode")
        .map(n => ({
          id: n.id,
          name: n.data?.name,
          methods: (n.data as any)?.methods
        }))
      )
      console.log("[CLASS_SAVE] before save", {
        nodes: nodes.length,
        edges: edges.length,
        edgesPreview: edges.map(e => ({
          id: e.id,
          source: e.source,
          target: e.target,
          type: e.type,
          relationshipType: (e.data as any)?.relationshipType ?? (e.data as any)?.data?.relationshipType
        }))
      })
      console.log("[CLASS_SAVE] payload source", source)
      console.log("[METHOD_PARAMS_BEFORE_SAVE]", nodes
        .filter((n: any) => n.type === 'classNode')
        .map((n: any) => ({
          id: n.id,
          name: n.data?.name,
          methodsCount: n.data?.methods?.length || 0,
          methods: n.data?.methods?.map((m: any) => ({
            id: m.id,
            name: m.name,
            parametersCount: Array.isArray(m.parameters) ? m.parameters.length : 0,
            parameters: m.parameters,
            returnType: m.returnType
          }))
        }))
      )
      source.nodes.forEach((n: any) => {
        if (n.kind === 'class') {
          console.log("[METHOD_SAVE] methods", n.methods)
        }
      })
    }

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

    if (import.meta.env.DEV) {
      console.log("[CLASS_SAVE] response", data)
    }

    if (data) {
      if (import.meta.env.DEV) {
        const parsedResponse = parseDiagramSource(data.sourceJson)
        const flowResponse = diagramSourceToReactFlow(parsedResponse)
        console.log("[CLASS_SAVE] after response mapping", {
          nodes: flowResponse.nodes.length,
          edges: flowResponse.edges.length
        })
        console.log("[METHOD_PARAMS_IN_BACKEND_RESPONSE]", {
          sourceJsonType: typeof data.sourceJson,
          parsedNodes: parsedResponse.nodes
            .filter((n: any) => n.kind === 'class')
            .map((n: any) => ({
              id: n.id,
              name: n.name,
              methodsCount: n.methods?.length || 0,
              methods: n.methods?.map((m: any) => ({
                id: m.id,
                name: m.name,
                parametersCount: Array.isArray(m.parameters) ? m.parameters.length : 0,
                parameters: m.parameters
              }))
            }))
        })
      }

      if (diagramType === 'USE_CASE') {
        try {
          const relations = edges
            .map(edge => {
              const sourceNode = nodes.find(n => n.id === edge.source)
              const targetNode = nodes.find(n => n.id === edge.target)
              if (!sourceNode || !targetNode) return null

              let actorNode = null
              let useCaseNode = null

              if (sourceNode.data?.kind === 'actor') {
                actorNode = sourceNode
              } else if (targetNode.data?.kind === 'actor') {
                actorNode = targetNode
              }

              if (sourceNode.data?.kind === 'useCase') {
                useCaseNode = sourceNode
              } else if (targetNode.data?.kind === 'useCase') {
                useCaseNode = targetNode
              }

              if (actorNode && useCaseNode) {
                const actorName = actorNode.data?.name || ''
                const requirementCode = useCaseNode.data?.derivedFromRequirements?.[0] || ''
                if (actorName && requirementCode) {
                  return { actorName, requirementCode }
                }
              }
              return null
            })
            .filter((r): r is { actorName: string; requirementCode: string } => r !== null)

          await diagramsApi.saveRelations(data.id, relations)
        } catch (err) {
          console.error('Error saving diagram relations:', err)
        }
      }

      syncDiagramResponse(data, 'Diagrama guardado correctamente.')
      setShowValidationModal(false)
    } else {
      showFeedback('error', 'Error del servidor al guardar.')
    }
  }

  const handleAlignNodes = useCallback((direction: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    const selectedNodes = nodes.filter(n => n.selected)
    if (selectedNodes.length < 2) return

    const getWidth = (node: typeof nodes[0]) => {
      if (node.width) return node.width
      if (node.data.kind === 'class') return 260
      if (node.data.kind === 'useCase') return 160
      if (node.data.kind === 'actor') return 120
      return 300
    }

    const getHeight = (node: typeof nodes[0]) => {
      if (node.height) return node.height
      if (node.data.kind === 'class') return 200
      if (node.data.kind === 'useCase') return 80
      if (node.data.kind === 'actor') return 120
      return 200
    }

    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    let sumCenterX = 0
    let sumCenterY = 0

    selectedNodes.forEach(node => {
      const w = getWidth(node)
      const h = getHeight(node)
      const x = node.position.x
      const y = node.position.y
      if (x < minX) minX = x
      if (x + w > maxX) maxX = x + w
      if (y < minY) minY = y
      if (y + h > maxY) maxY = y + h
      sumCenterX += x + w / 2
      sumCenterY += y + h / 2
    })

    const avgCenterX = sumCenterX / selectedNodes.length
    const avgCenterY = sumCenterY / selectedNodes.length

    captureHistorySnapshot('Alinear nodos')
    setNodes(prevNodes => prevNodes.map(node => {
      if (!node.selected) return node

      const w = getWidth(node)
      const h = getHeight(node)
      let nextX = node.position.x
      let nextY = node.position.y

      switch (direction) {
        case 'left':
          nextX = minX
          break
        case 'center':
          nextX = avgCenterX - w / 2
          break
        case 'right':
          nextX = maxX - w
          break
        case 'top':
          nextY = minY
          break
        case 'middle':
          nextY = avgCenterY - h / 2
          break
        case 'bottom':
          nextY = maxY - h
          break
      }

      const updatedDTO = {
        ...node.data,
        position: { x: nextX, y: nextY }
      }

      return {
        ...node,
        position: { x: nextX, y: nextY },
        data: updatedDTO
      }
    }))

    showFeedback('success', `Alineados ${selectedNodes.length} nodos.`)
  }, [nodes, setNodes, showFeedback, captureHistorySnapshot])

  const handleDistributeNodes = useCallback((axis: 'horizontal' | 'vertical') => {
    const selectedNodes = nodes.filter(n => n.selected)
    if (selectedNodes.length < 3) {
      showFeedback('info', 'Selecciona al menos 3 nodos para distribuir.')
      return
    }

    const getWidth = (node: typeof nodes[0]) => {
      if (node.width) return node.width
      if (node.data.kind === 'class') return 260
      if (node.data.kind === 'useCase') return 160
      if (node.data.kind === 'actor') return 120
      return 300
    }

    const getHeight = (node: typeof nodes[0]) => {
      if (node.height) return node.height
      if (node.data.kind === 'class') return 200
      if (node.data.kind === 'useCase') return 80
      if (node.data.kind === 'actor') return 120
      return 200
    }

    captureHistorySnapshot('Distribuir nodos')
    if (axis === 'horizontal') {
      const sorted = [...selectedNodes].sort((a, b) => a.position.x - b.position.x)
      const first = sorted[0]
      const last = sorted[sorted.length - 1]
      const startX = first.position.x
      const endX = last.position.x
      
      const totalWidths = sorted.reduce((sum, n) => sum + getWidth(n), 0)
      const span = endX + getWidth(last) - startX
      const remainingSpace = span - totalWidths
      const spacing = remainingSpace / (sorted.length - 1)

      let currentX = startX
      const positionMap = new Map<string, number>()
      
      sorted.forEach(node => {
        positionMap.set(node.id, currentX)
        currentX += getWidth(node) + spacing
      })

      setNodes(prev => prev.map(node => {
        if (!node.selected) return node
        const nextX = positionMap.get(node.id) ?? node.position.x
        return {
          ...node,
          position: { x: nextX, y: node.position.y },
          data: { ...node.data, position: { x: nextX, y: node.position.y } }
        }
      }))
    } else {
      const sorted = [...selectedNodes].sort((a, b) => a.position.y - b.position.y)
      const first = sorted[0]
      const last = sorted[sorted.length - 1]
      const startY = first.position.y
      const endY = last.position.y
      
      const totalHeights = sorted.reduce((sum, n) => sum + getHeight(n), 0)
      const span = endY + getHeight(last) - startY
      const remainingSpace = span - totalHeights
      const spacing = remainingSpace / (sorted.length - 1)

      let currentY = startY
      const positionMap = new Map<string, number>()
      
      sorted.forEach(node => {
        positionMap.set(node.id, currentY)
        currentY += getHeight(node) + spacing
      })

      setNodes(prev => prev.map(node => {
        if (!node.selected) return node
        const nextY = positionMap.get(node.id) ?? node.position.y
        return {
          ...node,
          position: { x: node.position.x, y: nextY },
          data: { ...node.data, position: { x: node.position.x, y: nextY } }
        }
      }))
    }

    showFeedback('success', `Distribuidos ${selectedNodes.length} nodos.`)
  }, [nodes, setNodes, showFeedback, captureHistorySnapshot])

  const handleGroupIntoPackage = useCallback(() => {
    const selectedNodes = nodes.filter(n => n.selected)
    if (selectedNodes.length === 0) return

    const getWidth = (node: typeof nodes[0]) => {
      if (node.width) return node.width
      if (node.data.kind === 'class') return 260
      if (node.data.kind === 'useCase') return 160
      if (node.data.kind === 'actor') return 120
      return 300
    }

    const getHeight = (node: typeof nodes[0]) => {
      if (node.height) return node.height
      if (node.data.kind === 'class') return 200
      if (node.data.kind === 'useCase') return 80
      if (node.data.kind === 'actor') return 120
      return 200
    }

    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity

    selectedNodes.forEach(node => {
      const w = getWidth(node)
      const h = getHeight(node)
      const x = node.position.x
      const y = node.position.y
      if (x < minX) minX = x
      if (x + w > maxX) maxX = x + w
      if (y < minY) minY = y
      if (y + h > maxY) maxY = y + h
    })

    const pkgMinX = minX - 30
    const pkgMinY = minY - 50
    const pkgWidth = maxX - minX + 60
    const pkgHeight = maxY - minY + 80

    const newPkgId = `pkg-${generateSafeId()}`
    const newPkgDTO: DiagramNodeDTO = {
      id: newPkgId,
      kind: 'package',
      name: 'Paquete Agrupado',
      description: 'Paquete creado automáticamente por agrupación.',
      position: { x: pkgMinX, y: pkgMinY },
      derivedFromRequirements: [],
      style: {
        width: pkgWidth,
        height: pkgHeight,
        color: '#3b82f6'
      }
    }

    const newPkgNode: Node<DiagramNodeDTO> = {
      id: newPkgId,
      type: 'packageNode',
      position: newPkgDTO.position,
      data: newPkgDTO,
      selected: false
    }

    const updatedNodes = nodes.map(node => {
      if (node.selected && node.data.kind !== 'package') {
        const nextDTO = {
          ...node.data,
          packageId: newPkgId
        }
        return {
          ...node,
          data: nextDTO
        }
      }
      return node
    })

    setNodes([newPkgNode, ...updatedNodes])
    showFeedback('success', `Creado paquete conteniendo ${selectedNodes.length} nodos.`)
  }, [nodes, setNodes, showFeedback])

  const handleDuplicateSelected = useCallback(() => {
    const selectedNodes = nodes.filter(n => n.selected)
    if (selectedNodes.length === 0) return

    const nodeIdMap = new Map<string, string>()
    const duplicatedNodes: Node<DiagramNodeDTO>[] = []

    selectedNodes.forEach(oldNode => {
      const newId = `node_${generateSafeId()}`
      nodeIdMap.set(oldNode.id, newId)

      const nextName = `${oldNode.data.name} copia`
      
      const newDTO: DiagramNodeDTO = {
        ...oldNode.data,
        id: newId,
        name: nextName,
        position: {
          x: oldNode.position.x + 40,
          y: oldNode.position.y + 40
        }
      }

      duplicatedNodes.push({
        id: newId,
        type: oldNode.type,
        position: newDTO.position,
        data: newDTO,
        selected: true
      })
    })

    const unselectedNodes = nodes.map(n => n.selected ? { ...n, selected: false } : n)

    const newEdges: Edge<DiagramRelationDTO>[] = []
    edges.forEach(edge => {
      const newSourceId = nodeIdMap.get(edge.source)
      const newTargetId = nodeIdMap.get(edge.target)

      if (newSourceId && newTargetId) {
        const newEdgeId = `edge_${generateSafeId()}`
        const newRelationData = {
          ...edge.data?.data,
          source: newSourceId,
          target: newTargetId
        }

        newEdges.push({
          id: newEdgeId,
          source: newSourceId,
          target: newTargetId,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
          type: edge.type,
          data: {
            id: newEdgeId,
            source: newSourceId,
            target: newTargetId,
            sourceHandle: edge.sourceHandle,
            targetHandle: edge.targetHandle,
            type: edge.type,
            data: newRelationData,
            derivedFromRequirements: edge.data?.derivedFromRequirements || []
          } as any,
          selected: true
        })
      }
    })

    const unselectedEdges = edges.map(e => e.selected ? { ...e, selected: false } : e)

    setNodes([...unselectedNodes, ...duplicatedNodes])
    setEdges([...unselectedEdges, ...newEdges])

    showFeedback('success', `Duplicados ${duplicatedNodes.length} elementos.`)
  }, [nodes, edges, showFeedback])

  const handleDuplicateNode = useCallback((nodeId: string) => {
    const targetNode = nodes.find(n => n.id === nodeId)
    if (!targetNode) return

    const newId = `node_${generateSafeId()}`
    const newDTO: DiagramNodeDTO = {
      ...targetNode.data,
      id: newId,
      name: `${targetNode.data.name} copia`,
      position: {
        x: targetNode.position.x + 40,
        y: targetNode.position.y + 40
      }
    }

    const newNode: Node<DiagramNodeDTO> = {
      id: newId,
      type: targetNode.type,
      position: newDTO.position,
      data: newDTO,
      selected: true
    }

    const unselectedNodes = nodes.map(n => ({ ...n, selected: false }))
    setNodes([...unselectedNodes, newNode])
    showFeedback('success', `Elemento '${targetNode.data.name}' duplicado.`)
  }, [nodes, showFeedback])

  const handleQuickAddAttribute = useCallback((id: string) => {
    setSelectedNodeId(id)
    setSelectedEdgeId(null)
    setEditorTarget('node')
    setIsSidebarOpen(true)
    setSidebarTabPreference('attributes')
    setSidebarSubViewPreference('ATTRIBUTE_FORM')
  }, [])

  const handleQuickAddMethod = useCallback((id: string) => {
    setSelectedNodeId(id)
    setSelectedEdgeId(null)
    setEditorTarget('node')
    setIsSidebarOpen(true)
    setSidebarTabPreference('methods')
    setSidebarSubViewPreference('METHOD_FORM')
  }, [])

  const handleQuickCreateRelation = useCallback((id: string) => {
    const sourceNode = nodes.find(n => n.id === id)
    if (!sourceNode) return

    const newId = `node_${generateSafeId()}`
    const isUml = sourceNode.type === 'classNode'
    
    const newDTO: DiagramNodeDTO = isUml ? {
      id: newId,
      kind: 'class',
      umlType: 'CLASS',
      name: `NuevaClaseRelacionada`,
      attributes: [],
      methods: [],
      enumValues: [],
      position: {
        x: sourceNode.position.x + 280,
        y: sourceNode.position.y + 40
      },
      packageId: (sourceNode.data as any).packageId
    } : {
      id: newId,
      kind: sourceNode.data.kind === 'actor' ? 'actor' : 'useCase',
      name: sourceNode.data.kind === 'actor' ? 'ActorRelacionado' : 'CasoDeUsoRelacionado',
      description: '',
      position: {
        x: sourceNode.position.x + 240,
        y: sourceNode.position.y + 40
      },
      packageId: (sourceNode.data as any).packageId
    }

    const newNode: Node<DiagramNodeDTO> = {
      id: newId,
      type: sourceNode.type,
      position: newDTO.position,
      data: newDTO,
      selected: true
    }

    const unselectedNodes = nodes.map(n => ({ ...n, selected: false }))
    
    const newEdgeId = `edge_${generateSafeId()}`
    const newEdge: Edge<DiagramRelationDTO> = {
      id: newEdgeId,
      source: id,
      target: newId,
      sourceHandle: 's-right',
      targetHandle: 't-left',
      type: isUml ? 'umlEdge' : 'useCaseEdge',
      data: {
        id: newEdgeId,
        source: id,
        target: newId,
        sourceHandle: 's-right',
        targetHandle: 't-left',
        type: isUml ? 'umlEdge' : 'useCaseEdge',
        data: {
          relationshipType: 'ASSOCIATION',
          label: '',
          description: '',
          sourceMultiplicity: '1',
          targetMultiplicity: '1',
          waypoints: []
        },
        derivedFromRequirements: []
      }
    }

    setNodes([...unselectedNodes, newNode])
    setEdges(prev => [...prev, newEdge])
    showFeedback('success', 'Relación y clase creada con éxito.')
  }, [nodes, setNodes, setEdges, showFeedback])

  const handleQuickAddInclude = useCallback((id: string) => {
    const sourceNode = nodes.find(n => n.id === id)
    if (!sourceNode) return

    const newId = `node_${generateSafeId()}`
    const newDTO: DiagramNodeDTO = {
      id: newId,
      kind: 'useCase',
      name: `CasoDeUsoIncluido`,
      description: '',
      position: {
        x: sourceNode.position.x + 240,
        y: sourceNode.position.y + 40
      },
      packageId: (sourceNode.data as any).packageId
    }

    const newNode: Node<DiagramNodeDTO> = {
      id: newId,
      type: 'useCaseNode',
      position: newDTO.position,
      data: newDTO,
      selected: true
    }

    const unselectedNodes = nodes.map(n => ({ ...n, selected: false }))
    
    const newEdgeId = `edge_${generateSafeId()}`
    const newEdge: Edge<DiagramRelationDTO> = {
      id: newEdgeId,
      source: id,
      target: newId,
      sourceHandle: 's-right',
      targetHandle: 't-left',
      type: 'useCaseEdge',
      data: {
        id: newEdgeId,
        source: id,
        target: newId,
        sourceHandle: 's-right',
        targetHandle: 't-left',
        type: 'useCaseEdge',
        data: {
          relationshipType: 'INCLUDE',
          label: '<<include>>',
          description: '',
          sourceMultiplicity: '1',
          targetMultiplicity: '1',
          waypoints: []
        },
        derivedFromRequirements: []
      }
    }

    setNodes([...unselectedNodes, newNode])
    setEdges(prev => [...prev, newEdge])
    showFeedback('success', 'Caso de uso incluido creado y conectado.')
  }, [nodes, setNodes, setEdges, showFeedback])

  const handleQuickAddExtend = useCallback((id: string) => {
    const sourceNode = nodes.find(n => n.id === id)
    if (!sourceNode) return

    const newId = `node_${generateSafeId()}`
    const newDTO: DiagramNodeDTO = {
      id: newId,
      kind: 'useCase',
      name: `CasoDeUsoExtendiendo`,
      description: '',
      position: {
        x: sourceNode.position.x + 240,
        y: sourceNode.position.y - 80
      },
      packageId: (sourceNode.data as any).packageId
    }

    const newNode: Node<DiagramNodeDTO> = {
      id: newId,
      type: 'useCaseNode',
      position: newDTO.position,
      data: newDTO,
      selected: true
    }

    const unselectedNodes = nodes.map(n => ({ ...n, selected: false }))
    
    const newEdgeId = `edge_${generateSafeId()}`
    const newEdge: Edge<DiagramRelationDTO> = {
      id: newEdgeId,
      source: newId,
      target: id,
      sourceHandle: 's-bottom',
      targetHandle: 't-top',
      type: 'useCaseEdge',
      data: {
        id: newEdgeId,
        source: newId,
        target: id,
        sourceHandle: 's-bottom',
        targetHandle: 't-top',
        type: 'useCaseEdge',
        data: {
          relationshipType: 'EXTEND',
          label: '<<extend>>',
          description: '',
          sourceMultiplicity: '1',
          targetMultiplicity: '1',
          waypoints: []
        },
        derivedFromRequirements: []
      }
    }

    setNodes([...unselectedNodes, newNode])
    setEdges(prev => [...prev, newEdge])
    showFeedback('success', 'Caso de uso extendido creado y conectado.')
  }, [nodes, setNodes, setEdges, showFeedback])

  const handleQuickAddToPackage = useCallback((id: string, pkgId: string | null) => {
    captureHistorySnapshot('Añadir a paquete')
    setNodes(prev => prev.map(node => {
      if (node.id === id) {
        return {
          ...node,
          data: {
            ...node.data,
            packageId: pkgId || undefined
          }
        }
      }
      return node
    }))
    showFeedback('success', pkgId ? 'Elemento añadido al paquete.' : 'Elemento removido del paquete.')
  }, [showFeedback, captureHistorySnapshot])

  const handleUndo = useCallback(() => {
    const previous = popUndo(nodes, edges, selectedNodeId, selectedEdgeId)
    if (previous) {
      isRestoringHistoryRef.current = true
      setNodes(previous.nodes)
      setEdges(previous.edges)
      setSelectedNodeId(previous.selectedNodeId)
      setSelectedEdgeId(previous.selectedEdgeId)
      setIsDirty(true)
      showFeedback('info', `Deshecho: ${previous.reason}`)
      setTimeout(() => {
        isRestoringHistoryRef.current = false
      }, 50)
    }
  }, [nodes, edges, selectedNodeId, selectedEdgeId, popUndo, showFeedback])

  const handleRedo = useCallback(() => {
    const next = popRedo(nodes, edges, selectedNodeId, selectedEdgeId)
    if (next) {
      isRestoringHistoryRef.current = true
      setNodes(next.nodes)
      setEdges(next.edges)
      setSelectedNodeId(next.selectedNodeId)
      setSelectedEdgeId(next.selectedEdgeId)
      setIsDirty(true)
      showFeedback('info', `Rehecho: ${next.reason}`)
      setTimeout(() => {
        isRestoringHistoryRef.current = false
      }, 50)
    }
  }, [nodes, edges, selectedNodeId, selectedEdgeId, popRedo, showFeedback])

  const handleBack = useCallback(async () => {
    if (isDirty) {
      showFeedback('info', 'Guardando cambios antes de salir...')
      await handleSaveDiagram(true)
    }
    const typePath = diagramType === 'CLASS' ? 'class' : 'use-case'
    navigate(`/app/projects/${projectId}/diagrams/${typePath}`)
  }, [isDirty, handleSaveDiagram, diagramType, projectId, navigate, showFeedback])

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
    handleReconnect,
    handleAddElement,
    handleAddActor,
    handleAddUseCase,
    handleAddPackage,
    handleDeleteSelected,
    handleDeleteNode,
    handleDeleteEdge,
    handleNodeDragStart,
    handleNodeDrag,
    handleNodeDragStop,
    updateNode,
    updateEdge,
    handleSaveDiagram,
    handleGenerateAutoDiagram,
    handleAutoLayout,
    handleCleanDuplicateEdges,
    handleApplyAiReplace,
    handleApplyAiMerge,
    handleCloseAiModal,
    handleSelectIssue,
    setDiagramName,
    setIsSidebarOpen,
    setShowValidationModal,
    setShowAiModal,
    sidebarTabPreference,
    setSidebarTabPreference,
    sidebarSubViewPreference,
    setSidebarSubViewPreference,
    handleAlignNodes,
    handleDistributeNodes,
    handleGroupIntoPackage,
    handleDuplicateSelected,
    handleDuplicateNode,
    handleQuickAddAttribute,
    handleQuickAddMethod,
    handleQuickCreateRelation,
    handleQuickAddInclude,
    handleQuickAddExtend,
    handleQuickAddToPackage,
    setSelectedNodeId,
    setEditorTarget,
    clearSelection,
    // Safely exposed undo/redo/dirty
    canUndo,
    canRedo,
    isDirty,
    lastSavedTime,
    handleUndo,
    handleRedo,
    handleBack,
  }
}