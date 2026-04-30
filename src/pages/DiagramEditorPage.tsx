import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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
import { useAuth } from '../auth/useAuth'
import { DiagramCanvas } from '../components/diagram/DiagramCanvas'
import { DiagramSidebar, type EditorTarget } from '../components/diagram/DiagramSidebar'
import { DiagramToolbar } from '../components/diagram/DiagramToolbar'
import { useDiagramEditorStore } from '../state/diagramEditor.store'
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
  const { user, logout } = useAuth()
  const { state: editorState, actions: editorActions } = useDiagramEditorStore()
  const { run } = useApiOperation()

  // ── Diagram metadata ──
  const [diagramId, setDiagramId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [diagramName, setDiagramName] = useState('Diagrama de clases')
  const [diagramType, setDiagramType] = useState<DiagramType>('CLASS')
  const [plantUmlPreview, setPlantUmlPreview] = useState('')
  const [diagramList, setDiagramList] = useState<DiagramSummaryResponse[]>([])

  // ── Selection state ──
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [editorTarget, setEditorTarget] = useState<EditorTarget>(null)

  // ── Diagram source (single source of truth) ──
  const [source, setSource] = useState<DiagramSourceDTO>(() => createEmptyDiagramSource())

  // ── Derived state ──
  const flowState = useMemo(() => diagramSourceToReactFlow(source), [source])
  const selectedNode = source.nodes.find((node) => node.id === selectedNodeId) ?? null
  const selectedEdge = source.edges.find((edge) => edge.id === selectedEdgeId) ?? null
  const validation = useMemo(() => validateDiagramSource(source), [source])

  // ── Canvas handlers ──
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

  // ── Toolbar actions ──
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

  // ── Sidebar handlers ──
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

  // ── Sync helper ──
  function syncDiagramResponse(response: DiagramResponse, message = 'Diagrama cargado correctamente.'): void {
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

  // ── CRUD operations (via diagramFacade + useApiOperation) ──
  async function handleCreateManualDiagram(): Promise<void> {
    if (!projectId.trim()) { editorActions.error('Debes indicar un projectId antes de crear el diagrama.'); return }
    if (!diagramName.trim()) { editorActions.error('Debes indicar un nombre para el diagrama.'); return }
    if (!validation.isValid) { editorActions.error(validation.errors.join(' ')); return }

    editorActions.saving('Creando diagrama manual...')
    const data = await run(
      () => diagramFacade.createManual({
        projectId: projectId.trim(),
        name: diagramName.trim(),
        sourceJson: serializeDiagramSource(source),
        plantUmlCode: null,
      }),
      { operationName: 'createManualDiagram', errorMessage: 'No fue posible crear el diagrama manual.' },
    )
    if (data) syncDiagramResponse(data, 'Diagrama manual creado exitosamente.')
    else editorActions.error('No fue posible crear el diagrama manual.')
  }

  async function handleCreateUseCaseManualDiagram(): Promise<void> {
    if (!projectId.trim()) { editorActions.error('Debes indicar un projectId antes de crear el diagrama.'); return }
    if (!diagramName.trim()) { editorActions.error('Debes indicar un nombre para el diagrama.'); return }
    if (!validation.isValid) { editorActions.error(validation.errors.join(' ')); return }

    editorActions.saving('Creando caso de uso manual...')
    const data = await run(
      () => diagramFacade.createUseCaseManual({
        projectId: projectId.trim(),
        name: diagramName.trim(),
        sourceJson: serializeDiagramSource(source),
        plantUmlCode: null,
        diagramType: 'USE_CASE',
      }),
      { operationName: 'createUseCaseManualDiagram', errorMessage: 'No fue posible crear el diagrama de caso de uso.' },
    )
    if (data) syncDiagramResponse(data, 'Diagrama de caso de uso creado exitosamente.')
    else editorActions.error('No fue posible crear el diagrama de caso de uso.')
  }

  async function handleGenerateAutoDiagram(): Promise<void> {
    if (!projectId.trim()) { editorActions.error('Debes indicar un projectId.'); return }

    editorActions.loading('Generando diagrama automático...')
    const data = await run(
      () => diagramFacade.generateClassDiagram(projectId.trim()),
      { operationName: 'generateAutoDiagram', errorMessage: 'No fue posible generar el diagrama automático.' },
    )
    if (data) syncDiagramResponse(data, 'Diagrama automático generado exitosamente.')
    else editorActions.error('No fue posible generar el diagrama automático.')
  }

  async function handleGenerateUseCaseAutoDiagram(): Promise<void> {
    if (!projectId.trim()) { editorActions.error('Debes indicar un projectId.'); return }

    editorActions.loading('Generando caso de uso automático...')
    const data = await run(
      () => diagramFacade.generateUseCaseDiagram(projectId.trim()),
      { operationName: 'generateUseCaseAutoDiagram', errorMessage: 'No fue posible generar el caso de uso automático.' },
    )
    if (data) syncDiagramResponse(data, 'Caso de uso automático generado exitosamente.')
    else editorActions.error('No fue posible generar el caso de uso automático.')
  }

  async function handleLoadDiagram(): Promise<void> {
    if (!diagramId.trim()) { editorActions.error('Debes indicar un diagramId.'); return }

    editorActions.loading('Cargando diagrama...')
    const data = await run(
      () => diagramFacade.getById(diagramId.trim()),
      { operationName: 'loadDiagram', errorMessage: 'No fue posible cargar el diagrama.' },
    )
    if (data) syncDiagramResponse(data, 'Diagrama cargado correctamente.')
    else editorActions.error('No fue posible cargar el diagrama.')
  }

  async function handleLoadProjectDiagrams(): Promise<void> {
    if (!projectId.trim()) { editorActions.error('Debes indicar un projectId.'); return }

    editorActions.loading('Listando diagramas del proyecto...')
    const data = await run(
      () => diagramFacade.listByProject(projectId.trim()),
      { operationName: 'listProjectDiagrams', errorMessage: 'No fue posible listar los diagramas del proyecto.' },
    )
    if (data) {
      setDiagramList(data)
      editorActions.editing(`Diagramas del proyecto: ${data.length}`)
    } else {
      editorActions.error('No fue posible listar los diagramas del proyecto.')
    }
  }

  async function handleSaveDiagram(): Promise<void> {
    if (!projectId.trim()) { editorActions.error('Debes indicar un projectId.'); return }
    if (!diagramName.trim()) { editorActions.error('Debes indicar un nombre para el diagrama.'); return }
    if (!validation.isValid) { editorActions.error(validation.errors.join(' ')); return }

    editorActions.saving('Guardando diagrama...')
    const payload = {
      projectId: projectId.trim(),
      name: diagramName.trim(),
      sourceJson: serializeDiagramSource(source),
      plantUmlCode: plantUmlPreview || null,
    }
    const data = await run(
      () => diagramFacade.saveOrUpdate(diagramId.trim() || null, payload),
      { operationName: 'saveDiagram', errorMessage: 'No fue posible guardar el diagrama.' },
    )
    if (data) syncDiagramResponse(data, 'Diagrama guardado correctamente.')
    else editorActions.error('No fue posible guardar el diagrama.')
  }

  async function handleGeneratePlantUml(): Promise<void> {
    if (!diagramId.trim()) { editorActions.error('Primero carga o guarda un diagrama para generar PlantUML.'); return }
    if (!validation.isValid) { editorActions.error(validation.errors.join(' ')); return }

    editorActions.exporting('Generando PlantUML...')
    const data = await run(
      () => diagramFacade.generatePlantUml(diagramId.trim()),
      { operationName: 'generatePlantUml', errorMessage: 'No fue posible generar PlantUML.' },
    )
    if (data) syncDiagramResponse(data, 'PlantUML generado correctamente.')
    else editorActions.error('No fue posible generar PlantUML.')
  }

  async function handleExport(format: 'puml' | 'txt'): Promise<void> {
    if (!diagramId.trim()) { editorActions.error('Primero carga o guarda un diagrama.'); return }

    editorActions.exporting(`Exportando ${format.toUpperCase()}...`)
    const blob = await run(
      () => format === 'puml'
        ? diagramFacade.exportPlantUml(diagramId.trim())
        : diagramFacade.exportText(diagramId.trim()),
      { operationName: `export_${format}`, errorMessage: `No fue posible exportar el archivo ${format.toUpperCase()}.` },
    )
    if (blob) {
      downloadBlob(blob, diagramName || 'diagram', format)
      editorActions.editing(`Exportación ${format.toUpperCase()} completada.`)
    } else {
      editorActions.error(`No fue posible exportar el archivo ${format.toUpperCase()}.`)
    }
  }

  async function loadDiagramFromList(id: string): Promise<void> {
    editorActions.loading('Cargando diagrama seleccionado...')
    const data = await run(
      () => diagramFacade.getById(id),
      { operationName: 'loadDiagramFromList', errorMessage: 'No fue posible cargar el diagrama.' },
    )
    if (data) syncDiagramResponse(data, 'Diagrama cargado correctamente.')
    else editorActions.error('No fue posible cargar el diagrama.')
  }

  function selectedModeLabel(): string {
    if (diagramId.trim()) return 'Guardado / existente'
    if (diagramList.length > 0) return 'Listando proyecto'
    return 'Local / nuevo'
  }

  // ── Render ──
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex min-h-screen flex-col gap-4 p-4 lg:p-6">

        {/* ── Header ── */}
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Fase 3</p>
            <h1 className="text-2xl font-semibold">Editor visual de diagramas</h1>
            <p className="text-sm text-slate-300">Fuente de verdad: sourceJson</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="rounded-md border border-slate-600 px-3 py-2 text-sm" to="/app">
              Volver al dashboard
            </Link>
            <button className="rounded-md bg-rose-600 px-3 py-2 text-sm font-medium" onClick={logout}>
              Logout
            </button>
          </div>
        </header>

        {/* ── Three-column layout ── */}
        <section className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)_340px]">

          {/* ── Left panel ── */}
          <aside className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900 p-4">
            <div className="space-y-3">
              <div>
                <h2 className="font-semibold">Datos del diagrama</h2>
                <p className="text-xs text-slate-400">Usa projectId para crear, cargar y guardar.</p>
              </div>
              <input className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2" placeholder="projectId" value={projectId} onChange={(e) => setProjectId(e.target.value)} />
              <input className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2" placeholder="diagramId" value={diagramId} onChange={(e) => setDiagramId(e.target.value)} />
              <input className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2" placeholder="Nombre del diagrama" value={diagramName} onChange={(e) => setDiagramName(e.target.value)} />

              {/* Toolbar component */}
              <DiagramToolbar
                isSaved={Boolean(diagramId.trim())}
                isValid={validation.isValid}
                hasSelection={Boolean(selectedNodeId || selectedEdgeId)}
                status={editorState.status}
                onAddNode={handleAddNode}
                onSave={handleSaveDiagram}
                onCreateManual={handleCreateManualDiagram}
                onGenerateAuto={handleGenerateAutoDiagram}
                onCreateUseCaseManual={handleCreateUseCaseManualDiagram}
                onGenerateUseCaseAuto={handleGenerateUseCaseAutoDiagram}
                onDeleteSelected={handleDeleteSelected}
              />

              <div className="flex flex-wrap gap-2">
                <button className="rounded-md bg-slate-700 px-3 py-2 text-sm font-medium" onClick={handleLoadDiagram}>Cargar por id</button>
                <button className="rounded-md bg-slate-700 px-3 py-2 text-sm font-medium" onClick={handleLoadProjectDiagrams}>Listar proyecto</button>
              </div>
            </div>

            {/* Info panel */}
            <div className="space-y-2 rounded-xl border border-slate-700 bg-slate-950/50 p-3 text-sm">
              <p><span className="text-slate-400">Tipo:</span> {diagramType}</p>
              <p><span className="text-slate-400">Modo:</span> {selectedModeLabel()}</p>
              <p><span className="text-slate-400">Usuario:</span> {user?.userId ?? 'sin sesión'}</p>
              <p className={validation.isValid ? 'text-emerald-300' : 'text-rose-300'}>
                {validation.isValid ? 'Diagrama válido' : validation.errors.join(' ')}
              </p>
            </div>

            {/* Diagram list */}
            <div className="space-y-2 rounded-xl border border-slate-700 bg-slate-950/50 p-3 text-sm">
              <h3 className="font-semibold">Proyecto</h3>
              <p className="text-xs text-slate-400">Diagramas del proyecto actual</p>
              <div className="max-h-56 space-y-2 overflow-auto pr-1">
                {diagramList.length === 0 ? (
                  <p className="text-slate-500">Sin diagramas cargados</p>
                ) : (
                  diagramList.map((diagram) => (
                    <button
                      key={diagram.id}
                      className="flex w-full items-center justify-between rounded-lg border border-slate-700 px-3 py-2 text-left text-sm hover:border-cyan-400"
                      onClick={() => void loadDiagramFromList(diagram.id)}
                    >
                      <span>{diagram.name}</span>
                      <span className="text-xs text-slate-400">{diagram.mode}</span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Export actions */}
            <div className="space-y-2 rounded-xl border border-slate-700 bg-slate-950/50 p-3 text-sm">
              <h3 className="font-semibold">Acciones de exportación</h3>
              <div className="flex flex-wrap gap-2">
                <button className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium" onClick={handleGeneratePlantUml}>Generar PlantUML</button>
                <button className="rounded-md bg-slate-700 px-3 py-2 text-sm font-medium" onClick={() => handleExport('puml')}>Descargar .puml</button>
                <button className="rounded-md bg-slate-700 px-3 py-2 text-sm font-medium" onClick={() => handleExport('txt')}>Descargar .txt</button>
              </div>
              <textarea
                readOnly
                className="h-40 w-full rounded-md border border-slate-700 bg-slate-950 p-2 text-xs text-slate-300"
                value={plantUmlPreview}
                placeholder="PlantUML generado aparecerá aquí"
              />
            </div>
          </aside>

          {/* ── Center: Canvas ── */}
          <DiagramCanvas
            nodes={flowState.nodes}
            edges={flowState.edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={handleConnect}
            onSelectionChange={handleSelectionChange}
          />

          {/* ── Right: Sidebar editor ── */}
          <DiagramSidebar
            editorTarget={editorTarget}
            selectedNode={selectedNode}
            selectedEdge={selectedEdge}
            onUpdateNode={updateNode}
            onUpdateEdge={updateEdge}
          />
        </section>

        {/* ── Source JSON preview ── */}
        <section className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
          <h2 className="mb-3 font-semibold">sourceJson actual</h2>
          <pre className="max-h-72 overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-300">
            {serializeDiagramSource(source)}
          </pre>
        </section>

        {/* ── Status bar ── */}
        <p className="rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm">
          Estado: {editorState.status} | {editorState.message}
        </p>
      </div>
    </main>
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
