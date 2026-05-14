import { useParams, useNavigate, Link } from 'react-router-dom'
import { diagramFacade } from '../facades/diagram.facade'
import { useApiOperation } from '../hooks/useLoadingError'
import { useAutoResourceLoader } from '../hooks/useResourceLoader'
import { isValidProjectId } from '../context/ProjectContext'
import { NoProjectSelected } from '../components/ui/NoProjectSelected'
import { DiagramTypeCard } from '../components/diagram/DiagramTypeCard'
import { SavedDiagramCard } from '../components/diagram/SavedDiagramCard'
import { DiagramEmptyState } from '../components/diagram/DiagramEmptyState'
import { LoadingAnimation } from '../components/ui/LoadingAnimation'
import type { DiagramType } from '../types/diagrams'

export function ProjectDiagramsPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { run, isLoading } = useApiOperation()
  const diagramsResource = useAutoResourceLoader(
    (activeProjectId: string) => diagramFacade.listByProject(activeProjectId),
    isValidProjectId(projectId) ? [projectId] as [string] : null,
    { errorMessage: 'No se pudieron cargar los diagramas del proyecto.' },
  )

  const diagrams = diagramsResource.data ?? []
  const setDiagrams = diagramsResource.setData

  if (!isValidProjectId(projectId)) {
    return <NoProjectSelected message="Selecciona un proyecto válido para ver diagramas." />
  }

  const handleOpenDiagram = (id: string) => {
    navigate(`/app/projects/${projectId}/diagrams/${id}`)
  }

  const handleCreateNew = (type: DiagramType | string) => {
    navigate(`/app/projects/${projectId}/diagrams/new?type=${type}`)
  }

  const handleGenerateIA = (type: DiagramType) => {
    navigate(`/app/projects/${projectId}/diagrams/new?type=${type}&action=generate`)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este diagrama?')) {
      await run(() => diagramFacade.remove(id), { errorMessage: 'Error al eliminar el diagrama.' })
      setDiagrams(prev => (prev ? prev.filter(d => d.id !== id) : prev))
    }
  }

  const handleRename = async (id: string) => {
    const diagram = diagrams.find(d => d.id === id)
    if (!diagram) return
    const newName = window.prompt('Nuevo nombre para el diagrama:', diagram.name)
    if (newName && newName.trim() && newName !== diagram.name) {
      await run(async () => {
        const full = await diagramFacade.getById(id)
        await diagramFacade.update(id, {
          projectId: full.projectId,
          name: newName.trim(),
          sourceJson: typeof full.sourceJson === 'string' ? full.sourceJson : JSON.stringify(full.sourceJson),
          plantUmlCode: full.plantUmlCode
        })
        await diagramsResource.load(projectId as string)
      }, { errorMessage: 'Error al renombrar el diagrama.' })
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-(--color-bg)">
      {/* ── Header ── */}
      <header className="px-8 py-10 border-b border-(--color-border) bg-(--color-bg-card)/30">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 text-xs font-mono text-(--color-text-muted) mb-4">
            <Link to="/app" className="hover:text-(--color-accent) transition-colors">Home</Link>
            <span>/</span>
            <Link to={`/app/projects/${projectId}`} className="hover:text-(--color-accent) transition-colors">Proyecto</Link>
            <span>/</span>
            <span className="text-(--color-text-primary)">Diagramas</span>
          </div>
          
          <h1 className="text-4xl font-bold text-(--color-text-primary) tracking-tight mb-2">
            Diagramas del proyecto
          </h1>
          <p className="text-(--color-text-secondary) text-lg max-w-2xl">
            Crea, genera y administra los diagramas asociados a este proyecto.
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-12 space-y-16">
        {/* ── Tipos de Diagramas ── */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-(--color-text-primary) flex items-center gap-3">
              <span className="w-1.5 h-8 bg-(--color-accent) rounded-full" />
              Tipos de diagramas
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            <DiagramTypeCard 
              type="CLASS"
              title="Diagrama de clases"
              description="Modela entidades, atributos, métodos y relaciones estructurales del sistema."
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              }
              onCreate={() => handleCreateNew('CLASS')}
              onGenerate={() => handleGenerateIA('CLASS')}
            />
            <DiagramTypeCard 
              type="USE_CASE"
              title="Diagrama de casos de uso"
              description="Representa actores, funcionalidades principales y límites del sistema."
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
              onCreate={() => handleCreateNew('USE_CASE')}
              onGenerate={() => handleGenerateIA('USE_CASE')}
            />
          </div>
        </section>

        {/* ── Diagramas Guardados ── */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-(--color-text-primary) flex items-center gap-3">
              <span className="w-1.5 h-8 bg-emerald-500 rounded-full" />
              Diagramas guardados
            </h2>
          </div>

          {isLoading && diagrams.length === 0 ? (
            <div className="flex justify-center py-20">
              <LoadingAnimation />
            </div>
          ) : diagrams.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {diagrams.map(diagram => (
                <SavedDiagramCard 
                  key={diagram.id}
                  diagram={diagram}
                  onOpen={handleOpenDiagram}
                  onRename={handleRename}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <DiagramEmptyState onCreateFirst={() => handleCreateNew('CLASS')} />
          )}
        </section>
      </main>
    </div>
  )
}
