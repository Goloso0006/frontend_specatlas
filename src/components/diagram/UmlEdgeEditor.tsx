import type {
  DiagramRelationDTO,
  DiagramRelationshipType,
  DiagramUseCaseRelationshipType
} from '../../types/diagrams'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

// Configuración de tipos de relación con iconos y descripciones
const relationshipConfig: Record<DiagramRelationshipType | DiagramUseCaseRelationshipType, { label: string; icon: string; description: string }> = {
  ASSOCIATION: { label: 'Asociación', icon: '🔗', description: 'Relación estructural entre clases' },
  AGGREGATION: { label: 'Agregación', icon: '◇', description: 'Relación "todo-parte" débil' },
  COMPOSITION: { label: 'Composición', icon: '◆', description: 'Relación "todo-parte" fuerte' },
  INHERITANCE: { label: 'Herencia', icon: '△', description: 'Generalización / Especialización' },
  IMPLEMENTATION: { label: 'Implementación', icon: '⊳', description: 'Realización de interfaz' },
  DEPENDENCY: { label: 'Dependencia', icon: '⇢', description: 'Relación de uso temporal' },
  INCLUDE: { label: 'Include', icon: '→', description: 'Inclusión de caso de uso' },
  EXTEND: { label: 'Extend', icon: '⇢', description: 'Extensión de caso de uso' },
  GENERALIZATION: { label: 'Generalización', icon: '△', description: 'Generalización de actor/uso' }
}

interface UmlEdgeEditorProps {
  edge: DiagramRelationDTO
  sourceName: string
  targetName: string
  onChange: (edge: DiagramRelationDTO) => void
  onDelete: (id: string) => void
}

export function UmlEdgeEditor({
  edge,
  sourceName,
  targetName,
  onChange,
  onDelete
}: UmlEdgeEditorProps) {
  const relationshipType = edge.data?.relationshipType || 'ASSOCIATION'

  const handleTypeChange = (newType: DiagramRelationshipType) => {
    onChange({
      ...edge,
      data: {
        ...(edge.data || { label: '', sourceMultiplicity: '1', targetMultiplicity: '1' }),
        relationshipType: newType
      }
    })
  }

  const handleDataChange = (changes: Partial<NonNullable<DiagramRelationDTO['data']>>) => {
    onChange({
      ...edge,
      data: {
        ...(edge.data || { relationshipType: 'ASSOCIATION', label: '', sourceMultiplicity: '1', targetMultiplicity: '1' }),
        ...changes
      }
    })
  }

  return (
    <div className="space-y-5">
      {/* Cabecera con tipo de relación e ID */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">{relationshipConfig[relationshipType].icon}</span>
            <h3 className="text-base font-semibold text-app-text-primary">
              {relationshipConfig[relationshipType].label}
            </h3>
          </div>
          <p className="text-xs text-app-text-muted mt-0.5">
            {relationshipConfig[relationshipType].description}
          </p>
          <p className="text-[10px] font-mono text-app-text-muted/70 mt-1">ID: {edge.id}</p>
        </div>
      </div>

      {/* Extremos de la relación (origen → destino) */}
      <div className="bg-app-surface/30 rounded-xl border border-app-border p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 text-center">
            <span className="text-[10px] uppercase font-bold text-app-text-muted block mb-1">Origen</span>
            <p className="text-sm font-medium text-app-text-primary truncate px-2 py-1 bg-app-surface rounded-md">
              {sourceName}
            </p>
          </div>
          <div className="text-app-accent text-xl font-light">→</div>
          <div className="flex-1 text-center">
            <span className="text-[10px] uppercase font-bold text-app-text-muted block mb-1">Destino</span>
            <p className="text-sm font-medium text-app-text-primary truncate px-2 py-1 bg-app-surface rounded-md">
              {targetName}
            </p>
          </div>
        </div>
      </div>

      {/* Selector de tipo de relación mejorado */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-app-text-muted flex items-center gap-1">
          <span>Tipo de relación</span>
          <span className="text-app-accent text-[10px]">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(relationshipConfig).map(([type, config]) => (
            <button
              key={type}
              type="button"
              onClick={() => handleTypeChange(type as DiagramRelationshipType)}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all
                ${relationshipType === type
                  ? 'border-app-accent bg-app-accent/10 text-app-accent ring-1 ring-app-accent/30'
                  : 'border-app-border bg-app-surface hover:bg-app-surface/80 text-app-text-secondary'}
              `}
            >
              <span className="text-base">{config.icon}</span>
              <span className="text-sm font-medium">{config.label}</span>
            </button>
          ))}
        </div>
        <p className="text-[11px] text-app-text-muted mt-1">
          {relationshipConfig[relationshipType].description}
        </p>
      </div>

      {/* Etiqueta de la relación */}
      <Input
        label="Etiqueta (opcional)"
        value={edge.data?.label || ''}
        onChange={(e) => handleDataChange({ label: e.target.value })}
        placeholder="Ej. realiza, contiene, hereda de..."
        className="bg-app-surface"
      />

      {/* Multiplicidades en layout de dos columnas */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-app-text-muted block mb-1">
            Multiplicidad origen
          </label>
          <input
            type="text"
            value={edge.data?.sourceMultiplicity || ''}
            onChange={(e) => handleDataChange({ sourceMultiplicity: e.target.value })}
            placeholder="Ej. 1, 0..1, 0..*"
            className="w-full bg-app-surface border border-app-border rounded-lg px-3 py-2 text-sm focus:border-app-accent focus:ring-1 focus:ring-app-accent/30 outline-none transition-all"
          />
          <p className="text-[10px] text-app-text-muted mt-1">Cantidad de instancias del origen</p>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-app-text-muted block mb-1">
            Multiplicidad destino
          </label>
          <input
            type="text"
            value={edge.data?.targetMultiplicity || ''}
            onChange={(e) => handleDataChange({ targetMultiplicity: e.target.value })}
            placeholder="Ej. 1, 0..1, 0..*"
            className="w-full bg-app-surface border border-app-border rounded-lg px-3 py-2 text-sm focus:border-app-accent focus:ring-1 focus:ring-app-accent/30 outline-none transition-all"
          />
          <p className="text-[10px] text-app-text-muted mt-1">Cantidad de instancias del destino</p>
        </div>
      </div>

      {/* Botón de eliminación con advertencia */}
      <div className="pt-4 border-t border-app-border">
        <Button
          variant="destructive"
          className="w-full flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
          onClick={() => onDelete(edge.id)}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Eliminar relación
        </Button>
        <p className="text-[10px] text-center text-app-text-muted mt-2">
          Esta acción es irreversible
        </p>
      </div>
    </div>
  )
}