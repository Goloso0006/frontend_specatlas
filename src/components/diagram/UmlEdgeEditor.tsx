import { useState } from 'react'
import type {
  DiagramNodeDTO,
  DiagramRelationDTO,
  DiagramRelationshipType
} from '../../types/diagrams'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

// Configuración de tipos de relación con iconos y descripciones
const relationshipConfig: Record<DiagramRelationshipType, { label: string; icon: string; description: string }> = {
  ASSOCIATION: { label: 'Asociación', icon: '🔗', description: 'Relación estructural entre clases' },
  AGGREGATION: { label: 'Agregación', icon: '◇', description: 'Relación "todo-parte" débil' },
  COMPOSITION: { label: 'Composición', icon: '◆', description: 'Relación "todo-parte" fuerte' },
  INHERITANCE: { label: 'Herencia', icon: '△', description: 'Generalización / Especialización' },
  IMPLEMENTATION: { label: 'Implementación', icon: '⊳', description: 'Realización de interfaz' },
  DEPENDENCY: { label: 'Dependencia', icon: '⇢', description: 'Relación de uso temporal' }
}

interface UmlEdgeEditorProps {
  edge: DiagramRelationDTO
  sourceName: string
  targetName: string
  nodes: DiagramNodeDTO[]
  onChange: (edge: DiagramRelationDTO) => void
  onDelete: (id: string) => void
}

