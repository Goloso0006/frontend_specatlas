import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectFacade } from '../facades/project.facade'
import { useApiOperation } from '../hooks/useLoadingError'
import { useAuth } from '../auth/useAuth'
import type { ProjectResponse } from '../types/projects'
import { PageShell } from '../components/layout/PageShell'
import { Button } from '../components/ui/Button'
import ProjectSearchBar from '../components/projects/ProjectSearchBar'
import ProjectGallery from '../components/projects/ProjectGallery'
import EmptyProjectsState from '../components/projects/EmptyProjectsState'

export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<ProjectResponse[]>([])
  const [query, setQuery] = useState('')
  const { run } = useApiOperation()

  useEffect(() => {
    if (!user?.userId) return
    run(async () => {
      const data = await projectFacade.getProjectsByUser(user.userId)
      setProjects(data)
    }, { errorMessage: 'No fue posible listar los proyectos.' })
  }, [user?.userId])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return projects
    return projects.filter((p) => p.name.toLowerCase().includes(q))
  }, [projects, query])

  function handleCreate() {
    navigate('/app/projects')
  }

  function openProject(id: string) {
    navigate(`/app/projects/${id}`)
  }

  return (
    <PageShell>
      <div className="text-center py-6">
        <h1 className="text-4xl font-bold tracking-tight">SpecAtlas</h1>
        <p className="mt-2 text-sm app-text-secondary">Tus proyectos de análisis de software</p>
      </div>

      <div className="flex items-center justify-center mb-6">
        <ProjectSearchBar value={query} onChange={setQuery} />
      </div>

      <div className="flex items-center justify-between mb-6">
        <div />
        <Button onClick={handleCreate}>Nuevo proyecto</Button>
      </div>

      {projects.length === 0 ? (
        <EmptyProjectsState onCreate={handleCreate} />
      ) : (
        <ProjectGallery projects={filtered} onCardClick={openProject} />
      )}
    </PageShell>
  )
}
