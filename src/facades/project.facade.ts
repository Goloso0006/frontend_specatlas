import { projectsApi } from '../api/services/projectsApi'
import type { ProjectRequest, ProjectResponse } from '../types/projects'

export class ProjectFacade {
  private readonly api: typeof projectsApi

  constructor(api = projectsApi) {
    this.api = api
  }

  async createProject(request: ProjectRequest): Promise<ProjectResponse> {
    return this.api.create({
      ...request,
      name: request.name.trim(),
      description: request.description.trim(),
    })
  }

  async getProject(id: string): Promise<ProjectResponse> {
    return this.api.getById(id.trim())
  }

  async getProjectsByUser(ownerId: string): Promise<ProjectResponse[]> {
    return this.api.listByUser(ownerId.trim())
  }

  async updateProject(id: string, request: ProjectRequest): Promise<ProjectResponse> {
    return this.api.update(id.trim(), {
      ...request,
      name: request.name.trim(),
      description: request.description.trim(),
    })
  }

  async deleteProject(id: string): Promise<void> {
    return this.api.remove(id.trim())
  }
}

export const projectFacade = new ProjectFacade()
