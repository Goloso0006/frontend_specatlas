import { endpoints } from '../endpoints'
import { unwrapData } from '../response'
import { httpProxy } from '../httpProxy'
import type { ApiResponse } from '../../types/api'
import type { ImpactResponse, RelationInferenceResponse } from '../../types/graph'
import type { RequirementDTO } from '../../types/requirements'

export const graphApi = {
  async getImpact(id: string): Promise<ImpactResponse> {
    const data = await httpProxy.get<ImpactResponse | ApiResponse<ImpactResponse>>(
      endpoints.graph.impact(id),
    )
    return unwrapData(data)
  },

  async inferRelations(projectId: string, requirements: RequirementDTO[]): Promise<RelationInferenceResponse> {
    const data = await httpProxy.post<RelationInferenceResponse | ApiResponse<RelationInferenceResponse>>(
      endpoints.graph.inferRelations(projectId),
      requirements,
    )
    return unwrapData(data)
  },
}
