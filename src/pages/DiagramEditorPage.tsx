import { useCallback, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  applyEdgeChanges,
  applyNodeChanges,
  addEdge,
  type Connection,
  type OnEdgesChange,
  type OnNodesChange,
  type OnSelectionChangeFunc,
} from 'reactflow'
import { diagramFacade } from '../facades/diagram.facade'
import { useApiOperation } from '../hooks/useLoadingError'
import { isValidProjectId } from '../context/ProjectContext'
import { NoProjectSelected } from '../components/ui/NoProjectSelected'
import { DiagramCanvas } from '../components/diagram/DiagramCanvas'
import { DiagramSidebar, type EditorTarget } from '../components/diagram/DiagramSidebar'
import { DiagramToolbar } from '../components/diagram/DiagramToolbar'
import { useDiagramEditorStore } from '../state/diagramEditor.store'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import type {
  DiagramClassNodeDTO,
  DiagramRelationDTO,
  DiagramType,
  DiagramResponse,
  DiagramSourceDTO,
  DiagramSummaryResponse,
} from '../types/diagrams'
import {
  createDiagramClassNode,
  createDiagramRelation,
  createEmptyDiagramSource,
  diagramSourceToReactFlow,
  parseDiagramSource,
  reactFlowToDiagramSource,
  serializeDiagramSource,
  validateDiagramSource,
} from '../utils/diagramMapper'

