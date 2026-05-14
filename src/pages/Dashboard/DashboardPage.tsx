import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { useApiOperation } from '../../hooks/useLoadingError'
import { projectFacade } from '../../facades/project.facade'
import type { ProjectRequest, ProjectResponse } from '../../types/projects'
import { ProjectSearchBar } from '../../components/projects/ProjectSearchBar'
import { CreateProjectCard } from './CreateProjectCard'
import { DashboardHeader } from './DashboardHeader'
import { FlipProjectCard } from './FlipProjectCard'
import { ProjectCreationModal } from './ProjectCreationModal'
import { DASHBOARD_STYLES } from './DashboardStyles'

const EMPTY_PROJECT: ProjectRequest = {
  name: '',
  description: '',
  ownerId: '',
  status: 'ACTIVE',
}

export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<ProjectResponse[]>([])
  const [query, setQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState<ProjectRequest>({ ...EMPTY_PROJECT, ownerId: user?.userId ?? '' })
  const { run, isLoading } = useApiOperation()

  useEffect(() => {
    if (!user?.userId) return
    void handleFetch()
  }, [user?.userId])

  async function handleFetch() {
    if (!user?.userId) return
    await run(async () => {
      const data = await projectFacade.getProjectsByUser(user.userId)
      setProjects(data)
    }, { errorMessage: 'No fue posible listar los proyectos.' })
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return projects
    return projects.filter((project) => project.name.toLowerCase().includes(q))
  }, [projects, query])

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    if (!form.name.trim() || !user?.userId) return

    await run(async () => {
      const created = await projectFacade.createProject({ ...form, ownerId: user.userId })
      await handleFetch()
      setIsModalOpen(false)
      setForm({ ...EMPTY_PROJECT, ownerId: user.userId })

      if (created?.id) {
        navigate(`/app/projects/${created.id}/iso-rules`)
      }
    }, { errorMessage: 'Error al crear el proyecto.' })
  }

  async function handleDeleteProject(projectId: string) {
    await run(async () => {
      await projectFacade.deleteProject(projectId)
      setProjects((prev) => prev.filter((project) => project.id !== projectId))
      await handleFetch()
    }, { errorMessage: 'Error al eliminar el proyecto.' })
  }

  function openProject(id: string) {
    navigate(`/app/projects/${id}`)
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <style>{DASHBOARD_STYLES}</style>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <DashboardHeader
          projectCount={projects.length}
          activeCount={projects.filter((project) => project.status === 'ACTIVE').length}
        />

        <div className="w-full max-w-2xl mx-auto mb-10">
          <ProjectSearchBar value={query} onChange={setQuery} />
        </div>

        {isLoading && projects.length === 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <CreateProjectCard onClick={() => setIsModalOpen(true)} />
            {[1, 2, 3].map((index) => (
              <div key={index} className="h-56 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl animate-pulse flex items-center justify-center">
                <svg className="w-8 h-8 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <CreateProjectCard onClick={() => setIsModalOpen(true)} />
            {filtered.map((project) => (
              <FlipProjectCard
                key={project.id}
                project={project}
                onClick={() => openProject(project.id)}
                onDelete={() => void handleDeleteProject(project.id)}
              />
            ))}
          </div>
        )}
      </main>

      <ProjectCreationModal
        open={isModalOpen}
        form={form}
        setForm={setForm}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreate}
        isSubmitting={isLoading}
      />
    </div>
  )
}

export default DashboardPage