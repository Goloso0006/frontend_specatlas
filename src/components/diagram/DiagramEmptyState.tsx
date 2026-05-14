import { Button } from '../ui/Button'

interface DiagramEmptyStateProps {
  onCreateFirst: () => void
}

export function DiagramEmptyState({ onCreateFirst }: DiagramEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-[var(--color-border)] rounded-2xl bg-[var(--color-bg-card)]/50">
      <div className="w-16 h-16 rounded-full bg-[var(--color-accent-subtle)] flex items-center justify-center mb-6">
        <svg className="w-8 h-8 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
        No hay diagramas creados todavía
      </h3>
      <p className="text-[var(--color-text-secondary)] text-center max-w-sm mb-8">
        Comienza modelando tu sistema eligiendo un tipo de diagrama arriba o genera uno automáticamente con IA.
      </p>
      <Button 
        onClick={onCreateFirst}
        className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white px-8 h-11"
      >
        Crear primer diagrama
      </Button>
    </div>
  )
}