export function DiagramEditorPage() {
  const { projectId: routeProjectId } = useParams()
  const navigate = useNavigate()
  const { state: editorState, actions: editorActions } = useDiagramEditorStore()
  const { run } = useApiOperation()

  const [projectId, setProjectId] = useState(routeProjectId ?? '')
  const [diagramId, setDiagramId] = useState('')
  const [diagramName, setDiagramName] = useState('Diagrama de clases')
  const [diagramType, setDiagramType] = useState<DiagramType>('CLASS')
  const [plantUmlPreview, setPlantUmlPreview] = useState('')
  const [diagramList, setDiagramList] = useState<DiagramSummaryResponse[]>([])

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [editorTarget, setEditorTarget] = useState<EditorTarget>(null)

  const [source, setSource] = useState<DiagramSourceDTO>(() => createEmptyDiagramSource())

  const flowState = useMemo(() => diagramSourceToReactFlow(source), [source])
  const selectedNode = source.nodes.find((node) => node.id === selectedNodeId) ?? null
  const selectedEdge = source.edges.find((edge) => edge.id === selectedEdgeId) ?? null
  const validation = useMemo(() => validateDiagramSource(source), [source])

  if (!isValidProjectId(routeProjectId)) {
    return <NoProjectSelected message="Selecciona un proyecto para usar el editor de diagramas." />
  }

  const handleNodesChange: OnNodesChange = useCallback((changes) => {
    setSource((current) => {
      const flow = diagramSourceToReactFlow(current)
      const nextNodes = applyNodeChanges(changes, flow.nodes)
      return reactFlowToDiagramSource(nextNodes, flow.edges)
    })
  }, [])

  const handleEdgesChange: OnEdgesChange = useCallback((changes) => {
    setSource((current) => {
      const flow = diagramSourceToReactFlow(current)
      const nextEdges = applyEdgeChanges(changes, flow.edges)
      return reactFlowToDiagramSource(flow.nodes, nextEdges)
    })
  }, [])

  const handleConnect = useCallback((connection: Connection) => {
    const src = connection.source
    const tgt = connection.target
    if (!src || !tgt) return

    setSource((current) => {
      const edge = createDiagramRelation(src, tgt)
      const flow = diagramSourceToReactFlow(current)
      const nextEdges = addEdge(
        {
          id: edge.id,
          source: edge.from,
          target: edge.to,
          type: 'smoothstep',
          label: edge.label || undefined,
          data: edge,
        },
        flow.edges,
      )
      return reactFlowToDiagramSource(flow.nodes, nextEdges)
    })
  }, [])

  const handleSelectionChange: OnSelectionChangeFunc = useCallback(({ nodes, edges }) => {
    setSelectedNodeId(nodes[0]?.id ?? null)
    setSelectedEdgeId(edges[0]?.id ?? null)
    setEditorTarget(nodes[0] ? 'node' : edges[0] ? 'edge' : null)
  }, [])

  function handleAddNode(): void {
    setSource((current) => ({
      ...current,
      nodes: [...current.nodes, createDiagramClassNode('NuevaClase')],
    }))
  }

  function handleDeleteSelected(): void {
    if (selectedNodeId) {
      setSource((current) => ({
        ...current,
        nodes: current.nodes.filter((node) => node.id !== selectedNodeId),
        edges: current.edges.filter((edge) => edge.from !== selectedNodeId && edge.to !== selectedNodeId),
      }))
      setSelectedNodeId(null)
      setEditorTarget(null)
      return
    }
    if (selectedEdgeId) {
      setSource((current) => ({
        ...current,
        edges: current.edges.filter((edge) => edge.id !== selectedEdgeId),
      }))
      setSelectedEdgeId(null)
      setEditorTarget(null)
    }
  }

  function updateNode(nextNode: DiagramClassNodeDTO): void {
    setSource((current) => ({
      ...current,
      nodes: current.nodes.map((node) => (node.id === nextNode.id ? nextNode : node)),
    }))
  }

  function updateEdge(nextEdge: DiagramRelationDTO): void {
    setSource((current) => ({
      ...current,
      edges: current.edges.map((edge) => (edge.id === nextEdge.id ? nextEdge : edge)),
    }))
  }

  function syncDiagramResponse(response: DiagramResponse, message = 'Diagrama cargado.'): void {
    setDiagramId(response.id)
    setProjectId(response.projectId)
    setDiagramName(response.name)
    setDiagramType(response.diagramType)
    setPlantUmlPreview(response.plantUmlCode ?? '')
    setSource(parseDiagramSource(response.sourceJson))
    setSelectedNodeId(null)
    setSelectedEdgeId(null)
    setEditorTarget(null)
    editorActions.editing(message)
  }

  async function handleCreateManualDiagram(): Promise<void> {
    if (!isValidProjectId(projectId) || !diagramName.trim() || !validation.isValid) return
    const data = await run(() => diagramFacade.createManual({
      projectId: projectId.trim(),
      name: diagramName.trim(),
      sourceJson: serializeDiagramSource(source),
      plantUmlCode: null,
    }), { errorMessage: 'Error al crear.' })
    if (data) syncDiagramResponse(data, 'Diagrama creado.')
  }

  async function handleGenerateAutoDiagram(): Promise<void> {
    if (!isValidProjectId(projectId)) return
    const data = await run(() => diagramFacade.generateClassDiagram(projectId.trim()), { errorMessage: 'Error al generar.' })
    if (data) syncDiagramResponse(data, 'Generación exitosa.')
  }

  async function handleLoadProjectDiagrams(): Promise<void> {
    if (!isValidProjectId(projectId)) return
    const data = await run(() => diagramFacade.listByProject(projectId.trim()), { errorMessage: 'Error al listar.' })
    if (data) setDiagramList(data)
  }

  async function handleSaveDiagram(): Promise<void> {
    if (!isValidProjectId(projectId) || !diagramName.trim() || !validation.isValid) return
    const payload = {
      projectId: projectId.trim(),
      name: diagramName.trim(),
      sourceJson: serializeDiagramSource(source),
      plantUmlCode: plantUmlPreview || null,
    }
    const data = await run(() => diagramFacade.saveOrUpdate(diagramId.trim() || null, payload), { errorMessage: 'Error al guardar.' })
    if (data) syncDiagramResponse(data, 'Guardado exitoso.')
  }

  async function handleGeneratePlantUml(): Promise<void> {
    if (!diagramId.trim() || !validation.isValid) return
    const data = await run(() => diagramFacade.generatePlantUml(diagramId.trim()), { errorMessage: 'Error en PlantUML.' })
    if (data) syncDiagramResponse(data, 'PlantUML actualizado.')
  }

  async function handleExport(format: 'puml' | 'txt'): Promise<void> {
    if (!diagramId.trim()) return
    const blob = await run(() => format === 'puml' ? diagramFacade.exportPlantUml(diagramId.trim()) : diagramFacade.exportText(diagramId.trim()))
    if (blob) downloadBlob(blob, diagramName || 'diagram', format)
  }

  return (
    <div className="h-screen flex flex-col bg-app-bg">
      <header className="h-16 px-6 flex items-center justify-between border-b border-app-border bg-white dark:bg-[#1e1e1e] shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/app/projects/${projectId}`)}>← Hub</Button>
          <div className="h-4 w-[1px] bg-app-border" />
          <h1 className="font-bold tracking-tight">{diagramName}</h1>
          <Badge variant="neutral">{diagramType}</Badge>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-app-text-muted font-mono">{editorState.status}</span>
          <Button size="sm" onClick={handleSaveDiagram}>Guardar Cambios</Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbar */}
        <aside className="w-80 border-r border-app-border flex flex-col bg-[#fcfcfc] dark:bg-[#181818] overflow-y-auto">
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="text-[12px] font-bold uppercase tracking-wider text-app-text-muted">Propiedades</h3>
              <Input label="Nombre del Diagrama" value={diagramName} onChange={e => setDiagramName(e.target.value)} />
            </div>

            <DiagramToolbar
              isSaved={Boolean(diagramId.trim())}
              isValid={validation.isValid}
              hasSelection={Boolean(selectedNodeId || selectedEdgeId)}
              status={editorState.status}
              onAddNode={handleAddNode}
              onSave={handleSaveDiagram}
              onCreateManual={handleCreateManualDiagram}
              onGenerateAuto={handleGenerateAutoDiagram}
              onDeleteSelected={handleDeleteSelected}
            />

            <div className="space-y-4 pt-4 border-t border-app-border">
              <h3 className="text-[12px] font-bold uppercase tracking-wider text-app-text-muted">Proyecto</h3>
              <Button variant="secondary" className="w-full" onClick={handleLoadProjectDiagrams}>Listar Diagramas</Button>
              <div className="space-y-2">
                {diagramList.map(d => (
                  <button 
                    key={d.id} 
                    onClick={() => syncDiagramResponse(d as any)}
                    className="w-full text-left p-3 text-sm rounded-lg border border-app-border hover:border-app-accent transition-all bg-white dark:bg-[#1e1e1e]"
                  >
                    {d.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-app-border">
              <h3 className="text-[12px] font-bold uppercase tracking-wider text-app-text-muted">Exportar</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="ghost" size="sm" onClick={handleGeneratePlantUml}>PlantUML</Button>
                <Button variant="ghost" size="sm" onClick={() => handleExport('puml')}>.puml</Button>
              </div>
            </div>
          </div>
        </aside>

        {/* Canvas Area */}
        <main className="flex-1 relative bg-white">
          <DiagramCanvas
            nodes={flowState.nodes}
            edges={flowState.edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={handleConnect}
            onSelectionChange={handleSelectionChange}
          />
        </main>

        {/* Right Properties */}
        <aside className="w-80 border-l border-app-border bg-[#fcfcfc] dark:bg-[#181818] overflow-y-auto">
          <DiagramSidebar
            editorTarget={editorTarget}
            selectedNode={selectedNode}
            selectedEdge={selectedEdge}
            onUpdateNode={updateNode}
            onUpdateEdge={updateEdge}
          />
        </aside>
      </div>
    </div>
  )
}

function downloadBlob(blob: Blob, filenamePrefix: string, extension: 'puml' | 'txt'): void {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filenamePrefix}.${extension}`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
