import { parseDiagramSource } from '../utils/diagramMapper'
import type { DiagramResponse, DiagramSummaryResponse } from '../types/diagrams'
import { normalizeOptionalString, normalizeString } from './common'

function normalizeDiagramType(value: unknown): DiagramResponse['diagramType'] {
  return value === 'USE_CASE' ? 'USE_CASE' : 'CLASS'
}

function normalizeDiagramMode(value: unknown): DiagramResponse['mode'] {
  return value === 'AUTO' ? 'AUTO' : 'MANUAL'
}

export function adaptDiagramResponse(response: Partial<DiagramResponse> | null | undefined): DiagramResponse {
  return {
    id: normalizeString(response?.id),
    projectId: normalizeString(response?.projectId),
    name: normalizeString(response?.name),
    diagramType: normalizeDiagramType(response?.diagramType),
    mode: normalizeDiagramMode(response?.mode),
    sourceJson: parseDiagramSource(response?.sourceJson as DiagramResponse['sourceJson']),
    plantUmlCode: normalizeOptionalString(response?.plantUmlCode) ?? null,
    createdAt: normalizeOptionalString(response?.createdAt),
    updatedAt: normalizeOptionalString(response?.updatedAt),
  }
}

export function adaptDiagramResponseList(
  response: Array<Partial<DiagramSummaryResponse>> | null | undefined,
): DiagramSummaryResponse[] {
  if (!Array.isArray(response)) {
    return []
  }

  return response.map((item) => ({
    id: normalizeString(item?.id),
    projectId: normalizeString(item?.projectId),
    name: normalizeString(item?.name),
    diagramType: normalizeDiagramType(item?.diagramType),
    mode: normalizeDiagramMode(item?.mode),
    createdAt: normalizeOptionalString(item?.createdAt),
    updatedAt: normalizeOptionalString(item?.updatedAt),
  }))
}
