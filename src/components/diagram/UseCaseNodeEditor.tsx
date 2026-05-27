import { useState } from 'react'
import type { DiagramNodeDTO } from '../../types/diagrams'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

interface UseCaseNodeEditorProps {
  node: DiagramNodeDTO
  type: 'actor' | 'useCase'
  onChange: (node: DiagramNodeDTO) => void
}

export function UseCaseNodeEditor({
  node,
  type,
  onChange,
}: UseCaseNodeEditorProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'traceability' | 'appearance'>('summary')
  const [newRequirementCode, setNewRequirementCode] = useState('')

  if (!node) return null
  const isActor = type === 'actor'

  const derived = Array.isArray(node.derivedFromRequirements) ? node.derivedFromRequirements : []

  const handleAddRequirement = () => {
    if (!newRequirementCode.trim()) return
    const code = newRequirementCode.trim()
    if (!derived.includes(code)) {
      onChange({
        ...node,
        derivedFromRequirements: [...derived, code],
      })
    }
    setNewRequirementCode('')
  }

  const handleRemoveRequirement = (code: string) => {
    onChange({
      ...node,
      derivedFromRequirements: derived.filter(c => c !== code),
    })
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300 flex flex-col h-full">
      {/* Header Info */}
      <div className="flex items-center gap-3 pb-2 border-b border-zinc-150 dark:border-zinc-800 shrink-0">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isActor ? 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'}`}>
          {isActor ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        <div className="truncate">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide truncate max-w-[180px]">
            {node.name || (isActor ? 'Nuevo Actor' : 'Nuevo Caso de Uso')}
          </h3>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-1 inline-block">
            {isActor ? 'ACTOR' : 'CASO DE USO'}
          </span>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-2 shrink-0 select-none">
        <button
          onClick={() => setActiveTab('summary')}
          className={`py-2 px-2 text-xs font-bold text-center border-b-2 transition-all truncate flex-1 ${activeTab === 'summary' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Resumen
        </button>

        <button
          onClick={() => setActiveTab('traceability')}
          className={`py-2 px-2 text-xs font-bold text-center border-b-2 transition-all truncate flex-1 ${activeTab === 'traceability' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Trazabilidad ({derived.length})
        </button>

        <button
          onClick={() => setActiveTab('appearance')}
          className={`py-2 px-2 text-xs font-bold text-center border-b-2 transition-all truncate flex-1 ${activeTab === 'appearance' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Apariencia
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === 'summary' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <Input
              label="Nombre"
              value={node.name}
              onChange={(e) => onChange({ ...node, name: e.target.value })}
              placeholder={isActor ? 'Ej: Cliente' : 'Ej: Reservar cita'}
              maxLength={50}
            />
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Descripción
              </label>
              <textarea
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:border-blue-500 outline-none min-h-[100px] resize-none"
                value={node.description || ''}
                onChange={(e) => onChange({ ...node, description: e.target.value })}
                placeholder={isActor ? 'Describe quién es este actor...' : 'Describe qué hace este caso de uso...'}
                maxLength={100}
              />
            </div>
          </div>
        )}

        {activeTab === 'traceability' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex gap-2">
              <Input
                label="Código de Requisito"
                value={newRequirementCode}
                onChange={e => setNewRequirementCode(e.target.value)}
                placeholder="Ej. RF-001"
                className="flex-1"
                maxLength={20}
              />
              <div className="flex items-end pb-0.5">
                <Button onClick={handleAddRequirement} disabled={!newRequirementCode.trim()}>
                  Agregar
                </Button>
              </div>
            </div>

            <div className="space-y-2 border-t border-zinc-100 dark:border-zinc-900 pt-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Requisitos Vinculados</span>
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto custom-scrollbar">
                {derived.map(code => (
                  <div key={code} className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 text-xs">
                    <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">{code}</span>
                    <button
                      onClick={() => handleRemoveRequirement(code)}
                      className="text-rose-500 hover:text-rose-600 font-bold text-[11px]"
                    >
                      Quitar
                    </button>
                  </div>
                ))}
                {derived.length === 0 && (
                  <p className="text-xs italic text-zinc-400 text-center py-4">Sin requisitos trazados</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'appearance' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block font-bold">Color de Acento</label>
              <div className="flex flex-wrap gap-2 px-1">
                {[
                  { label: 'Neutral', value: 'neutral' },
                  { label: 'Azul', value: 'azul' },
                  { label: 'Verde', value: 'verde' },
                  { label: 'Dorado', value: 'dorado' },
                  { label: 'Violeta', value: 'violeta' },
                  { label: 'Rojo', value: 'rojo' },
                  { label: 'Gris', value: 'gris' },
                ].map(preset => (
                  <button
                    key={preset.value}
                    onClick={() => onChange({
                      ...node,
                      style: {
                        ...node.style,
                        color: preset.value,
                      }
                    } as any)}
                    className={`w-6 h-6 rounded-full border border-zinc-200 dark:border-zinc-800 transition-all ${node.style?.color === preset.value || (!node.style?.color && preset.value === 'neutral') ? 'ring-2 ring-blue-500 scale-110 shadow' : 'hover:scale-105'}`}
                    style={{
                      backgroundColor:
                        preset.value === 'neutral' ? '#f4f4f5' :
                        preset.value === 'azul' ? '#3b82f6' :
                        preset.value === 'verde' ? '#10b981' :
                        preset.value === 'dorado' ? '#eab308' :
                        preset.value === 'violeta' ? '#8b5cf6' :
                        preset.value === 'rojo' ? '#ef4444' : '#64748b'
                    }}
                    title={preset.label}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2 border-t border-zinc-100 dark:border-zinc-900 pt-3">
              <label className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-150 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!(node as any).compactMode}
                  onChange={(e) => onChange({ ...node, compactMode: e.target.checked } as any)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Modo Compacto</span>
                  <span className="text-[9px] text-zinc-400">Reduce márgenes del nodo en el lienzo</span>
                </div>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
