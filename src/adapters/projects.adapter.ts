import type { ProjectResponse, ProjectStatus } from '../types/projects'
import { normalizeOptionalString, normalizeString } from './common'

const VALID_STATUSES = new Set<ProjectStatus>(['ACTIVE', 'ARCHIVED', 'DRAFT'])

function normalizeStatus(value: unknown): ProjectStatus {
  if (typeof value === 'string' && VALID_STATUSES.has(value as ProjectStatus)) {
    return value as ProjectStatus
  }

  return 'DRAFT'
}

export function adaptProjectResponse(response: Partial<ProjectResponse> | null | undefined): ProjectResponse {
  return {
    id: normalizeString(response?.id),
    name: normalizeString(response?.name),
    description: normalizeString(response?.description),
    ownerId: normalizeString(response?.ownerId),
    status: normalizeStatus(response?.status),
    createdAt: normalizeOptionalString(response?.createdAt) ?? '',
    updatedAt: normalizeOptionalString(response?.updatedAt) ?? '',
  }
}

export function adaptProjectResponses(response: Array<Partial<ProjectResponse>> | null | undefined): ProjectResponse[] {
  if (!Array.isArray(response)) {
    return []
  }

  return response.map(adaptProjectResponse)
}
