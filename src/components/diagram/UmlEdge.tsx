import { 
  getSmoothStepPath, 
  EdgeLabelRenderer, 
  BaseEdge,
  type EdgeProps,
  type Edge
} from '@xyflow/react'
import type { DiagramRelationDTO } from '../../types/diagrams'

export function UmlEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<Edge<DiagramRelationDTO>>) {
  if (!data) return null
  
  const relationshipType = data.data?.relationshipType || 'ASSOCIATION'
  const relData = data.data
  const isDashed = false // Can be determined by relationship type if needed

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 16,
  })

  const getMarkerEnd = () => {
    switch (relationshipType) {
      case 'INHERITANCE':
      case 'IMPLEMENTATION':
        return `url(#triangle-empty)`
      case 'DEPENDENCY':
        return `url(#open-arrow)`
      case 'ASSOCIATION':
        return undefined // Or simple arrow if desired
      default:
        return undefined
    }
  }

  const getMarkerStart = () => {
    switch (relationshipType) {
      case 'AGGREGATION':
        return `url(#diamond-empty)`
      case 'COMPOSITION':
        return `url(#diamond-filled)`
      default:
        return undefined
    }
  }

  const label = relData?.label || ''
  const sourceMult = relData?.sourceMultiplicity || ''
  const targetMult = relData?.targetMultiplicity || ''

  const typeLabels: Record<string, string> = {
    ASSOCIATION: 'Asociación',
    AGGREGATION: 'Agregación',
    COMPOSITION: 'Composición',
    INHERITANCE: 'Herencia',
    IMPLEMENTATION: 'Implementación',
    DEPENDENCY: 'Dependencia',
  }

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={getMarkerEnd()}
        markerStart={getMarkerStart()}
        style={{
          strokeWidth: selected ? 3 : 2,
          stroke: selected ? 'var(--color-accent)' : 'var(--color-text-primary)',
          strokeDasharray: isDashed ? '5,5' : undefined,
          transition: 'stroke 0.2s, stroke-width 0.2s',
        }}
      />
      
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <div className={`px-2 py-1 rounded-md border text-[10px] font-bold shadow-sm transition-all ${
            selected 
              ? 'bg-app-accent border-app-accent text-white scale-110' 
              : 'bg-white dark:bg-[#1e1e1e] border-app-text-primary dark:border-white/50 text-app-text-primary dark:text-white/60 opacity-70'
          }`} style={{opacity: selected ? 1 : 0.5}}>
            {label || typeLabels[relationshipType] || ''}
          </div>
        </div>
      </EdgeLabelRenderer>

      {/* Multiplicities near endpoints */}
      { (sourceMult || targetMult) && (() => {
        const dx = targetX - sourceX
        const dy = targetY - sourceY
        const len = Math.sqrt(dx * dx + dy * dy) || 1
        const ux = dx / len
        const uy = dy / len
        const px = -uy
        const py = ux

        const sourcePos = {
          x: sourceX + ux * 20 + px * -8,
          y: sourceY + uy * 20 + py * -8,
        }
        const targetPos = {
          x: targetX - ux * 20 + px * 8,
          y: targetY - uy * 20 + py * 8,
        }

        return (
          <>
            {sourceMult && (
              <EdgeLabelRenderer>
                <div style={{ position: 'absolute', transform: `translate(-50%, -50%) translate(${sourcePos.x}px,${sourcePos.y}px)`, pointerEvents: 'none' }}>
                  <div className="text-[10px] font-mono px-1 py-0.5 rounded bg-white/80 dark:bg-black/60 text-app-text-primary border" style={{opacity: 0.85}}>
                    {sourceMult}
                  </div>
                </div>
              </EdgeLabelRenderer>
            )}
            {targetMult && (
              <EdgeLabelRenderer>
                <div style={{ position: 'absolute', transform: `translate(-50%, -50%) translate(${targetPos.x}px,${targetPos.y}px)`, pointerEvents: 'none' }}>
                  <div className="text-[10px] font-mono px-1 py-0.5 rounded bg-white/80 dark:bg-black/60 text-app-text-primary border" style={{opacity: 0.85}}>
                    {targetMult}
                  </div>
                </div>
              </EdgeLabelRenderer>
            )}
          </>
        )
      })()}
    </>
  )
}
