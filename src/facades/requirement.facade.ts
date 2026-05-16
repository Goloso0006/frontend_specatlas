import { requirementsApi, validationRulesApi, traceabilityApi, testCasesApi } from '../api/services/requirementsApi'
import { adaptRequirementDTO } from '../adapters/requirements.adapter'
import type {
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
} from '../types/requirements'

import type { ImpactGraphResponse } from '../types/graph'

/**
 * Facade that encapsulates all requirement-related API operations.
 *
 * Components should interact with this facade instead of calling
 * `requirementsApi` directly. This provides:
 *  - A single entry point for all requirement operations
 *  - Orchestration of multi-step workflows (convert → check duplicates → save)
 *  - Consistent return types for the UI layer
 *  - Decoupling of components from the HTTP/adapter layer
 */
export class RequirementFacade {
  private readonly api: typeof requirementsApi

  constructor(api = requirementsApi) {
    this.api = api
  }

  // ── Single-step operations ──

  /**
   * Converts free-form text into a structured requirement DTO.
   * Does NOT persist anything — use `saveRequirement()` afterwards.
   */
  async convertTextToRequirement(projectId: string, text: string): Promise<RequirementDTO> {
    return this.api.convert({ projectId, text })
  }

  /**
   * Alias for convertTextToRequirement but specifically for improving a manual requirement row.
   */
  async convertManualRequirement(text: string, projectId: string): Promise<RequirementDTO> {
    return this.api.convert({ projectId, text })
  }

  /**
   * Converts free-form text into a batch of structured requirement DTOs.
   * Does NOT persist anything — use `saveRequirement()` afterwards.
   */
  async generateRequirementDraftsFromText(projectId: string, text: string, requirementType: 'FUNCTIONAL' | 'NON_FUNCTIONAL'): Promise<RequirementBatchResponse> {
    return this.api.convertBatch({ projectId, text, requirementType })
  }

  /**
   * Persists a requirement (create or update depending on backend logic).
   */
  async saveRequirement(dto: RequirementDTO): Promise<RequirementDTO> {
    return this.api.save({
      ...dto,
      projectId: dto.projectId.trim(),
      title: dto.title.trim(),
      description: dto.description.trim(),
    })
  }

  /**
   * Improves a requirement's content via AI.
   * Sends the current requirement state and returns the AI's improved proposal.
   * Does NOT persist automatically.
   */
  async improveRequirement(dto: RequirementDTO): Promise<RequirementDTO> {
    if (!dto.requirementType) {
      throw new Error('MISSING_REQUIREMENT_TYPE')
    }

    const response = await this.api.improve({
      projectId: dto.projectId.trim(),
      requirement: {
        ...dto,
        projectId: dto.projectId.trim(),
      }
    })

    const improved = response.improvedRequirement ?? response.improved
    if (!improved) {
      throw new Error('IA no devolvió una propuesta válida')
    }

    return adaptRequirementDTO(improved)
  }

  /**
   * Retrieves the intelligent memory for a specific requirement.
   */
  async getRequirementMemory(requirementId: string): Promise<RequirementMemoryResponse> {
    return this.api.getMemory(requirementId)
  }

  /**
   * Retrieves the impact of deleting a requirement.
   */
  async getRequirementDeleteImpact(requirementId: string): Promise<RequirementDeleteImpactResponse> {
    return this.api.getDeleteImpact(requirementId)
  }

  /**
   * Retrieves all requirements for a given project, optionally filtered by type or category.
   */
  async getRequirementsByProject(projectId: string, requirementType?: string, category?: string): Promise<RequirementDTO[]> {
    return this.api.getByProject(projectId.trim(), requirementType, category)
  }

  /**
   * Searches requirements by a free-text query (semantic search).
   */
  async searchRequirements(query: string): Promise<SearchResponse[]> {
    const normalizedQuery = query.trim()
    if (!normalizedQuery) {
      return []
    }
    return this.api.search(normalizedQuery)
  }

  /**
   * Checks if a requirement has potential semantic duplicates in a project.
   */
  async checkDuplicates(request: DuplicateCheckRequest): Promise<DuplicateMatchResponse[]> {
    return this.api.checkDuplicates({
      projectId: request.projectId.trim(),
      title: request.title.trim(),
      description: request.description.trim(),
    })
  }

