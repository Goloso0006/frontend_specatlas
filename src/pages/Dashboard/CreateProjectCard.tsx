interface CreateProjectCardProps {
  onClick: () => void
}

export function CreateProjectCard({ onClick }: CreateProjectCardProps) {
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col items-center justify-center h-56 w-full rounded-xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-bg-card)] hover:border-[var(--color-accent)] hover:shadow-lg transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-subtle)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg)] overflow-hidden"
      aria-label="Crear nuevo proyecto"
    >
      <div className="absolute inset-0 bg-[var(--color-accent-subtle)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-[var(--color-accent-subtle)] flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
          <svg className="w-8 h-8 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <span className="text-lg font-medium text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors">
          Nuevo Proyecto
        </span>
        <span className="text-sm text-[var(--color-text-muted)] mt-1">Crea un nuevo espacio de trabajo</span>
      </div>
    </button>
  )
}

export default CreateProjectCard