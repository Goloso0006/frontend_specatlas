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
  RequirementMemoryResponse,
  RequirementDeleteImpactResponse,
  RequirementNode,
  SearchResponse,
  ValidationRule,
  EvaluationResponse,
  TraceabilityLink,
  TestCase,
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

  async improve(payload: RequirementDTO): Promise<RequirementDTO> {
    const data = await httpProxy.post<RequirementDTO | ApiResponse<RequirementDTO>>(
      endpoints.requirements.improve,
      payload,
    )
    return adaptRequirementDTO(unwrapData(data))
  },

  async getMemory(id: string): Promise<RequirementMemoryResponse> {
    const data = await httpProxy.get<RequirementMemoryResponse | ApiResponse<RequirementMemoryResponse>>(
      endpoints.requirements.memory(id),
    )
    return unwrapData(data)
  },

  async getDeleteImpact(id: string): Promise<RequirementDeleteImpactResponse> {
    const data = await httpProxy.get<RequirementDeleteImpactResponse | ApiResponse<RequirementDeleteImpactResponse>>(
      endpoints.requirements.deleteImpact(id),
    )
    return unwrapData(data)
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

  async delete(id: string): Promise<void> {
    await httpProxy.delete(endpoints.requirements.byId(id))
  },

  async getGraphImpact(requirementId: string): Promise<ImpactGraphResponse> {
    const data = await httpProxy.get<ImpactGraphResponse | ApiResponse<ImpactGraphResponse>>(
      endpoints.graph.impact(requirementId.trim()),
    )
    return unwrapData(data)
  },
}

export const validationRulesApi = {
  async listByProject(projectId: string): Promise<ValidationRule[]> {
    const data = await httpProxy.get<ValidationRule[] | ApiResponse<ValidationRule[]>>(
      endpoints.validationRules.byProject(projectId),
    )
    return unwrapData(data)
  },

  async create(payload: ValidationRule): Promise<ValidationRule> {
    const data = await httpProxy.post<ValidationRule | ApiResponse<ValidationRule>>(
      endpoints.validationRules.base,
      payload,
    )
    return unwrapData(data)
  },

  async update(id: string, payload: Partial<ValidationRule>): Promise<ValidationRule> {
    const data = await httpProxy.put<ValidationRule | ApiResponse<ValidationRule>>(
      `${endpoints.validationRules.base}/${id}`,
      payload,
    )
    return unwrapData(data)
  },

  async delete(id: string): Promise<void> {
    await httpProxy.delete(`${endpoints.validationRules.base}/${id}`)
  },

  async toggle(id: string): Promise<ValidationRule> {
    const data = await httpProxy.post<ValidationRule | ApiResponse<ValidationRule>>(
      endpoints.validationRules.toggle(id),
      {},
    )
    return unwrapData(data)
  },

  async evaluate(requirement: RequirementDTO, projectId: string): Promise<EvaluationResponse> {
    const data = await httpProxy.post<EvaluationResponse | ApiResponse<EvaluationResponse>>(
      endpoints.validationRules.evaluate,
      { requirement, projectId },
    )
    return unwrapData(data)
  },
}

export const traceabilityApi = {
  async getByRequirement(requirementId: string): Promise<TraceabilityLink[]> {
    const data = await httpProxy.get<TraceabilityLink[] | ApiResponse<TraceabilityLink[]>>(
      endpoints.traceability.byRequirement(requirementId),
    )
    return unwrapData(data)
  },

  async listByProject(projectId: string): Promise<TraceabilityLink[]> {
    const data = await httpProxy.get<TraceabilityLink[] | ApiResponse<TraceabilityLink[]>>(
      endpoints.traceability.byProject(projectId),
    )
    return unwrapData(data)
  },

  async create(payload: TraceabilityLink): Promise<TraceabilityLink> {
    const data = await httpProxy.post<TraceabilityLink | ApiResponse<TraceabilityLink>>(
      endpoints.traceability.base,
      payload,
    )
    return unwrapData(data)
  },

  async delete(id: string): Promise<void> {
    await httpProxy.delete(endpoints.traceability.byId(id))
  },
}

export const testCasesApi = {
  async listByProject(projectId: string): Promise<TestCase[]> {
    const data = await httpProxy.get<TestCase[] | ApiResponse<TestCase[]>>(
      endpoints.testCases.byProject(projectId),
    )
    return unwrapData(data)
  },

  async create(payload: TestCase): Promise<TestCase> {
    const data = await httpProxy.post<TestCase | ApiResponse<TestCase>>(
      endpoints.testCases.base,
      payload,
    )
    return unwrapData(data)
  },

  async update(id: string, payload: Partial<TestCase>): Promise<TestCase> {
    const data = await httpProxy.put<TestCase | ApiResponse<TestCase>>(
      endpoints.testCases.byId(id),
      payload,
    )
    return unwrapData(data)
  },

  async delete(id: string): Promise<void> {
    await httpProxy.delete(endpoints.testCases.byId(id))
  },
}

