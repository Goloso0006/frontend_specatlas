import { useParams, useNavigate } from 'react-router-dom'
import { useProject, isValidProjectId } from '../context/ProjectContext'
import { NoProjectSelected } from '../components/ui/NoProjectSelected'

// ── Option card ───────────────────────────────────────────────────────────

interface OptionCardProps {
  title: string
  description: string
  icon: React.ReactNode
  badge: string
  onClick: () => void
}

function OptionCard({ title, description, icon, badge, onClick }: OptionCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className={[
        'group relative flex flex-col gap-5 p-7 md:p-9',
        'bg-[var(--color-bg-card)] border border-[var(--color-border)]',
        'rounded-2xl cursor-pointer select-none',
        'hover:border-[var(--color-border-strong)] hover:shadow-xl hover:-translate-y-1',
        'transition-all duration-300',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2',
      ].join(' ')}
    >
      {/* Badge */}
      <span className="absolute top-5 right-5 inline-flex items-center h-5 px-2 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
        {badge}
      </span>

      {/* Icon */}
      <div className="text-[var(--color-accent)] group-hover:scale-110 transition-transform duration-200 w-fit">
        {icon}
      </div>

      {/* Text */}
      <div>
        <h2 className="text-lg md:text-xl font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors mb-2">
          {title}
        </h2>
        <p className="text-[14px] text-[var(--color-text-secondary)] leading-relaxed">
          {description}
        </p>
      </div>

      {/* CTA */}
      <div className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-accent)] opacity-0 group-hover:opacity-100 transition-opacity duration-200 -mb-1">
        Explorar
        <svg className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  )
}

// ── Icons ────────────────────────────────────────────────────────────────

const FunctionalIcon = () => (
  <svg width="30" height="30" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.4}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const NonFunctionalIcon = () => (
  <svg width="30" height="30" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.4}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
)

const MapIcon = () => (
  <svg width="30" height="30" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.4}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
)

// ── Page ──────────────────────────────────────────────────────────────────

export function RequirementTypeSelectionPage() {
  const { projectId: routeProjectId } = useParams()
  const { projectId: contextProjectId } = useProject()
  const navigate = useNavigate()

  const projectId = routeProjectId ?? contextProjectId ?? ''

  if (!isValidProjectId(projectId)) {
    return <NoProjectSelected message="Selecciona un proyecto para gestionar sus requisitos." />
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[var(--color-bg)]">
      <div className="max-w-4xl mx-auto w-full px-6 md:px-8 pt-12 pb-20">

        {/* Header */}
        <div className="mb-10">
          <span
            className="text-[11px] font-mono font-medium uppercase tracking-[0.16em] text-[var(--color-accent)]"
          >
            // requisitos
          </span>
          <h1 className="mt-1.5 text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--color-text-primary)] leading-tight">
            Requisitos
          </h1>
          <p className="mt-2.5 text-base text-[var(--color-text-secondary)] leading-relaxed max-w-xl">
            Selecciona el tipo de requisito que deseas gestionar.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <OptionCard
            title="Requisitos funcionales"
            description="Gestiona comportamientos, acciones y funcionalidades del sistema. Define qué debe hacer el sistema."
            icon={<FunctionalIcon />}
            badge="RF"
            onClick={() => navigate(`/app/projects/${projectId}/requirements/functional`)}
          />
          <OptionCard
            title="Requisitos no funcionales"
            description="Define calidad, seguridad, rendimiento, usabilidad y restricciones del sistema."
            icon={<NonFunctionalIcon />}
            badge="RNF"
            onClick={() => navigate(`/app/projects/${projectId}/requirements/non-functional`)}
          />
          <OptionCard
            title="Mapa de requisitos"
            description="Visualiza la trazabilidad completa entre requisitos funcionales y no funcionales."
            icon={<MapIcon />}
            badge="MAPA"
            onClick={() => navigate(`/app/projects/${projectId}/requirements/map`)}
          />
        </div>
      </div>
    </div>
  )
}

export default RequirementTypeSelectionPage
