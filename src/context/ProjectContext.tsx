import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react'
import { projectFacade } from '../facades/project.facade'
import type { ProjectResponse } from '../types/projects'

// ── Types ──

export interface ProjectContextValue {
  /** The currently selected project, or null if none is selected */
  currentProject: ProjectResponse | null
  /** The projectId of the currently selected project */
  projectId: string | null
  /** Load and select a project by ID */
  selectProject: (projectId: string) => Promise<void>
  /** Clear the current project selection */
  clearProject: () => void
  /** Whether a project is currently being loaded */
  isLoading: boolean
  /** Error message if project loading failed */
  error: string | null
}

// ── Context ──

const ProjectContext = createContext<ProjectContextValue | null>(null)

// ── Provider ──

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [currentProject, setCurrentProject] = useState<ProjectResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectProject = useCallback(async (projectId: string) => {
    if (!projectId || projectId.startsWith('USR-')) {
      setError('ID de proyecto inválido. Selecciona un proyecto desde el dashboard.')
      setCurrentProject(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const project = await projectFacade.getProject(projectId)
      setCurrentProject(project)
    } catch {
      setError('No fue posible cargar el proyecto.')
      setCurrentProject(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearProject = useCallback(() => {
    setCurrentProject(null)
    setError(null)
  }, [])

  const projectId = currentProject?.id ?? null

  const value = useMemo<ProjectContextValue>(
    () => ({
      currentProject,
      projectId,
      selectProject,
      clearProject,
      isLoading,
      error,
    }),
    [currentProject, projectId, selectProject, clearProject, isLoading, error],
  )

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
}

// ── Hook ──

export function useProject(): ProjectContextValue {
  const context = useContext(ProjectContext)
  if (!context) {
    throw new Error('useProject must be used within ProjectProvider')
  }
  return context
}

// ── Guard utility ──

/**
 * Returns true if the given id is a valid projectId (non-empty, not a userId).
 * Use this before calling any project-scoped endpoint.
 */
export function isValidProjectId(id: string | null | undefined): id is string {
  if (!id || !id.trim()) return false
  if (id.startsWith('USR-')) return false
  return true
}
