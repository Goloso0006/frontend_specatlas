import { Button } from '../ui/Button'
import type { DiagramNodeDTO, DiagramRelationDTO, DiagramType } from '../../types/diagrams'

interface GeneratedDiagramReviewModalProps {
  nodes: DiagramNodeDTO[]
  edges: DiagramRelationDTO[]
  warnings: string[]
  isCanvasEmpty: boolean
  diagramType: DiagramType
  onClose: () => void
  onApplyReplace: () => void
  onApplyMerge: () => void
}

export function GeneratedDiagramReviewModal({
  nodes,
  edges,
  warnings,
  isCanvasEmpty,
  diagramType,
  onClose,
  onApplyReplace,
  onApplyMerge,
}: GeneratedDiagramReviewModalProps) {
  const isUseCase = diagramType === 'USE_CASE'

  // Class stats
  const classCount = nodes.filter(n => n.kind === 'class' && (n.umlType === 'CLASS' || !n.umlType)).length
  const interfaceCount = nodes.filter(n => n.kind === 'class' && n.umlType === 'INTERFACE').length
  const enumCount = nodes.filter(n => n.kind === 'class' && n.umlType === 'ENUM').length
  const abstractCount = nodes.filter(n => n.kind === 'class' && n.umlType === 'ABSTRACT_CLASS').length

  // Use Case stats
  const actorCount = nodes.filter(n => n.kind === 'actor').length
  const useCaseCount = nodes.filter(n => n.kind === 'useCase').length

  const relationCount = edges.length

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-[#121212] w-full max-w-2xl rounded-3xl border border-app-border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b bg-app-accent/5 dark:bg-app-accent/10 border-app-accent/20 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-app-accent flex items-center justify-center shrink-0 shadow-lg shadow-app-accent/20">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-app-text-primary">Propuesta de IA Generada</h2>
            <p className="text-sm text-app-text-secondary">
              Revisa los elementos sugeridos por el asistente de SpecAtlas.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {isUseCase ? (
              <>
                <StatCard label="Actores" value={actorCount} icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                <StatCard label="Casos de Uso" value={useCaseCount} icon="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </>
            ) : (
              <>
                <StatCard label="Clases" value={classCount + abstractCount} icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                <StatCard label="Interfaces" value={interfaceCount} icon="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7" />
                <StatCard label="Enums" value={enumCount} icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </>
            )}
            <StatCard label="Relaciones" value={relationCount} icon="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
          </div>

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
              <h4 className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Notas de la IA
              </h4>
              <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1 list-disc list-inside">
                {warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}

          {/* Detailed Lists */}
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-app-text-muted mb-3">Nuevos Elementos</h4>
              <div className="flex flex-wrap gap-2">
                {nodes.map(node => (
                  <span key={node.id} className="px-2.5 py-1 rounded-lg bg-app-surface border border-app-border text-xs font-medium text-app-text-primary">
                    {node.name}
                    <span className="ml-1 text-[9px] opacity-50 uppercase">
                      {isUseCase ? node.kind : (node.kind === 'class' ? (node as any).umlType || 'CLASS' : node.kind)}
                    </span>
                  </span>
                ))}
              </div>
            </div>

            {edges.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-app-text-muted mb-3">Nuevas Relaciones</h4>
                <div className="space-y-2">
                  {edges.slice(0, 8).map(edge => (
                    <div key={edge.id} className="text-xs flex items-center gap-2 text-app-text-secondary">
                      <span className="font-bold text-app-text-primary">{nodes.find(n => n.id === edge.source)?.name}</span>
                      <svg className="w-3 h-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                      <span className="font-bold text-app-text-primary">{nodes.find(n => n.id === edge.target)?.name}</span>
                      <span className="text-[10px] bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded italic opacity-70">
                        {edge.data?.relationshipType} {edge.data?.label && `: ${edge.data.label}`}
                      </span>
                    </div>
                  ))}
                  {edges.length > 8 && <p className="text-[10px] text-app-text-muted italic">Y {edges.length - 8} relaciones más...</p>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-slate-50/50 dark:bg-white/5 space-y-4">
          {!isCanvasEmpty && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/20 text-amber-700 dark:text-amber-400">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-xs leading-tight">
                <strong>Este diagrama ya contiene elementos.</strong> Puedes reemplazarlos completamente con la propuesta o fusionar los nuevos elementos manteniendo tu trabajo actual.
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <div className="flex gap-2">
              {!isCanvasEmpty && (
                <Button variant="secondary" onClick={onApplyMerge} className="border-app-accent/30 text-app-accent hover:bg-app-accent/5">
                  Fusionar Propuesta
                </Button>
              )}
              <Button variant="primary" onClick={onApplyReplace} className="shadow-lg shadow-app-accent/20">
                {isCanvasEmpty ? 'Aplicar Propuesta' : 'Reemplazar Diagrama'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string, value: number, icon: string }) {
  return (
    <div className="p-3 rounded-2xl border border-app-border bg-app-surface flex flex-col gap-1 items-center text-center">
      <div className="w-8 h-8 rounded-xl bg-app-accent/10 text-app-accent flex items-center justify-center mb-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
        </svg>
      </div>
      <span className="text-lg font-bold text-app-text-primary">{value}</span>
      <span className="text-[10px] uppercase font-bold text-app-text-muted tracking-tighter">{label}</span>
    </div>
  )
}
