export interface ConvertRequest {
  text: string
  projectId: string
}

export interface ConvertBatchRequest {
  text: string
  projectId: string
  requirementType: 'FUNCTIONAL' | 'NON_FUNCTIONAL'
}

export interface RequirementBatchResponse {
  requirements: RequirementDTO[]
  warnings: string[]
  sourceSummary: string
}

export interface NonFunctionalDetailDTO {
  category: string
  metricName: string
  operator: string
  targetValue: string
  unit: string
  verificationMethod: string
  context?: string
  rationale?: string
}

export interface RequirementDTO {
  id: string
  code: string
  title: string
  description: string
  actors: string[]
  acceptanceCriteria: string[]
  isoClassification: string
  projectId: string
  relatedCodes: string[]
  requirementType?: 'FUNCTIONAL' | 'NON_FUNCTIONAL'
  nonFunctionalDetail?: NonFunctionalDetailDTO | null
}

export interface SearchResponse {
  id: string
  code: string
  title: string
  description: string
  similarity?: number
}

export interface RequirementNode {
  id: string
  code: string
  title: string
  description: string
}

export interface DuplicateCheckRequest {
  projectId: string
  title: string
  description: string
}

export interface DuplicateMatchResponse {
  requirementId: string
  requirementCode: string
  title: string
  similarity: number
  requirementType?: 'FUNCTIONAL' | 'NON_FUNCTIONAL'
}
