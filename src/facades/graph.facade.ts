import { apiClient } from '../api/client'

export class GraphFacade {
  constructor(private client = apiClient) {}

  async inferRelations(projectId: string): Promise<void> {
    await this.client.post(`/api/graph/infer-relations/${projectId}`)
  }
}

export const graphFacade = new GraphFacade()
