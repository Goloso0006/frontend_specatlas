import { diagramsApi } from '../api/services/diagramsApi'
import type {
  DiagramRequest,
  DiagramResponse,
  DiagramSummaryResponse,
} from '../types/diagrams'

/**
 * Facade that encapsulates all diagram-related API operations.
 *
 * Components should interact with this facade instead of calling
 * `diagramsApi` directly.
 */
export class DiagramFacade {
  private readonly api: typeof diagramsApi

  constructor(api = diagramsApi) {
    this.api = api
  }

  // ── CRUD ──

  /** Creates a diagram from a manual source definition. */
  async createManual(payload: DiagramRequest): Promise<DiagramResponse> {
    return this.api.createManual(payload)
  }

  /** Auto-generates a class diagram from existing project requirements. */
  async generateClassDiagram(projectId: string): Promise<DiagramResponse> {
    return this.api.createAuto(projectId)
  }

  /** Loads a diagram by its ID. */
  async getById(diagramId: string): Promise<DiagramResponse> {
    return this.api.getById(diagramId.trim())
  }

  /** Lists all diagrams belonging to a project. */
  async listByProject(projectId: string): Promise<DiagramSummaryResponse[]> {
    return this.api.listByProject(projectId.trim())
  }

  /** Updates an existing diagram. */
  async update(diagramId: string, payload: DiagramRequest): Promise<DiagramResponse> {
    return this.api.update(diagramId.trim(), payload)
  }

  /** Deletes a diagram by its ID. */
  async remove(diagramId: string): Promise<void> {
    return this.api.remove(diagramId.trim())
  }

  // ── PlantUML ──

  /** Generates PlantUML code for a diagram. */
  async generatePlantUml(diagramId: string): Promise<DiagramResponse> {
    return this.api.generatePlantUml(diagramId.trim())
  }

  // ── Exports ──

  /** Downloads diagram as a .puml file (returns Blob). */
  async exportPlantUml(diagramId: string): Promise<Blob> {
    return this.api.exportPlantUml(diagramId.trim())
  }

  /** Downloads diagram as a .txt file (returns Blob). */
  async exportText(diagramId: string): Promise<Blob> {
    return this.api.exportText(diagramId.trim())
  }

  // ── Orchestration ──

  /**
   * Save-or-update: if `diagramId` is present, updates; otherwise creates manual.
   */
  async saveOrUpdate(diagramId: string | null, payload: DiagramRequest): Promise<DiagramResponse> {
    if (diagramId?.trim()) {
      return this.api.update(diagramId.trim(), payload)
    }
    return this.api.createManual(payload)
  }
}

export const diagramFacade = new DiagramFacade()
