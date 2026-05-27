import { useParams, useNavigate, Link } from 'react-router-dom'
import { isValidProjectId } from '../context/ProjectContext'
import { NoProjectSelected } from '../components/ui/NoProjectSelected'
import { DiagramTypeCard } from '../components/diagram/DiagramTypeCard'
import { useSmartNavigate } from '../hooks/useSmartNavigate'

export function ProjectDiagramsPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const smartNavigate = useSmartNavigate()

  if (!isValidProjectId(projectId)) {
    return <NoProjectSelected message="Selecciona un proyecto válido para ver diagramas." />
  }

  const handleNavigateType = (type: string) => {
    navigate(`/app/projects/${projectId}/diagrams/${type}`)
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--color-bg)]">
      {/* ── Header ── */}
      <header className="px-8 py-10 border-b border-[var(--color-border)] bg-[var(--color-bg-card)]/30">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-text-muted)] mb-4">
            <button type="button" onClick={() => smartNavigate('/app')} className="hover:text-[var(--color-accent)] transition-colors">Home</button>
            <span>/</span>
            <Link to={`/app/projects/${projectId}`} className="hover:text-[var(--color-accent)] transition-colors">Proyecto</Link>
            <span>/</span>
            <span className="text-[var(--color-text-primary)] font-semibold">Diagramas</span>
          </div>
          
          <h1 className="text-4xl font-bold text-[var(--color-text-primary)] tracking-tight mb-2">
            Diagramas
          </h1>
          <p className="text-[var(--color-text-secondary)] text-lg max-w-2xl">
            Selecciona el tipo de diagrama que deseas crear o gestionar.
          </p>
        </div>
      </header>

      {/* ── Main content / Grid ── */}
      <main className="max-w-6xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DiagramTypeCard 
            title="Diagrama de clases"
            description="Modela entidades, atributos, métodos y relaciones estructurales del sistema."
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            }
            onClick={() => handleNavigateType('class')}
          />
          <DiagramTypeCard 
            title="Diagrama de casos de uso"
            description="Representa actores, funcionalidades principales y límites del sistema."
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
            onClick={() => handleNavigateType('use-case')}
          />
          <DiagramTypeCard 
            title="Diagrama de secuencia"
            description="Modela la interacción temporal y el intercambio de mensajes entre objetos del sistema."
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            onClick={() => handleNavigateType('sequence')}
            disabled={true}
          />
          <DiagramTypeCard 
            title="Diagrama de actividades"
            description="Visualiza flujos de trabajo, decisiones operacionales y concurrencia de procesos."
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            }
            onClick={() => handleNavigateType('activity')}
            disabled={true}
          />
          <DiagramTypeCard 
            title="Diagrama de componentes"
            description="Muestra la organización, dependencias y cableado físico de los módulos de software."
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            }
            onClick={() => handleNavigateType('component')}
            disabled={true}
          />
          <DiagramTypeCard 
            title="Diagrama entidad-relación"
            description="Modela el esquema lógico de almacenamiento y cardinalidad de base de datos relacional."
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            }
            onClick={() => handleNavigateType('er')}
            disabled={true}
          />
        </div>
      </main>
    </div>
  )
}
