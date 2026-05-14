import type { 
  DiagramActorNodeDTO, 
  DiagramUseCaseNodeDTO, 
  DiagramPositionDTO 
} from '../types/diagrams'
import { createNodeId } from './diagramMapper'

export function createActorNode(
  name: string, 
  position: DiagramPositionDTO = { x: 100, y: 100 }
): DiagramActorNodeDTO {
  return {
    id: createNodeId(),
    kind: 'actor',
    name,
    position,
    description: '',
    derivedFromRequirements: []
  }
}

export function createUseCaseNode(
  name: string, 
  position: DiagramPositionDTO = { x: 400, y: 100 }
): DiagramUseCaseNodeDTO {
  return {
    id: createNodeId(),
    kind: 'useCase',
    name,
    position,
    description: '',
    derivedFromRequirements: []
  }
}
