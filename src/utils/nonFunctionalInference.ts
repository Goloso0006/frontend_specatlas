import type { RequirementDTO, NonFunctionalDetailDTO } from '../types/requirements'

const PATTERNS = [
  {
    regex: /máximo\s+de\s+(\d+)\s+(segundos?|minutos?|milisegundos?|ms|s)/i,
    extract: (m: RegExpMatchArray): Partial<NonFunctionalDetailDTO> => ({
      category: 'Rendimiento',
      metricName: 'Tiempo de respuesta máximo',
      operator: '<=',
      targetValue: m[1],
      unit: m[2],
      verificationMethod: 'Prueba de carga/rendimiento'
    })
  },
  {
    regex: /menos\s+de\s+(\d+)\s+(segundos?|minutos?|milisegundos?|ms|s)/i,
    extract: (m: RegExpMatchArray): Partial<NonFunctionalDetailDTO> => ({
      category: 'Rendimiento',
      metricName: 'Tiempo de respuesta',
      operator: '<',
      targetValue: m[1],
      unit: m[2],
      verificationMethod: 'Prueba de carga/rendimiento'
    })
  },
  {
    regex: /(disponibilidad|uptime|tiempo de actividad).+?(\d+(?:\.\d+)?)\s*%/i,
    extract: (m: RegExpMatchArray): Partial<NonFunctionalDetailDTO> => ({
      category: 'Disponibilidad',
      metricName: 'Porcentaje de disponibilidad',
      operator: '>=',
      targetValue: m[2],
      unit: '%',
      verificationMethod: 'Monitoreo continuo'
    })
  },
  {
    regex: /soporta(r|rá)?\s+(hasta\s+)?(\d+)\s+usuarios\s+concurrentes/i,
    extract: (m: RegExpMatchArray): Partial<NonFunctionalDetailDTO> => ({
      category: 'Escalabilidad',
      metricName: 'Usuarios concurrentes soportados',
      operator: '>=',
      targetValue: m[3],
      unit: 'usuarios',
      verificationMethod: 'Prueba de estrés'
    })
  }
]

export function inferNonFunctionalDetail(dto: RequirementDTO): NonFunctionalDetailDTO {
  // Start with existing or empty
  let detail: NonFunctionalDetailDTO = dto.nonFunctionalDetail || {
    category: '',
    metricName: '',
    operator: '',
    targetValue: '',
    unit: '',
    verificationMethod: '',
    context: '',
    rationale: ''
  }

  const textToAnalyze = `${dto.description || ''} ${(dto.acceptanceCriteria || []).join(' ')}`

  for (const pattern of PATTERNS) {
    const match = textToAnalyze.match(pattern.regex)
    if (match) {
      const extracted = pattern.extract(match)
      detail = {
        category: detail.category || extracted.category || '',
        metricName: detail.metricName || extracted.metricName || '',
        operator: detail.operator || extracted.operator || '',
        targetValue: detail.targetValue || extracted.targetValue || '',
        unit: detail.unit || extracted.unit || '',
        verificationMethod: detail.verificationMethod || extracted.verificationMethod || '',
        context: detail.context || extracted.context || 'Contexto inferido del texto',
        rationale: detail.rationale || extracted.rationale || 'Asegurar requerimientos de calidad'
      }
    }
  }

  return detail
}
