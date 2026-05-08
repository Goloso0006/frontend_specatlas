import { useMemo } from 'react'
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

type GraphMode = 'impact' | 'inferred'

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

function layoutNodes(nodeIds: string[]): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {}
  if (nodeIds.length === 0) return positions

  if (nodeIds.length === 1) {
    positions[nodeIds[0]] = { x: 80, y: 80 }
    return positions
  }

  if (nodeIds.length === 2) {
    positions[nodeIds[0]] = { x: 80, y: 80 }
    positions[nodeIds[1]] = { x: 360, y: 80 }
    return positions
  }

  const columns = Math.min(3, Math.ceil(Math.sqrt(nodeIds.length)))

  nodeIds.forEach((id, index) => {
    const column = index % columns
    const row = Math.floor(index / columns)
    positions[id] = {
      x: 80 + column * 280,
      y: 80 + row * 160,
    }
  })

  return positions
}

function normalizeRequirementGraph(graphData: GraphData, requirements?: RequirementDTO[]): NormalizedGraph {
  const rawJson = graphData ? JSON.stringify(graphData, null, 2) : ''
  const requirementMap = buildRequirementMap(requirements)

  if (!graphData) {
    return { nodes: [], edges: [], reasons: [], rawJson, hasKnownShape: false }
  }

  let payload: Record<string, unknown> | null = null

  if (Array.isArray(graphData)) {
    const arrayEntries = graphData.filter(isRecord)
    const looksLikeEdges = arrayEntries.some(isEdgeLikeEntry)
    payload = {
      nodes: looksLikeEdges ? [] : arrayEntries,
      edges: looksLikeEdges ? arrayEntries : [],
    }
  } else if (isRecord(graphData)) {
    payload = graphData
  }

  if (!payload) {
    return { nodes: [], edges: [], reasons: [], rawJson, hasKnownShape: false }
  }

  const nodesSource = extractArray(payload.nodes)
  const edgesSource = extractArray(payload.edges)
  const relationsSource = extractArray(payload.relations)
  const combinedEdges = edgesSource.length > 0 ? edgesSource : relationsSource

  const nodeMap = new Map<string, RequirementGraphNode>()
  const reasons: NormalizedGraph['reasons'] = []

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

  const positions = layoutNodes(Array.from(nodeMap.keys()))
  const nodes = Array.from(nodeMap.values()).map((node) => ({
    ...node,
    position: positions[node.id] ?? { x: 80, y: 80 },
  }))

  const edges = edgeEntries.flatMap((entry, index) => {
    const fromCode = toStringValue(entry.fromCode ?? entry.from ?? entry.source ?? entry.sourceCode ?? entry.sourceId)
    const toCode = toStringValue(entry.toCode ?? entry.to ?? entry.target ?? entry.targetCode ?? entry.targetId)
    if (!fromCode || !toCode) return []

    const relationType = toStringValue(entry.relationType ?? entry.type ?? entry.relationship ?? entry.label) || 'RELATES_TO'
    const reason = toStringValue(entry.reason ?? entry.description)

    return [{
      id: toStringValue(entry.id) || `${fromCode}-${toCode}-${relationType}-${index}`,
      source: fromCode,
      target: toCode,
      label: relationType,
      animated: true,
      type: 'smoothstep',
      data: { reason },
      markerEnd: { type: MarkerType.ArrowClosed },
      style: {
        stroke: 'var(--color-text-muted)',
        strokeWidth: 1.5,
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

function RequirementGraphNodeView({ data, selected }: NodeProps<RequirementGraphNode>) {
  const badge = data.requirementType || inferRequirementType(data.code)

  return (
    <div
      className={[
        'min-w-[220px] max-w-[260px] rounded-2xl border bg-[var(--color-bg-card)] px-4 py-3 shadow-sm transition-all duration-150',
        'border-[var(--color-border)] hover:border-[var(--color-border-strong)] hover:shadow-md',
        selected ? 'ring-1 ring-[var(--color-border-strong)]' : '',
      ].join(' ')}
    >
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !border-2 !border-[var(--color-border-strong)] !bg-[var(--color-surface)]" />
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !border-2 !border-[var(--color-border-strong)] !bg-[var(--color-surface)]" />

      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 text-[10px] font-semibold tracking-[0.14em] text-[var(--color-text-muted)]">
          {badge}
        </span>
        <span className="text-[10px] font-mono text-[var(--color-text-muted)]">{data.code}</span>
      </div>

      <div className="space-y-1">
        <div className="text-[13px] font-semibold leading-snug text-[var(--color-text-primary)]">
          {data.title}
        </div>
        {data.description ? (
          <div className="text-[11.5px] leading-relaxed text-[var(--color-text-muted)] line-clamp-3">
            {data.description}
          </div>
        ) : null}
      </div>
    </div>
  )
}

const nodeTypes: NodeTypes = {
  requirement: RequirementGraphNodeView,
}

export function RequirementGraphFlow({
  requirements,
  graphData,
  mode = 'impact',
  selectedRequirementId,
  className = '',
}: RequirementGraphFlowProps) {
  const graph = useMemo(
    () => normalizeRequirementGraph(graphData, requirements),
    [graphData, requirements],
  )

  const nodes = useMemo(
    () => graph.nodes.map((node) => ({ ...node, selected: node.id === selectedRequirementId })),
    [graph.nodes, selectedRequirementId],
  )

  if (!graphData) {
    return (
      <div className={['space-y-3', className].join(' ')}>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5 text-sm text-[var(--color-text-muted)]">
          No hay datos de grafo para mostrar todavía.
        </div>
      </div>
    )
  }

  if (graph.edges.length === 0) {
    return (
      <div className={['space-y-3', className].join(' ')}>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5 text-sm text-[var(--color-text-muted)]">
          No hay relaciones visibles todavía.
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
              {mode === 'inferred' ? 'Relaciones inferidas' : 'Grafo de impacto'}
            </h4>
            <p className="text-[11px] text-[var(--color-text-muted)]">
              Visualización automática de nodos y relaciones del proyecto actual.
            </p>
          </div>
          <div className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
            React Flow
          </div>
        </div>

        <div className="h-[460px] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[linear-gradient(180deg,var(--color-bg),var(--color-bg-card))]">
          <ReactFlow
            nodes={nodes}
            edges={graph.edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.5}
            maxZoom={1.4}
            nodesDraggable
            nodesConnectable={false}
            elementsSelectable
            panOnScroll={false}
            zoomOnScroll={false}
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
        </div>
      </div>

      {mode === 'inferred' && graph.reasons.length > 0 ? (
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
