import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { projectFacade } from '../facades/project.facade'
import { useApiOperation } from './useLoadingError'
import type { ProjectRequest, ProjectResponse } from '../types/projects'

export const EMPTY_PROJECT: ProjectRequest = {
  name: '',
  description: '',
  ownerId: '',
  status: 'ACTIVE',
}

export function useProjects() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [ownerId] = useState(user?.userId ?? '')
  const [form, setForm] = useState<ProjectRequest>({ ...EMPTY_PROJECT, ownerId: user?.userId ?? '' })
  const [projects, setProjects] = useState<ProjectResponse[]>([])
  const [selectedProject, setSelectedProject] = useState<ProjectResponse | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  
  const { run, isLoading } = useApiOperation()

  useEffect(() => {
    if (ownerId) {
      void handleList()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId])

  async function handleList(): Promise<void> {
    if (!ownerId.trim()) return

    await run(
      async () => {
        const data = await projectFacade.getProjectsByUser(ownerId)
        setProjects(data)
      },
      { errorMessage: 'No fue posible listar los proyectos.' }
    )
  }

  async function handleSave(event: React.FormEvent): Promise<void> {
    event.preventDefault()
    if (!form.name.trim() || !form.ownerId.trim()) return

    await run(
      async () => {
        let createdProjectId: string
        
        if (selectedProject) {
          // Editing existing project: keep original behavior
          await projectFacade.updateProject(selectedProject.id, form)
          await handleList()
          setIsFormOpen(false)
          setSelectedProject(null)
          setForm({ ...EMPTY_PROJECT, ownerId })
        } else {
          // Creating new project: redirect to ISO rules selection
          const newProject = await projectFacade.createProject(form)
          createdProjectId = newProject.id
          setIsFormOpen(false)
          setSelectedProject(null)
          setForm({ ...EMPTY_PROJECT, ownerId })
          // Navigate to ISO rules setup page
          navigate(`/app/projects/${createdProjectId}/iso-rules`)
        }
      },
      { errorMessage: 'No fue posible guardar el proyecto.' }
    )
  }

  async function handleDelete(id: string): Promise<void> {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este proyecto? Esta acción no se puede deshacer.')) {
      return
    }

    await run(
      async () => {
        await projectFacade.deleteProject(id)
        await handleList()
        if (selectedProject?.id === id) {
          setIsFormOpen(false)
          setSelectedProject(null)
          setForm({ ...EMPTY_PROJECT, ownerId })
        }
      },
      { errorMessage: 'No fue posible eliminar el proyecto.' }
    )
  }

  function updateField<K extends keyof ProjectRequest>(key: K, value: ProjectRequest[K]): void {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function handleNewProject() {
    setSelectedProject(null)
    setForm({ ...EMPTY_PROJECT, ownerId })
    setIsFormOpen(true)
  }

  function handleEditProject(project: ProjectResponse) {
    setSelectedProject(project)
    setForm({
      name: project.name,
      description: project.description,
      ownerId: project.ownerId,
      status: project.status,
    })
    setIsFormOpen(true)
  }

  return {
    form,
    projects,
    selectedProject,
    isFormOpen,
    isLoading,
    setIsFormOpen,
    handleSave,
    handleDelete,
    updateField,
    handleNewProject,
    handleEditProject,
  }
}
