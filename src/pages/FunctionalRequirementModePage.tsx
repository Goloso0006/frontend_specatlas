import { useParams, useNavigate } from 'react-router-dom'
import { useProject, isValidProjectId } from '../context/ProjectContext'
import { NoProjectSelected } from '../components/ui/NoProjectSelected'

// ── Reusable option card ───────────────────────────────────────────────────

interface ModeCardProps {
  title: string
  description: string
  icon: React.ReactNode
  tag: string
  tagColor?: string
  onClick: () => void
}

function ModeCard({ title, description, icon, tag, tagColor = 'bg-[var(--color-surface)]', onClick }: ModeCardProps) {
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
      {/* Tag */}
      <span className={`absolute top-5 right-5 inline-flex items-center h-5 px-2 rounded-md text-[10px] font-bold uppercase tracking-wider ${tagColor} text-[var(--color-text-muted)] border border-[var(--color-border)]`}>
        {tag}
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
        Seleccionar
        <svg className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────

const AIIcon = () => (
  <svg width="30" height="30" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.4}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
)

const ManualIcon = () => (
  <svg width="30" height="30" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.4}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

// ── Page ─────────────────────────────────────────────────────────────────

export function FunctionalRequirementModePage() {
  const { projectId: routeProjectId } = useParams()
  const { projectId: contextProjectId } = useProject()
  const navigate = useNavigate()

  const projectId = routeProjectId ?? contextProjectId ?? ''

  if (!isValidProjectId(projectId)) {
    return <NoProjectSelected message="Selecciona un proyecto para continuar." />
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[var(--color-bg)]">
      <div className="max-w-4xl mx-auto w-full px-6 md:px-8 pt-12 pb-20">

        {/* Header */}
        <div className="mb-10">
          <span className="text-[11px] font-mono font-medium uppercase tracking-[0.16em] text-[var(--color-accent)]">
            // requisitos funcionales
          </span>
          <h1 className="mt-1.5 text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--color-text-primary)] leading-tight">
            Requisitos funcionales
          </h1>
          <p className="mt-2.5 text-base text-[var(--color-text-secondary)] leading-relaxed max-w-xl">
            Elige cómo deseas crear o gestionar los requisitos funcionales.
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-5 md:grid-cols-2">
          <ModeCard
            title="Crear con IA desde texto"
            description="Pega notas de reunión, entrevistas o conversaciones con el cliente y deja que SpecAtlas estructure los requisitos automáticamente."
            icon={<AIIcon />}
            tag="IA"
            onClick={() => navigate(`/app/projects/${projectId}/requirements/functional/ai`)}
          />
          <ModeCard
            title="Crear manualmente"
            description="Redacta y administra requisitos funcionales de forma directa. Control total sobre cada campo del requisito."
            icon={<ManualIcon />}
            tag="Manual"
            onClick={() => navigate(`/app/projects/${projectId}/requirements/functional/manual`)}
          />
        </div>


      </div>
    </div>
  )
}

export default FunctionalRequirementModePage
