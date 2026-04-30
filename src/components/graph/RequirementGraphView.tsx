import { useMemo } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  type Edge,
  type Node,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { EmptyState } from '../ui/DataDisplay'

type GraphLikeResponse = Record<string, unknown> | null | undefined

interface GraphViewData {
  title: string
  nodes: Node[]
  edges: Edge[]
  rawJson: string
}

function toNodeId(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback
}

function toLabel(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback
}

function normalizeGraphResponse(response: GraphLikeResponse, title: string): GraphViewData {
  const rawJson = response ? JSON.stringify(response, null, 2) : ''

  if (!response) {
    return { title, nodes: [], edges: [], rawJson }
  }

  const nodesSource = Array.isArray(response.nodes)
    ? response.nodes
    : Array.isArray(response.requirements)
      ? response.requirements
      : Array.isArray(response.items)
        ? response.items
        : []

  const edgesSource = Array.isArray(response.edges)
    ? response.edges
    : Array.isArray(response.relations)
      ? response.relations
      : Array.isArray(response.links)
        ? response.links
        : []

  const nodes = nodesSource.map((item, index) => {
    const entry = item as Record<string, unknown>
    const id = toNodeId(entry.id ?? entry.requirementId ?? entry.code, `node-${index}`)
    const label = toLabel(entry.label ?? entry.title ?? entry.name ?? entry.code, id)

    return {
      id,
      data: { label },
      position: {
        x: index % 3 * 220,
        y: Math.floor(index / 3) * 120,
      },
      style: {
        border: '1px solid rgb(94 234 212)',
        background: 'rgba(15, 23, 42, 0.95)',
        color: 'rgb(226 232 240)',
        borderRadius: 12,
        padding: 10,
        width: 180,
      },
    } satisfies Node
  })

  const edges = edgesSource.flatMap((item, index) => {
    const entry = item as Record<string, unknown>
    const source = toNodeId(entry.from ?? entry.source ?? entry.sourceId ?? entry.origin, '')
    const target = toNodeId(entry.to ?? entry.target ?? entry.targetId ?? entry.destination, '')
    if (!source || !target) return []

    const label = toLabel(entry.label ?? entry.type ?? entry.relationship ?? entry.name, '')

    return [{
      id: toNodeId(entry.id ?? `${source}-${target}-${index}`, `${source}-${target}-${index}`),
      source,
      target,
      label: label || undefined,
      animated: true,
      type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: 'rgb(56 189 248)', strokeWidth: 2 },
    } satisfies Edge]
  })

  return { title, nodes, edges, rawJson }
}

export function RequirementGraphView({
  title,
  response,
  emptyMessage = 'No hay datos para mostrar en el grafo.',
}: {
  title: string
  response: GraphLikeResponse
  emptyMessage?: string
}) {
  const graph = useMemo(() => normalizeGraphResponse(response, title), [response, title])

  if (graph.nodes.length === 0 || graph.edges.length === 0) {
    return (
      <div className="space-y-3">
        <EmptyState message={emptyMessage} />
        {graph.rawJson ? (
          <pre className="max-h-72 overflow-auto rounded-md border border-slate-700 bg-slate-900 p-3 text-xs text-slate-200">
            {graph.rawJson}
          </pre>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-slate-700 bg-slate-900 p-3">
        <h4 className="mb-3 font-semibold text-slate-100">{graph.title}</h4>
        <div className="h-[420px] overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
          <ReactFlow nodes={graph.nodes} edges={graph.edges} fitView nodesDraggable={false} nodesConnectable={false} zoomOnScroll>
            <MiniMap zoomable pannable />
            <Controls />
            <Background gap={16} color="rgba(148, 163, 184, 0.18)" />
          </ReactFlow>
        </div>
      </div>

      {graph.rawJson ? (
        <details className="rounded-xl border border-slate-700 bg-slate-900 p-3">
          <summary className="cursor-pointer text-sm font-medium text-slate-200">Ver respuesta cruda</summary>
          <pre className="mt-3 max-h-72 overflow-auto rounded-md bg-slate-950 p-3 text-xs text-slate-200">{graph.rawJson}</pre>
        </details>
      ) : null}
    </div>
  )
}