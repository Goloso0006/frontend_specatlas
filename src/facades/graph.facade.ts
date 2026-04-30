import { graphApi } from '../api/services/graphApi.ts'
import type { RequirementDTO } from '../types/requirements'

export class GraphFacade {
  private readonly api: typeof graphApi

  constructor(api = graphApi) {
    this.api = api
  }

  async getImpact(id: string) {
    return this.api.getImpact(id)
  }

  async inferRelations(projectId: string, requirements: RequirementDTO[]) {
    return this.api.inferRelations(projectId, requirements)
  }
}

export const graphFacade = new GraphFacade()
