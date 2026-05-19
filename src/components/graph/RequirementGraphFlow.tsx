import { useMemo, useState } from 'react'
import { analyzeRequirementText } from '../../utils/requirementQualityAnalyzer'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  Position,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
} from '@xyflow/react'
import type { RequirementDTO } from '../../types/requirements'

type GraphMode = 'impact' | 'inferred' | 'focused' | 'project-map'

type GraphData = unknown

type RequirementGraphNodeData = {
  code: string
  title: string
  description?: string
  requirementType?: string
}

type RequirementGraphNode = Node<RequirementGraphNodeData, 'requirement'>

type NormalizedGraph = {
  nodes: RequirementGraphNode[]
  edges: Edge[]
  reasons: Array<{ id: string; from: string; to: string; relationType: string; reason: string }>
  rawJson: string
  hasKnownShape: boolean
}

interface RequirementGraphFlowProps {
  requirements?: RequirementDTO[]
  graphData?: GraphData
  mode?: GraphMode
  selectedRequirementId?: string
  selectedRequirementCode?: string
  className?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function toStringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function explicitRequirementType(requirement?: RequirementDTO | null): string {
  const typed = requirement as (RequirementDTO & { requirementType?: string }) | null | undefined
  return typed?.requirementType?.trim() || ''
}

function inferRequirementType(code: string, requirement?: RequirementDTO | null): string {
  const explicit = explicitRequirementType(requirement)
  if (explicit) return explicit
  if (code.toUpperCase().startsWith('RNF')) return 'RNF'
  if (code.toUpperCase().startsWith('RF')) return 'RF'
  return 'REQ'
}

function extractArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isRecord) : []
}

function isEdgeLikeEntry(entry: Record<string, unknown>): boolean {
  return Boolean(
    entry.fromCode || entry.toCode || entry.from || entry.to || entry.source || entry.target || entry.relationType || entry.relationship,
  )
}

function buildRequirementMap(requirements?: RequirementDTO[]) {
  const map = new Map<string, RequirementDTO>()
  for (const requirement of requirements ?? []) {
    if (requirement.code) {
      map.set(requirement.code, requirement)
    }
  }
  return map
}

function layoutRequirementNodes(
  nodes: RequirementGraphNode[]
): { positions: Record<string, { x: number; y: number }>; headers: any[] } {
  const positions: Record<string, { x: number; y: number }> = {}
  const headers: any[] = []

  if (nodes.length === 0) return { positions, headers }

  const rnfNodes: RequirementGraphNode[] = []
  const rfNodes: RequirementGraphNode[] = []
  const otherNodes: RequirementGraphNode[] = []

  nodes.forEach(node => {
    const type = (node.data.requirementType || '').toUpperCase()
    if (type === 'RNF' || type === 'NON_FUNCTIONAL' || node.id.toUpperCase().startsWith('RNF')) {
      rnfNodes.push(node)
    } else if (type === 'RF' || type === 'FUNCTIONAL' || node.id.toUpperCase().startsWith('RF')) {
      rfNodes.push(node)
    } else {
      otherNodes.push(node)
    }
  })

  const rowHeight = 195
  const yStart = 110

  // 1. RNF columns
  const rnfCols = Math.max(1, Math.ceil(rnfNodes.length / 5))
  rnfNodes.forEach((node, index) => {
    const col = index % rnfCols
    const row = Math.floor(index / rnfCols)
    positions[node.id] = {
      x: 80 + col * 290,
      y: yStart + row * rowHeight
    }
  })

  // 2. RF columns
  const rfStartIdx = 80 + rnfCols * 300
  const rfCols = Math.max(1, Math.ceil(rfNodes.length / 5))
  rfNodes.forEach((node, index) => {
    const col = index % rfCols
    const row = Math.floor(index / rfCols)
    positions[node.id] = {
      x: rfStartIdx + col * 290,
      y: yStart + row * rowHeight
    }
  })

  // 3. Other columns
  const otherStartIdx = rfStartIdx + rfCols * 310
  const otherCols = Math.max(1, Math.ceil(otherNodes.length / 5))
  otherNodes.forEach((node, index) => {
    const col = index % otherCols
    const row = Math.floor(index / otherCols)
    positions[node.id] = {
      x: otherStartIdx + col * 290,
      y: yStart + row * rowHeight
    }
  })

  // Add category headers centered over their columns
  if (rnfNodes.length > 0) {
    const rnfCenterX = 80 + ((rnfCols - 1) * 290) / 2
    headers.push({
      id: 'header-rnf',
      type: 'header',
      position: { x: rnfCenterX + 10, y: 30 },
      draggable: false,
      selectable: false,
      data: { label: 'Requisitos No Funcionales (RNF)' }
    })
  }

  if (rfNodes.length > 0) {
    const rfCenterX = rfStartIdx + ((rfCols - 1) * 290) / 2
    headers.push({
      id: 'header-rf',
      type: 'header',
      position: { x: rfCenterX + 10, y: 30 },
      draggable: false,
      selectable: false,
      data: { label: 'Requisitos Funcionales (RF)' }
    })
  }

  if (otherNodes.length > 0) {
    const otherCenterX = otherStartIdx + ((otherCols - 1) * 290) / 2
    headers.push({
      id: 'header-other',
      type: 'header',
      position: { x: otherCenterX + 10, y: 30 },
      draggable: false,
      selectable: false,
      data: { label: 'Otros Elementos' }
    })
  }

  return { positions, headers }
}

