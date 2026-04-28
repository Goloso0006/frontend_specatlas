import type { ValidationRuleRequest, ValidationRuleResponse, ValidationRuleSeverity } from '../types/validationRules'
import { normalizeBoolean, normalizeOptionalString, normalizeString } from './common'

const VALID_SEVERITIES = new Set<ValidationRuleSeverity>(['INFO', 'WARN', 'ERROR'])

function normalizeSeverity(value: unknown): ValidationRuleSeverity {
  if (typeof value === 'string' && VALID_SEVERITIES.has(value as ValidationRuleSeverity)) {
    return value as ValidationRuleSeverity
  }

  return 'WARN'
}

export function adaptValidationRuleResponse(
  response: Partial<ValidationRuleResponse> | null | undefined,
): ValidationRuleResponse {
  return {
    id: normalizeString(response?.id),
    projectId: normalizeString(response?.projectId),
    name: normalizeString(response?.name),
    description: normalizeString(response?.description),
    ruleType: normalizeString(response?.ruleType),
    condition: normalizeString(response?.condition),
    severity: normalizeSeverity(response?.severity),
    enabled: normalizeBoolean(response?.enabled, true),
    createdAt: normalizeOptionalString(response?.createdAt),
    updatedAt: normalizeOptionalString(response?.updatedAt),
  }
}

export function adaptValidationRuleResponses(
  response: Array<Partial<ValidationRuleResponse>> | null | undefined,
): ValidationRuleResponse[] {
  if (!Array.isArray(response)) {
    return []
  }

  return response.map(adaptValidationRuleResponse)
}

export function adaptValidationRuleRequest(response: ValidationRuleRequest): ValidationRuleRequest {
  return {
    projectId: normalizeString(response.projectId),
    name: normalizeString(response.name),
    description: normalizeString(response.description),
    ruleType: normalizeString(response.ruleType),
    condition: normalizeString(response.condition),
    severity: normalizeSeverity(response.severity),
    enabled: normalizeBoolean(response.enabled, true),
  }
}
