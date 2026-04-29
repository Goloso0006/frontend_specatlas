import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  applyEdgeChanges,
  applyNodeChanges,
  addEdge,
  type Connection,
  type OnEdgesChange,
  type OnNodesChange,
  type OnSelectionChangeFunc,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { diagramsApi } from '../api/services/diagramsApi'
import { useAuth } from '../auth/useAuth'
import { ClassDiagramNode } from '../components/diagram/ClassDiagramNode'
import { useDiagramEditorStore } from '../state/diagramEditor.store'
import type {
  DiagramClassAttributeDTO,
  DiagramClassMethodDTO,
  DiagramClassNodeDTO,
  DiagramRelationDTO,
  DiagramRelationType,
  DiagramResponse,
  DiagramSummaryResponse,
  DiagramSourceDTO,
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

type EditorTarget = 'node' | 'edge' | null

const nodeTypes = {
  classNode: ClassDiagramNode,
}

const relationTypes: DiagramRelationType[] = [
  'association',
  'inheritance',
  'aggregation',
  'composition',
  'dependency',
]

export function DiagramEditorPage() {
  const { user, logout } = useAuth()
  const { state: editorState, actions: editorActions } = useDiagramEditorStore()
  const [diagramId, setDiagramId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [diagramName, setDiagramName] = useState('Diagrama de clases')
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
    const source = connection.source
    const target = connection.target

    if (!source || !target) {
      return
    }

    setSource((current) => {
      const edge = createDiagramRelation(source, target)
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

  async function handleCreateManualDiagram(): Promise<void> {
    if (!projectId.trim()) {
      editorActions.error('Debes indicar un projectId antes de crear el diagrama.')
      return
    }

    if (!diagramName.trim()) {
      editorActions.error('Debes indicar un nombre para el diagrama.')
      return
    }

    const payload = {
      projectId: projectId.trim(),
      name: diagramName.trim(),
      sourceJson: serializeDiagramSource(source),
      plantUmlCode: null,
    }

    if (!validation.isValid) {
      editorActions.error(validation.errors.join(' '))
      return
    }

    try {
      editorActions.saving('Creando diagrama manual...')
      const data = await diagramsApi.createManual(payload)
      syncDiagramResponse(data, 'Diagrama manual creado exitosamente.')
    } catch {
      editorActions.error('No fue posible crear el diagrama manual.')
    }
  }

  async function handleGenerateAutoDiagram(): Promise<void> {
    if (!projectId.trim()) {
      editorActions.error('Debes indicar un projectId.')
      return
    }

    try {
      editorActions.loading('Generando diagrama automatico...')
      const data = await diagramsApi.createAuto(projectId.trim())
      syncDiagramResponse(data, 'Diagrama automatico generado exitosamente.')
    } catch {
      editorActions.error('No fue posible generar el diagrama automatico.')
    }
  }

  async function handleLoadDiagram(): Promise<void> {
    if (!diagramId.trim()) {
      editorActions.error('Debes indicar un diagramId.')
      return
    }

    try {
      editorActions.loading('Cargando diagrama...')
      const data = await diagramsApi.getById(diagramId.trim())
      syncDiagramResponse(data, 'Diagrama cargado correctamente.')
    } catch {
      editorActions.error('No fue posible cargar el diagrama.')
    }
  }

  async function handleLoadProjectDiagrams(): Promise<void> {
    if (!projectId.trim()) {
      editorActions.error('Debes indicar un projectId.')
      return
    }

    try {
      editorActions.loading('Listando diagramas del proyecto...')
      const data = await diagramsApi.listByProject(projectId.trim())
      setDiagramList(data)
      editorActions.editing(`Diagramas del proyecto: ${data.length}`)
    } catch {
      editorActions.error('No fue posible listar los diagramas del proyecto.')
    }
  }

  async function handleSaveDiagram(): Promise<void> {
    if (!projectId.trim()) {
      editorActions.error('Debes indicar un projectId.')
      return
    }

    if (!diagramName.trim()) {
      editorActions.error('Debes indicar un nombre para el diagrama.')
      return
    }

    if (!validation.isValid) {
      editorActions.error(validation.errors.join(' '))
      return
    }

    const payload = {
      projectId: projectId.trim(),
      name: diagramName.trim(),
      sourceJson: serializeDiagramSource(source),
      plantUmlCode: plantUmlPreview || null,
    }

    try {
      editorActions.saving('Guardando diagrama...')
      const data = diagramId.trim()
        ? await diagramsApi.update(diagramId.trim(), payload)
        : await diagramsApi.createManual(payload)
      syncDiagramResponse(data, 'Diagrama guardado correctamente.')
    } catch {
      editorActions.error('No fue posible guardar el diagrama.')
    }
  }

  async function handleGeneratePlantUml(): Promise<void> {
    if (!diagramId.trim()) {
      editorActions.error('Primero carga o guarda un diagrama para generar PlantUML.')
      return
    }

    if (!validation.isValid) {
      editorActions.error(validation.errors.join(' '))
      return
    }

    try {
      editorActions.exporting('Generando PlantUML...')
      const data = await diagramsApi.generatePlantUml(diagramId.trim())
      syncDiagramResponse(data, 'PlantUML generado correctamente.')
    } catch {
      editorActions.error('No fue posible generar PlantUML.')
    }
  }

  async function handleExport(format: 'puml' | 'txt'): Promise<void> {
    if (!diagramId.trim()) {
      editorActions.error('Primero carga o guarda un diagrama.')
      return
    }

    try {
      editorActions.exporting(`Exportando ${format.toUpperCase()}...`)
      const blob =
        format === 'puml'
          ? await diagramsApi.exportPlantUml(diagramId.trim())
          : await diagramsApi.exportText(diagramId.trim())
      downloadBlob(blob, `${diagramName || 'diagram'}`, format)
      editorActions.editing(`Exportacion ${format.toUpperCase()} completada.`)
    } catch {
      editorActions.error(`No fue posible exportar el archivo ${format.toUpperCase()}.`)
    }
  }

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

  function syncDiagramResponse(response: DiagramResponse, message = 'Diagrama cargado correctamente.'): void {
    setDiagramId(response.id)
    setProjectId(response.projectId)
    setDiagramName(response.name)
    setPlantUmlPreview(response.plantUmlCode ?? '')
    setSource(parseDiagramSource(response.sourceJson))
    setSelectedNodeId(null)
    setSelectedEdgeId(null)
    setEditorTarget(null)
    editorActions.editing(message)
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

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex min-h-screen flex-col gap-4 p-4 lg:p-6">
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

        <section className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)_340px]">
          <aside className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900 p-4">
            <div className="space-y-3">
              <div>
                <h2 className="font-semibold">Datos del diagrama</h2>
                <p className="text-xs text-slate-400">Usa projectId para crear, cargar y guardar.</p>
              </div>
              <input
                className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2"
                placeholder="projectId"
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
              />
              <input
                className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2"
                placeholder="diagramId"
                value={diagramId}
                onChange={(event) => setDiagramId(event.target.value)}
              />
              <input
                className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2"
                placeholder="Nombre del diagrama"
                value={diagramName}
                onChange={(event) => setDiagramName(event.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <button className="rounded-md bg-cyan-600 px-3 py-2 text-sm font-medium" onClick={handleAddNode}>
                  Agregar clase
                </button>
                <button className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium" onClick={handleSaveDiagram}>
                  Guardar
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="rounded-md bg-slate-700 px-3 py-2 text-sm font-medium" onClick={handleCreateManualDiagram}>
                  Crear manual
                </button>
                <button className="rounded-md bg-slate-700 px-3 py-2 text-sm font-medium" onClick={handleGenerateAutoDiagram}>
                  Generar automatico
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="rounded-md bg-slate-700 px-3 py-2 text-sm font-medium" onClick={handleLoadDiagram}>
                  Cargar por id
                </button>
                <button className="rounded-md bg-slate-700 px-3 py-2 text-sm font-medium" onClick={handleLoadProjectDiagrams}>
                  Listar proyecto
                </button>
              </div>
            </div>

            <div className="space-y-2 rounded-xl border border-slate-700 bg-slate-950/50 p-3 text-sm">
              <p><span className="text-slate-400">Tipo:</span> CLASS</p>
              <p><span className="text-slate-400">Modo:</span> {selectedModeLabel()}</p>
              <p><span className="text-slate-400">Usuario:</span> {user?.userId ?? 'sin sesion'}</p>
              <p className={validation.isValid ? 'text-emerald-300' : 'text-rose-300'}>
                {validation.isValid ? 'Diagrama valido' : validation.errors.join(' ')}
              </p>
            </div>

            <div className="space-y-2 rounded-xl border border-slate-700 bg-slate-950/50 p-3 text-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Proyecto</h3>
                <button className="rounded-md bg-rose-600 px-3 py-1 text-xs font-medium" onClick={handleDeleteSelected}>
                  Eliminar seleccionado
                </button>
              </div>
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

            <div className="space-y-2 rounded-xl border border-slate-700 bg-slate-950/50 p-3 text-sm">
              <h3 className="font-semibold">Acciones de exportacion</h3>
              <div className="flex flex-wrap gap-2">
                <button className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium" onClick={handleGeneratePlantUml}>
                  Generar PlantUML
                </button>
                <button className="rounded-md bg-slate-700 px-3 py-2 text-sm font-medium" onClick={() => handleExport('puml')}>
                  Descargar .puml
                </button>
                <button className="rounded-md bg-slate-700 px-3 py-2 text-sm font-medium" onClick={() => handleExport('txt')}>
                  Descargar .txt
                </button>
              </div>
              <textarea
                readOnly
                className="h-40 w-full rounded-md border border-slate-700 bg-slate-950 p-2 text-xs text-slate-300"
                value={plantUmlPreview}
                placeholder="PlantUML generado aparecerá aquí"
              />
            </div>
          </aside>

          <section className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900">
            <div className="border-b border-slate-700 px-4 py-3">
              <h2 className="font-semibold">Canvas visual</h2>
              <p className="text-xs text-slate-400">Arrastra nodos, conecta relaciones y selecciona para editar.</p>
            </div>
            <div className="h-[calc(100vh-260px)] min-h-180">
              <ReactFlow
                nodes={flowState.nodes}
                edges={flowState.edges}
                nodeTypes={nodeTypes}
                onNodesChange={handleNodesChange}
                onEdgesChange={handleEdgesChange}
                onConnect={handleConnect}
                onSelectionChange={handleSelectionChange}
                fitView
              >
                <Background gap={18} size={1} color="#1f2937" />
                <Controls />
                <MiniMap
                  nodeColor="#22d3ee"
                  maskColor="rgba(15, 23, 42, 0.65)"
                  pannable
                  zoomable
                />
              </ReactFlow>
            </div>
          </section>

          <aside className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900 p-4">
            {editorTarget === 'node' && selectedNode ? (
              <NodeEditor node={selectedNode} onChange={updateNode} />
            ) : editorTarget === 'edge' && selectedEdge ? (
              <EdgeEditor edge={selectedEdge} onChange={updateEdge} />
            ) : (
              <div className="rounded-xl border border-dashed border-slate-700 p-4 text-sm text-slate-400">
                Selecciona un nodo o una relacion para editar sus propiedades.
              </div>
            )}
          </aside>
        </section>

        <section className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
          <h2 className="mb-3 font-semibold">sourceJson actual</h2>
          <pre className="max-h-72 overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-300">
            {serializeDiagramSource(source)}
          </pre>
        </section>

        <p className="rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm">
          Estado: {editorState.status} | {editorState.message}
        </p>
      </div>
    </main>
  )

  function selectedModeLabel(): string {
    if (diagramId.trim()) {
      return 'Guardado / existente'
    }

    if (diagramList.length > 0) {
      return 'Listando proyecto'
    }

    return 'Local / nuevo'
  }

  async function loadDiagramFromList(id: string): Promise<void> {
    try {
      editorActions.loading('Cargando diagrama seleccionado...')
      const data = await diagramsApi.getById(id)
      syncDiagramResponse(data, 'Diagrama cargado correctamente.')
    } catch {
      editorActions.error('No fue posible cargar el diagrama.')
    }
  }
}

function NodeEditor({ node, onChange }: {
  node: DiagramClassNodeDTO
  onChange: (node: DiagramClassNodeDTO) => void
}) {
  function updateAttribute(index: number, field: keyof DiagramClassAttributeDTO, value: string): void {
    onChange({
      ...node,
      attributes: node.attributes.map((attribute, currentIndex) =>
        currentIndex === index ? { ...attribute, [field]: value } : attribute,
      ),
    })
  }

  function updateMethod(index: number, field: keyof DiagramClassMethodDTO, value: string): void {
    onChange({
      ...node,
      methods: node.methods.map((method, currentIndex) =>
        currentIndex === index ? { ...method, [field]: value } : method,
      ),
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold">Nodo seleccionado</h3>
        <p className="text-xs text-slate-400">{node.id}</p>
      </div>
      <label className="block space-y-1 text-sm">
        <span>Nombre</span>
        <input
          className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2"
          value={node.name}
          onChange={(event) => onChange({ ...node, name: event.target.value })}
        />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="block space-y-1 text-sm">
          <span>X</span>
          <input
            type="number"
            className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2"
            value={node.position.x}
            onChange={(event) =>
              onChange({
                ...node,
                position: { ...node.position, x: Number(event.target.value) },
              })
            }
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>Y</span>
          <input
            type="number"
            className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2"
            value={node.position.y}
            onChange={(event) =>
              onChange({
                ...node,
                position: { ...node.position, y: Number(event.target.value) },
              })
            }
          />
        </label>
      </div>
      <label className="block space-y-1 text-sm">
        <span>Derived from requirements</span>
        <input
          className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2"
          value={node.derivedFromRequirements.join(', ')}
          onChange={(event) => {
            const next = event.target.value
            onChange({
              ...node,
              derivedFromRequirements: next
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean),
            })
          }}
        />
      </label>
      <EditorList
        title="Atributos"
        onAdd={() =>
          onChange({
            ...node,
            attributes: [
              ...node.attributes,
              { name: 'nuevoAtributo', type: 'String', visibility: 'private' },
            ],
          })
        }
      >
        {node.attributes.map((attribute, index) => (
          <div key={`${attribute.name}-${index}`} className="space-y-2 rounded-lg border border-slate-700 p-3">
            <input
              className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm"
              value={attribute.name}
              onChange={(event) => updateAttribute(index, 'name', event.target.value)}
              placeholder="Nombre"
            />
            <input
              className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm"
              value={attribute.type}
              onChange={(event) => updateAttribute(index, 'type', event.target.value)}
              placeholder="Tipo"
            />
            <select
              className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm"
              value={attribute.visibility}
              onChange={(event) => updateAttribute(index, 'visibility', event.target.value)}
            >
              <option value="public">public</option>
              <option value="private">private</option>
              <option value="protected">protected</option>
              <option value="package">package</option>
            </select>
          </div>
        ))}
      </EditorList>
      <EditorList
        title="Métodos"
        onAdd={() =>
          onChange({
            ...node,
            methods: [...node.methods, { name: 'nuevoMetodo', returnType: 'void', visibility: 'public' }],
          })
        }
      >
        {node.methods.map((method, index) => (
          <div key={`${method.name}-${index}`} className="space-y-2 rounded-lg border border-slate-700 p-3">
            <input
              className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm"
              value={method.name}
              onChange={(event) => updateMethod(index, 'name', event.target.value)}
              placeholder="Nombre"
            />
            <input
              className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm"
              value={method.returnType}
              onChange={(event) => updateMethod(index, 'returnType', event.target.value)}
              placeholder="Tipo retorno"
            />
            <select
              className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm"
              value={method.visibility}
              onChange={(event) => updateMethod(index, 'visibility', event.target.value)}
            >
              <option value="public">public</option>
              <option value="private">private</option>
              <option value="protected">protected</option>
              <option value="package">package</option>
            </select>
          </div>
        ))}
      </EditorList>
    </div>
  )
}

function EdgeEditor({ edge, onChange }: {
  edge: DiagramRelationDTO
  onChange: (edge: DiagramRelationDTO) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold">Relacion seleccionada</h3>
        <p className="text-xs text-slate-400">{edge.id}</p>
      </div>
      <label className="block space-y-1 text-sm">
        <span>Label</span>
        <input
          className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2"
          value={edge.label}
          onChange={(event) => onChange({ ...edge, label: event.target.value })}
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span>Tipo</span>
        <select
          className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2"
          value={edge.type}
          onChange={(event) =>
            onChange({
              ...edge,
              type: event.target.value as DiagramRelationType,
            })
          }
        >
          {relationTypes.map((relationType) => (
            <option key={relationType} value={relationType}>
              {relationType}
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-md border border-slate-700 p-3">
          <p className="text-slate-400">From</p>
          <p>{edge.from}</p>
        </div>
        <div className="rounded-md border border-slate-700 p-3">
          <p className="text-slate-400">To</p>
          <p>{edge.to}</p>
        </div>
      </div>
      <label className="block space-y-1 text-sm">
        <span>Derived from requirements</span>
        <input
          className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2"
          value={edge.derivedFromRequirements.join(', ')}
          onChange={(event) => {
            const next = event.target.value
            onChange({
              ...edge,
              derivedFromRequirements: next
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean),
            })
          }}
        />
      </label>
    </div>
  )
}

function EditorList({
  title,
  onAdd,
  children,
}: {
  title: string
  onAdd: () => void
  children: ReactNode
}) {
  return (
    <div className="space-y-3 rounded-xl border border-slate-700 bg-slate-950/50 p-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="font-semibold">{title}</h4>
        <button className="rounded-md bg-cyan-600 px-3 py-1 text-xs font-medium" onClick={onAdd}>
          Agregar
        </button>
      </div>
      <div className="space-y-3">{children}</div>
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