function translateRelationType(type: string): string {
  const upper = type.toUpperCase()
  switch (upper) {
    case 'DEPENDS_ON': return 'Depende de'
    case 'CONFLICTS_WITH': return 'Conflicta con'
    case 'IMPACTS': return 'Impacta'
    case 'CONSTRAINS': return 'Condiciona'
    case 'RELATES_TO': return 'Relacionado'
    case 'DUPLICATES': return 'Posible duplicado'
    default: return type
  }
}

function normalizeRequirementGraph(graphData: GraphData, requirements?: RequirementDTO[]): NormalizedGraph {
  const rawJson = graphData ? JSON.stringify(graphData, null, 2) : ''
  const requirementMap = buildRequirementMap(requirements)

  // Safely resolve the payload structure, unwrapping the 'data' key if present
  let payload: Record<string, unknown> | null = null

  if (graphData) {
    if (Array.isArray(graphData)) {
      const arrayEntries = graphData.filter(isRecord)
      const looksLikeEdges = arrayEntries.some(isEdgeLikeEntry)
      payload = {
        nodes: looksLikeEdges ? [] : arrayEntries,
        edges: looksLikeEdges ? arrayEntries : [],
      }
    } else if (isRecord(graphData)) {
      payload = graphData
      if (isRecord(payload.data)) {
        payload = payload.data as Record<string, unknown>
      }
    }
  }

  const nodeMap = new Map<string, RequirementGraphNode>()
  const reasons: NormalizedGraph['reasons'] = []

  // Always populate nodeMap with ALL project requirements first so we never have an empty screen
  if (requirements && requirements.length > 0) {
    for (const req of requirements) {
      if (!req.code) continue
      const code = req.code
      const title = req.title || code
      const description = req.description || ''
      const requirementType = req.requirementType || inferRequirementType(code, req)
      
      nodeMap.set(code, {
        id: code,
        type: 'requirement',
        position: { x: 0, y: 0 },
        data: { code, title, description, requirementType }
      })
    }
  }

  const nodesSource = payload ? extractArray(payload.nodes) : []
  const edgesSource = payload ? extractArray(payload.edges) : []
  const relationsSource = payload ? extractArray(payload.relations) : []
  const combinedEdges = edgesSource.length > 0 ? edgesSource : relationsSource

  // Augment or update nodes from payload nodesSource if any exist
  for (const entry of nodesSource) {
    const code = toStringValue(entry.code ?? entry.id ?? entry.requirementCode ?? entry.label ?? entry.title ?? entry.name)
    if (!code) continue

    const requirement = requirementMap.get(code) ?? null
    const title = toStringValue(entry.title ?? entry.name) || requirement?.title?.trim() || code
    const description = toStringValue(entry.description) || requirement?.description?.trim() || ''
    const requirementType = toStringValue(entry.requirementType ?? entry.type) || inferRequirementType(code, requirement)

    nodeMap.set(code, {
      id: code,
      type: 'requirement',
      position: { x: 0, y: 0 },
      data: { code, title, description, requirementType },
    })
  }

  const edgeEntries = combinedEdges.filter(isRecord)

  for (const entry of edgeEntries) {
    const fromCode = toStringValue(entry.fromCode ?? entry.from ?? entry.source ?? entry.sourceCode ?? entry.sourceId)
    const toCode = toStringValue(entry.toCode ?? entry.to ?? entry.target ?? entry.targetCode ?? entry.targetId)
    if (!fromCode || !toCode) continue

    const relationType = toStringValue(entry.relationType ?? entry.type ?? entry.relationship ?? entry.label) || 'RELATES_TO'
    const reason = toStringValue(entry.reason ?? entry.description)

    const fromRequirement = requirementMap.get(fromCode) ?? null
    const toRequirement = requirementMap.get(toCode) ?? null

    if (!nodeMap.has(fromCode)) {
      nodeMap.set(fromCode, {
        id: fromCode,
        type: 'requirement',
        position: { x: 0, y: 0 },
        data: {
          code: fromCode,
          title: fromRequirement?.title?.trim() || fromCode,
          description: fromRequirement?.description?.trim() || '',
          requirementType: inferRequirementType(fromCode, fromRequirement),
        },
      })
    }

    if (!nodeMap.has(toCode)) {
      nodeMap.set(toCode, {
        id: toCode,
        type: 'requirement',
        position: { x: 0, y: 0 },
        data: {
          code: toCode,
          title: toRequirement?.title?.trim() || toCode,
          description: toRequirement?.description?.trim() || '',
          requirementType: inferRequirementType(toCode, toRequirement),
        },
      })
    }

    if (reason) {
      reasons.push({
        id: `${fromCode}-${toCode}-${relationType}`,
        from: fromCode,
        to: toCode,
        relationType,
        reason,
      })
    }
  }

  const layout = layoutRequirementNodes(Array.from(nodeMap.values()))
  const reqNodes = Array.from(nodeMap.values()).map((node) => ({
    ...node,
    position: layout.positions[node.id] ?? { x: 80, y: 80 },
  }))
  const nodes = [...layout.headers, ...reqNodes]

  const edges = edgeEntries.flatMap((entry, index) => {
    const fromCode = toStringValue(entry.fromCode ?? entry.from ?? entry.source ?? entry.sourceCode ?? entry.sourceId)
    const toCode = toStringValue(entry.toCode ?? entry.to ?? entry.target ?? entry.targetCode ?? entry.targetId)
    if (!fromCode || !toCode) return []

    const relationType = toStringValue(entry.relationType ?? entry.type ?? entry.relationship ?? entry.label) || 'RELATES_TO'
    const reason = toStringValue(entry.reason ?? entry.description)

    let stroke = 'var(--color-text-muted)'
    let animated = false
    let strokeDasharray: string | undefined = undefined

    switch (relationType.toUpperCase()) {
      case 'DEPENDS_ON':
        stroke = 'var(--color-text-primary)'
        break
      case 'CONFLICTS_WITH':
        stroke = '#f59e0b'
        strokeDasharray = '5 5'
        break
      case 'IMPACTS':
        stroke = 'var(--color-accent)'
        animated = true
        break
      case 'CONSTRAINS':
        strokeDasharray = '5 5'
        break
    }

    return [{
      id: toStringValue(entry.id) || `${fromCode}-${toCode}-${relationType}-${index}`,
      source: fromCode,
      target: toCode,
      label: translateRelationType(relationType),
      labelStyle: { fill: 'var(--color-text-primary)', fontSize: 10, fontWeight: 600 },
      labelBgStyle: { fill: 'var(--color-bg)', fillOpacity: 0.8 },
      animated,
      type: 'smoothstep',
      data: { reason, originalType: relationType.toUpperCase() },
      markerEnd: { type: MarkerType.ArrowClosed, color: stroke },
      style: {
        stroke,
        strokeWidth: 1.5,
        strokeDasharray,
      },
    } satisfies Edge]
  })

  return {
    nodes,
    edges,
    reasons,
    rawJson,
    hasKnownShape: nodesSource.length > 0 || edgesSource.length > 0 || relationsSource.length > 0,
  }
}

