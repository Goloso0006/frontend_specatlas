export type DiagramType = 'CLASS' | 'USE_CASE' | 'COMPONENT' | 'SEQUENCE'
export type DiagramMode = 'MANUAL' | 'AUTO'
export type DiagramRelationType = 'association' | 'inheritance' | 'aggregation' | 'composition' | 'dependency'
export type VisibilityType = 'public' | 'private' | 'protected' | 'package'

export interface DiagramPositionDTO {
  x: number
  y: number
}

export interface DiagramClassAttributeDTO {
  id: string
  name: string
  type: string
  visibility: VisibilityType
  required?: boolean
}

export interface DiagramClassMethodDTO {
  id: string
  name: string
  parameters: string
  returnType: string
  visibility: VisibilityType
}

export type DiagramUmlType = 'CLASS' | 'ABSTRACT_CLASS' | 'INTERFACE' | 'ENUM'

export interface DiagramEnumValueDTO {
  id: string
  name: string
}

export type DiagramActorNodeDTO = {
  id: string
  kind: 'actor'
  name: string
  description?: string
  position: DiagramPositionDTO
  derivedFromRequirements: string[]
  actorType?: string
}

export type DiagramUseCaseNodeDTO = {
  id: string
  kind: 'useCase'
  name: string
  description?: string
  position: DiagramPositionDTO
  derivedFromRequirements: string[]
}

export type DiagramClassNodeDTO = {
  id: string
  kind: 'class'
  umlType: DiagramUmlType
  name: string
  attributes: DiagramClassAttributeDTO[]
  methods: DiagramClassMethodDTO[]
  enumValues?: DiagramEnumValueDTO[]
  position: DiagramPositionDTO
  description?: string
  derivedFromRequirements: string[]
  packageId?: string
}

export type DiagramRelationshipType = 
  | 'ASSOCIATION' 
  | 'AGGREGATION' 
  | 'COMPOSITION' 
  | 'INHERITANCE' 
  | 'IMPLEMENTATION' 
  | 'DEPENDENCY'

export type DiagramUseCaseRelationshipType =
  | 'ASSOCIATION'
  | 'INCLUDE'
  | 'EXTEND'
  | 'GENERALIZATION'

export type DiagramRelationDTO = {
  id: string
  source: string
  target: string
  sourceHandle?: string | null
  targetHandle?: string | null
  type?: string
  data?: {
    relationshipType: DiagramRelationshipType | DiagramUseCaseRelationshipType
    label?: string
    description?: string
    sourceMultiplicity?: string
    targetMultiplicity?: string
  }
  derivedFromRequirements: string[]
}

export type DiagramPackageNodeDTO = {
  id: string
  kind: 'package'
  name: string
  description?: string
  position: DiagramPositionDTO
  derivedFromRequirements: string[]
  style?: {
    width: number
    height: number
    color?: string
  }
  childCount?: number
}

export type DiagramNodeDTO = DiagramClassNodeDTO | DiagramActorNodeDTO | DiagramUseCaseNodeDTO | DiagramPackageNodeDTO

export interface DiagramSourceDTO {
  diagramType: DiagramType
  nodes: DiagramNodeDTO[]
  edges: DiagramRelationDTO[]
  actors?: any[]
  useCases?: any[]
  relations?: any[]
  systemName?: string
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

export type DiagramValidationSeverity = 'error' | 'warning'

export interface DiagramValidationIssue {
  id: string
  severity: DiagramValidationSeverity
  message: string
  targetType: 'node' | 'edge' | 'diagram'
  targetId?: string
}

export interface DiagramValidationResult {
  valid: boolean
  issues: DiagramValidationIssue[]
  errors: DiagramValidationIssue[]
  warnings: DiagramValidationIssue[]
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
