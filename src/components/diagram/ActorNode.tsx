import { memo } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import type { DiagramActorNodeDTO } from '../../types/diagrams'

export const ActorNode = memo(({ data, selected }: NodeProps<Node<DiagramActorNodeDTO>>) => {
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

      {/* Actor Visual */}
      <div className="flex flex-col items-center gap-2">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
          selected 
            ? 'bg-app-accent text-white shadow-lg shadow-app-accent/20 border-2 border-app-accent' 
            : 'bg-white dark:bg-[#181818] text-app-text-primary border border-app-border group-hover:border-app-accent/50'
        }`}>
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        
        <span className={`text-[13px] font-bold tracking-tight px-3 py-1 rounded-full transition-all duration-300 ${
          selected 
            ? 'bg-app-accent/10 text-app-accent' 
            : 'text-app-text-primary'
        }`}>
          {data.name}
        </span>
      </div>
    </div>
  )
})

ActorNode.displayName = 'ActorNode'
