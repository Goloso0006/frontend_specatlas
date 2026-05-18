import { useState } from 'react'
import type { DiagramRelationDTO, DiagramUseCaseRelationshipType, DiagramNodeDTO } from '../../types/diagrams'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'

interface UseCaseEdgeEditorProps {
  edge: DiagramRelationDTO
  sourceName: string
  targetName: string
  nodes: DiagramNodeDTO[]
  onChange: (edge: DiagramRelationDTO) => void
  onDelete: (id: string) => void
}

const typeDescriptions: Record<DiagramUseCaseRelationshipType, string> = {
  ASSOCIATION: 'Asociación: Comunica la participación de un actor en un caso de uso.',
  INCLUDE: 'Incluye (<<include>>): El caso de uso origen contiene obligatoriamente el comportamiento del destino.',
  EXTEND: 'Extiende (<<extend>>): El caso de uso destino puede ampliar opcionalmente al origen en ciertos puntos.',
  GENERALIZATION: 'Generalización: Relación de herencia para actores o casos de uso más especializados.'
}

export function UseCaseEdgeEditor({
  edge,
  sourceName,
  targetName,
  nodes,
  onChange,
  onDelete,
}: UseCaseEdgeEditorProps) {
  const [showAdvancedWaypoints, setShowAdvancedWaypoints] = useState(false)
  const currentType = ((edge.data?.relationshipType || edge.data?.relationshipType) as DiagramUseCaseRelationshipType) || 'ASSOCIATION'

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

  const handleDataChange = (changes: Partial<NonNullable<DiagramRelationDTO['data']>>) => {
    onChange({
      ...edge,
      data: {
        ...(edge.data || { relationshipType: 'ASSOCIATION' }),
        ...changes
      }
    })
  }

  // ── SEMANTIC WARNINGS & QUICK FIXES ──
  const warnings: string[] = []
  const quickFixes: { label: string; action: () => void }[] = []

  const sourceNode = nodes.find(n => n.id === edge.source)
  const targetNode = nodes.find(n => n.id === edge.target)
  const sKind = sourceNode?.kind
  const tKind = targetNode?.kind

  if (currentType === 'ASSOCIATION') {
    if (sKind === 'useCase' && tKind === 'useCase') {
      warnings.push('Una asociación directa entre casos de uso puede ser ambigua.')
      quickFixes.push({
        label: 'Cambiar a Incluye (<<include>>)',
        action: () => handleTypeChange('INCLUDE')
      })
      quickFixes.push({
        label: 'Cambiar a Extiende (<<extend>>)',
        action: () => handleTypeChange('EXTEND')
      })
    }
  }

  if (currentType === 'INCLUDE' || currentType === 'EXTEND') {
    if (sKind === 'actor' || tKind === 'actor') {
      warnings.push(`La relación ${currentType.toLowerCase()} debe conectar únicamente casos de uso (UC -> UC).`)
      quickFixes.push({
        label: 'Cambiar a Asociación estándar',
        action: () => handleTypeChange('ASSOCIATION')
      })
    }
  }

  if (currentType === 'GENERALIZATION') {
    if (sKind !== tKind) {
      warnings.push('La generalización normalmente conecta elementos del mismo tipo (Actor-Actor o UC-UC).')
      quickFixes.push({
        label: 'Cambiar a Asociación estándar',
        action: () => handleTypeChange('ASSOCIATION')
      })
    }
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

      {/* ── SECCIÓN DE ADVERTENCIAS Y QUICK FIXES ── */}
      {warnings.length > 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-start gap-2.5">
            <span className="text-base text-amber-500">⚠️</span>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                Advertencias de Diseño ({warnings.length})
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
                Acciones de Corrección Rápida:
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

      <div className="space-y-4">
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
          <p className="text-[11px] text-app-text-muted mt-1 leading-relaxed bg-zinc-50 dark:bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800">
            {typeDescriptions[currentType]}
          </p>
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

        {/* Extension Point Ref - specifically useful for EXTEND */}
        {currentType === 'EXTEND' && (
          <Input
            label="Punto de Extensión (Opcional)"
            value={(edge.data as any)?.extensionPointRef || ''}
            onChange={(e) => handleDataChange({ extensionPointRef: e.target.value } as any)}
            placeholder="Ej. login_error, stock_alert"
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

      {/* Puntos de Ruta (Manual Route Waypoints) */}
      <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-app-text-muted">Puntos de Ruta (Ruta Manual)</span>
          {((edge.data?.waypoints || []) as any[]).length > 0 && (
            <button 
              type="button"
              onClick={() => onChange({ ...edge, data: { ...edge.data!, waypoints: [] } })}
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
              className="text-[11px] font-bold text-blue-500 hover:text-blue-655 transition-colors flex items-center gap-1 w-full justify-center bg-blue-500/5 hover:bg-blue-500/10 py-1.5 rounded-xl border border-blue-500/10"
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
                          onChange({ ...edge, data: { ...edge.data!, waypoints: next } })
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
                          onChange({ ...edge, data: { ...edge.data!, waypoints: next } })
                        }}
                        className="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded font-mono text-center text-xs"
                      />
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        const next = (edge.data?.waypoints || []).filter((_, idx) => idx !== index)
                        onChange({ ...edge, data: { ...edge.data!, waypoints: next } })
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
              onChange({ ...edge, data: { ...edge.data!, waypoints: [...current, newPoint] } })
            }}
          >
            + Agregar Punto de Ruta
          </Button>
        </div>
      </div>

      <div className="pt-4 border-t border-app-border">
        <Button
          variant="destructive"
          className="w-full flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
          onClick={() => onDelete(edge.id)}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Eliminar Relación
        </Button>
      </div>
    </div>
  )
}
