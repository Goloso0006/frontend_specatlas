import { requirementsApi } from '../api/services/requirementsApi'
import type {
  DuplicateCheckRequest,
  DuplicateMatchResponse,
  RequirementDTO,
  RequirementNode,
  SearchResponse,
} from '../types/requirements'

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
   * Searches requirements by a free-text query (semantic search).
   */
  async searchRequirements(query: string): Promise<SearchResponse[]> {
    return this.api.search(query.trim())
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
