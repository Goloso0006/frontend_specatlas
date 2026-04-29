import { diagramsApi } from '../api/services/diagramsApi'
import type { DiagramResponse } from '../types/diagrams'

export class DiagramFacade {
  constructor(private api = diagramsApi) {}

  async generateClassDiagram(projectId: string): Promise<DiagramResponse> {
    const diagram = await this.api.createAuto(projectId)
    return diagram
  }

  async createManual(payload: Parameters<typeof diagramsApi.createManual>[0]) {
    return this.api.createManual(payload)
  }

  async exportPlantUml(diagramId: string) {
    return this.api.exportPlantUml(diagramId)
  }

  async exportText(diagramId: string) {
    return this.api.exportText(diagramId)
  }
}

export const diagramFacade = new DiagramFacade()
