import { Button } from '../ui/Button'

interface UnsupportedDiagramViewProps {
  onBack: () => void
}

export function UnsupportedDiagramView({ onBack }: UnsupportedDiagramViewProps) {
  return (
    <div className="flex-1 flex items-center justify-center bg-(--color-bg)">
      <div className="text-center p-8 bg-(--color-bg-card) rounded-2xl border border-(--color-border) max-w-md">
        <div className="w-16 h-16 rounded-full bg-(--color-accent-subtle) text-(--color-accent) flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-(--color-text-primary) mb-2">Tipo de diagrama no soportado</h2>
        <p className="text-(--color-text-secondary) mb-6">Solo se pueden crear diagramas de Clases o de Casos de Uso en esta fase.</p>
        <Button onClick={onBack}>Volver a la biblioteca</Button>
      </div>
    </div>
  )
}
