import { httpProxy } from '../api/httpProxy'

export class GraphFacade {
  private readonly client: typeof httpProxy

  constructor(client = httpProxy) {
    this.client = client
  }

  async inferRelations(projectId: string): Promise<void> {
    await this.client.post(`/api/graph/infer-relations/${projectId}`)
  }
}

export const graphFacade = new GraphFacade()
