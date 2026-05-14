import type { DiagramRelationDTO, DiagramUseCaseRelationshipType } from '../../types/diagrams'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'

interface UseCaseEdgeEditorProps {
  edge: DiagramRelationDTO
  sourceName: string
  targetName: string
  onChange: (edge: DiagramRelationDTO) => void
  onDelete: (id: string) => void
}

export function UseCaseEdgeEditor({
  edge,
  sourceName,
  targetName,
  onChange,
  onDelete,
}: UseCaseEdgeEditorProps) {
  const currentType = (edge.data?.relationshipType as DiagramUseCaseRelationshipType) || 'ASSOCIATION'

  const handleTypeChange = (type: DiagramUseCaseRelationshipType) => {
    onChange({
      ...edge,
      data: {
        ...edge.data!,
        relationshipType: type,
        // Clear label if switching to include/extend since they have auto-labels
        label: (type === 'INCLUDE' || type === 'EXTEND') ? '' : edge.data?.label
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-app-accent/10 text-app-accent flex items-center justify-center">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-app-text-primary">Propiedades de Relación</h3>
          <p className="text-xs text-app-text-muted">Define cómo interactúan estos elementos.</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Read-only Source/Target */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-app-text-muted ml-1">Origen</label>
            <div className="px-3 py-2 rounded-xl bg-app-surface border border-app-border text-xs font-medium text-app-text-secondary truncate">
              {sourceName}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-app-text-muted ml-1">Destino</label>
            <div className="px-3 py-2 rounded-xl bg-app-surface border border-app-border text-xs font-medium text-app-text-secondary truncate">
              {targetName}
            </div>
          </div>
        </div>

        {/* Relationship Type Select */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-app-text-muted ml-1">Tipo de Relación</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'ASSOCIATION', label: 'Asociación' },
              { id: 'INCLUDE', label: 'Incluye (<<include>>)' },
              { id: 'EXTEND', label: 'Extiende (<<extend>>)' },
              { id: 'GENERALIZATION', label: 'Generalización' },
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => handleTypeChange(type.id as DiagramUseCaseRelationshipType)}
                className={`px-3 py-2 rounded-xl border text-[11px] font-bold transition-all ${
                  currentType === type.id
                    ? 'bg-app-accent border-app-accent text-white shadow-lg shadow-app-accent/20'
                    : 'bg-app-surface border-app-border text-app-text-secondary hover:border-app-accent/50'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Label - only if not include/extend */}
        {currentType !== 'INCLUDE' && currentType !== 'EXTEND' && (
          <Input
            label="Etiqueta"
            value={edge.data?.label || ''}
            onChange={(e) => onChange({ ...edge, data: { ...edge.data!, label: e.target.value } })}
            placeholder="Ej: Inicia sesión"
          />
        )}

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-app-text-muted ml-1">Descripción</label>
          <textarea
            className="w-full min-h-[80px] p-4 rounded-2xl bg-app-surface border border-app-border text-sm text-app-text-primary focus:border-app-accent outline-none transition-all resize-none"
            value={edge.data?.description || ''}
            onChange={(e) => onChange({ ...edge, data: { ...edge.data!, description: e.target.value } })}
            placeholder="Anota detalles sobre esta relación..."
          />
        </div>
      </div>

      <div className="pt-4 border-t border-app-border">
        <Button
          variant="secondary"
          className="w-full border-rose-200 text-rose-600 hover:bg-rose-50"
          onClick={() => onDelete(edge.id)}
        >
          Eliminar Relación
        </Button>
      </div>
    </div>
  )
}
