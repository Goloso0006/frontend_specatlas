import { useParams, useNavigate, Link } from 'react-router-dom'
import { diagramFacade } from '../facades/diagram.facade'
import { useApiOperation } from '../hooks/useLoadingError'
import { useAutoResourceLoader } from '../hooks/useResourceLoader'
import { useSmartNavigate } from '../hooks/useSmartNavigate'
import { isValidProjectId } from '../context/ProjectContext'
import { NoProjectSelected } from '../components/ui/NoProjectSelected'
import { SavedDiagramCard } from '../components/diagram/SavedDiagramCard'
import { LoadingAnimation } from '../components/ui/LoadingAnimation'
import { Button } from '../components/ui/Button'
import type { DiagramType } from '../types/diagrams'

interface DiagramTypeDetailPageProps {
  type: DiagramType | 'SEQUENCE' | 'ACTIVITY' | 'ER'
}

export function DiagramTypeDetailPage({ type }: DiagramTypeDetailPageProps) {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const smartNavigate = useSmartNavigate()
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

  // Filter diagrams by the selected type
  const filteredDiagrams = diagrams.filter(d => d.diagramType === type)

  const typePath = type === 'CLASS' ? 'class' : 'use-case'

  const handleOpenDiagram = (id: string) => {
    navigate(`/app/projects/${projectId}/diagrams/${typePath}/${id}`)
  }

  const handleCreateNew = () => {
    navigate(`/app/projects/${projectId}/diagrams/${typePath}/new`)
  }

  const handleGenerateIA = () => {
    navigate(`/app/projects/${projectId}/diagrams/${typePath}/new?action=generate`)
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

  // Diagram details config
  const getConfig = () => {
    switch (type) {
      case 'CLASS':
        return {
          title: 'Diagrama de clases',
          description: 'Modela la estructura del sistema a través de clases, interfaces, métodos y atributos.',
          isActive: true,
        }
      case 'USE_CASE':
        return {
          title: 'Diagrama de casos de uso',
          description: 'Representa las interacciones entre los actores y los casos de uso principales del sistema.',
          isActive: true,
        }
      case 'SEQUENCE':
        return {
          title: 'Diagrama de secuencia',
          description: 'Modela la interacción temporal de objetos y mensajes en un flujo de ejecución determinado.',
          isActive: false,
        }
      case 'ACTIVITY':
        return {
          title: 'Diagrama de actividades',
          description: 'Visualiza el flujo de trabajo operacional, decisiones y bifurcaciones paralelas del sistema.',
          isActive: false,
        }
      case 'COMPONENT':
        return {
          title: 'Diagrama de componentes',
          description: 'Muestra la organización, dependencias y cableado físico de los componentes del software.',
          isActive: false,
        }
      case 'ER':
        return {
          title: 'Diagrama entidad-relación',
          description: 'Modela la estructura de base de datos a través de tablas, atributos y relaciones de cardinalidad.',
          isActive: false,
        }
      default:
        return {
          title: 'Diagrama',
          description: 'Gestiona diagramas del proyecto.',
          isActive: false,
        }
    }
  }

  const config = getConfig()

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--color-bg)]">
      {/* ── Header / Breadcrumbs ── */}
      <header className="px-8 py-10 border-b border-[var(--color-border)] bg-[var(--color-bg-card)]/30">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-text-muted)] mb-4">
            <button type="button" onClick={() => smartNavigate('/app')} className="hover:text-[var(--color-accent)] transition-colors">Home</button>
            <span>/</span>
            <Link to={`/app/projects/${projectId}`} className="hover:text-[var(--color-accent)] transition-colors">Proyecto</Link>
            <span>/</span>
            <Link to={`/app/projects/${projectId}/diagrams`} className="hover:text-[var(--color-accent)] transition-colors">Diagramas</Link>
            <span>/</span>
            <span className="text-[var(--color-text-primary)] font-semibold">{config.title}</span>
          </div>

          <h1 className="text-4xl font-bold text-[var(--color-text-primary)] tracking-tight mb-2">
            {config.title}
          </h1>
          <p className="text-[var(--color-text-secondary)] text-lg max-w-2xl">
            {config.description}
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-12 space-y-12">
        {config.isActive ? (
          <>
            {/* ── Featured Creation Card ── */}
            <div className="relative overflow-hidden p-8 md:p-10 rounded-2xl border border-[var(--color-border-strong)] bg-[var(--color-bg-card)] shadow-[0_2px_24px_rgba(0,0,0,0.04)]">
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-accent)]/[0.03] via-transparent to-[var(--color-accent)]/[0.06] pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-accent-subtle)] text-[var(--color-accent)] text-[11px] font-semibold uppercase tracking-wider">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nuevo diagrama
                  </div>
                  <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                    Crear nuevo {config.title.toLowerCase()}
                  </h2>
                  <p className="text-sm text-[var(--color-text-secondary)] max-w-xl leading-relaxed">
                    Comienza a modelar tus requisitos de forma visual. Puedes diseñar el diagrama desde cero o dejar que SpecAtlas use la IA para estructurar el modelo basándose en tus requisitos existentes.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 shrink-0">
                  <Button
                    variant="secondary"
                    onClick={handleCreateNew}
                    className="h-11 px-6 text-sm font-semibold border-[var(--color-border-strong)] !shadow-none"
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Crear Manualmente
                    </span>
                  </Button>
                  <Button
                    onClick={handleGenerateIA}
                    className="h-11 px-6 text-sm font-semibold bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-accent-foreground)] !shadow-none"
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Generar con IA
                    </span>
                  </Button>
                </div>
              </div>
              {/* Decorative background element */}
              <div className="absolute -right-6 -bottom-6 opacity-[0.03] text-[var(--color-text-primary)] pointer-events-none">
                <svg className="w-56 h-56" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>

            {/* ── Saved Diagrams ── */}
            <section className="space-y-6">
              <h2 className="text-xl font-bold text-[var(--color-text-primary)] flex items-center gap-3">
                <span className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                Diagramas guardados
              </h2>

              {isLoading && filteredDiagrams.length === 0 ? (
                <div className="flex justify-center py-16">
                  <LoadingAnimation />
                </div>
              ) : filteredDiagrams.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredDiagrams.map(diagram => (
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
                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-[var(--color-border)] rounded-2xl bg-[var(--color-bg-card)]/50">
                  <div className="w-12 h-12 rounded-full bg-[var(--color-accent-subtle)] flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">
                    No hay diagramas de este tipo
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)] text-center max-w-xs mb-6">
                    Comienza a diseñar tu primer {config.title.toLowerCase()} para este proyecto.
                  </p>
                  <Button
                    onClick={handleCreateNew}
                    className="bg-[var(--color-accent)] hover:opacity-90 text-[var(--color-accent-foreground)] px-6 h-9 text-xs font-semibold"
                  >
                    Crear diagrama
                  </Button>
                </div>
              )}
            </section>
          </>
        ) : (
          /* ── Próximamente / Placeholder ── */
          <div className="flex flex-col items-center justify-center p-16 border border-[var(--color-border)] rounded-2xl bg-[var(--color-bg-card)]/40 max-w-2xl mx-auto text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-accent-subtle)] flex items-center justify-center text-[var(--color-accent)] mb-6 transform hover:rotate-12 transition-transform duration-300">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-3">
              ¡Próximamente disponible!
            </h2>
            <p className="text-[var(--color-text-secondary)] text-base leading-relaxed max-w-md mb-8">
              El {config.title.toLowerCase()} se encuentra en desarrollo activo. Muy pronto podrás modelar y estructurar este tipo de relaciones con la ayuda de nuestro motor semántico e IA de SpecAtlas.
            </p>
            <Button
              variant="secondary"
              onClick={() => navigate(`/app/projects/${projectId}/diagrams`)}
              className="px-6 h-10 text-sm font-semibold flex items-center gap-2 border-[var(--color-border-strong)]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver a diagramas
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
