import { apiClient } from '../client'
import { endpoints } from '../endpoints'
import { unwrapData } from '../response'
import { adaptValidationRuleResponse, adaptValidationRuleResponses } from '../../adapters/validationRules.adapter'
import type { ApiResponse } from '../../types/api'
import type { ValidationRuleRequest, ValidationRuleResponse } from '../../types/validationRules'

export const validationRulesApi = {
  async listByProject(projectId: string): Promise<ValidationRuleResponse[]> {
    const { data } = await apiClient.get<ValidationRuleResponse[] | ApiResponse<ValidationRuleResponse[]>>(
      `${endpoints.validationRules.base}/project/${projectId}`,
    )
    return adaptValidationRuleResponses(unwrapData(data))
  },

  async create(payload: ValidationRuleRequest): Promise<ValidationRuleResponse> {
    const { data } = await apiClient.post<ValidationRuleResponse | ApiResponse<ValidationRuleResponse>>(
      endpoints.validationRules.base,
      payload,
    )
    return adaptValidationRuleResponse(unwrapData(data))
  },

  async update(id: string, payload: ValidationRuleRequest): Promise<ValidationRuleResponse> {
    const { data } = await apiClient.put<ValidationRuleResponse | ApiResponse<ValidationRuleResponse>>(
      `${endpoints.validationRules.base}/${id}`,
      payload,
    )
    return adaptValidationRuleResponse(unwrapData(data))
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`${endpoints.validationRules.base}/${id}`)
  },
}
