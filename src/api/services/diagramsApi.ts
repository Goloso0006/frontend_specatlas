import { endpoints } from '../endpoints'
import { unwrapData } from '../response'
import { httpProxy } from '../httpProxy'
import { adaptDiagramResponse, adaptDiagramResponseList } from '../../adapters/diagram.adapter'
import type { ApiResponse } from '../../types/api'
import type {
  DiagramRequest,
  DiagramResponse,
  DiagramSummaryResponse,
  UseCaseDiagramRequest,
} from '../../types/diagrams'

export const diagramsApi = {
  async createManual(payload: DiagramRequest): Promise<DiagramResponse> {
    const data = await httpProxy.post<DiagramResponse | ApiResponse<DiagramResponse>>(
      endpoints.diagrams.manual,
      payload,
    )
    return adaptDiagramResponse(unwrapData(data))
  },

  async createAuto(projectId: string): Promise<DiagramResponse> {
    const data = await httpProxy.post<DiagramResponse | ApiResponse<DiagramResponse>>(
      endpoints.diagrams.classAuto(projectId),
    )
    return adaptDiagramResponse(unwrapData(data))
  },

  async createUseCaseManual(payload: UseCaseDiagramRequest): Promise<DiagramResponse> {
    const data = await httpProxy.post<DiagramResponse | ApiResponse<DiagramResponse>>(
      endpoints.diagrams.useCaseManual,
      payload,
    )
    return adaptDiagramResponse(unwrapData(data))
  },

  async generateUseCaseAuto(projectId: string): Promise<DiagramResponse> {
    const data = await httpProxy.post<DiagramResponse | ApiResponse<DiagramResponse>>(
      endpoints.diagrams.useCaseAuto(projectId),
    )
    return adaptDiagramResponse(unwrapData(data))
  },

  async getById(diagramId: string): Promise<DiagramResponse> {
    const data = await httpProxy.get<DiagramResponse | ApiResponse<DiagramResponse>>(
      endpoints.diagrams.byId(diagramId),
    )
    return adaptDiagramResponse(unwrapData(data))
  },

  async listByProject(projectId: string): Promise<DiagramSummaryResponse[]> {
    const data = await httpProxy.get<DiagramSummaryResponse[] | ApiResponse<DiagramSummaryResponse[]>>(
      endpoints.diagrams.byProject(projectId),
    )
    return adaptDiagramResponseList(unwrapData(data))
  },

  async update(diagramId: string, payload: DiagramRequest): Promise<DiagramResponse> {
    const data = await httpProxy.put<DiagramResponse | ApiResponse<DiagramResponse>>(
      endpoints.diagrams.byId(diagramId),
      payload,
    )
    return adaptDiagramResponse(unwrapData(data))
  },

  async remove(diagramId: string): Promise<void> {
    await httpProxy.delete(endpoints.diagrams.byId(diagramId))
  },

  async generatePlantUml(diagramId: string): Promise<DiagramResponse> {
    const data = await httpProxy.post<DiagramResponse | ApiResponse<DiagramResponse>>(
      endpoints.diagrams.plantUml(diagramId),
    )
    return adaptDiagramResponse(unwrapData(data))
  },

  async exportPlantUml(diagramId: string): Promise<Blob> {
    const data = await httpProxy.get<Blob>(endpoints.diagrams.exportPlantUml(diagramId), {
      responseType: 'blob',
    })
    return data
  },

  async exportText(diagramId: string): Promise<Blob> {
    const data = await httpProxy.get<Blob>(endpoints.diagrams.exportText(diagramId), {
      responseType: 'blob',
    })
    return data
  },
}
