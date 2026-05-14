import { memo } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import type { DiagramUseCaseNodeDTO } from '../../types/diagrams'

export const UseCaseNode = memo(({ data, selected }: NodeProps<Node<DiagramUseCaseNodeDTO>>) => {
  if (!data) return null
  return (
    <div className={`group relative transition-all duration-300 ${selected ? 'scale-105' : ''}`}>
      {/* Handles */}
      {/* Target Handles */}
      <Handle type="target" position={Position.Top} id="t-top" className="opacity-0 group-hover:opacity-100 !bg-blue-500 !border-0" />
      <Handle type="target" position={Position.Bottom} id="t-bottom" className="opacity-0 group-hover:opacity-100 !bg-blue-500 !border-0" />
      <Handle type="target" position={Position.Left} id="t-left" className="opacity-0 group-hover:opacity-100 !bg-blue-500 !border-0" />
      <Handle type="target" position={Position.Right} id="t-right" className="opacity-0 group-hover:opacity-100 !bg-blue-500 !border-0" />

      {/* Source Handles */}
      <Handle type="source" position={Position.Top} id="s-top" className="opacity-0 group-hover:opacity-100 !bg-emerald-500 !border-0" />
      <Handle type="source" position={Position.Bottom} id="s-bottom" className="opacity-0 group-hover:opacity-100 !bg-emerald-500 !border-0" />
      <Handle type="source" position={Position.Left} id="s-left" className="opacity-0 group-hover:opacity-100 !bg-emerald-500 !border-0" />
      <Handle type="source" position={Position.Right} id="s-right" className="opacity-0 group-hover:opacity-100 !bg-emerald-500 !border-0" />

      {/* Use Case Visual - Oval */}
      <div className={`min-w-[140px] px-6 py-4 rounded-[40px] flex items-center justify-center text-center transition-all duration-300 border-2 ${
        selected 
          ? 'bg-white dark:bg-[#181818] border-app-accent shadow-xl shadow-app-accent/10' 
          : 'bg-white dark:bg-[#181818] border-app-border group-hover:border-app-accent/50'
      }`}>
        <div className="space-y-1">
          <p className={`text-[13px] font-bold leading-tight ${selected ? 'text-app-accent' : 'text-app-text-primary'}`}>
            {data.name}
          </p>
          {data.description && (
            <p className="text-[10px] text-app-text-muted italic line-clamp-1">
              {data.description}
            </p>
          )}
        </div>
      </div>
    </div>
  )
})

UseCaseNode.displayName = 'UseCaseNode'
