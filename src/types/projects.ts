export type ProjectStatus = 'ACTIVE' | 'ARCHIVED' | 'DRAFT'

export interface ProjectRequest {
  name: string
  description: string
  ownerId: string
  status: ProjectStatus
}

export interface ProjectResponse {
  id: string
  name: string
  description: string
  ownerId: string
  status: ProjectStatus
  createdAt: string
  updatedAt: string
}

export interface ProjectReport {
  id: string
  projectId: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
}
