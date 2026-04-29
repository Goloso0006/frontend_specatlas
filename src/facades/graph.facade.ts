import { httpProxy } from '../api/httpProxy'

export class GraphFacade {
  constructor(private client = httpProxy) {}

  async inferRelations(projectId: string): Promise<void> {
    await this.client.post(`/api/graph/infer-relations/${projectId}`)
  }
}

export const graphFacade = new GraphFacade()
