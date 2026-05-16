export interface ConvertRequest {
  text: string
  projectId: string
}

export interface ConvertBatchRequest {
  text: string
  projectId: string
  requirementType: 'FUNCTIONAL' | 'NON_FUNCTIONAL'
}

export interface RequirementBatchResponse {
  requirements: RequirementDTO[]
  warnings: string[]
  sourceSummary: string
}

export interface NonFunctionalDetailDTO {
  category: string
  metricName: string
  operator: string
  targetValue: string
  unit: string
  verificationMethod: string
  context?: string
  rationale?: string
}

export interface RequirementDTO {
  id: string
  code: string
  title: string
  description: string
  actors: string[]
  acceptanceCriteria: string[]
  isoClassification: string
  projectId: string
  relatedCodes: string[]
  requirementType?: 'FUNCTIONAL' | 'NON_FUNCTIONAL'
  nonFunctionalDetail?: NonFunctionalDetailDTO | null
}

export interface SearchResponse {
  id: string
  code: string
  title: string
  description: string
  similarity?: number
}

export interface RequirementNode {
  id: string
  code: string
  title: string
  description: string
}

export interface DuplicateCheckRequest {
  projectId: string
  title: string
  description: string
}

export interface DuplicateMatchResponse {
  requirementId: string
  code: string
  title: string
  description?: string
  requirementType?: 'FUNCTIONAL' | 'NON_FUNCTIONAL'
  similarity: number
  similarityPercentage?: number
  level?: 'DUPLICATE' | 'VERY_SIMILAR' | 'RELATED' | 'LOW'
  explanation?: string
  recommendation?: string
}

export interface SemanticMemorySection {
  similarRequirements: DuplicateMatchResponse[]
  warnings: string[]
}

export interface StructuralRelation {
  sourceCode: string
  relationType: string
  targetCode: string
  targetTitle?: string
}

export interface StructuralMemorySection {
  outgoingRelations: StructuralRelation[]
  incomingRelations: StructuralRelation[]
  dependencies: StructuralRelation[]
  conflicts: StructuralRelation[]
  impactedRequirements: StructuralRelation[]
  warnings: string[]
}

export interface ValidationRuleDTO {
  id: string
  title: string
  description: string
  severity: RuleSeverity
  active: boolean
}

export type RuleType = 
  | 'AMBIGUOUS_TERMS' 
  | 'RNF_REQUIRES_METRIC' 
  | 'RNF_REQUIRES_VERIFICATION_METHOD' 
  | 'RF_REQUIRES_ACTOR' 
  | 'ACCEPTANCE_CRITERIA_BDD' 
  | 'NO_RF_RNF_MIX' 
  | 'TITLE_REQUIRED' 
  | 'DESCRIPTION_REQUIRED'

export type RuleTarget = 'FUNCTIONAL' | 'NON_FUNCTIONAL' | 'BOTH'
export type RuleSeverity = 'INFO' | 'WARNING' | 'ERROR'

export interface ValidationRule {
  id?: string
  projectId: string
  name: string
  description: string
  type: RuleType
  target: RuleTarget
  severity: RuleSeverity
  active: boolean
  config?: string
}

export interface RuleViolation {
  ruleId: string
  ruleName: string
  message: string
  severity: RuleSeverity
}

export interface EvaluationResponse {
  requirementId?: string
  violations: RuleViolation[]
  passed: boolean
}

export interface ProceduralMemorySection {
  activeRules: ValidationRuleDTO[]
  violations: RuleViolation[]
  warnings: string[]
}

export type TraceabilityTargetType = 'TEST_CASE' | 'DIAGRAM' | 'CLASS' | 'COMPONENT' | 'MODULE' | 'ARCHITECTURE_ELEMENT'
export type TraceabilityRelationType = 'VALIDATED_BY' | 'REPRESENTED_IN' | 'IMPLEMENTED_BY' | 'DEPENDS_ON' | 'IMPACTS' | 'REFINES' | 'RELATED_TO'

export interface TraceabilityLink {
  id?: string
  projectId: string
  requirementId: string
  targetType: TraceabilityTargetType
  relationType: TraceabilityRelationType
  targetId: string
  targetName: string
  description?: string
  createdAt?: string
}

export interface TestCase {
  id?: string
  projectId: string
  code: string
  title: string
  description: string
  expectedResult: string
  createdAt?: string
  updatedAt?: string
}

export interface TraceabilitySection {
  relatedCodes: string[]
  relatedDiagrams: Array<{ id: string; name: string; type: string }>
  relatedTestCases: Array<{ id: string; code: string; title: string }>
  relatedArchitecture: Array<{ name: string; type: string; relation: string }>
  links: TraceabilityLink[]
  warnings: string[]
}

export interface RequirementMemoryResponse {
  requirementId: string
  code: string
  title: string
  semantic: SemanticMemorySection
  structural: StructuralMemorySection
  procedural: ProceduralMemorySection
  traceability: TraceabilitySection
}

export type RiskLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH'

export interface DeleteImpactRelation {
  sourceCode: string
  relationType: string
  targetCode: string
  targetTitle?: string
}

export interface DeleteImpactDiagram {
  id: string
  name: string
  type: string
}

export interface RequirementDeleteImpactResponse {
  requirementId: string
  code: string
  title: string
  requirementType: 'FUNCTIONAL' | 'NON_FUNCTIONAL'
  riskLevel: RiskLevel
  summary: string
  incomingRelations: DeleteImpactRelation[]
  outgoingRelations: DeleteImpactRelation[]
  dependentRequirements: DeleteImpactRelation[]
  impactedRequirements: DeleteImpactRelation[]
  conflicts: DeleteImpactRelation[]
  relatedDiagrams: DeleteImpactDiagram[]
  relatedTestCases: Array<{ id: string; code: string; title: string }>
  relatedArchitecture: Array<{ name: string; type: string; relation: string }>
  relatedCodes: string[]
  warnings: string[]
}
