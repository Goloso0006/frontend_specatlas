import { 
  getSmoothStepPath, 
  EdgeLabelRenderer, 
  BaseEdge,
  type EdgeProps,
  type Edge
} from '@xyflow/react'
import type { DiagramRelationDTO } from '../../types/diagrams'

export function UseCaseEdge({
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
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 16,
  })

  const relData = data?.data
  const relType = relData?.relationshipType || 'ASSOCIATION'
  const isDashed = relType === 'INCLUDE' || relType === 'EXTEND'
  const isGeneralization = relType === 'GENERALIZATION'
  
  let markerEnd = ''
  if (relType === 'INCLUDE' || relType === 'EXTEND') {
    markerEnd = 'url(#uml-dependency-arrow)'
  } else if (isGeneralization) {
    markerEnd = 'url(#uml-inheritance-arrow)'
  }

  // Automatic labels for include/extend
  let displayLabel = relData?.label || ''
  if (relType === 'INCLUDE') displayLabel = '<<include>>'
  if (relType === 'EXTEND') displayLabel = '<<extend>>'

  return (
    <>
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={{
          strokeWidth: selected ? 3 : 2,
          stroke: selected ? 'var(--app-accent)' : 'var(--app-border-strong)',
          strokeDasharray: isDashed ? '5 5' : 'none',
          transition: 'all 0.3s'
        }}
      />
      
      {displayLabel && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
              zIndex: 30,
            }}
            className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold bg-white dark:bg-[#121212] transition-all shadow-sm ${
              selected ? 'border-app-accent text-app-accent scale-110 shadow-app-accent/10' : 'border-app-border text-app-text-secondary opacity-80'
            }`}
          >
            {displayLabel}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
