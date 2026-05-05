import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectFacade } from '../facades/project.facade'
import { useApiOperation } from '../hooks/useLoadingError'
import { useAuth } from '../auth/useAuth'
import type { ProjectResponse, ProjectRequest } from '../types/projects'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import ProjectSearchBar from '../components/projects/ProjectSearchBar'
import ProjectCard from '../components/projects/ProjectCard'
import EmptyProjectsState from '../components/projects/EmptyProjectsState'

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
    handleFetch()
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
    return projects.filter((p) => p.name.toLowerCase().includes(q))
  }, [projects, query])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !user?.userId) return

    await run(async () => {
      await projectFacade.createProject({ ...form, ownerId: user.userId })
      await handleFetch()
      setIsModalOpen(false)
      setForm({ ...EMPTY_PROJECT, ownerId: user.userId })
    }, { errorMessage: 'Error al crear el proyecto.' })
  }

  function openProject(id: string) {
    navigate(`/app/projects/${id}`)
  }

  return (
    <div className="min-h-screen bg-app-bg">
      {/* Header Section */}
      <header className="pt-20 pb-12 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        <h1 className="text-6xl font-bold tracking-tighter app-text-primary mb-4">SpecAtlas</h1>
        <p className="text-xl app-text-secondary max-w-2xl font-light">
          Analiza, diseña y gestiona tus arquitecturas de software con precisión.
        </p>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 pb-24">
        {/* Search & Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-12">
          <div className="w-full max-w-md">
            <ProjectSearchBar value={query} onChange={setQuery} />
          </div>
          <Button size="lg" onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto shadow-sm">
            Nuevo Proyecto
          </Button>
        </div>

        {/* Grid */}
        {isLoading && projects.length === 0 ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 opacity-50">
            {[1, 2, 3].map(i => <div key={i} className="h-64 bg-app-surface rounded-xl animate-pulse" />)}
          </div>
        ) : projects.length === 0 ? (
          <EmptyProjectsState onCreate={() => setIsModalOpen(true)} />
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((project) => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                onClick={openProject} 
              />
            ))}
          </div>
        )}
      </main>

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1e1e1e] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-app-border">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold tracking-tight">Nuevo Proyecto</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-app-text-muted hover:text-app-text-primary">
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleCreate} className="space-y-6">
                <Input
                  required
                  label="Nombre"
                  placeholder="Mi Arquitectura de Referencia"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
                
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium app-text-secondary">Descripción</label>
                  <textarea
                    className="w-full bg-[#fcfcfc] dark:bg-[#151515] border border-app-border rounded-lg px-4 py-3 text-[15px] focus:ring-2 focus:ring-app-accent/20 outline-none min-h-[120px] transition-all"
                    placeholder="Describe brevemente el alcance..."
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1">
                    Crear Proyecto
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
