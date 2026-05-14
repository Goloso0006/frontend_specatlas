
import type { DiagramNodeDTO } from '../../types/diagrams'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

interface UseCaseNodeEditorProps {
  node: DiagramNodeDTO
  type: 'actor' | 'useCase'
  onChange: (node: DiagramNodeDTO) => void
  onDelete: (id: string) => void
}

export function UseCaseNodeEditor({
  node,
  type,
  onChange,
  onDelete,
}: UseCaseNodeEditorProps) {
  if (!node) return null
  const isActor = type === 'actor'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActor ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
          {isActor ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        <div>
          <h3 className="text-lg font-bold text-app-text-primary">
            {isActor ? 'Propiedades del Actor' : 'Propiedades del Caso de Uso'}
          </h3>
          <p className="text-xs text-app-text-muted">
            {isActor ? 'Define el rol de quien interactúa.' : 'Define una funcionalidad del sistema.'}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <Input
          label="Nombre"
          value={node.name}
          onChange={(e) => onChange({ ...node, name: e.target.value })}
          placeholder={isActor ? 'Ej: Cliente' : 'Ej: Reservar cita'}
        />
        
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-app-text-muted ml-1">
            Descripción
          </label>
          <textarea
            className="w-full min-h-[100px] p-4 rounded-2xl bg-app-surface border border-app-border text-sm text-app-text-primary focus:border-app-accent outline-none transition-all resize-none"
            value={node.description || ''}
            onChange={(e) => onChange({ ...node, description: e.target.value })}
            placeholder={isActor ? 'Describe quién es este actor...' : 'Describe qué hace este caso de uso...'}
          />
        </div>
      </div>

      <div className="pt-4 border-t border-app-border">
        <Button
          variant="secondary"
          className="w-full border-rose-200 text-rose-600 hover:bg-rose-50"
          onClick={() => onDelete(node.id)}
        >
          Eliminar {isActor ? 'Actor' : 'Caso de Uso'}
        </Button>
      </div>
    </div>
  )
}
