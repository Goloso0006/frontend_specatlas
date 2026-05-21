interface DashboardHeaderProps {
  projectCount: number
  activeCount: number
}

export function DashboardHeader({ projectCount, activeCount }: DashboardHeaderProps) {
  const inactiveCount = Math.max(projectCount - activeCount, 0)

  return (
    <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        <span className="sa-hero-eyebrow">SpecAtlas workspace</span>
        <h1 className="sa-hero-title mt-4">
          Tus <span>Proyectos</span>
        </h1>
        <p className="sa-hero-sub mt-4">
          Encuentra tus sistemas, continúa el modelado y mantén cada arquitectura documentada desde un solo tablero.
        </p>
      </div>

      <div className="sa-stats lg:justify-end">
        <div className="sa-stat">
          <span className="sa-stat-num">{projectCount}</span>
          total
        </div>
        <div className="sa-stat">
          <span className="sa-stat-num">{activeCount}</span>
          activos
        </div>
        <div className="sa-stat">
          <span className="sa-stat-num">{inactiveCount}</span>
          en pausa
        </div>
      </div>
    </header>
  )
}

export default DashboardHeader