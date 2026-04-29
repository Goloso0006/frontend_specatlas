import { endpoints } from '../endpoints'
import { unwrapData } from '../response'
import { httpProxy } from '../httpProxy'
import { adaptDiagramResponse, adaptDiagramResponseList } from '../../adapters/diagram.adapter'
import type { ApiResponse } from '../../types/api'
import type {
  DiagramRequest,
  DiagramResponse,
  DiagramSummaryResponse,
} from '../../types/diagrams'

export const diagramsApi = {
  async createManual(payload: DiagramRequest): Promise<DiagramResponse> {
    const data = await httpProxy.post<DiagramResponse | ApiResponse<DiagramResponse>>(
      `${endpoints.diagrams.base}/manual`,
      payload,
    )
    return adaptDiagramResponse(unwrapData(data))
  },

  async createAuto(projectId: string): Promise<DiagramResponse> {
    const data = await httpProxy.post<DiagramResponse | ApiResponse<DiagramResponse>>(
      `${endpoints.diagrams.base}/class/auto/${projectId}`,
    )
    return adaptDiagramResponse(unwrapData(data))
  },

  async getById(diagramId: string): Promise<DiagramResponse> {
    const data = await httpProxy.get<DiagramResponse | ApiResponse<DiagramResponse>>(
      `${endpoints.diagrams.base}/${diagramId}`,
    )
    return adaptDiagramResponse(unwrapData(data))
  },

  async listByProject(projectId: string): Promise<DiagramSummaryResponse[]> {
    const data = await httpProxy.get<DiagramSummaryResponse[] | ApiResponse<DiagramSummaryResponse[]>>(
      `${endpoints.diagrams.base}/project/${projectId}`,
    )
    return adaptDiagramResponseList(unwrapData(data))
  },

  async update(diagramId: string, payload: DiagramRequest): Promise<DiagramResponse> {
    const data = await httpProxy.put<DiagramResponse | ApiResponse<DiagramResponse>>(
      `${endpoints.diagrams.base}/${diagramId}`,
      payload,
    )
    return adaptDiagramResponse(unwrapData(data))
  },

  async remove(diagramId: string): Promise<void> {
    await httpProxy.delete(`${endpoints.diagrams.base}/${diagramId}`)
  },

  async generatePlantUml(diagramId: string): Promise<DiagramResponse> {
    const data = await httpProxy.post<DiagramResponse | ApiResponse<DiagramResponse>>(
      `${endpoints.diagrams.base}/${diagramId}/plantuml`,
    )
    return adaptDiagramResponse(unwrapData(data))
  },

  async exportPlantUml(diagramId: string): Promise<Blob> {
    const data = await httpProxy.get(`${endpoints.diagrams.base}/${diagramId}/export/puml`, {
      responseType: 'blob',
    })
    return data
  },

  async exportText(diagramId: string): Promise<Blob> {
    const data = await httpProxy.get(`${endpoints.diagrams.base}/${diagramId}/export/txt`, {
      responseType: 'blob',
    })
    return data
  },
}
