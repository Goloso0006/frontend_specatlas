interface CreateProjectCardProps {
  onClick: () => void
}

export function CreateProjectCard({ onClick }: CreateProjectCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="project-card-surface group relative flex h-64 w-full flex-col justify-between overflow-hidden p-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]"
      aria-label="Crear nuevo proyecto"
    >
      <div className="relative z-10">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-accent-subtle)] text-[var(--color-accent)] transition group-hover:scale-105">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <span className="block text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Nuevo proyecto
        </span>
        <span className="mt-2 block max-w-[15rem] text-sm leading-6 text-[var(--color-text-secondary)]">
          Crea un espacio para requisitos, reglas ISO y diagramas del sistema.
        </span>
      </div>
      <span className="relative z-10 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-accent)]">
        Empezar ahora
        <svg className="h-4 w-4 transition group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m-6-6 6 6-6 6" />
        </svg>
      </span>
    </button>
  )
}

export default CreateProjectCard