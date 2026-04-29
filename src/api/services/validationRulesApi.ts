import { endpoints } from '../endpoints'
import { unwrapData } from '../response'
import { httpProxy } from '../httpProxy'
import { adaptValidationRuleResponse, adaptValidationRuleResponses } from '../../adapters/validationRules.adapter'
import type { ApiResponse } from '../../types/api'
import type { ValidationRuleRequest, ValidationRuleResponse } from '../../types/validationRules'

export const validationRulesApi = {
  async listByProject(projectId: string): Promise<ValidationRuleResponse[]> {
    const data = await httpProxy.get<ValidationRuleResponse[] | ApiResponse<ValidationRuleResponse[]>>(
      `${endpoints.validationRules.base}/project/${projectId}`,
    )
    return adaptValidationRuleResponses(unwrapData(data))
  },

  async create(payload: ValidationRuleRequest): Promise<ValidationRuleResponse> {
    const data = await httpProxy.post<ValidationRuleResponse | ApiResponse<ValidationRuleResponse>>(
      endpoints.validationRules.base,
      payload,
    )
    return adaptValidationRuleResponse(unwrapData(data))
  },

  async update(id: string, payload: ValidationRuleRequest): Promise<ValidationRuleResponse> {
    const data = await httpProxy.put<ValidationRuleResponse | ApiResponse<ValidationRuleResponse>>(
      `${endpoints.validationRules.base}/${id}`,
      payload,
    )
    return adaptValidationRuleResponse(unwrapData(data))
  },

  async remove(id: string): Promise<void> {
    await httpProxy.delete(`${endpoints.validationRules.base}/${id}`)
  },
}