  /**
   * Returns nodes impacted by a given requirement.
   */
  async getImpact(requirementId: string): Promise<RequirementNode[]> {
    return this.api.getImpact(requirementId.trim())
  }

  /**
   * Returns conflicting requirements for a given requirement.
   */
  async getConflicts(requirementId: string): Promise<RequirementNode[]> {
    return this.api.getConflicts(requirementId.trim())
  }

  /**
   * Creates a dependency relationship between two requirements.
   */
  async createDependency(fromId: string, toId: string): Promise<void> {
    return this.api.createDependency(fromId.trim(), toId.trim())
  }

  /**
   * Permanently deletes a requirement by its ID.
   */
  async deleteRequirement(requirementId: string): Promise<void> {
    return this.api.delete(requirementId.trim())
  }
  
  /**
   * Retrieves the full impact graph (nodes and edges) for a requirement.
   */
  async getGraphImpact(requirementId: string): Promise<ImpactGraphResponse> {
    return this.api.getGraphImpact(requirementId)
  }

  // ── Validation Rules ───────────────────────────────────────────────────

  async listValidationRules(projectId: string): Promise<ValidationRule[]> {
    return validationRulesApi.listByProject(projectId)
  }

  async createValidationRule(payload: ValidationRule): Promise<ValidationRule> {
    return validationRulesApi.create(payload)
  }

  async updateValidationRule(id: string, payload: Partial<ValidationRule>): Promise<ValidationRule> {
    return validationRulesApi.update(id, payload)
  }

  async deleteValidationRule(id: string): Promise<void> {
    return validationRulesApi.delete(id)
  }

  async toggleValidationRule(id: string): Promise<ValidationRule> {
    return validationRulesApi.toggle(id)
  }

  async evaluateRequirementAgainstRules(requirement: RequirementDTO, projectId: string): Promise<EvaluationResponse> {
    return validationRulesApi.evaluate(requirement, projectId)
  }

  // ── Traceability ─────────────────────────────────────────────────────

  async getRequirementTraceability(requirementId: string): Promise<TraceabilityLink[]> {
    return traceabilityApi.getByRequirement(requirementId)
  }

  async listProjectTraceabilityLinks(projectId: string): Promise<TraceabilityLink[]> {
    return traceabilityApi.listByProject(projectId)
  }

  async createTraceabilityLink(payload: TraceabilityLink): Promise<TraceabilityLink> {
    return traceabilityApi.create(payload)
  }

  async deleteTraceabilityLink(linkId: string): Promise<void> {
    return traceabilityApi.delete(linkId)
  }

  // ── Test Cases ───────────────────────────────────────────────────────

  async listTestCases(projectId: string): Promise<TestCase[]> {
    return testCasesApi.listByProject(projectId)
  }

  async createTestCase(payload: TestCase): Promise<TestCase> {
    return testCasesApi.create(payload)
  }

  async updateTestCase(id: string, payload: Partial<TestCase>): Promise<TestCase> {
    return testCasesApi.update(id, payload)
  }

  async deleteTestCase(id: string): Promise<void> {
    return testCasesApi.delete(id)
  }

  // ── Orchestrated workflows ──

  /**
   * Full workflow: convert text → check duplicates → save if no duplicates.
   *
   * Returns a discriminated union:
   * - `{ status: 'success', data: RequirementDTO }` if saved successfully
   * - `{ status: 'duplicates_found', duplicates: DuplicateMatchResponse[] }` if duplicates exist
   */
  async createRequirementFromText(
    projectId: string,
    text: string,
  ): Promise<CreateRequirementResult> {
    const converted = await this.api.convert({ projectId, text })

    const duplicates = await this.api.checkDuplicates({
      projectId,
      title: converted.title,
      description: converted.description,
    })

    if (Array.isArray(duplicates) && duplicates.length > 0) {
      return { status: 'duplicates_found', duplicates }
    }

    const saved = await this.api.save(converted)
    return { status: 'success', data: saved }
  }
}

// ── Result types ──

export type CreateRequirementResult =
  | { status: 'success'; data: RequirementDTO }
  | { status: 'duplicates_found'; duplicates: DuplicateMatchResponse[] }

// ── Singleton instance ──

export const requirementFacade = new RequirementFacade()
