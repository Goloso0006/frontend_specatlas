import type { DiagramSummaryResponse } from '../../types/diagrams'
import { Button } from '../ui/Button'

interface SavedDiagramCardProps {
  diagram: DiagramSummaryResponse
  onOpen: (id: string) => void
  onRename: (id: string) => void
  onDelete: (id: string) => void
}

export function SavedDiagramCard({ diagram, onOpen, onRename, onDelete }: SavedDiagramCardProps) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'CLASS': return 'Clases'
      case 'USE_CASE': return 'Casos de Uso'
      default: return type
    }
  }

  return (
    <div className="group flex flex-col p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] hover:border-[var(--color-accent)] hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-accent)] mb-1">
            {getTypeLabel(diagram.diagramType)}
          </span>
          <h3 className="text-md font-semibold text-[var(--color-text-primary)] line-clamp-1">
            {diagram.name}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <span className={`w-2 h-2 rounded-full ${diagram.mode === 'AUTO' ? 'bg-purple-500' : 'bg-emerald-500'}`} title={diagram.mode === 'AUTO' ? 'Generado por IA' : 'Manual'} />
        </div>
      </div>

      <div className="flex-1 space-y-2 mb-4">
        <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
          <span>Actualizado:</span>
          <span>{formatDate(diagram.updatedAt || diagram.createdAt)}</span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
          <span>Estado:</span>
          <span className="text-[var(--color-text-secondary)]">{diagram.mode === 'AUTO' ? 'IA' : 'Manual'}</span>
        </div>
      </div>

      <div className="flex gap-2 pt-3 border-t border-[var(--color-border)]">
        <Button 
          variant="secondary" 
          size="sm" 
          className="flex-1 text-[11px] h-8"
          onClick={() => onOpen(diagram.id)}
        >
          Abrir
        </Button>
        <button 
          onClick={() => onRename(diagram.id)}
          className="p-1.5 rounded-md hover:bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          title="Renombrar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button 
          onClick={() => onDelete(diagram.id)}
          className="p-1.5 rounded-md hover:bg-red-500/10 text-[var(--color-text-muted)] hover:text-red-500 transition-colors"
          title="Eliminar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  )
}
