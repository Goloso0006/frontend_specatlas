import type {
  DiagramClassNodeDTO,
  DiagramPositionDTO,
  DiagramRelationDTO,
} from '../types/diagrams'
import { createDiagramClassNode, createDiagramRelation } from '../utils/diagramMapper'

export class DiagramElementFactory {
  static createNode(type: string, data?: Partial<DiagramClassNodeDTO>): DiagramClassNodeDTO {
    switch (type?.toString().toLowerCase()) {
      case 'class':
      case 'classnode':
      case 'class_node':
      case 'class':
        // use helper to create base node then merge provided fields
        const name = typeof data?.name === 'string' && data.name.trim() ? data.name : undefined
        const position: DiagramPositionDTO | undefined = data?.position
        const base = createDiagramClassNode(name ?? 'NuevaClase', position ?? { x: 100, y: 100 })
        return {
          ...base,
          attributes: Array.isArray(data?.attributes) ? data!.attributes! : base.attributes,
          methods: Array.isArray(data?.methods) ? data!.methods! : base.methods,
          derivedFromRequirements: Array.isArray(data?.derivedFromRequirements)
            ? data!.derivedFromRequirements!
            : base.derivedFromRequirements,
        }

      default:
        throw new Error(`Unsupported node type: ${type}`)
    }
  }

  static createRelation(type: string, data?: Partial<DiagramRelationDTO>): DiagramRelationDTO {
    const t = typeof type === 'string' ? type : ''
    switch (t.toLowerCase()) {
      case 'association':
      case 'inheritance':
      case 'aggregation':
      case 'composition':
      case 'dependency':
        const from = typeof data?.from === 'string' ? data.from : ''
        const to = typeof data?.to === 'string' ? data.to : ''
        const base = createDiagramRelation(from, to)
        return {
          ...base,
          type: (data?.type as any) ?? base.type,
          label: typeof data?.label === 'string' ? data.label : base.label,
          derivedFromRequirements: Array.isArray(data?.derivedFromRequirements)
            ? data!.derivedFromRequirements!
            : base.derivedFromRequirements,
        }

      default:
        throw new Error(`Unsupported relation type: ${type}`)
    }
  }
}

export const diagramElementFactory = DiagramElementFactory
