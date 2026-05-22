import type { 
  DiagramActorNodeDTO,
  DiagramUseCaseNodeDTO
} from '../types/diagrams'
import { 
  normalizeNode, 
  normalizeEdge,
  generateSafeId
} from './diagramMapper'
import type { 
  GeneratedCanvas
} from './generatedClassDiagramMapper'

export function normalizeGeneratedUseCaseDiagramResponse(response: any): {
  diagramId?: string
  projectId?: string
  name?: string
  diagramType: 'USE_CASE'
  actors: any[]
  useCases: any[]
  relations: any[]
  systemName?: string
} {
  if (!response) {
    return { diagramType: 'USE_CASE', actors: [], useCases: [], relations: [] }
  }

  // Extract metadata if wrapped or direct
  const diagramId = response.id ?? response.data?.id ?? undefined
  const projectId = response.projectId ?? response.data?.projectId ?? undefined
  const name = response.name ?? response.data?.name ?? undefined

  const parseJsonStr = (val: any) => {
    if (typeof val === 'string') {
      try {
        let p = JSON.parse(val)
        while (typeof p === 'string') {
          p = JSON.parse(p)
        }
        return p
      } catch (err) {
        console.error('Failed to parse JSON string:', err, val)
        throw new Error('No se pudo interpretar el diagrama generado por IA.')
      }
    }
    return val
  }

  // Helper to check if a parsed object has any use case array properties
  const isUseCasePayload = (obj: any) => {
    return obj && (Array.isArray(obj.actors) || Array.isArray(obj.useCases) || Array.isArray(obj.relations))
  }

  // Priority 1: response.actors / response.useCases / response.relations
  if (Array.isArray(response.actors) || Array.isArray(response.useCases) || Array.isArray(response.relations)) {
    return {
      diagramId,
      projectId,
      name,
      diagramType: 'USE_CASE',
      actors: Array.isArray(response.actors) ? response.actors : [],
      useCases: Array.isArray(response.useCases) ? response.useCases : [],
      relations: Array.isArray(response.relations) ? response.relations : [],
      systemName: response.systemName
    }
  }

  // Check top level direct sourceJson or content if present on response
  if (response.sourceJson) {
    const parsed = parseJsonStr(response.sourceJson)
    if (isUseCasePayload(parsed)) {
      return {
        diagramId,
        projectId,
        name,
        diagramType: 'USE_CASE',
        actors: Array.isArray(parsed.actors) ? parsed.actors : [],
        useCases: Array.isArray(parsed.useCases) ? parsed.useCases : [],
        relations: Array.isArray(parsed.relations) ? parsed.relations : [],
        systemName: parsed.systemName
      }
    }
  }

  if (response.content) {
    const parsed = parseJsonStr(response.content)
    if (isUseCasePayload(parsed)) {
      return {
        diagramId,
        projectId,
        name,
        diagramType: 'USE_CASE',
        actors: Array.isArray(parsed.actors) ? parsed.actors : [],
        useCases: Array.isArray(parsed.useCases) ? parsed.useCases : [],
        relations: Array.isArray(parsed.relations) ? parsed.relations : [],
        systemName: parsed.systemName
      }
    }
  }

  // Priority 2: response.data.sourceJson
  if (response.data?.sourceJson) {
    const parsed = parseJsonStr(response.data.sourceJson)
    if (isUseCasePayload(parsed)) {
      return {
        diagramId,
        projectId,
        name,
        diagramType: 'USE_CASE',
        actors: Array.isArray(parsed.actors) ? parsed.actors : [],
        useCases: Array.isArray(parsed.useCases) ? parsed.useCases : [],
        relations: Array.isArray(parsed.relations) ? parsed.relations : [],
        systemName: parsed.systemName
      }
    }
  }

  // Priority 3: response.data.content
  if (response.data?.content) {
    const parsed = parseJsonStr(response.data.content)
    if (isUseCasePayload(parsed)) {
      return {
        diagramId,
        projectId,
        name,
        diagramType: 'USE_CASE',
        actors: Array.isArray(parsed.actors) ? parsed.actors : [],
        useCases: Array.isArray(parsed.useCases) ? parsed.useCases : [],
        relations: Array.isArray(parsed.relations) ? parsed.relations : [],
        systemName: parsed.systemName
      }
    }
  }

  // Priority 4: response.data
  if (response.data) {
    const parsed = parseJsonStr(response.data)
    if (isUseCasePayload(parsed)) {
      return {
        diagramId,
        projectId,
        name,
        diagramType: 'USE_CASE',
        actors: Array.isArray(parsed.actors) ? parsed.actors : [],
        useCases: Array.isArray(parsed.useCases) ? parsed.useCases : [],
        relations: Array.isArray(parsed.relations) ? parsed.relations : [],
        systemName: parsed.systemName
      }
    }
  }

  return { diagramType: 'USE_CASE', actors: [], useCases: [], relations: [] }
}

