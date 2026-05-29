import type {
  DuplicateMatchResponse,
  RequirementDTO,
  RequirementNode,
  SearchResponse,
  TraceabilityLink,
} from '../types/requirements'
import { normalizeNumber, normalizeString, normalizeStringArray } from './common'
import { sanitizeAcceptanceCriteriaList } from '../utils/acceptanceCriteria'

export function adaptRequirementDTO(response: Partial<RequirementDTO> | null | undefined): RequirementDTO {
  const requirementType = response?.requirementType
  return {
    id: normalizeString(response?.id),
    code: normalizeString(response?.code),
    title: normalizeString(response?.title),
    description: normalizeString(response?.description),
    actors: normalizeStringArray(response?.actors),
    acceptanceCriteria: sanitizeAcceptanceCriteriaList(normalizeStringArray(response?.acceptanceCriteria), requirementType),
    isoClassification: normalizeString(response?.isoClassification),
    projectId: normalizeString(response?.projectId),
    relatedCodes: normalizeStringArray(response?.relatedCodes),
    requirementType,
    nonFunctionalDetail: response?.nonFunctionalDetail
      ? {
          category: normalizeString(response.nonFunctionalDetail.category),
          metricName: normalizeString(response.nonFunctionalDetail.metricName),
          operator: normalizeString(response.nonFunctionalDetail.operator),
          targetValue: normalizeString(response.nonFunctionalDetail.targetValue),
          unit: normalizeString(response.nonFunctionalDetail.unit),
          verificationMethod: normalizeString(response.nonFunctionalDetail.verificationMethod),
          context: normalizeString(response.nonFunctionalDetail.context),
          rationale: normalizeString(response.nonFunctionalDetail.rationale),
        }
      : null,
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

export function adaptTraceabilityLink(response: any): TraceabilityLink {
  return {
    id: normalizeString(response?.id),
    projectId: normalizeString(response?.projectId),
    requirementId: normalizeString(response?.sourceId), // mapea sourceId a requirementId
    targetType: response?.targetType,
    relationType: response?.relationType,
    targetId: normalizeString(response?.targetId || 'MANUAL'),
    targetName: normalizeString(response?.targetCode), // mapea targetCode a targetName
    description: response?.description ? normalizeString(response.description) : undefined,
    createdAt: response?.createdAt ? normalizeString(response.createdAt) : undefined,
  }
}

export function adaptTraceabilityLinkList(response: any[] | null | undefined): TraceabilityLink[] {
  if (!Array.isArray(response)) {
    return []
  }
  return response.map(adaptTraceabilityLink)
}

export function adaptTraceabilityLinkRequest(link: any): any {
  return {
    projectId: link?.projectId,
    sourceType: 'REQUIREMENT',
    sourceId: link?.requirementId,
    sourceCode: 'REQ',
    targetType: link?.targetType,
    targetId: link?.targetId || 'MANUAL',
    targetCode: link?.targetName,
    relationType: link?.relationType,
    description: link?.description || '',
  }
}
