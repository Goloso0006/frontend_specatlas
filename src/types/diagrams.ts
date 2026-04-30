export type DiagramType = 'CLASS' | 'USE_CASE'
export type DiagramMode = 'MANUAL' | 'AUTO'
export type DiagramRelationType = 'association' | 'inheritance' | 'aggregation' | 'composition' | 'dependency'
export type VisibilityType = 'public' | 'private' | 'protected' | 'package'

export interface DiagramPositionDTO {
  x: number
  y: number
}

export interface DiagramClassAttributeDTO {
  name: string
  type: string
  visibility: VisibilityType
}

export interface DiagramClassMethodDTO {
  name: string
  returnType: string
  visibility: VisibilityType
}

export interface DiagramClassNodeDTO {
  id: string
  kind: 'class'
  name: string
  attributes: DiagramClassAttributeDTO[]
  methods: DiagramClassMethodDTO[]
  position: DiagramPositionDTO
  derivedFromRequirements: string[]
}

export interface DiagramRelationDTO {
  id: string
  from: string
  to: string
  type: DiagramRelationType
  label: string
  derivedFromRequirements: string[]
}

export interface DiagramSourceDTO {
  diagramType: DiagramType
  nodes: DiagramClassNodeDTO[]
  edges: DiagramRelationDTO[]
}

export interface DiagramRequest {
  projectId: string
  name: string
  sourceJson: string
  plantUmlCode: string | null
}

export interface UseCaseDiagramRequest extends DiagramRequest {
  diagramType?: 'USE_CASE'
}

export interface DiagramResponse {
  id: string
  projectId: string
  name: string
  diagramType: DiagramType
  mode: DiagramMode
  sourceJson: DiagramSourceDTO | string
  plantUmlCode: string | null
  createdAt?: string
  updatedAt?: string
}

export interface DiagramSummaryResponse {
  id: string
  projectId: string
  name: string
  diagramType: DiagramType
  mode: DiagramMode
  createdAt?: string
  updatedAt?: string
}
