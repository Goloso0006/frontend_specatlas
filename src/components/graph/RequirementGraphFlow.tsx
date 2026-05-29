import { useMemo, useState, useRef, useCallback } from 'react'
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
  // Normalize keys to ignore accents and case
  const keys = Object.keys(entry).map(k => k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, ""))
  
  const hasFrom = keys.some(k => k === 'from' || k === 'source' || k === 'origen' || k === 'start' || k.includes('origen'))
  const hasTo = keys.some(k => k === 'to' || k === 'target' || k === 'destino' || k === 'end' || k.includes('destino'))
  const hasRelation = keys.some(k => k === 'relation' || k === 'relacion' || k === 'tipo' || k === 'type')
  
  if ((hasFrom && hasTo) || (hasFrom && hasRelation) || (hasTo && hasRelation)) {
    return true
  }

  // Ultimate heuristic: If an object has 2 or more values that look like requirement codes, it's an edge!
  // Nodes typically only have 1 code.
  const validCodes = Object.values(entry).filter(v => {
    if (typeof v !== 'string') return false
    const upper = v.trim().toUpperCase()
    return upper.startsWith('RF') || upper.startsWith('RNF') || upper.startsWith('REQ')
  })
  
  return validCodes.length >= 2
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

  // Deduplicate by ID (uppercase) to prevent overlapping ghosts
  const seenIds = new Set<string>()
  const uniqueNodes: RequirementGraphNode[] = []
  for (const node of nodes) {
    const key = node.id.toUpperCase()
    if (seenIds.has(key)) continue
    seenIds.add(key)
    uniqueNodes.push(node)
  }

  const rnfNodes: RequirementGraphNode[] = []
  const rfNodes: RequirementGraphNode[] = []
  const otherNodes: RequirementGraphNode[] = []

  uniqueNodes.forEach(node => {
    const type = (node.data.requirementType || '').toUpperCase()
    if (type === 'RNF' || type === 'NON_FUNCTIONAL' || node.id.toUpperCase().startsWith('RNF')) {
      rnfNodes.push(node)
    } else if (type === 'RF' || type === 'FUNCTIONAL' || node.id.toUpperCase().startsWith('RF')) {
      rfNodes.push(node)
    } else {
      otherNodes.push(node)
    }
  })

  // STACKED GRID LAYOUT
  const colWidth = 400
  const colGap = 50
  const rowHeight = 450
  const maxCols = 5
  
  let currentY = 100

  // 1. RNF Section
  if (rnfNodes.length > 0) {
    headers.push({
      id: 'header-rnf',
      type: 'header',
      position: { x: 100, y: currentY - 60 },
      draggable: false,
      selectable: false,
      data: { label: 'Requisitos No Funcionales (RNF)' }
    })

    rnfNodes.forEach((node, i) => {
      const col = i % maxCols
      const row = Math.floor(i / maxCols)
      positions[node.id] = {
        x: 100 + col * (colWidth + colGap),
        y: currentY + row * rowHeight
      }
    })
    const rnfRows = Math.ceil(rnfNodes.length / maxCols)
    currentY += rnfRows * rowHeight + 100
  }

  // 2. RF Section
  if (rfNodes.length > 0) {
    headers.push({
      id: 'header-rf',
      type: 'header',
      position: { x: 100, y: currentY - 60 },
      draggable: false,
      selectable: false,
      data: { label: 'Requisitos Funcionales (RF)' }
    })

    rfNodes.forEach((node, i) => {
      const col = i % maxCols
      const row = Math.floor(i / maxCols)
      positions[node.id] = {
        x: 100 + col * (colWidth + colGap),
        y: currentY + row * rowHeight
      }
    })
    const rfRows = Math.ceil(rfNodes.length / maxCols)
    currentY += rfRows * rowHeight + 100
  }

  // 3. Other Nodes Section
  if (otherNodes.length > 0) {
    headers.push({
      id: 'header-other',
      type: 'header',
      position: { x: 100, y: currentY - 60 },
      draggable: false,
      selectable: false,
      data: { label: 'Otros Elementos' }
    })

    otherNodes.forEach((node, i) => {
      const col = i % maxCols
      const row = Math.floor(i / maxCols)
      positions[node.id] = {
        x: 100 + col * (colWidth + colGap),
        y: currentY + row * rowHeight
      }
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
  let rawJson = ''
  let parsedData = graphData

  // Sometimes AI returns a JSON string (potentially with markdown ```json)
  if (typeof graphData === 'string') {
    rawJson = graphData
    try {
      parsedData = JSON.parse(graphData)
    } catch {
      try {
        const clean = graphData.replace(/```json/gi, '').replace(/```/g, '').trim()
        parsedData = JSON.parse(clean)
      } catch {
        // Leave as string if unparseable
      }
    }
  } else if (graphData) {
    rawJson = JSON.stringify(graphData, null, 2)
  }

  const requirementMap = new Map<string, RequirementDTO>()
  const titleToCodeMap = new Map<string, string>()
  
  if (requirements) {
    for (const req of requirements) {
      if (req.code) {
        const cleanCode = req.code.trim().toUpperCase()
        requirementMap.set(cleanCode, req)
        if (req.title) {
          titleToCodeMap.set(req.title.trim().toUpperCase(), cleanCode)
        }
      }
    }
  }

  function resolveCode(raw: unknown): string {
    const val = toStringValue(raw).trim().toUpperCase()
    if (!val) return ''
    if (requirementMap.has(val)) return val
    if (titleToCodeMap.has(val)) return titleToCodeMap.get(val)!
    
    // Fallback: Check if the string starts with a known code (e.g., "RF-001: Description")
    for (const code of requirementMap.keys()) {
      if (val.startsWith(code)) return code
    }
    return val
  }

  // Safely resolve the payload structure, unwrapping the 'data' key if present
  let payload: Record<string, unknown> | null = null

  if (parsedData) {
    if (Array.isArray(parsedData)) {
      const arrayEntries = parsedData.filter(isRecord)
      const looksLikeEdges = arrayEntries.some(isEdgeLikeEntry)
      payload = {
        nodes: looksLikeEdges ? [] : arrayEntries,
        edges: looksLikeEdges ? arrayEntries : [],
      }
    } else if (isRecord(parsedData)) {
      payload = parsedData
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
      const code = req.code.trim().toUpperCase()
      const title = req.title || req.code
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

  let nodesSource: Record<string, unknown>[] = []
  let combinedEdges: Record<string, unknown>[] = []

  if (payload) {
    // Debug: log the raw AI payload so we can diagnose issues
    console.log('[RequirementGraphFlow] Raw AI payload keys:', Object.keys(payload))
    
    // Dynamically detect nodes and edges arrays in the payload
    for (const [key, value] of Object.entries(payload)) {
      if (Array.isArray(value)) {
        const arr = value.filter(isRecord)
        const lowerKey = key.toLowerCase()
        
        // Classify by key name first, then by content inspection
        const isEdgeKey = lowerKey.includes('edge') || lowerKey.includes('relacion') || lowerKey.includes('arista') || lowerKey.includes('conexion') || lowerKey.includes('link') || lowerKey.includes('dependencia')
        const isNodeKey = lowerKey.includes('node') || lowerKey.includes('req') || lowerKey.includes('nodo')
        
        if (isEdgeKey) {
          combinedEdges = combinedEdges.concat(arr)
        } else if (isNodeKey) {
          nodesSource = nodesSource.concat(arr)
        } else if (arr.some(isEdgeLikeEntry)) {
          combinedEdges = combinedEdges.concat(arr)
        }
      }
    }
    // Fallback if payload itself is just an object containing edge-like properties
    if (isEdgeLikeEntry(payload)) {
      combinedEdges.push(payload)
    }
  }

  // Augment or update nodes from payload nodesSource if any exist
  for (const entry of nodesSource) {
    const rawCode = entry.code ?? entry.id ?? entry.requirementCode ?? entry.label ?? entry.title ?? entry.name
    const code = resolveCode(rawCode)
    if (!code) continue

    const requirement = requirementMap.get(code) ?? null
    const title = toStringValue(entry.title ?? entry.name) || requirement?.title?.trim() || code
    const description = toStringValue(entry.description) || requirement?.description?.trim() || ''
    
    // Only override type if the AI provided a strong non-default type, otherwise use the existing or inferred one
    let requirementType = toStringValue(entry.requirementType ?? entry.type).toUpperCase()
    if (!requirementType || requirementType === 'DEFAULT') {
      requirementType = requirementMap.get(code)?.requirementType || inferRequirementType(code, requirement)
    }

    nodeMap.set(code, {
      id: code,
      type: 'requirement',
      position: { x: 0, y: 0 },
      data: { code, title, description, requirementType },
    })
  }

  const edgeEntries = combinedEdges.filter(isRecord)

  // Helper to extract values from an object using a list of keyword substrings
  function extractValueByKeywords(entry: Record<string, unknown>, keywords: string[]): unknown {
    const entryKeys = Object.keys(entry)
    for (const kw of keywords) {
      for (const k of entryKeys) {
        // Strip accents and non-alphanumeric chars
        const cleanK = k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "")
        
        // Exact matching for short dangerous keywords like 'to' and 'from'
        if (kw === 'to' || kw === 'from') {
          if (cleanK === kw || cleanK === `${kw}code` || cleanK === `${kw}id` || cleanK === `id${kw}` || cleanK === `req${kw}` || cleanK === `nodo${kw}`) {
            return entry[k]
          }
        } else {
          // Flexible substring match for longer safer words
          if (cleanK.includes(kw)) {
            return entry[k]
          }
        }
      }
    }
    return undefined
  }

  for (const entry of edgeEntries) {
    let rawFrom = extractValueByKeywords(entry, ['from', 'source', 'origen', 'start', 'depende', 'req1', 'nodo1'])
    let rawTo = extractValueByKeywords(entry, ['to', 'target', 'destino', 'end', 'impacta', 'req2', 'nodo2'])
    
    if (!rawFrom || !rawTo) {
      const allVals = Object.values(entry).map(toStringValue)
      const validCodes = allVals.map(v => resolveCode(v)).filter(Boolean)
      if (validCodes.length >= 2) {
        if (!rawFrom) rawFrom = validCodes[0]
        if (!rawTo) rawTo = validCodes[1]
      }
    }
    
    if (!rawFrom || !rawTo) continue
    
    const fromCode = resolveCode(rawFrom)
    const toCode = resolveCode(rawTo)
    if (!fromCode || !toCode) continue

    const relationType = toStringValue(extractValueByKeywords(entry, ['relation', 'relacion', 'type', 'tipo', 'label'])) || 'RELATES_TO'
    const reason = toStringValue(extractValueByKeywords(entry, ['reason', 'description', 'razon', 'motivo', 'justificacion']))

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

  // Deduplicate nodeMap entries by uppercase key (safety net)
  const dedupedNodes = Array.from(nodeMap.values())
  const layout = layoutRequirementNodes(dedupedNodes)
  
  // Use a unique fallback position for any node without a layout slot (prevents overlap at 0,0)
  let fallbackIndex = 0
  const reqNodes = dedupedNodes.map((node) => {
    let pos = layout.positions[node.id]
    if (!pos) {
      // Place fallback nodes WAY below the normal grid so they never stack on top of real nodes
      pos = { x: 80 + fallbackIndex * 350, y: 5000 + fallbackIndex * 350 }
      fallbackIndex++
    }
    return { ...node, position: pos }
  })
  const nodes = [...layout.headers, ...reqNodes]

  const edges = edgeEntries.flatMap((entry, index) => {
    let rawFrom = extractValueByKeywords(entry, ['from', 'source', 'origen', 'start', 'depende', 'req1', 'nodo1'])
    let rawTo = extractValueByKeywords(entry, ['to', 'target', 'destino', 'end', 'impacta', 'req2', 'nodo2'])
    
    if (!rawFrom || !rawTo) {
      const allVals = Object.values(entry).map(toStringValue)
      const validCodes = allVals.map(v => resolveCode(v)).filter(Boolean)
      if (validCodes.length >= 2) {
        if (!rawFrom) rawFrom = validCodes[0]
        if (!rawTo) rawTo = validCodes[1]
      }
    }
    
    if (!rawFrom || !rawTo) return []

    const fromCode = resolveCode(rawFrom)
    const toCode = resolveCode(rawTo)
    if (!fromCode || !toCode) return []
    // Skip self-referencing edges
    if (fromCode === toCode) return []

    const relationType = toStringValue(extractValueByKeywords(entry, ['relation', 'relacion', 'type', 'tipo', 'label'])) || 'RELATES_TO'
    const reason = toStringValue(extractValueByKeywords(entry, ['reason', 'description', 'razon', 'motivo', 'justificacion']))

    let stroke = 'var(--color-text-muted)'
    let animated = false
    let strokeDasharray: string | undefined = undefined

    let canonicalType = relationType.toUpperCase()
    
    switch (canonicalType) {
      case 'DEPENDS_ON':
      case 'DEPENDE_DE':
      case 'DEPENDENCIA':
        canonicalType = 'DEPENDS_ON'
        stroke = 'var(--color-text-primary)'
        break
      case 'CONFLICTS_WITH':
      case 'CONFLICTO':
        canonicalType = 'CONFLICTS_WITH'
        stroke = '#f59e0b'
        strokeDasharray = '5 5'
        break
      case 'IMPACTS':
      case 'IMPACTA':
      case 'IMPACTO':
        canonicalType = 'IMPACTS'
        stroke = 'var(--color-accent)'
        animated = true
        break
      case 'CONSTRAINS':
      case 'CONDICIONA':
        canonicalType = 'CONSTRAINS'
        strokeDasharray = '5 5'
        break
    }

    return [{
      id: toStringValue(entry.id) || `${fromCode}-${toCode}-${relationType}-${index}`,
      source: fromCode,
      target: toCode,
      label: translateRelationType(canonicalType),
      labelStyle: { fill: 'var(--color-text-primary)', fontSize: 10, fontWeight: 600 },
      labelBgStyle: { fill: 'var(--color-bg)', fillOpacity: 0.8 },
      animated,
      type: 'smoothstep',
      data: { reason, originalType: canonicalType },
      markerEnd: { type: MarkerType.ArrowClosed, color: stroke },
      style: {
        stroke,
        strokeWidth: 1.5,
        strokeDasharray,
      },
    } satisfies Edge]
  })

  // Debug logging
  console.log(`[RequirementGraphFlow] Parsed: ${nodes.length} nodes, ${edges.length} edges, ${combinedEdges.length} raw edge entries`)
  if (edges.length > 0) {
    console.log('[RequirementGraphFlow] Sample edges:', edges.slice(0, 3).map(e => `${e.source} -> ${e.target} (${e.data?.originalType})`))
  }
  if (combinedEdges.length > 0 && edges.length === 0) {
    console.log('[RequirementGraphFlow] WARNING: Raw edges exist but none parsed! Sample raw:', combinedEdges.slice(0, 2))
  }

  return {
    nodes,
    edges,
    reasons,
    rawJson,
    hasKnownShape: nodesSource.length > 0 || combinedEdges.length > 0,
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
    simClass = 'bg-[var(--color-bg-card)] border-cyan-500 ring-2 ring-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.35)] z-50'
  } else if (isSimImpacted) {
    simClass = 'bg-[var(--color-bg-card)] border-amber-500 ring-2 ring-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.3)] z-40'
  } else if (isSimDimmed) {
    simClass = 'bg-[var(--color-bg-card)]/50 border-[var(--color-border)]/50 opacity-40'
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
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleNodeMouseEnter = useCallback((_: unknown, node: { type?: string; id: string }) => {
    if (node.type !== 'requirement') return
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    setHoveredNodeId(node.id)
  }, [])

  const handleNodeMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    hoverTimerRef.current = setTimeout(() => {
      setHoveredNodeId(null)
    }, 80)
  }, [])

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
      filteredNodes = filteredNodes.filter(n => {
        const t = (n.data.requirementType || inferRequirementType(n.data.code)).toUpperCase()
        return t === 'RNF' || t === 'NON_FUNCTIONAL'
      })
    } else if (filter === 'RF') {
      filteredNodes = filteredNodes.filter(n => {
        const t = (n.data.requirementType || inferRequirementType(n.data.code)).toUpperCase()
        return t === 'RF' || t === 'FUNCTIONAL'
      })
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

  const hasRequirements = requirements && requirements.length > 0;
  
  if (!graphData && !hasRequirements) {
    return (
      <div className={['space-y-3', className].join(' ')}>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5 text-sm text-[var(--color-text-muted)]">
          No hay requisitos ni datos de grafo para mostrar todavía.
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
            onNodeMouseEnter={handleNodeMouseEnter}
            onNodeMouseLeave={handleNodeMouseLeave}
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
