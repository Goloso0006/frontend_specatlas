import { endpoints } from '../endpoints'
import { unwrapData } from '../response'
import { httpProxy } from '../httpProxy'
import type { ApiResponse } from '../../types/api'
import type { RequirementQualityAnalysisDTO } from '../../types/requirements'

export const qualityAnalysisApi = {
  async getProjectQualityAnalyses(projectId: string): Promise<RequirementQualityAnalysisDTO[]> {
    const data = await httpProxy.get<RequirementQualityAnalysisDTO[] | ApiResponse<RequirementQualityAnalysisDTO[]>>(
      endpoints.requirements.projectQuality(projectId)
    )
    const unwrapped = unwrapData(data)
    return Array.isArray(unwrapped) ? unwrapped : []
  },

  async getRequirementQualityAnalysis(requirementId: string): Promise<RequirementQualityAnalysisDTO | null> {
    try {
      const data = await httpProxy.get<RequirementQualityAnalysisDTO | ApiResponse<RequirementQualityAnalysisDTO>>(
        endpoints.requirements.quality(requirementId)
      )
      return unwrapData(data)
    } catch {
      return null
    }
  },

  async reanalyzeRequirement(requirementId: string): Promise<RequirementQualityAnalysisDTO> {
    const data = await httpProxy.post<RequirementQualityAnalysisDTO | ApiResponse<RequirementQualityAnalysisDTO>>(
      endpoints.requirements.reanalyze(requirementId),
      {}
    )
    return unwrapData(data)
  }
}
