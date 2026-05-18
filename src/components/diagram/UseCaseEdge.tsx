import { memo } from 'react'
import { 
  getSmoothStepPath, 
  EdgeLabelRenderer, 
  BaseEdge,
  useReactFlow,
  type EdgeProps,
  type Edge
} from '@xyflow/react'
import type { DiagramRelationDTO } from '../../types/diagrams'

function buildWaypointPath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  waypoints: { x: number; y: number }[]
): [string, number, number] {
  let path = `M ${sourceX} ${sourceY}`
  waypoints.forEach((wp) => {
    path += ` L ${wp.x} ${wp.y}`
  })
  path += ` L ${targetX} ${targetY}`

  const allPoints = [{ x: sourceX, y: sourceY }, ...waypoints, { x: targetX, y: targetY }]
  const middleIndex = Math.floor(allPoints.length / 2)
  const p1 = allPoints[middleIndex - 1]
  const p2 = allPoints[middleIndex]
  
  const labelX = (p1.x + p2.x) / 2
  const labelY = (p1.y + p2.y) / 2

  return [path, labelX, labelY]
}

function UseCaseEdgeComponent({
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

  const { getViewport, screenToFlowPosition } = useReactFlow()

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    const flowPos = screenToFlowPosition({
      x: e.clientX,
      y: e.clientY,
    })

    const newWaypoints = [...waypoints, { x: Math.round(flowPos.x), y: Math.round(flowPos.y) }]

    if ((data as any).onUpdateEdge) {
      (data as any).onUpdateEdge({
        ...data,
        data: {
          ...data.data,
          waypoints: newWaypoints,
        },
      })
    }
  }

  const relData = data?.data
  const relType = String(relData?.relationshipType || (relData as any)?.relationType || 'ASSOCIATION').toUpperCase()
  const isDashed = relType === 'INCLUDE' || relType === 'EXTEND'
  const isGeneralization = relType === 'GENERALIZATION'

  const waypoints = relData?.waypoints || (data as any).waypoints || []
  const hasWaypoints = Array.isArray(waypoints) && waypoints.length > 0

  let edgePath = ''
  let labelX = 0
  let labelY = 0

  if (hasWaypoints) {
    const [path, lx, ly] = buildWaypointPath(sourceX, sourceY, targetX, targetY, waypoints)
    edgePath = path
    labelX = lx
    labelY = ly
  } else {
    const [path, lx, ly] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      borderRadius: 16,
    })
    edgePath = path
    labelX = lx
    labelY = ly
  }
  
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
      <g onDoubleClick={handleDoubleClick} className="cursor-pointer">
        <BaseEdge 
          path={edgePath} 
          markerEnd={markerEnd} 
          style={{
            strokeWidth: selected ? 3 : 2,
            stroke: selected ? 'var(--color-accent)' : 'var(--color-border-strong)',
            strokeDasharray: isDashed ? '5 5' : 'none',
            transition: 'all 0.3s'
          }}
        />
      </g>
      
      {displayLabel && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
              zIndex: 30,
            }}
            className={(() => {
              const labelMode: 'always' | 'hover' | 'hide' = (data as any)?.labelMode || 'always'
              let className = "px-2 py-0.5 rounded-lg border text-[10px] font-bold bg-white dark:bg-[#121212] transition-all shadow-sm "
              if (selected) {
                className += "border-blue-500 text-blue-500 scale-110 shadow-blue-500/10 opacity-100"
              } else {
                className += "border-app-border text-app-text-secondary "
                if (labelMode === 'hide') {
                  className += "opacity-0 pointer-events-none hover:opacity-100 hover:pointer-events-auto"
                } else if (labelMode === 'hover') {
                  const isAutoIncludeExtend = relType === 'INCLUDE' || relType === 'EXTEND'
                  className += isAutoIncludeExtend 
                    ? "opacity-40 hover:opacity-100" 
                    : "opacity-[0.04] hover:opacity-100"
                } else {
                  className += "opacity-75 hover:opacity-100"
                }
              }
              return className
            })()}
          >
            {((data as any)?.hasWarning) && <span className="mr-1 text-amber-500 font-bold" title="Advertencia semántica UML">⚠️</span>}
            {displayLabel}
          </div>
        </EdgeLabelRenderer>
      )}

      {/* Waypoint draggable control points */}
      {selected && waypoints.map((wp: any, index: number) => {
        const handleMouseDown = (e: React.MouseEvent) => {
          e.stopPropagation()
          e.preventDefault()

          const startClientX = e.clientX
          const startClientY = e.clientY
          const initialWp = { ...wp }
          const { zoom } = getViewport()

          const handleMouseMove = (moveEvent: MouseEvent) => {
            const dx = (moveEvent.clientX - startClientX) / zoom
            const dy = (moveEvent.clientY - startClientY) / zoom

            const newWaypoints = [...waypoints]
            newWaypoints[index] = {
              x: Math.round(initialWp.x + dx),
              y: Math.round(initialWp.y + dy),
            }

            if ((data as any).onUpdateEdge) {
              (data as any).onUpdateEdge({
                ...data,
                data: {
                  ...data.data,
                  waypoints: newWaypoints,
                },
              })
            }
          }

          const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
          }

          document.addEventListener('mousemove', handleMouseMove)
          document.addEventListener('mouseup', handleMouseUp)
        }

        return (
          <EdgeLabelRenderer key={`wp-${index}`}>
            <div
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${wp.x}px,${wp.y}px)`,
                pointerEvents: 'all',
                zIndex: 3001,
              }}
              className="nodrag nopan"
            >
              <div
                onMouseDown={handleMouseDown}
                className="w-4.5 h-4.5 rounded-full bg-blue-500 hover:bg-blue-650 border-2 border-white dark:border-zinc-900 shadow-lg cursor-move flex items-center justify-center text-[9px] font-bold text-white transition-transform duration-100 hover:scale-125 active:scale-95 select-none nodrag"
                title={`Punto de control ${index + 1} - Arrastrar para mover`}
              >
                {index + 1}
              </div>
            </div>
          </EdgeLabelRenderer>
        )
      })}
    </>
  )
}

export const UseCaseEdge = memo(UseCaseEdgeComponent, (prev, next) => {
  return (
    prev.selected === next.selected &&
    prev.sourceX === next.sourceX &&
    prev.sourceY === next.sourceY &&
    prev.targetX === next.targetX &&
    prev.targetY === next.targetY &&
    prev.sourcePosition === next.sourcePosition &&
    prev.targetPosition === next.targetPosition &&
    prev.data?.data?.relationshipType === next.data?.data?.relationshipType &&
    prev.data?.data?.label === next.data?.data?.label &&
    prev.data?.data?.waypoints === next.data?.data?.waypoints &&
    (prev.data as any)?.labelMode === (next.data as any)?.labelMode &&
    (prev.data as any)?.hasWarning === (next.data as any)?.hasWarning
  )
})

UseCaseEdge.displayName = 'UseCaseEdge'