function RequirementGraphHeaderNodeView({ data }: { data: { label: string; isSimDimmed?: boolean } }) {
  return (
    <div className={`px-5 py-2.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)]/90 backdrop-blur-md text-[10px] font-bold tracking-[0.2em] uppercase text-[var(--color-accent)] text-center shadow-md min-w-[240px] pointer-events-none select-none relative overflow-hidden transition-all duration-300 ${
      data.isSimDimmed ? 'opacity-40 scale-95' : 'opacity-100'
    }`}>
      <div className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-transparent via-[var(--color-accent)] to-transparent opacity-60" />
      {data.label}
    </div>
  )
}

function RequirementGraphNodeView({ data, selected }: NodeProps<RequirementGraphNode>) {
  const badge = data.requirementType || inferRequirementType(data.code)
  const typeUpper = badge.toUpperCase()
  const isRNF = typeUpper === 'RNF' || typeUpper === 'NON_FUNCTIONAL'

  // Real-time local quality check
  const issues = analyzeRequirementText({
    title: data.title,
    description: data.description || '',
    acceptanceCriteria: [],
    requirementType: isRNF ? 'NON_FUNCTIONAL' : 'FUNCTIONAL'
  })
  const errorCount = issues.filter(i => i.severity === 'error').length
  const warningCount = issues.filter(i => i.severity === 'warning').length

  let dotColorClass = 'bg-emerald-500 shadow-emerald-500/50'
  let dotLabel = 'Calidad: Correcto'
  let statusText = 'Listo'
  
  if (errorCount > 0) {
    dotColorClass = 'bg-rose-500 shadow-rose-500/50 animate-pulse'
    dotLabel = `${errorCount} error(es)`
    statusText = 'Error'
  } else if (warningCount > 0) {
    dotColorClass = 'bg-amber-500 shadow-amber-500/50 animate-pulse'
    dotLabel = `${warningCount} advertencia(s)`
    statusText = 'Revisar'
  }

  const isSimActive = (data as any).isSimActive
  const isSimImpacted = (data as any).isSimImpacted
  const isSimDimmed = (data as any).isSimDimmed

  let simClass = ''
  if (isSimActive) {
    simClass = 'bg-[var(--color-bg-card)] border-cyan-500 ring-2 ring-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.35)] scale-105 z-50'
  } else if (isSimImpacted) {
    simClass = 'bg-[var(--color-bg-card)] border-amber-500 ring-2 ring-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.3)] scale-102 z-40'
  } else if (isSimDimmed) {
    simClass = 'bg-[var(--color-bg-card)]/50 border-[var(--color-border)]/50 opacity-40 scale-98'
  } else if (selected) {
    simClass = 'border-[var(--color-accent)] ring-2 ring-[var(--color-accent)] shadow-[0_0_20px_rgba(var(--color-accent-rgb),0.2)] bg-[var(--color-surface)]'
  } else {
    simClass = isRNF
      ? 'bg-[var(--color-bg-card)]/90 border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.04)] hover:border-purple-500/40 hover:shadow-[0_0_20px_rgba(168,85,247,0.08)]'
      : 'bg-[var(--color-bg-card)]/90 border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.04)] hover:border-cyan-500/40 hover:shadow-[0_0_20px_rgba(6,182,212,0.08)]'
  }

  return (
    <div
      className={[
        'min-w-[240px] max-w-[260px] rounded-2xl border px-4 py-3.5 transition-all duration-300 relative overflow-hidden backdrop-blur-[2px]',
        simClass,
      ].join(' ')}
    >
      {selected && (
        <div className="absolute -top-3 right-3 rounded bg-[var(--color-accent)] px-1.5 py-0.5 text-[9px] font-bold text-[var(--color-accent-foreground)]">ACTUAL</div>
      )}
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !border-2 !border-[var(--color-border-strong)] !bg-[var(--color-surface)]" />
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !border-2 !border-[var(--color-border-strong)] !bg-[var(--color-surface)]" />

      <div className="mb-2 flex items-center justify-between gap-2">
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold tracking-[0.14em] uppercase ${
          isRNF 
            ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' 
            : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
        }`}>
          {badge}
        </span>
        <span className="text-[10px] font-mono text-[var(--color-text-muted)]">{data.code}</span>
      </div>

      <div className="space-y-1.5">
        <div className="text-[13px] font-bold leading-snug text-[var(--color-text-primary)]">
          {data.title}
        </div>
        {data.description ? (
          <div className="text-[11px] leading-relaxed text-[var(--color-text-muted)] line-clamp-3">
            {data.description}
          </div>
        ) : null}
      </div>

      {/* Quality status dot indicator */}
      <div className="mt-3.5 pt-2 border-t border-[var(--color-border)]/30 flex items-center justify-between">
        <span className="text-[9px] font-mono text-[var(--color-text-muted)] uppercase tracking-wider">
          Calidad
        </span>
        <div className="flex items-center gap-1.5" title={dotLabel}>
          <span className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px_2px] ${dotColorClass}`} />
          <span className="text-[9.5px] font-semibold text-[var(--color-text-secondary)]">
            {statusText}
          </span>
        </div>
      </div>
    </div>
  )
}

