import { useState, useEffect } from 'react'
import { useAuth } from '../auth/useAuth'
import { useNavigate } from 'react-router-dom'
import { projectFacade } from '../facades/project.facade'
import { useApiOperation } from '../hooks/useLoadingError'
import type { ProjectRequest, ProjectResponse, ProjectStatus } from '../types/projects'
import { PageShell } from '../components/layout/PageShell'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'

const EMPTY_PROJECT: ProjectRequest = {
  name: '',
  description: '',
  ownerId: '',
  status: 'ACTIVE',
}

export function ProjectsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [ownerId] = useState(user?.userId ?? '')
  const [form, setForm] = useState<ProjectRequest>({ ...EMPTY_PROJECT, ownerId: user?.userId ?? '' })
  const [projects, setProjects] = useState<ProjectResponse[]>([])
  const [selectedProject, setSelectedProject] = useState<ProjectResponse | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  
  const { run } = useApiOperation()

  useEffect(() => {
    if (ownerId) {
      handleList()
    }
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

  function getStatusBadgeVariant(status: string) {
    switch (status) {
      case 'ACTIVE': return 'success'
      case 'ARCHIVED': return 'neutral'
      case 'DRAFT': return 'warning'
      default: return 'neutral'
    }
  }

  return (
    <PageShell>
      <PageHeader 
        title="Proyectos" 
        description="Gestiona tus espacios de análisis, requisitos y diagramas."
        action={
          !isFormOpen && (
            <Button onClick={handleNewProject}>
              Nuevo proyecto
            </Button>
          )
        }
      />

      {isFormOpen ? (
        <Card className="max-w-2xl p-6 sm:p-8">
          <h2 className="text-xl font-semibold mb-6 app-text-primary tracking-tight">
            {selectedProject ? 'Editar proyecto' : 'Crear nuevo proyecto'}
          </h2>
          <form onSubmit={handleSave} className="space-y-5">
            <Input
              required
              maxLength={60}
              label="Nombre del proyecto"
              placeholder="Ej. Sistema de E-commerce"
              value={form.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('name', e.target.value)}
            />
            
            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium app-text-primary">
                Descripción
              </label>
              <textarea
                className="w-full app-card border border-app-border-strong rounded-md px-3 py-2 text-[15px] app-text-primary placeholder-app-text-muted focus-ring interactive min-h-[120px] overflow-auto"
                maxLength={240}
                placeholder="Describe brevemente el alcance del proyecto..."
                value={form.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateField('description', e.target.value)}
              />
              <div className="flex justify-end text-[11px] app-text-muted">
                {form.description.length}/240
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium app-text-primary">
                Estado
              </label>
              <select
                className="w-full app-card border border-app-border-strong rounded-md px-3 py-2 text-[15px] app-text-primary focus-ring interactive appearance-none"
                value={form.status}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateField('status', e.target.value as ProjectStatus)}
              >
                <option value="ACTIVE">Activo</option>
                <option value="DRAFT">Borrador</option>
                <option value="ARCHIVED">Archivado</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4 border-t border-app-border">
              <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {selectedProject ? 'Guardar cambios' : 'Siguiente'}
              </Button>
            </div>
          </form>
        </Card>
      ) : projects.length === 0 ? (
        <Card className="py-16 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-app-surface rounded-full flex items-center justify-center mb-4">
            <span className="text-xl">📁</span>
          </div>
          <h3 className="text-lg font-medium app-text-primary mb-2">Aún no tienes proyectos</h3>
          <p className="app-text-secondary text-[15px] max-w-md mb-6">
            Crea tu primer proyecto para comenzar a analizar requisitos y modelar arquitecturas de software.
          </p>
          <Button onClick={handleNewProject}>
            Siguiente
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between mb-3">
                <Badge variant={getStatusBadgeVariant(project.status)}>
                  {project.status}
                </Badge>
                <span className="text-[11px] app-text-muted uppercase tracking-wider" title="ID del Proyecto">
                  {project.id}
                </span>
              </div>
              
              <h3 className="text-[17px] font-semibold app-text-primary mb-1">
                {project.name}
              </h3>
              
              <p className="text-[13px] app-text-secondary mb-6 flex-1 whitespace-pre-wrap break-words leading-relaxed line-clamp-4">
                {project.description || 'Sin descripción'}
              </p>
              
              <div className="flex items-center gap-2 pt-4 border-t border-app-border mt-auto">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleEditProject(project)}
                >
                  Editar
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleDelete(project.id)}
                >
                  Eliminar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  )
}
