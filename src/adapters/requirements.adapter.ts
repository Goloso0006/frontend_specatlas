import type {
  DuplicateMatchResponse,
  RequirementDTO,
  RequirementNode,
  SearchResponse,
} from '../types/requirements'
import { normalizeNumber, normalizeString, normalizeStringArray } from './common'

export function adaptRequirementDTO(response: Partial<RequirementDTO> | null | undefined): RequirementDTO {
  return {
    id: normalizeString(response?.id),
    code: normalizeString(response?.code),
    title: normalizeString(response?.title),
    description: normalizeString(response?.description),
    actors: normalizeStringArray(response?.actors),
    acceptanceCriteria: normalizeStringArray(response?.acceptanceCriteria),
    isoClassification: normalizeString(response?.isoClassification),
    projectId: normalizeString(response?.projectId),
    relatedCodes: normalizeStringArray(response?.relatedCodes),
  }
}

export function adaptSearchResponse(response: Partial<SearchResponse> | null | undefined): SearchResponse {
  return {
    id: normalizeString(response?.id),
    code: normalizeString(response?.code),
    title: normalizeString(response?.title),
    description: normalizeString(response?.description),
    similarity:
      typeof response?.similarity === 'number' && Number.isFinite(response.similarity)
        ? response.similarity
        : undefined,
  }
}

export function adaptRequirementNode(response: Partial<RequirementNode> | null | undefined): RequirementNode {
  return {
    id: normalizeString(response?.id),
    code: normalizeString(response?.code),
    title: normalizeString(response?.title),
    description: normalizeString(response?.description),
  }
}

export function adaptDuplicateMatchResponse(
  // @ts-ignore - allow legacy requirementCode if backend hasn't updated
  response: Partial<DuplicateMatchResponse & { requirementCode?: string }> | null | undefined,
): DuplicateMatchResponse {
  return {
    requirementId: normalizeString(response?.requirementId),
    code: normalizeString(response?.code || response?.requirementCode),
    title: normalizeString(response?.title),
    description: response?.description ? normalizeString(response.description) : undefined,
    requirementType: response?.requirementType,
    similarity: normalizeNumber(response?.similarity),
    similarityPercentage: response?.similarityPercentage ? normalizeNumber(response.similarityPercentage) : undefined,
    level: response?.level,
    explanation: response?.explanation ? normalizeString(response.explanation) : undefined,
    recommendation: response?.recommendation ? normalizeString(response.recommendation) : undefined,
  }
}

export function adaptRequirementDTOList(response: Array<Partial<RequirementDTO>> | null | undefined): RequirementDTO[] {
  if (!Array.isArray(response)) {
    return []
  }

  return response.map(adaptRequirementDTO)
}

export function adaptSearchResponseList(response: Array<Partial<SearchResponse>> | null | undefined): SearchResponse[] {
  if (!Array.isArray(response)) {
    return []
  }

  return response.map(adaptSearchResponse)
}

export function adaptRequirementNodeList(
  response: Array<Partial<RequirementNode>> | null | undefined,
): RequirementNode[] {
  if (!Array.isArray(response)) {
    return []
  }

  return response.map(adaptRequirementNode)
}

export function adaptDuplicateMatchResponseList(
  response: Array<Partial<DuplicateMatchResponse>> | null | undefined,
): DuplicateMatchResponse[] {
  if (!Array.isArray(response)) {
    return []
  }

  return response.map(adaptDuplicateMatchResponse)
}