export function UmlEdgeEditor({
  edge,
  sourceName,
  targetName,
  nodes,
  onChange,
  onDelete
}: UmlEdgeEditorProps) {
  const [showAdvancedWaypoints, setShowAdvancedWaypoints] = useState(false)
  const relationshipType = (edge.data?.relationshipType || 'ASSOCIATION') as DiagramRelationshipType

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

  // ── SEMANTIC WARNINGS & QUICK FIXES ──
  const warnings: string[] = []
  const quickFixes: { label: string; action: () => void }[] = []

  const targetNode = nodes.find(n => n.id === edge.target) as any
  const sourceNode = nodes.find(n => n.id === edge.source) as any

  if (relationshipType === 'INHERITANCE' && edge.source === edge.target) {
    warnings.push('Una clase no puede heredar de sí misma (herencia reflexiva).')
  }

  if (relationshipType === 'IMPLEMENTATION' && targetNode && targetNode.umlType !== 'INTERFACE') {
    warnings.push('Una implementación normalmente debe apuntar hacia una interfaz.')
    quickFixes.push({
      label: 'Cambiar relación a Dependencia',
      action: () => handleTypeChange('DEPENDENCY')
    })
    
    // Check if there is any interface in the diagram to offer targeting
    const interfaces = nodes.filter(n => (n as any).umlType === 'INTERFACE')
    if (interfaces.length > 0) {
      quickFixes.push({
        label: `Redirigir destino a la interfaz '${interfaces[0].name}'`,
        action: () => {
          onChange({
            ...edge,
            target: interfaces[0].id
          })
        }
      })
    }
  }

  if (relationshipType === 'INHERITANCE' && (sourceNode?.umlType === 'ENUM' || targetNode?.umlType === 'ENUM')) {
    warnings.push('La herencia no suele aplicarse a enumeraciones.')
    quickFixes.push({
      label: 'Cambiar relación a Dependencia',
      action: () => handleTypeChange('DEPENDENCY')
    })
  }

  if (relationshipType === 'COMPOSITION' && targetNode?.umlType === 'INTERFACE') {
    warnings.push('Una composición normalmente no debería apuntar hacia una interfaz.')
  }

  // Duplicate Check

  return (
    <div className="space-y-5">
      {/* Cabecera con tipo de relación */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">{relationshipConfig[relationshipType]?.icon || '🔗'}</span>
            <h3 className="text-base font-semibold text-app-text-primary">
              {relationshipConfig[relationshipType]?.label || 'Relación'}
            </h3>
          </div>
          <p className="text-xs text-app-text-muted mt-0.5">
            {relationshipConfig[relationshipType]?.description || 'Relación entre clases UML'}
          </p>
          <p className="text-[10px] font-mono text-app-text-muted/70 mt-1">ID: {edge.id}</p>
        </div>
      </div>

      {/* ── SECCIÓN DE ADVERTENCIAS Y QUICK FIXES ── */}
      {warnings.length > 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start gap-2.5">
            <span className="text-base text-amber-500">⚠️</span>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                Advertencias UML ({warnings.length})
              </h4>
              <ul className="list-disc list-inside text-xs text-amber-600 dark:text-amber-300 mt-1 space-y-1">
                {warnings.map((warn, i) => (
                  <li key={i}>{warn}</li>
                ))}
              </ul>
            </div>
          </div>
          {quickFixes.length > 0 && (
            <div className="pt-2.5 border-t border-amber-500/20 space-y-2">
              <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block">
                Corrección Rápida (Quick Fix):
              </span>
              <div className="flex flex-col gap-1.5">
                {quickFixes.map((fix, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={fix.action}
                    className="w-full text-left px-3 py-2 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/30 text-xs font-semibold text-amber-700 dark:text-amber-300 rounded-lg transition-all active:scale-[0.99]"
                  >
                    💡 {fix.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Extremos de la relación (origen → destino) y Handles */}
      <div className="bg-app-surface/30 rounded-xl border border-app-border p-4 space-y-4">
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

        {/* Handle Selectors */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-app-border/40">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-app-text-muted block mb-1">
              Enlace Origen
            </label>
            <select
              value={edge.sourceHandle || 'auto'}
              onChange={(e) => {
                const val = e.target.value === 'auto' ? null : e.target.value
                onChange({ ...edge, sourceHandle: val })
              }}
              className="w-full bg-app-surface border border-app-border rounded-lg px-2.5 py-1.5 text-xs text-app-text-primary focus:border-app-accent outline-none"
            >
              <option value="auto">Automático</option>
              <option value="top">Superior (Arriba)</option>
              <option value="bottom">Inferior (Abajo)</option>
              <option value="left">Izquierda</option>
              <option value="right">Derecha</option>
              <option value="top-left">Esquina Sup-Izq</option>
              <option value="top-right">Esquina Sup-Der</option>
              <option value="bottom-left">Esquina Inf-Izq</option>
              <option value="bottom-right">Esquina Inf-Der</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-app-text-muted block mb-1">
              Enlace Destino
            </label>
            <select
              value={edge.targetHandle || 'auto'}
              onChange={(e) => {
                const val = e.target.value === 'auto' ? null : e.target.value
                onChange({ ...edge, targetHandle: val })
              }}
              className="w-full bg-app-surface border border-app-border rounded-lg px-2.5 py-1.5 text-xs text-app-text-primary focus:border-app-accent outline-none"
            >
              <option value="auto">Automático</option>
              <option value="top">Superior (Arriba)</option>
              <option value="bottom">Inferior (Abajo)</option>
              <option value="left">Izquierda</option>
              <option value="right">Derecha</option>
              <option value="top-left">Esquina Sup-Izq</option>
              <option value="top-right">Esquina Sup-Der</option>
              <option value="bottom-left">Esquina Inf-Izq</option>
              <option value="bottom-right">Esquina Inf-Der</option>
            </select>
          </div>
        </div>
      </div>

      {/* Selector de tipo de relación */}
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
              <span className="text-xs font-medium">{config.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Etiqueta de la relación */}
      <Input
        label="Etiqueta (opcional)"
        value={edge.data?.label || ''}
        onChange={(e) => handleDataChange({ label: e.target.value })}
        placeholder="Ej. realiza, contiene, hereda de..."
        className="bg-app-surface"
      />

      {/* Navigability */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-app-text-muted block mb-1">
          Navegabilidad
        </label>
        <select
          value={(edge.data as any)?.navigability || 'BOTH'}
          onChange={(e) => handleDataChange({ navigability: e.target.value } as any)}
          className="w-full bg-app-surface border border-app-border rounded-lg px-3 py-2 text-sm focus:border-app-accent outline-none text-app-text-primary"
        >
          <option value="BOTH">Bidireccional (Ambas)</option>
          <option value="NAVIGABLE">Unidireccional (Origen a Destino)</option>
          <option value="NONE">No navegable</option>
        </select>
      </div>

      {/* Multiplicidades */}
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
            className="w-full bg-app-surface border border-app-border rounded-lg px-3 py-2 text-sm focus:border-app-accent outline-none text-app-text-primary"
          />
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
            className="w-full bg-app-surface border border-app-border rounded-lg px-3 py-2 text-sm focus:border-app-accent outline-none text-app-text-primary"
          />
        </div>
      </div>

      {/* Role Names */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-app-text-muted block mb-1">
            Rol Origen
          </label>
          <input
            type="text"
            value={(edge.data as any)?.sourceRole || ''}
            onChange={(e) => handleDataChange({ sourceRole: e.target.value } as any)}
            placeholder="Ej. admin, propietario"
            className="w-full bg-app-surface border border-app-border rounded-lg px-3 py-2 text-sm focus:border-app-accent outline-none text-app-text-primary"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-app-text-muted block mb-1">
            Rol Destino
          </label>
          <input
            type="text"
            value={(edge.data as any)?.targetRole || ''}
            onChange={(e) => handleDataChange({ targetRole: e.target.value } as any)}
            placeholder="Ej. usuarios, perfil"
            className="w-full bg-app-surface border border-app-border rounded-lg px-3 py-2 text-sm focus:border-app-accent outline-none text-app-text-primary"
          />
        </div>
      </div>

      {/* Puntos de Ruta (Manual Route Waypoints) */}
      <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-app-text-muted">Puntos de Ruta (Ruta Manual)</span>
          {((edge.data?.waypoints || []) as any[]).length > 0 && (
            <button 
              type="button"
              onClick={() => handleDataChange({ waypoints: [] })}
              className="text-[10px] text-rose-500 hover:text-rose-600 font-bold uppercase transition-colors"
            >
              Limpiar
            </button>
          )}
        </div>

        {((edge.data?.waypoints || []) as any[]).length > 0 ? (
          <div className="space-y-2">
            <p className="text-[10px] text-zinc-400 bg-zinc-50 dark:bg-slate-800/40 p-2 rounded-xl text-center italic">
              💡 Tip: Puedes arrastrar los puntos de control directamente en el lienzo.
            </p>
            <button
              type="button"
              onClick={() => setShowAdvancedWaypoints(!showAdvancedWaypoints)}
              className="text-[11px] font-bold text-blue-500 hover:text-blue-650 transition-colors flex items-center gap-1 w-full justify-center bg-blue-500/5 hover:bg-blue-500/10 py-1.5 rounded-xl border border-blue-500/10"
            >
              {showAdvancedWaypoints ? '▲ Ocultar ajuste preciso X/Y' : '▼ Mostrar ajuste preciso X/Y (Avanzado)'}
            </button>

            {showAdvancedWaypoints && (
              <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1 animate-in fade-in duration-200">
                {((edge.data?.waypoints || []) as any[]).map((wp: any, index: number) => (
                  <div key={index} className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-xl text-xs">
                    <span className="font-mono text-slate-400">P{index + 1}:</span>
                    <div className="flex items-center gap-1.5 flex-1">
                      <span className="text-[10px] text-slate-400 font-bold">X</span>
                      <input 
                        type="number"
                        value={wp.x}
                        onChange={(e) => {
                          const next = [...(edge.data?.waypoints || [])]
                          next[index] = { ...next[index], x: Number(e.target.value) }
                          handleDataChange({ waypoints: next })
                        }}
                        className="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded font-mono text-center text-xs"
                      />
                      <span className="text-[10px] text-slate-400 font-bold">Y</span>
                      <input 
                        type="number"
                        value={wp.y}
                        onChange={(e) => {
                          const next = [...(edge.data?.waypoints || [])]
                          next[index] = { ...next[index], y: Number(e.target.value) }
                          handleDataChange({ waypoints: next })
                        }}
                        className="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded font-mono text-center text-xs"
                      />
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        const next = (edge.data?.waypoints || []).filter((_, idx) => idx !== index)
                        handleDataChange({ waypoints: next })
                      }}
                      className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 p-1 rounded font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-[11px] text-slate-400 dark:text-slate-500 italic text-center py-1">
            Usa puntos de ruta para trazar líneas personalizadas y evitar solapamientos.
          </p>
        )}

        <div className="flex gap-2">
          <Button 
            type="button" 
            variant="secondary" 
            className="w-full text-xs py-1.5 font-bold"
            onClick={() => {
              const current = edge.data?.waypoints || []
              const newPoint = current.length > 0 
                ? { x: current[current.length - 1].x + 50, y: current[current.length - 1].y + 50 }
                : { x: 300, y: 300 }
              handleDataChange({ waypoints: [...current, newPoint] })
            }}
          >
            + Agregar Punto de Ruta
          </Button>
        </div>
      </div>

      {/* Botón de eliminación */}
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
      </div>
    </div>
  )
}