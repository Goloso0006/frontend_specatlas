import { requirementsApi } from '../api/services/requirementsApi'
import type { RequirementDTO } from '../types/requirements'

export class RequirementFacade {
  constructor(private api = requirementsApi) {}

  async createRequirementFromText(projectId: string, text: string) {
    const converted = await this.api.convert({ projectId, text })

    const duplicates = await this.api.checkDuplicates({
      projectId,
      title: converted.title,
      description: converted.description,
    })

    if (Array.isArray(duplicates) && duplicates.length > 0) {
      return {
        status: 'warning' as const,
        duplicates,
      }
    }

    const saved: RequirementDTO = await this.api.save(converted)
    return {
      status: 'success' as const,
      data: saved,
    }
  }

  async convert(projectId: string, text: string) {
    return this.api.convert({ projectId, text })
  }

  async save(requirement: RequirementDTO) {
    return this.api.save(requirement)
  }
}

export const requirementFacade = new RequirementFacade()