/**
 * Maps a generated Use Case diagram DTO to a canvas-compatible format.
 * Positions actors on the left and use cases on the right.
 */
export function mapGeneratedUseCaseDiagramToCanvas(source: any): GeneratedCanvas {
  const warnings: string[] = []
  
  if (!source) {
    return { nodes: [], edges: [], warnings: ['No se recibió información del diagrama.'] }
  }

  const normalized = normalizeGeneratedUseCaseDiagramResponse(source)
  const { actors: rawActors, useCases: rawUseCases, relations: rawRelations } = normalized

  if (import.meta.env.DEV) {
    console.log("[USE_CASE_AI] normalized", {
      actors: rawActors.length,
      useCases: rawUseCases.length,
      relations: rawRelations.length
    })
  }

  // Constants for default positioning if position not present
  const ACTOR_X = 50
  const SPACING_Y = 180
  
  const UC_START_X = 420
  const UC_COLS = 2
  const UC_SPACING_X = 400
  const UC_SPACING_Y = 200

  const actorNodes = rawActors.map((actor: any, index: number) => {
    const defaultPos = {
      x: ACTOR_X,
      y: index * SPACING_Y + 50
    }
    const nodeDTO = {
      id: actor.id || `actor_${generateSafeId()}`,
      kind: 'actor' as const,
      name: actor.name || `Actor ${index + 1}`,
      description: actor.description || '',
      position: actor.position || defaultPos,
      derivedFromRequirements: actor.derivedFromRequirements || [],
      actorType: actor.kind ?? "primary"
    }
    return normalizeNode(nodeDTO) as DiagramActorNodeDTO
  })

  const ucNodes = rawUseCases.map((uc: any, index: number) => {
    const col = index % UC_COLS
    const row = Math.floor(index / UC_COLS)
    const defaultPos = {
      x: UC_START_X + col * UC_SPACING_X,
      y: row * UC_SPACING_Y + 50
    }
    const nodeDTO = {
      id: uc.id || `uc_${generateSafeId()}`,
      kind: 'useCase' as const,
      name: uc.name || `UseCase ${index + 1}`,
      description: uc.description || '',
      position: uc.position || defaultPos,
      derivedFromRequirements: uc.derivedFromRequirements || [],
      extensionPoints: uc.extensionPoints || []
    }
    return normalizeNode(nodeDTO) as DiagramUseCaseNodeDTO
  })

  const mappedNodes = [...actorNodes, ...ucNodes]
  const nodeIds = new Set(mappedNodes.map(n => n.id))

  const rawEdges = rawRelations.map((rel: any) => {
    const source = rel.source ?? rel.sourceId ?? ''
    const target = rel.target ?? rel.targetId ?? ''
    const rawType = String(rel.type ?? rel.relationType ?? rel.relationshipType ?? 'ASSOCIATION').toUpperCase()
    
    let normalizedType = 'ASSOCIATION'
    if (rawType.includes('INCLUDE')) normalizedType = 'INCLUDE'
    else if (rawType.includes('EXTEND')) normalizedType = 'EXTEND'
    else if (rawType.includes('GENERALIZATION')) normalizedType = 'GENERALIZATION'

    return {
      id: rel.id || `rel_${generateSafeId()}`,
      source,
      target,
      type: 'useCaseEdge',
      data: {
        relationType: normalizedType,
        relationshipType: normalizedType,
        label: rel.label ?? '',
        extensionPointRef: rel.extensionPointRef ?? ''
      },
      derivedFromRequirements: rel.derivedFromRequirements || []
    }
  })

  const filteredEdges = rawEdges
    .map(edge => {
      const normalizedEdge = normalizeEdge(edge, 'USE_CASE')
      normalizedEdge.type = 'useCaseEdge'
      return normalizedEdge
    })
    .filter(edge => {
      const srcOk = nodeIds.has(edge.source)
      const tgtOk = nodeIds.has(edge.target)
      if (!srcOk || !tgtOk) {
        const msg = `[DiagramMapper] Skipping edge "${edge.id}": ${!srcOk ? `source "${edge.source}" not found` : ''} ${!tgtOk ? `target "${edge.target}" not found` : ''}`.trim()
        warnings.push(msg)
        console.warn(msg)
        return false
      }
      return true
    })

  if (import.meta.env.DEV) {
    console.log("[USE_CASE_AI] mapped", {
      nodes: mappedNodes.length,
      edges: filteredEdges.length
    })
  }

  return {
    nodes: mappedNodes,
    edges: filteredEdges,
    warnings
  }
}
