interface DashboardHeaderProps {
  projectCount: number
  activeCount: number
}

export function DashboardHeader({ projectCount, activeCount }: DashboardHeaderProps) {
  return (
    <div className="mb-12 flex flex-col items-start gap-1">
      <span className="sa-hero-eyebrow">// workspace</span>
      <h1 className="sa-hero-title">
        Tus <span>proyectos</span>
      </h1>
      <p className="sa-hero-sub mt-2">
        Gestiona, analiza y organiza tus arquitecturas de software con precisión.
      </p>
      <div className="sa-stats mt-5">
        <div className="sa-stat">
          <span className="sa-stat-num">{projectCount}</span>
          proyectos
        </div>
        <div className="sa-stat">
          <span className="sa-stat-num">{activeCount}</span>
          activos
        </div>
      </div>
    </div>
  )
}

export default DashboardHeader