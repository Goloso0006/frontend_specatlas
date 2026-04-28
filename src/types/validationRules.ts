export type ValidationRuleSeverity = 'INFO' | 'WARN' | 'ERROR'

export interface ValidationRuleRequest {
  projectId: string
  name: string
  description: string
  ruleType: string
  condition: string
  severity: ValidationRuleSeverity
  enabled: boolean
}

export interface ValidationRuleResponse extends ValidationRuleRequest {
  id: string
  createdAt?: string
  updatedAt?: string
}
