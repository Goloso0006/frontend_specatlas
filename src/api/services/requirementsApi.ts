import { endpoints } from '../endpoints'
import { unwrapData } from '../response'
import { httpProxy } from '../httpProxy'
import {
  adaptDuplicateMatchResponseList,
  adaptRequirementDTO,
  adaptRequirementNodeList,
  adaptSearchResponseList,
} from '../../adapters/requirements.adapter'
import type { ApiResponse } from '../../types/api'
import type {
  ConvertRequest,
  ConvertBatchRequest,
  DuplicateCheckRequest,
  DuplicateMatchResponse,
  RequirementBatchResponse,
  RequirementDTO,
  RequirementNode,
  SearchResponse,
} from '../../types/requirements'
import type { ImpactGraphResponse } from '../../types/graph'

export const requirementsApi = {
  async convert(payload: ConvertRequest): Promise<RequirementDTO> {
    const data = await httpProxy.post<RequirementDTO | ApiResponse<RequirementDTO>>(
      endpoints.requirements.convert,
      payload,
    )
    return adaptRequirementDTO(unwrapData(data))
  },

  async convertBatch(payload: ConvertBatchRequest): Promise<RequirementBatchResponse> {
    const data = await httpProxy.post<RequirementBatchResponse | ApiResponse<RequirementBatchResponse>>(
      endpoints.requirements.convertBatch,
      payload,
    )
    
    // We unwrap the data. Since we might need to adapt the DTOs inside, let's do it safely
    const unwrapped = unwrapData(data)
    return {
      requirements: Array.isArray(unwrapped.requirements) 
        ? unwrapped.requirements.map(adaptRequirementDTO) 
        : [],
      warnings: unwrapped.warnings || [],
      sourceSummary: unwrapped.sourceSummary || ''
    }
  },

  async save(payload: RequirementDTO): Promise<RequirementDTO> {
    const data = await httpProxy.post<RequirementDTO | ApiResponse<RequirementDTO>>(
      endpoints.requirements.save,
      payload,
    )
    return adaptRequirementDTO(unwrapData(data))
  },

  async getByProject(projectId: string, requirementType?: string, category?: string): Promise<RequirementDTO[]> {
    const data = await httpProxy.get<RequirementDTO[] | ApiResponse<RequirementDTO[]>>(
      endpoints.requirements.byProject(projectId),
      {
        params: { requirementType, category },
      }
    )
    const arrayData = unwrapData(data)
    return Array.isArray(arrayData) ? arrayData.map(adaptRequirementDTO) : []
  },

  async search(query: string): Promise<SearchResponse[]> {
    const data = await httpProxy.get<SearchResponse[] | ApiResponse<SearchResponse[]>>(
      endpoints.requirements.search,
      {
      params: { query },
      },
    )
    return adaptSearchResponseList(unwrapData(data))
  },

  async checkDuplicates(payload: DuplicateCheckRequest): Promise<DuplicateMatchResponse[]> {
    const data = await httpProxy.post<
      DuplicateMatchResponse[] | ApiResponse<DuplicateMatchResponse[]>
    >(
      endpoints.requirements.duplicates,
      payload,
    )
    return adaptDuplicateMatchResponseList(unwrapData(data))
  },

  async getImpact(requirementId: string): Promise<RequirementNode[]> {
    const data = await httpProxy.get<RequirementNode[] | ApiResponse<RequirementNode[]>>(
      endpoints.requirements.impact(requirementId),
    )
    return adaptRequirementNodeList(unwrapData(data))
  },

  async createDependency(fromId: string, toId: string): Promise<void> {
    await httpProxy.post(endpoints.requirements.dependency, null, {
      params: { fromId, toId },
    })
  },

  async getConflicts(requirementId: string): Promise<RequirementNode[]> {
    const data = await httpProxy.get<RequirementNode[] | ApiResponse<RequirementNode[]>>(
      endpoints.requirements.conflicts(requirementId),
    )
    return adaptRequirementNodeList(unwrapData(data))
  },

  async deleteById(requirementId: string): Promise<void> {
    await httpProxy.delete(endpoints.requirements.byId(requirementId))
  },

  async getGraphImpact(requirementId: string): Promise<ImpactGraphResponse> {
    const data = await httpProxy.get<ImpactGraphResponse | ApiResponse<ImpactGraphResponse>>(
      endpoints.graph.impact(requirementId.trim()),
    )
    return unwrapData(data)
  },
}
