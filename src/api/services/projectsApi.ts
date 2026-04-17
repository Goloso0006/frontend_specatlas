import { apiClient } from '../client'
import { endpoints } from '../endpoints'
import { unwrapData } from '../response'
import type { ApiResponse } from '../../types/api'
import type { ProjectRequest, ProjectResponse } from '../../types/projects'

export const projectsApi = {
  async create(payload: ProjectRequest): Promise<ProjectResponse> {
    const { data } = await apiClient.post<ProjectResponse | ApiResponse<ProjectResponse>>(
      endpoints.projects.base,
      payload,
    )
    return unwrapData(data)
  },

  async getById(id: string): Promise<ProjectResponse> {
    const { data } = await apiClient.get<ProjectResponse | ApiResponse<ProjectResponse>>(
      endpoints.projects.byId(id),
    )
    return unwrapData(data)
  },

  async listByUser(ownerId: string): Promise<ProjectResponse[]> {
    const { data } = await apiClient.get<ProjectResponse[] | ApiResponse<ProjectResponse[]>>(
      endpoints.projects.byUser(ownerId),
    )
    return unwrapData(data)
  },

  async update(id: string, payload: ProjectRequest): Promise<ProjectResponse> {
    const { data } = await apiClient.put<ProjectResponse | ApiResponse<ProjectResponse>>(
      endpoints.projects.byId(id),
      payload,
    )
    return unwrapData(data)
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(endpoints.projects.byId(id))
  },
}
