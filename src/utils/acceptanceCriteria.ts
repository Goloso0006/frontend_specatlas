export const ACCEPTANCE_CRITERION_MAX_LENGTH = 100

function normalizeLineBreaks(value: string): string {
  return value.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}

function countLineBreaks(value: string): number {
  const matches = normalizeLineBreaks(value).match(/\n/g)
  return matches ? matches.length : 0
}

export function getAcceptanceCriterionLineBreakLimit(requirementType?: string): number {
  return requirementType === 'FUNCTIONAL' ? 1 : 0
}

export function clampAcceptanceCriterionValue(
  value: string,
  maxLineBreaks: number,
  maxLength: number = ACCEPTANCE_CRITERION_MAX_LENGTH,
): string {
  const normalized = normalizeLineBreaks(value)
  const lineLimited = maxLineBreaks > 0
    ? normalized.split('\n').slice(0, maxLineBreaks + 1).join('\n')
    : normalized.replace(/\n/g, '')

  return lineLimited.slice(0, maxLength)
}

export function shouldBlockAcceptanceCriterionEnter(value: string, maxLineBreaks: number): boolean {
  return maxLineBreaks <= 0 || countLineBreaks(value) >= maxLineBreaks
}

export function sanitizeAcceptanceCriteriaList(
  items: string[] | null | undefined,
  requirementType?: string,
): string[] {
  if (!Array.isArray(items)) {
    return []
  }

  const maxLineBreaks = getAcceptanceCriterionLineBreakLimit(requirementType)
  return items.map(item => clampAcceptanceCriterionValue(item || '', maxLineBreaks))
}