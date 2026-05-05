import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { projectFacade } from '../facades/project.facade'
import { useProject, isValidProjectId } from '../context/ProjectContext'
import { useApiOperation } from '../hooks/useLoadingError'
import { NoProjectSelected } from '../components/ui/NoProjectSelected'
import type { ProjectResponse } from '../types/projects'

export function ProjectWorkspacePage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState<ProjectResponse | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { run } = useApiOperation()
  const { selectProject } = useProject()

  useEffect(() => {
    if (!isValidProjectId(projectId)) return

    run(async () => {
      const data = await projectFacade.getProject(projectId)
      setProject(data)
      await selectProject(projectId)
    })
  }, [projectId])

  if (!isValidProjectId(projectId)) {
    return <NoProjectSelected message="El ID de proyecto en la URL no es válido." />
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-48 bg-app-surface rounded-lg mb-4" />
          <div className="h-4 w-64 bg-app-surface rounded-lg" />
        </div>
      </div>
    )
  }

  const hubCards = [
    {
      title: 'Requisitos',
      description: 'Define, organiza y gestiona los requerimientos funcionales y no funcionales.',
      icon: '📝',
      path: `/app/projects/${project.id}/requirements`
    },
    {
      title: 'Diagramas',
      description: 'Modela la arquitectura, flujos y componentes de tu sistema visualmente.',
      icon: '📐',
      path: `/app/projects/${project.id}/diagrams`
    }
  ]

  return (
    <div className="min-h-screen bg-app-bg flex flex-col">
      {/* Top Bar */}
      <nav className="h-16 px-8 flex items-center justify-between border-b border-app-border bg-white dark:bg-[#1e1e1e]">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/app')}
            className="text-app-text-muted hover:text-app-text-primary transition-colors text-sm font-medium"
          >
            ← Volver
          </button>
          <div className="h-4 w-[1px] bg-app-border" />
          <span className="font-semibold app-text-primary tracking-tight">{project.name}</span>
        </div>

        <div className="relative">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-full hover:bg-app-surface transition-colors text-xl"
            title="Configuración del Proyecto"
          >
            ⚙️
          </button>

          {isMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#252525] border border-app-border rounded-xl shadow-2xl z-20 overflow-hidden py-2 animate-in fade-in zoom-in duration-150">
                <button 
                  onClick={() => navigate(`/app/projects/${project.id}/info`)}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-app-surface transition-colors flex items-center gap-3"
                >
                  <span>ℹ️</span> Información del proyecto
                </button>
                <button 
                  onClick={() => navigate(`/app/projects/${project.id}/edit`)}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-app-surface transition-colors flex items-center gap-3"
                >
                  <span>✏️</span> Editar proyecto
                </button>
                <button 
                  onClick={() => navigate(`/app/projects/${project.id}/validation-rules`)}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-app-surface transition-colors flex items-center gap-3"
                >
                  <span>⚖️</span> Editar Reglas
                </button>
              </div>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-5xl mx-auto w-full pt-20 pb-12 px-8">
        <h1 className="text-4xl font-bold tracking-tight mb-2">{project.name}</h1>
        <p className="text-lg app-text-secondary font-light max-w-2xl">
          {project.description || 'Sin descripción'}
        </p>
      </div>

      {/* Grid of Modules */}
      <main className="max-w-5xl mx-auto w-full px-8 pb-20">
        <div className="grid gap-8 md:grid-cols-2">
          {hubCards.map((card) => (
            <div 
              key={card.title}
              onClick={() => navigate(card.path)}
              className="group bg-white dark:bg-[#1e1e1e] border border-app-border rounded-2xl p-8 cursor-pointer interactive hover:shadow-2xl hover:border-app-border-strong card-hover"
            >
              <div className="text-4xl mb-6 group-hover:scale-110 transition-transform">
                {card.icon}
              </div>
              <h2 className="text-2xl font-bold mb-3 group-hover:text-app-accent transition-colors">
                {card.title}
              </h2>
              <p className="app-text-secondary leading-relaxed">
                {card.description}
              </p>
              <div className="mt-8 flex items-center text-sm font-semibold text-app-accent opacity-0 group-hover:opacity-100 transition-opacity">
                Abrir módulo <span className="ml-2">→</span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default ProjectWorkspacePage
