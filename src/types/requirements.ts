export interface ConvertRequest {
  text: string
  projectId: string
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
}
