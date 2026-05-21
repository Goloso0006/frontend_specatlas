import { endpoints } from '../endpoints'
import { unwrapData } from '../response'
import { httpProxy } from '../httpProxy'
import { adaptProjectResponse, adaptProjectResponses } from '../../adapters/projects.adapter'
import type { ApiResponse } from '../../types/api'
import type { ProjectRequest, ProjectResponse, ProjectReport } from '../../types/projects'

export const projectsApi = {
  async create(payload: ProjectRequest): Promise<ProjectResponse> {
    const data = await httpProxy.post<ProjectResponse | ApiResponse<ProjectResponse>>(
      endpoints.projects.base,
      payload,
    )
    return adaptProjectResponse(unwrapData(data))
  },

  async getById(id: string): Promise<ProjectResponse> {
    const data = await httpProxy.get<ProjectResponse | ApiResponse<ProjectResponse>>(
      endpoints.projects.byId(id),
    )
    return adaptProjectResponse(unwrapData(data))
  },

  async listByUser(ownerId: string): Promise<ProjectResponse[]> {
    const data = await httpProxy.get<ProjectResponse[] | ApiResponse<ProjectResponse[]>>(
      endpoints.projects.byUser(ownerId),
    )
    return adaptProjectResponses(unwrapData(data))
  },

  async update(id: string, payload: ProjectRequest): Promise<ProjectResponse> {
    const data = await httpProxy.put<ProjectResponse | ApiResponse<ProjectResponse>>(
      endpoints.projects.byId(id),
      payload,
    )
    return adaptProjectResponse(unwrapData(data))
  },

  async remove(id: string): Promise<void> {
    await httpProxy.delete(endpoints.projects.byId(id))
  },

  async getReports(projectId: string): Promise<ProjectReport[]> {
    const data = await httpProxy.get<ProjectReport[] | ApiResponse<ProjectReport[]>>(
      `/api/projects/${projectId}/reports`
    )
    return unwrapData(data)
  },

  async getReportById(projectId: string, reportId: string): Promise<ProjectReport> {
    const data = await httpProxy.get<ProjectReport | ApiResponse<ProjectReport>>(
      `/api/projects/${projectId}/reports/${reportId}`
    )
    return unwrapData(data)
  },

  async createReport(projectId: string, payload: Partial<ProjectReport>): Promise<ProjectReport> {
    const data = await httpProxy.post<ProjectReport | ApiResponse<ProjectReport>>(
      `/api/projects/${projectId}/reports`,
      payload
    )
    return unwrapData(data)
  },

  async updateReport(projectId: string, reportId: string, payload: Partial<ProjectReport>): Promise<ProjectReport> {
    const data = await httpProxy.put<ProjectReport | ApiResponse<ProjectReport>>(
      `/api/projects/${projectId}/reports/${reportId}`,
      payload
    )
    return unwrapData(data)
  },

  async deleteReport(projectId: string, reportId: string): Promise<void> {
    await httpProxy.delete(`/api/projects/${projectId}/reports/${reportId}`)
  },
}
