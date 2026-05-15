import { Handle, NodeResizer, Position, type NodeProps, type Node } from '@xyflow/react'
import type { DiagramPackageNodeDTO } from '../../types/diagrams'

export function PackageNode({ data, selected }: NodeProps<Node<DiagramPackageNodeDTO>>) {
  const palette: Record<string, string> = {
    neutral: 'rgba(255,255,255,0.03)',
    gris: 'rgba(148,163,184,0.05)',
    azul: 'rgba(59,130,246,0.05)',
    verde: 'rgba(16,185,129,0.05)',
    dorado: 'rgba(168,140,74,0.05)',
    violeta: 'rgba(124,58,237,0.05)',
    rojo: 'rgba(220,38,38,0.05)',
  }

  const rawColor = data.style?.color || 'neutral'
  const packageColor = palette[rawColor] || rawColor

  return (
    <div
      className="relative w-full h-full rounded-lg"
      style={{
        background: packageColor,
        // Border: dashed when idle, solid blue when selected — purely visual, no zIndex here.
        // The actual z-order is controlled by the React Flow node-level zIndex (set to 0 in
        // addNodeToCanvas / diagramSourceToReactFlow). Do NOT set zIndex inside this div
        // because it would create a new stacking context and break the global ordering.
        border: selected
          ? '1.5px solid rgba(59,130,246,0.7)'
          : '1.5px dashed var(--color-border)',
        // Only the drag handle area (header) needs pointer events.
        // The full interior uses pointer-events:none so that class nodes placed
        // inside the package bounds remain clickable and selectable.
        pointerEvents: 'none',
        boxShadow: selected ? '0 0 0 3px rgba(59,130,246,0.15)' : 'none',
      }}
    >
      {/* NodeResizer: always rendered so it responds immediately after creation.
          The resize handles themselves need pointer-events so wrap in a passthrough div. */}
      <div style={{ pointerEvents: 'all' }}>
        <NodeResizer
          isVisible={true}
          minWidth={200}
          minHeight={150}
          maxWidth={2000}
          maxHeight={1400}
          handleStyle={{
            width: 8,
            height: 8,
            background: selected ? '#60a5fa' : '#94a3b8',
            border: '2px solid white',
            borderRadius: 2,
          }}
          lineStyle={{
            borderColor: selected ? 'rgba(59,130,246,0.5)' : 'transparent',
          }}
        />
      </div>

      {/* Header/Tab — needs pointer-events so the user can click to select & drag the package */}
      <div
        className="absolute -top-[24px] left-0 h-[24px] px-3 flex items-center gap-2 rounded-t-md select-none"
        style={{
          pointerEvents: 'all',
          background: selected
            ? 'rgba(59,130,246,0.15)'
            : 'rgba(148,163,184,0.1)',
          border: selected
            ? '1px solid rgba(59,130,246,0.5)'
            : '1px solid var(--color-border)',
          borderBottom: 'none',
          cursor: 'move',
        }}
      >
        {/* Package icon */}
        <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
        </svg>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {data.name || 'Package'}
        </span>
        {selected && typeof data.childCount === 'number' && data.childCount > 0 && (
          <span className="text-[9px] text-slate-400 dark:text-slate-500 ml-1">
            ({data.childCount})
          </span>
        )}
      </div>

      {/* Description — decorative only, pointer-events:none so it does not block class clicks */}
      {data.description && (
        <div
          className="absolute bottom-2 left-3 right-3 text-[10px] text-slate-400 dark:text-slate-500 italic truncate"
          style={{ pointerEvents: 'none' }}
        >
          {data.description}
        </div>
      )}

      {/* Connection handles: very thin hit area, hidden until package is selected */}
      <div style={{ pointerEvents: 'all' }}>
        <Handle
          type="target" position={Position.Top}
          style={{ opacity: selected ? 0.5 : 0, transition: 'opacity 0.2s' }}
        />
        <Handle
          type="source" position={Position.Bottom}
          style={{ opacity: selected ? 0.5 : 0, transition: 'opacity 0.2s' }}
        />
        <Handle
          type="target" position={Position.Left}
          style={{ opacity: selected ? 0.5 : 0, transition: 'opacity 0.2s' }}
        />
        <Handle
          type="source" position={Position.Right}
          style={{ opacity: selected ? 0.5 : 0, transition: 'opacity 0.2s' }}
        />
      </div>
    </div>
  )
}
