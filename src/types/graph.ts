export interface ImpactNode {
  id: string
  code: string
  title: string
  type?: string
  requirementType?: 'FUNCTIONAL' | 'NON_FUNCTIONAL'
}

export interface ImpactEdge {
  id: string
  source: string
  target: string
  label: string
  type?: string
}

export interface ImpactGraphResponse {
  nodes: ImpactNode[]
  edges: ImpactEdge[]
  [key: string]: any
}

export type ImpactResponse = ImpactGraphResponse

export interface RelationInferenceResponse {
  [key: string]: any
}
