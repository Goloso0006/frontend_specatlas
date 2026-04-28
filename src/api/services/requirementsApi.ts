import { apiClient } from '../client'
import { endpoints } from '../endpoints'
import { unwrapData } from '../response'
import {
  adaptDuplicateMatchResponseList,
  adaptRequirementDTO,
  adaptRequirementNodeList,
  adaptSearchResponseList,
} from '../../adapters/requirements.adapter'
import type { ApiResponse } from '../../types/api'
import type {
  ConvertRequest,
  DuplicateCheckRequest,
  DuplicateMatchResponse,
  RequirementDTO,
  RequirementNode,
  SearchResponse,
} from '../../types/requirements'

export const requirementsApi = {
  async convert(payload: ConvertRequest): Promise<RequirementDTO> {
    const { data } = await apiClient.post<RequirementDTO | ApiResponse<RequirementDTO>>(
      endpoints.requirements.convert,
      payload,
    )
    return adaptRequirementDTO(unwrapData(data))
  },

  async save(payload: RequirementDTO): Promise<RequirementDTO> {
    const { data } = await apiClient.post<RequirementDTO | ApiResponse<RequirementDTO>>(
      endpoints.requirements.save,
      payload,
    )
    return adaptRequirementDTO(unwrapData(data))
  },

  async search(query: string): Promise<SearchResponse[]> {
    const { data } = await apiClient.get<SearchResponse[] | ApiResponse<SearchResponse[]>>(
      endpoints.requirements.search,
      {
      params: { query },
      },
    )
    return adaptSearchResponseList(unwrapData(data))
  },

  async checkDuplicates(payload: DuplicateCheckRequest): Promise<DuplicateMatchResponse[]> {
    const { data } = await apiClient.post<
      DuplicateMatchResponse[] | ApiResponse<DuplicateMatchResponse[]>
    >(
      endpoints.requirements.duplicates,
      payload,
    )
    return adaptDuplicateMatchResponseList(unwrapData(data))
  },

  async getImpact(requirementId: string): Promise<RequirementNode[]> {
    const { data } = await apiClient.get<RequirementNode[] | ApiResponse<RequirementNode[]>>(
      endpoints.requirements.impact(requirementId),
    )
    return adaptRequirementNodeList(unwrapData(data))
  },

  async createDependency(fromId: string, toId: string): Promise<void> {
    await apiClient.post(endpoints.requirements.dependency, null, {
      params: { fromId, toId },
    })
  },

  async getConflicts(requirementId: string): Promise<RequirementNode[]> {
    const { data } = await apiClient.get<RequirementNode[] | ApiResponse<RequirementNode[]>>(
      endpoints.requirements.conflicts(requirementId),
    )
    return adaptRequirementNodeList(unwrapData(data))
  },
}
