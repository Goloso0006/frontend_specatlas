import { useEffect, useMemo, useState, type FormEvent } from 'react'
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

  async function handleCreate(event: FormEvent) {
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
    <div className="dashboard-shell min-h-screen text-[var(--color-text-primary)]">
      <style>{DASHBOARD_STYLES}</style>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <section className="dashboard-panel px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
          <div className="relative z-10">
            <DashboardHeader
              projectCount={projects.length}
              activeCount={projects.filter((project) => project.status === 'ACTIVE').length}
            />

            <div className="dashboard-actions-bar dashboard-actions-bar--search-only">
              <ProjectSearchBar value={query} onChange={setQuery} />
              <p className="dashboard-actions-hint">
                Filtra el tablero por nombre, módulo o alcance técnico.
              </p>
            </div>

            {isLoading && projects.length === 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                <CreateProjectCard onClick={() => setIsModalOpen(true)} />
                {[1, 2, 3].map((index) => (
                  <div key={index} className="project-card-surface h-64 animate-pulse p-5">
                    <div className="mb-5 h-11 w-11 rounded-2xl bg-[var(--color-surface)]" />
                    <div className="mb-3 h-5 w-3/4 rounded bg-[var(--color-surface)]" />
                    <div className="h-4 w-1/2 rounded bg-[var(--color-surface)]" />
                    <div className="mt-12 h-px bg-[var(--color-border)]" />
                    <div className="mt-5 h-8 w-full rounded-full bg-[var(--color-surface)]" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 && query.trim() ? (
              <div className="rounded-[var(--ocd-tweak-dashboard-card-radius,1.35rem)] border border-dashed border-[var(--color-border)] bg-[var(--color-bg-card)] px-6 py-14 text-center">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">No encontramos proyectos con “{query}”.</p>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Prueba con otro nombre o crea un nuevo espacio de trabajo.</p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
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
          </div>
        </section>
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
