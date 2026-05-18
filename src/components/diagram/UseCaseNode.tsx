import { memo } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import type { DiagramUseCaseNodeDTO } from '../../types/diagrams'

const UseCaseNodeComponent = ({ data, selected }: NodeProps<Node<DiagramUseCaseNodeDTO>>) => {
  if (!data) return null

  const color = data.style?.color || 'neutral'
  const compactMode = !!data.compactMode
  const packageId = (data as any).packageId

  let themeClasses = 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:border-blue-400'
  let textClasses = 'text-slate-800 dark:text-slate-200'

  if (color === 'azul') {
    themeClasses = 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-500 hover:border-blue-600'
    textClasses = 'text-blue-700 dark:text-blue-300 font-bold'
  } else if (color === 'verde') {
    themeClasses = 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-500 hover:border-emerald-600'
    textClasses = 'text-emerald-700 dark:text-emerald-300 font-bold'
  } else if (color === 'dorado') {
    themeClasses = 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-500 hover:border-amber-600'
    textClasses = 'text-amber-700 dark:text-amber-300 font-bold'
  } else if (color === 'violeta') {
    themeClasses = 'bg-purple-50/40 dark:bg-purple-950/20 border-purple-500 hover:border-purple-600'
    textClasses = 'text-purple-700 dark:text-purple-300 font-bold'
  } else if (color === 'rojo') {
    themeClasses = 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-500 hover:border-rose-600'
    textClasses = 'text-rose-700 dark:text-rose-300 font-bold'
  } else if (color === 'gris') {
    themeClasses = 'bg-slate-50/40 dark:bg-slate-800/30 border-slate-500 hover:border-slate-600'
    textClasses = 'text-slate-700 dark:text-slate-300 font-bold'
  }

  if (selected) {
    themeClasses = 'bg-white dark:bg-slate-900 border-blue-500 shadow-xl shadow-blue-500/10 scale-105'
    textClasses = 'text-blue-600 dark:text-blue-400 font-black'
  } else if (packageId) {
    themeClasses += ' shadow-sm opacity-95'
  } else {
    themeClasses += ' hover:shadow-lg'
  }

  return (
    <div className={`group relative transition-all duration-300 ${selected ? 'scale-105' : ''}`}>
      {/* Subtle compact toolbar on hover/selection */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1 bg-zinc-900/90 dark:bg-zinc-950/90 border border-zinc-800 text-white rounded-lg shadow-xl px-2 py-1 z-30 pointer-events-auto select-none nodrag">
        <button
          onClick={(e) => { e.stopPropagation(); (data as any).onEditNode?.(data.id) }}
          className="p-1 hover:bg-zinc-800 rounded text-[10px] flex items-center justify-center"
          title="Editar caso de uso"
        >
          ✏️
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); (data as any).onDuplicateNode?.(data.id) }}
          className="p-1 hover:bg-zinc-800 rounded text-[10px] flex items-center justify-center"
          title="Duplicar caso de uso"
        >
          📋
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); (data as any).onAddInclude?.(data.id) }}
          className="px-1.5 py-0.5 hover:bg-zinc-800 rounded text-[9px] font-bold text-emerald-400"
          title="Agregar Include"
        >
          +Inc
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); (data as any).onAddExtend?.(data.id) }}
          className="px-1.5 py-0.5 hover:bg-zinc-800 rounded text-[9px] font-bold text-amber-400"
          title="Agregar Extend"
        >
          +Ext
        </button>
        <div className="w-px h-3 bg-zinc-800 mx-0.5" />
        <button
          onClick={(e) => { e.stopPropagation(); (data as any).onDeleteNode?.(data.id) }}
          className="p-1 hover:bg-rose-950/30 hover:text-rose-400 rounded text-[10px] flex items-center justify-center"
          title="Eliminar caso de uso"
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

      {/* Use Case Visual - Oval */}
      <div className={`relative flex items-center justify-center text-center transition-all duration-300 border-2 ${
        compactMode
          ? 'min-w-[115px] px-4 py-2.5 rounded-[30px]'
          : 'min-w-[150px] px-6 py-4.5 rounded-[40px]'
      } ${themeClasses}`}>
        {packageId && (
          <span className="absolute -top-1 -right-1 px-1 py-0.5 rounded bg-slate-200/50 dark:bg-slate-800/60 text-[8px] text-slate-500 font-bold scale-90 opacity-70" title="Dentro de paquete">
            📦
          </span>
        )}
        <div className="space-y-0.5">
          <p className={`text-[12px] leading-tight ${textClasses}`}>
            {data.name}
          </p>
          {!compactMode && data.description && (
            <p className="text-[9px] text-slate-400 dark:text-slate-500 italic line-clamp-1 max-w-[130px]">
              {data.description}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export const UseCaseNode = memo(UseCaseNodeComponent, (prev, next) => {
  if (!prev.data || !next.data) return false
  return (
    prev.selected === next.selected &&
    prev.data.id === next.data.id &&
    prev.data.name === next.data.name &&
    prev.data.description === next.data.description &&
    (prev.data as any).packageId === (next.data as any).packageId &&
    (prev.data as any).isDraggedOver === (next.data as any).isDraggedOver &&
    prev.data.style?.color === next.data.style?.color &&
    prev.data.compactMode === next.data.compactMode
  )
})

UseCaseNode.displayName = 'UseCaseNode'
