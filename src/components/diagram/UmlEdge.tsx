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

function UmlEdgeComponent({
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
  
  const relationshipType = data.data?.relationshipType || 'ASSOCIATION'
  const relData = data.data
  const isDashed = relationshipType === 'DEPENDENCY' || relationshipType === 'IMPLEMENTATION'

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

  const getMarkerEnd = () => {
    switch (relationshipType) {
      case 'INHERITANCE':
      case 'IMPLEMENTATION':
        return `url(#triangle-empty)`
      case 'DEPENDENCY':
        return `url(#open-arrow)`
      case 'ASSOCIATION':
        return undefined
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
      <g onDoubleClick={handleDoubleClick} className="cursor-pointer">
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
      </g>
      
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
            zIndex: 30,
          }}
          className="nodrag nopan"
        >
          <div 
            className={(() => {
              const labelMode: 'always' | 'hover' | 'hide' = (data as any)?.labelMode || 'always'
              let className = "px-2.5 py-1 rounded-lg border text-[10px] font-bold shadow-sm transition-all duration-200 "
              if (selected) {
                className += "bg-blue-500 border-blue-500 text-white scale-110 shadow-blue-500/20 opacity-100"
              } else {
                className += "bg-white dark:bg-[#1a1f2c] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 "
                if (labelMode === 'hide') {
                  className += "opacity-0 pointer-events-none hover:opacity-100 hover:pointer-events-auto"
                } else if (labelMode === 'hover') {
                  className += (!label) ? "opacity-[0.04] hover:opacity-100" : "opacity-40 hover:opacity-100"
                } else {
                  className += "opacity-75 hover:opacity-100"
                }
              }
              return className
            })()}
          >
            {((data as any)?.hasWarning) && <span className="mr-1 text-amber-500 font-bold" title="Advertencia semántica UML">⚠️</span>}
            {label || typeLabels[relationshipType] || ''}
          </div>
        </div>
      </EdgeLabelRenderer>

      {/* Multiplicities near endpoints */}
      { (sourceMult || targetMult) && (() => {
        // Calculate offset multiplier positioning
        const dx = targetX - sourceX
        const dy = targetY - sourceY
        const len = Math.sqrt(dx * dx + dy * dy) || 1
        const ux = dx / len
        const uy = dy / len
        const px = -uy
        const py = ux

        const sourcePos = {
          x: sourceX + ux * 28 + px * -10,
          y: sourceY + uy * 28 + py * -10,
        }
        const targetPos = {
          x: targetX - ux * 28 + px * 10,
          y: targetY - uy * 28 + py * 10,
        }

        return (
          <>
            {sourceMult && (
              <EdgeLabelRenderer>
                <div style={{ position: 'absolute', transform: `translate(-50%, -50%) translate(${sourcePos.x}px,${sourcePos.y}px)`, pointerEvents: 'none', zIndex: 30 }}>
                  <div className="text-[9px] font-mono px-1 py-0.5 rounded bg-white/80 dark:bg-black/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800" style={{opacity: 0.85}}>
                    {sourceMult}
                  </div>
                </div>
              </EdgeLabelRenderer>
            )}
            {targetMult && (
              <EdgeLabelRenderer>
                <div style={{ position: 'absolute', transform: `translate(-50%, -50%) translate(${targetPos.x}px,${targetPos.y}px)`, pointerEvents: 'none', zIndex: 30 }}>
                  <div className="text-[9px] font-mono px-1 py-0.5 rounded bg-white/80 dark:bg-black/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800" style={{opacity: 0.85}}>
                    {targetMult}
                  </div>
                </div>
              </EdgeLabelRenderer>
            )}
          </>
        )
      })()}

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

export const UmlEdge = memo(UmlEdgeComponent, (prev, next) => {
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
    prev.data?.data?.sourceMultiplicity === next.data?.data?.sourceMultiplicity &&
    prev.data?.data?.targetMultiplicity === next.data?.data?.targetMultiplicity &&
    prev.data?.data?.waypoints === next.data?.data?.waypoints &&
    (prev.data as any)?.labelMode === (next.data as any)?.labelMode &&
    (prev.data as any)?.hasWarning === (next.data as any)?.hasWarning
  )
})

UmlEdge.displayName = 'UmlEdge'
