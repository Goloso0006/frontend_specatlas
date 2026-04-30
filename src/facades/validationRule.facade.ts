import { validationRulesApi } from '../api/services/validationRulesApi'
import type { ValidationRuleRequest, ValidationRuleResponse } from '../types/validationRules'

export class ValidationRuleFacade {
  private readonly api: typeof validationRulesApi

  constructor(api = validationRulesApi) {
    this.api = api
  }

  async createRule(request: ValidationRuleRequest): Promise<ValidationRuleResponse> {
    return this.api.create({
      ...request,
      name: request.name.trim(),
      description: request.description.trim(),
      condition: request.condition.trim(),
    })
  }


  async getRulesByProject(projectId: string): Promise<ValidationRuleResponse[]> {
    return this.api.listByProject(projectId.trim())
  }

  async updateRule(id: string, request: ValidationRuleRequest): Promise<ValidationRuleResponse> {
    return this.api.update(id.trim(), {
      ...request,
      name: request.name.trim(),
      description: request.description.trim(),
      condition: request.condition.trim(),
    })
  }

  async deleteRule(id: string): Promise<void> {
    return this.api.remove(id.trim())
  }
}

export const validationRuleFacade = new ValidationRuleFacade()