const nodeTypes: NodeTypes = {
  requirement: RequirementGraphNodeView,
  header: RequirementGraphHeaderNodeView,
}

function getDownstreamNodes(startId: string, edges: Edge[]): Set<string> {
  const visited = new Set<string>()
  const queue = [startId]
  visited.add(startId)

  while (queue.length > 0) {
    const curr = queue.shift()!
    for (const edge of edges) {
      if (edge.source === curr && !visited.has(edge.target)) {
        visited.add(edge.target)
        queue.push(edge.target)
      }
    }
  }
  return visited
}

export function RequirementGraphFlow({
  requirements,
  graphData,
  mode = 'impact',
  selectedRequirementId,
  selectedRequirementCode,
  className = '',
}: RequirementGraphFlowProps) {
  const [filter, setFilter] = useState('ALL')
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [clickedNodeId, setClickedNodeId] = useState<string | null>(null)

  const graph = useMemo(
    () => normalizeRequirementGraph(graphData, requirements),
    [graphData, requirements],
  )

  const filteredGraph = useMemo(() => {
    let filteredNodes = graph.nodes;
    let filteredEdges = graph.edges;

    // Filtro principal por modo: "focused" vs "project-map"
    if (mode === 'focused' || mode === 'impact') {
      const codeToFocus = selectedRequirementCode || selectedRequirementId
      if (codeToFocus) {
        filteredEdges = filteredEdges.filter(e => e.source === codeToFocus || e.target === codeToFocus)
        const connectedNodeIds = new Set(filteredEdges.flatMap(e => [e.source, e.target]))
        connectedNodeIds.add(codeToFocus)
        filteredNodes = filteredNodes.filter(n => connectedNodeIds.has(n.id))
      }
    }

    // Filtros de usuario de la UI
    if (filter === 'RNF') {
      filteredNodes = filteredNodes.filter(n => (n.data.requirementType || inferRequirementType(n.data.code)) === 'RNF')
    } else if (filter === 'RF') {
      filteredNodes = filteredNodes.filter(n => (n.data.requirementType || inferRequirementType(n.data.code)) === 'RF')
    } else if (filter !== 'ALL') {
      filteredEdges = filteredEdges.filter(e => e.data?.originalType === filter)
    }

    if (filter === 'RNF' || filter === 'RF') {
      const validNodeIds = new Set(filteredNodes.map(n => n.id))
      filteredEdges = filteredEdges.filter(e => validNodeIds.has(e.source) && validNodeIds.has(e.target))
    } else if (filter !== 'ALL') {
      const validNodeIds = new Set(filteredEdges.flatMap(e => [e.source, e.target]))
      // Solo en modo project map escondemos nodos si filtramos por relación y no están conectados.
      // En modo focused, es mejor dejar el nodo central siempre visible.
      if (mode === 'project-map') {
        filteredNodes = filteredNodes.filter(n => validNodeIds.has(n.id))
      }
    }

    return { nodes: filteredNodes, edges: filteredEdges }
  }, [graph, filter, mode, selectedRequirementId, selectedRequirementCode])

  const activeSimNodeId = hoveredNodeId || clickedNodeId || null

  const impactedNodeIds = useMemo(() => {
    if (!activeSimNodeId) return new Set<string>()
    return getDownstreamNodes(activeSimNodeId, filteredGraph.edges)
  }, [activeSimNodeId, filteredGraph.edges])

  const nodes = useMemo(() => {
    return filteredGraph.nodes.map((node) => {
      const isHeader = (node.type as string) === 'header'
      const isSelected = node.id === selectedRequirementId || node.data.code === selectedRequirementCode || node.id === selectedRequirementCode

      let isSimActive = false
      let isSimImpacted = false
      let isSimDimmed = false

      if (activeSimNodeId) {
        if (isHeader) {
          isSimDimmed = true
        } else if (node.id === activeSimNodeId) {
          isSimActive = true
        } else if (impactedNodeIds.has(node.id)) {
          isSimImpacted = true
        } else {
          isSimDimmed = true
        }
      }

      return {
        ...node,
        selected: isSelected,
        data: {
          ...node.data,
          isSimActive,
          isSimImpacted,
          isSimDimmed,
        }
      }
    })
  }, [filteredGraph.nodes, selectedRequirementId, selectedRequirementCode, activeSimNodeId, impactedNodeIds])

  const edges = useMemo(() => {
    return filteredGraph.edges.map((edge) => {
      const isEdgeInPath = activeSimNodeId && edge.source === activeSimNodeId && impactedNodeIds.has(edge.target)

      if (activeSimNodeId) {
        if (isEdgeInPath) {
          // Flowing neon impact edge!
          return {
            ...edge,
            animated: true,
            style: {
              ...edge.style,
              stroke: '#f59e0b', // Amber flow
              strokeWidth: 3,
              filter: 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.8))',
            },
          }
        } else {
          // Dimmed non-impact edge!
          return {
            ...edge,
            animated: false,
            style: {
              ...edge.style,
              stroke: 'rgba(255, 255, 255, 0.03)',
              strokeWidth: 0.8,
            },
          }
        }
      }

      return edge
    })
  }, [filteredGraph.edges, activeSimNodeId, impactedNodeIds])

  if (!graphData) {
    return (
      <div className={['space-y-3', className].join(' ')}>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5 text-sm text-[var(--color-text-muted)]">
          No hay datos de grafo para mostrar todavía.
        </div>
      </div>
    )
  }

  if (graph.nodes.length === 0 && graph.edges.length === 0) {
    return (
      <div className={['space-y-3', className].join(' ')}>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5 text-sm text-[var(--color-text-muted)]">
          {mode === 'focused' || mode === 'impact' 
            ? 'Este requisito todavía no tiene relaciones directas.'
            : 'No hay relaciones visibles todavía.'}
        </div>
        {graph.rawJson ? (
          <details className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
            <summary className="cursor-pointer text-sm font-medium text-[var(--color-text-primary)]">
              Respuesta sin formato
            </summary>
            <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words text-[11px] text-[var(--color-text-muted)]">
              {graph.rawJson}
            </pre>
          </details>
        ) : null}
      </div>
    )
  }

  return (
    <div className={['space-y-3', className].join(' ')}>
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-3 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h4 className="text-[13px] font-semibold text-[var(--color-text-primary)]">
              {mode === 'focused' || mode === 'impact' ? 'Impacto del requisito' : mode === 'project-map' ? 'Mapa general del proyecto' : 'Relaciones inferidas'}
            </h4>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
              Visualización automática de nodos y relaciones del proyecto actual.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {[
                { id: 'ALL', label: 'Todos' },
                { id: 'DEPENDS_ON', label: 'Dependencias' },
                { id: 'CONFLICTS_WITH', label: 'Conflictos' },
                { id: 'IMPACTS', label: 'Impacto' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold tracking-wider uppercase transition-all duration-150 active:scale-95 cursor-pointer border outline-none focus:outline-none ${
                    filter === f.id
                      ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.1)]'
                      : 'bg-[var(--color-bg-card)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--color-text-muted)] hidden sm:block">
            React Flow
          </div>
        </div>
 
        <div className="h-[500px] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[linear-gradient(180deg,var(--color-bg),var(--color-bg-card))] relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.25 }}
            minZoom={0.35}
            maxZoom={1.5}
            translateExtent={[[-1500, -1500], [2500, 2500]]}
            nodeExtent={[[-1000, -1000], [2000, 2000]]}
            nodesDraggable={true}
            nodesConnectable={false}
            elementsSelectable={true}
            panOnDrag={true}
            panOnScroll={false}
            zoomOnScroll={true}
            onNodeMouseEnter={(_, node) => {
              if (node.type === 'requirement') {
                setHoveredNodeId(node.id)
              }
            }}
            onNodeMouseLeave={() => setHoveredNodeId(null)}
            onNodeClick={(_, node) => {
              if (node.type === 'requirement') {
                setClickedNodeId(prev => prev === node.id ? null : node.id)
              }
            }}
            onPaneClick={() => {
              setClickedNodeId(null)
            }}
            defaultEdgeOptions={{
              type: 'smoothstep',
              animated: true,
              style: {
                stroke: 'var(--color-text-muted)',
                strokeWidth: 1.5,
              },
            }}
          >
            <Background variant={BackgroundVariant.Dots} gap={24} size={1.2} color="rgba(0,0,0,0.08)" />
            <Controls showInteractive={false} position="bottom-right" className="!border !border-[var(--color-border)] !shadow-sm" />
          </ReactFlow>
          {filter !== 'ALL' && filteredGraph.edges.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[1px] pointer-events-none z-10 p-4 text-center">
              <div className="rounded-2xl border border-cyan-500/20 bg-[var(--color-bg-card)] p-6 shadow-xl max-w-sm pointer-events-auto">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mx-auto mb-4 border border-cyan-500/20">
                  <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h5 className="text-[13px] font-bold text-[var(--color-text-primary)] uppercase tracking-wider">
                  Sin Relaciones
                </h5>
                <p className="text-[11px] text-[var(--color-text-muted)] mt-2 leading-relaxed">
                  No se encontraron relaciones del tipo <span className="text-cyan-400 font-bold">"{
                    filter === 'DEPENDS_ON' ? 'Dependencias' :
                    filter === 'CONFLICTS_WITH' ? 'Conflictos' : 'Impacto'
                  }"</span> en este proyecto actualmente.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {graph.reasons.length > 0 ? (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
          <h5 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
            Razones detectadas
          </h5>
          <div className="space-y-2">
            {graph.reasons.map((item) => (
              <div key={item.id} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-[var(--color-text-muted)]">
                  <span>{item.from}</span>
                  <span>→</span>
                  <span>{item.to}</span>
                  <span className="rounded-full border border-[var(--color-border)] px-2 py-0.5">{item.relationType}</span>
                </div>
                <p className="mt-2 text-[12px] leading-relaxed text-[var(--color-text-secondary)]">
                  {item.reason}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {graph.rawJson && !graph.hasKnownShape ? (
        <details className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
          <summary className="cursor-pointer text-sm font-medium text-[var(--color-text-primary)]">
            Respuesta sin formato
          </summary>
          <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words text-[11px] text-[var(--color-text-muted)]">
            {graph.rawJson}
          </pre>
        </details>
      ) : null}
    </div>
  )
}

export type { GraphMode as RequirementGraphMode }
