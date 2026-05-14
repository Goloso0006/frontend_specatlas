import { Handle, NodeResizer, Position, type NodeProps, type Node } from '@xyflow/react'
import type { DiagramPackageNodeDTO } from '../../types/diagrams'

export function PackageNode({ data, selected }: NodeProps<Node<DiagramPackageNodeDTO>>) {
  const palette: Record<string, string> = {
    neutral: 'rgba(255,255,255,0.04)',
    gris: 'rgba(148,163,184,0.06)',
    azul: 'rgba(59,130,246,0.06)',
    verde: 'rgba(16,185,129,0.06)',
    dorado: 'rgba(168,140,74,0.06)',
    violeta: 'rgba(124,58,237,0.06)',
    rojo: 'rgba(220,38,38,0.06)',
  }

  const rawColor = data.style?.color || 'neutral'
  const packageColor = palette[rawColor] || rawColor

  return (
    <div
      className={`relative w-full h-full rounded-lg transition-all ${
        selected ? 'ring-2 ring-blue-500/20 shadow-lg' : ''
      }`}
      style={{
        background: packageColor,
        border: selected ? '1px solid rgba(59,130,246,0.6)' : '1px solid var(--color-border)',
        zIndex: 0,
      }}
    >
      <NodeResizer
        isVisible={true}
        minWidth={480}
        minHeight={300}
        maxWidth={2000}
        maxHeight={1400}
        handleClassName="!w-2 !h-2 !bg-blue-400 !border-2 !border-white dark:!border-slate-900 opacity-100 hover:!bg-blue-600"
        lineClassName="!border-blue-400"
      />

      {/* Header/Tab */}
      <div className="absolute -top-[22px] left-0 h-[22px] px-3 bg-slate-100 dark:bg-slate-800 border-t-2 border-l-2 border-r-2 border-slate-300 dark:border-slate-700 rounded-t-md flex items-center">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Package
        </span>
      </div>

      <div className="p-3">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2 mb-2">
          <div className="text-left font-bold text-slate-800 dark:text-slate-100">
            {data.name}
          </div>
          {selected && typeof data.childCount === 'number' && (
            <div className="text-[11px] text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md bg-white/5">
              {data.childCount} clases
            </div>
          )}
        </div>
        {data.description && (
          <p className="text-[10px] text-slate-500 dark:text-slate-400 italic text-center">
            {data.description}
          </p>
        )}
      </div>

      {/* Handles for connections if needed */}
      <Handle type="target" position={Position.Top} className="opacity-0 group-hover:opacity-100" />
      <Handle type="source" position={Position.Bottom} className="opacity-0 group-hover:opacity-100" />
      <Handle type="target" position={Position.Left} className="opacity-0 group-hover:opacity-100" />
      <Handle type="source" position={Position.Right} className="opacity-0 group-hover:opacity-100" />
    </div>
  )
}
