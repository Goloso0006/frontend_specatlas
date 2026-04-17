import { apiClient } from '../client'
import { endpoints } from '../endpoints'
import { unwrapData } from '../response'
import type { ApiResponse } from '../../types/api'
import type {
  DiagramRequest,
  DiagramResponse,
  DiagramSummaryResponse,
} from '../../types/diagrams'

export const diagramsApi = {
  async createManual(payload: DiagramRequest): Promise<DiagramResponse> {
    const { data } = await apiClient.post<DiagramResponse | ApiResponse<DiagramResponse>>(
      `${endpoints.diagrams.base}/manual`,
      payload,
    )
    return unwrapData(data)
  },

  async createAuto(projectId: string): Promise<DiagramResponse> {
    const { data } = await apiClient.post<DiagramResponse | ApiResponse<DiagramResponse>>(
      `${endpoints.diagrams.base}/class/auto/${projectId}`,
    )
    return unwrapData(data)
  },

  async getById(diagramId: string): Promise<DiagramResponse> {
    const { data } = await apiClient.get<DiagramResponse | ApiResponse<DiagramResponse>>(
      `${endpoints.diagrams.base}/${diagramId}`,
    )
    return unwrapData(data)
  },

  async listByProject(projectId: string): Promise<DiagramSummaryResponse[]> {
    const { data } = await apiClient.get<DiagramSummaryResponse[] | ApiResponse<DiagramSummaryResponse[]>>(
      `${endpoints.diagrams.base}/project/${projectId}`,
    )
    return unwrapData(data)
  },

  async update(diagramId: string, payload: DiagramRequest): Promise<DiagramResponse> {
    const { data } = await apiClient.put<DiagramResponse | ApiResponse<DiagramResponse>>(
      `${endpoints.diagrams.base}/${diagramId}`,
      payload,
    )
    return unwrapData(data)
  },

  async remove(diagramId: string): Promise<void> {
    await apiClient.delete(`${endpoints.diagrams.base}/${diagramId}`)
  },

  async generatePlantUml(diagramId: string): Promise<DiagramResponse> {
    const { data } = await apiClient.post<DiagramResponse | ApiResponse<DiagramResponse>>(
      `${endpoints.diagrams.base}/${diagramId}/plantuml`,
    )
    return unwrapData(data)
  },

  async exportPlantUml(diagramId: string): Promise<Blob> {
    const { data } = await apiClient.get(`${endpoints.diagrams.base}/${diagramId}/export/puml`, {
      responseType: 'blob',
    })
    return data
  },

  async exportText(diagramId: string): Promise<Blob> {
    const { data } = await apiClient.get(`${endpoints.diagrams.base}/${diagramId}/export/txt`, {
      responseType: 'blob',
    })
    return data
  },
}
