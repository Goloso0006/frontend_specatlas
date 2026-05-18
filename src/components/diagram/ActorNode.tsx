import { memo } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import type { DiagramActorNodeDTO } from '../../types/diagrams'

const ActorNodeComponent = ({ data, selected }: NodeProps<Node<DiagramActorNodeDTO>>) => {
  if (!data) return null

  const color = data.style?.color || 'neutral'
  const compactMode = !!data.compactMode
  const packageId = (data as any).packageId

  let containerClasses = 'bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400 hover:shadow-md'
  let labelClasses = 'text-slate-800 dark:text-slate-200'

  if (color === 'azul') {
    containerClasses = 'bg-blue-50/40 dark:bg-blue-950/20 border-2 border-blue-500 text-blue-600 dark:text-blue-400'
    labelClasses = 'text-blue-700 dark:text-blue-300 font-bold'
  } else if (color === 'verde') {
    containerClasses = 'bg-emerald-50/40 dark:bg-emerald-950/20 border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400'
    labelClasses = 'text-emerald-700 dark:text-emerald-300 font-bold'
  } else if (color === 'dorado') {
    containerClasses = 'bg-amber-50/40 dark:bg-amber-950/20 border-2 border-amber-500 text-amber-600 dark:text-amber-400'
    labelClasses = 'text-amber-700 dark:text-amber-300 font-bold'
  } else if (color === 'violeta') {
    containerClasses = 'bg-purple-50/40 dark:bg-purple-950/20 border-2 border-purple-500 text-purple-600 dark:text-purple-400'
    labelClasses = 'text-purple-700 dark:text-purple-300 font-bold'
  } else if (color === 'rojo') {
    containerClasses = 'bg-rose-50/40 dark:bg-rose-950/20 border-2 border-rose-500 text-rose-600 dark:text-rose-400'
    labelClasses = 'text-rose-700 dark:text-rose-300 font-bold'
  } else if (color === 'gris') {
    containerClasses = 'bg-slate-50/40 dark:bg-slate-800/30 border-2 border-slate-500 text-slate-600 dark:text-slate-400'
    labelClasses = 'text-slate-700 dark:text-slate-300 font-bold'
  }

  if (selected) {
    containerClasses = 'bg-blue-500 text-white border-2 border-blue-600 shadow-lg shadow-blue-500/20 scale-105'
    labelClasses = 'text-blue-600 dark:text-blue-400 font-black'
  } else if (packageId) {
    containerClasses += ' opacity-95'
  }

  return (
    <div className={`group relative transition-all duration-300 ${selected ? 'scale-105' : ''}`}>
      {/* Subtle compact toolbar on hover/selection */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1 bg-zinc-900/90 dark:bg-zinc-950/90 border border-zinc-800 text-white rounded-lg shadow-xl px-2 py-1 z-30 pointer-events-auto select-none nodrag">
        <button
          onClick={(e) => { e.stopPropagation(); (data as any).onEditNode?.(data.id) }}
          className="p-1 hover:bg-zinc-800 rounded text-[10px] flex items-center justify-center"
          title="Editar actor"
        >
          ✏️
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); (data as any).onDuplicateNode?.(data.id) }}
          className="p-1 hover:bg-zinc-800 rounded text-[10px] flex items-center justify-center"
          title="Duplicar actor"
        >
          📋
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); (data as any).onCreateRelation?.(data.id) }}
          className="p-1 hover:bg-zinc-800 rounded text-[10px] flex items-center justify-center font-bold"
          title="Crear relación"
        >
          🔗
        </button>
        <div className="w-px h-3 bg-zinc-800 mx-0.5" />
        <button
          onClick={(e) => { e.stopPropagation(); (data as any).onDeleteNode?.(data.id) }}
          className="p-1 hover:bg-rose-950/30 hover:text-rose-400 rounded text-[10px] flex items-center justify-center"
          title="Eliminar actor"
        >
          🗑️
        </button>
      </div>
      {/* Handles */}
      {/* Target Handles */}
      <Handle type="target" position={Position.Top} id="t-top" className={`!w-2.5 !h-2.5 ${selected ? 'opacity-100' : 'opacity-0'} group-hover:opacity-100 hover:scale-125 !bg-blue-500 !border-0 transition-all duration-200`} />
      <Handle type="target" position={Position.Bottom} id="t-bottom" className={`!w-2.5 !h-2.5 ${selected ? 'opacity-100' : 'opacity-0'} group-hover:opacity-100 hover:scale-125 !bg-blue-500 !border-0 transition-all duration-200`} />
      <Handle type="target" position={Position.Left} id="t-left" className={`!w-2.5 !h-2.5 ${selected ? 'opacity-100' : 'opacity-0'} group-hover:opacity-100 hover:scale-125 !bg-blue-500 !border-0 transition-all duration-200`} />
      <Handle type="target" position={Position.Right} id="t-right" className={`!w-2.5 !h-2.5 ${selected ? 'opacity-100' : 'opacity-0'} group-hover:opacity-100 hover:scale-125 !bg-blue-500 !border-0 transition-all duration-200`} />

      {/* Source Handles */}
      <Handle type="source" position={Position.Top} id="s-top" className={`!w-2.5 !h-2.5 ${selected ? 'opacity-100' : 'opacity-0'} group-hover:opacity-100 hover:scale-125 !bg-emerald-500 !border-0 transition-all duration-200`} />
      <Handle type="source" position={Position.Bottom} id="s-bottom" className={`!w-2.5 !h-2.5 ${selected ? 'opacity-100' : 'opacity-0'} group-hover:opacity-100 hover:scale-125 !bg-emerald-500 !border-0 transition-all duration-200`} />
      <Handle type="source" position={Position.Left} id="s-left" className={`!w-2.5 !h-2.5 ${selected ? 'opacity-100' : 'opacity-0'} group-hover:opacity-100 hover:scale-125 !bg-emerald-500 !border-0 transition-all duration-200`} />
      <Handle type="source" position={Position.Right} id="s-right" className={`!w-2.5 !h-2.5 ${selected ? 'opacity-100' : 'opacity-0'} group-hover:opacity-100 hover:scale-125 !bg-emerald-500 !border-0 transition-all duration-200`} />

      {/* Actor Visual */}
      <div className="flex flex-col items-center gap-2">
        <div className={`rounded-2xl flex items-center justify-center transition-all duration-300 ${
          compactMode
            ? 'w-10 h-10'
            : 'w-14 h-14'
        } ${containerClasses}`}>
          <svg className={compactMode ? 'w-6 h-6' : 'w-8 h-8'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        
        <span className={`text-[12px] tracking-tight px-2 py-0.5 rounded-full transition-all duration-300 ${labelClasses}`}>
          {data.name}
        </span>
      </div>
    </div>
  )
}

export const ActorNode = memo(ActorNodeComponent, (prev, next) => {
  if (!prev.data || !next.data) return false
  return (
    prev.selected === next.selected &&
    prev.data.id === next.data.id &&
    prev.data.name === next.data.name &&
    prev.data.description === next.data.description &&
    (prev.data as any).packageId === (next.data as any).packageId &&
    prev.data.style?.color === next.data.style?.color &&
    prev.data.compactMode === next.data.compactMode
  )
})

ActorNode.displayName = 'ActorNode'
