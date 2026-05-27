import { memo } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import type { DiagramClassNodeDTO } from '../../types/diagrams'

function ClassNodeComponent({ data, selected }: NodeProps<Node<DiagramClassNodeDTO>>) {
  if (!data) return null
  
  const umlType = data.umlType || 'CLASS'
  const isAbstract = umlType === 'ABSTRACT_CLASS'
  const isInterface = umlType === 'INTERFACE'
  const isEnum = umlType === 'ENUM'

  const attributes = Array.isArray(data.attributes) ? data.attributes : []
  const methods = Array.isArray(data.methods) ? data.methods : []
  const enumValues = Array.isArray(data.enumValues) ? data.enumValues : []

  const compactMode = !!(data as any).compactMode
  const hideEmptySections = !!(data as any).hideEmptySections
  const hideVisibilitySymbols = !!(data as any).hideVisibilitySymbols
  const accentColor = data.style?.color || 'neutral'

  // Map accent color to header background classes
  const accentHeaderMap: Record<string, string> = {
    neutral: 'bg-slate-50/80 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200',
    gris: 'bg-slate-200/80 dark:bg-slate-700/60 text-slate-800 dark:text-slate-200',
    azul: 'bg-blue-50/80 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200',
    verde: 'bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200',
    dorado: 'bg-amber-50/80 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200',
    violeta: 'bg-purple-50/80 dark:bg-purple-950/30 text-purple-900 dark:text-purple-200',
    rojo: 'bg-rose-50/80 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200',
  }

  // For special UML types, use their own color regardless of accent
  const headerBg = isInterface ? 'bg-amber-50/80 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300'
    : isEnum ? 'bg-emerald-50/80 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300'
    : isAbstract ? 'bg-purple-50/80 dark:bg-purple-950/20 text-purple-800 dark:text-purple-300'
    : (accentHeaderMap[accentColor] || accentHeaderMap.neutral)

  // Map accent color to border highlight
  const accentBorderMap: Record<string, string> = {
    neutral: 'border-slate-800 dark:border-slate-700/60 hover:border-slate-700 dark:hover:border-slate-500',
    gris: 'border-slate-500 dark:border-slate-500',
    azul: 'border-blue-500 dark:border-blue-500',
    verde: 'border-emerald-500 dark:border-emerald-500',
    dorado: 'border-amber-500 dark:border-amber-500',
    violeta: 'border-purple-500 dark:border-purple-500',
    rojo: 'border-rose-500 dark:border-rose-500',
  }

  const borderClass = selected
    ? 'border-blue-500 dark:border-blue-400 shadow-[0_12px_30px_rgba(59,130,246,0.25)] z-20 scale-[1.02]'
    : (data as any).packageId
      ? 'border-slate-400 dark:border-slate-600 shadow-sm opacity-95'
      : `${accentBorderMap[accentColor] || accentBorderMap.neutral} hover:shadow-lg`

  // Hover and selection classes for handles
  const handleTargetClass = `!w-2 !h-2 ${selected ? 'opacity-100' : 'opacity-0'} group-hover:opacity-100 hover:scale-125 !bg-blue-500 !border-0 transition-all duration-200`
  const handleSourceClass = `!w-2 !h-2 ${selected ? 'opacity-100' : 'opacity-0'} group-hover:opacity-100 hover:scale-125 !bg-emerald-500 !border-0 transition-all duration-200`

  const packageId = (data as any).packageId

  const showAttrSection = !isInterface && !isEnum && (!hideEmptySections || attributes.length > 0)
  const showMethodSection = !isEnum && (!hideEmptySections || methods.length > 0)
  const showEnumSection = isEnum && (!hideEmptySections || enumValues.length > 0)

  return (
    <article
      className={`group relative min-w-[220px] bg-white dark:bg-slate-900 rounded-xl border-2 transition-all duration-300 shadow-md ${borderClass}`}
      style={{ zIndex: 10 }}
    >
      {/* Subtle compact toolbar on hover/selection */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1 bg-zinc-900/90 dark:bg-zinc-950/90 border border-zinc-800 text-white rounded-lg shadow-xl px-2 py-1 z-30 pointer-events-auto select-none nodrag">
        <button
          onClick={(e) => { e.stopPropagation(); (data as any).onEditNode?.(data.id) }}
          className="p-1 hover:bg-zinc-800 rounded text-[10px] flex items-center justify-center"
          title="Editar clase"
        >
          ✏️
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); (data as any).onDuplicateNode?.(data.id) }}
          className="p-1 hover:bg-zinc-800 rounded text-[10px] flex items-center justify-center"
          title="Duplicar clase"
        >
          📋
        </button>
        {!isInterface && !isEnum && (
          <button
            onClick={(e) => { e.stopPropagation(); (data as any).onAddAttribute?.(data.id) }}
            className="px-1.5 py-0.5 hover:bg-zinc-800 rounded text-[9px] font-bold"
            title="Agregar atributo"
          >
            +Attr
          </button>
        )}
        {!isEnum && (
          <button
            onClick={(e) => { e.stopPropagation(); (data as any).onAddMethod?.(data.id) }}
            className="px-1.5 py-0.5 hover:bg-zinc-800 rounded text-[9px] font-bold"
            title="Agregar método"
          >
            +Mét
          </button>
        )}
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
          title="Eliminar clase"
        >
          🗑️
        </button>
      </div>
      {/* Target Handles (top, right, bottom, left + 4 corners) */}
      <Handle type="target" position={Position.Top} id="t-top" className={handleTargetClass} />
      <Handle type="target" position={Position.Bottom} id="t-bottom" className={handleTargetClass} />
      <Handle type="target" position={Position.Left} id="t-left" className={handleTargetClass} />
      <Handle type="target" position={Position.Right} id="t-right" className={handleTargetClass} />
      <Handle type="target" position={Position.Top} id="t-top-left" style={{ left: '20%' }} className={handleTargetClass} />
      <Handle type="target" position={Position.Top} id="t-top-right" style={{ left: '80%' }} className={handleTargetClass} />
      <Handle type="target" position={Position.Bottom} id="t-bottom-left" style={{ left: '20%' }} className={handleTargetClass} />
      <Handle type="target" position={Position.Bottom} id="t-bottom-right" style={{ left: '80%' }} className={handleTargetClass} />

      {/* Source Handles (top, right, bottom, left + 4 corners) */}
      <Handle type="source" position={Position.Top} id="s-top" className={handleSourceClass} />
      <Handle type="source" position={Position.Bottom} id="s-bottom" className={handleSourceClass} />
      <Handle type="source" position={Position.Left} id="s-left" className={handleSourceClass} />
      <Handle type="source" position={Position.Right} id="s-right" className={handleSourceClass} />
      <Handle type="source" position={Position.Top} id="s-top-left" style={{ left: '20%' }} className={handleSourceClass} />
      <Handle type="source" position={Position.Top} id="s-top-right" style={{ left: '80%' }} className={handleSourceClass} />
      <Handle type="source" position={Position.Bottom} id="s-bottom-left" style={{ left: '20%' }} className={handleSourceClass} />
      <Handle type="source" position={Position.Bottom} id="s-bottom-right" style={{ left: '80%' }} className={handleSourceClass} />
      
      {/* Header: Stereotype & Name */}
      <header className={`relative border-b-2 border-slate-800 dark:border-slate-700/60 ${compactMode ? 'px-3 py-2' : 'px-4 py-3.5'} text-center rounded-t-xl transition-colors duration-200 ${headerBg}`}>
        {packageId && (
          <span className="absolute top-2 right-2 px-1 py-0.5 rounded bg-slate-200/50 dark:bg-slate-800/60 text-[8px] text-slate-500 font-bold scale-90 opacity-70" title="Dentro de paquete">
            📦
          </span>
        )}
        {(isAbstract || isInterface || isEnum) && (
          <p className="text-[9px] font-bold uppercase tracking-widest opacity-80 mb-0.5 leading-none">
            {isAbstract ? '<<abstract>>' : isInterface ? '<<interface>>' : '<<enumeration>>'}
          </p>
        )}
        <h3 className={`text-xs font-black uppercase tracking-wider ${isAbstract ? 'italic underline decoration-purple-500/30' : ''}`}>
          {data.name || 'NuevaClase'}
        </h3>
      </header>

      {/* Attributes Section */}
      {showAttrSection && (
        <section className={`border-b-2 border-slate-800 dark:border-slate-700/60 ${compactMode ? 'px-2 py-1.5' : 'px-3 py-2.5'} min-h-[36px]`}>
          {attributes.length > 0 ? (
            <ul className="space-y-1.5">
              {attributes.map((attr) => (
                <li key={attr.id} className="text-[10px] font-mono text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  {!hideVisibilitySymbols && <span className="text-blue-500 font-bold w-2.5 text-center">{formatVisibility(attr.visibility)}</span>}
                  <span className="font-bold">{attr.name}</span>
                  <span className="text-slate-400 dark:text-slate-500">: {attr.type || 'String'}{attr.required ? ' *' : ''}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[9px] italic text-slate-400 dark:text-slate-500 text-center opacity-60">Sin atributos</p>
          )}
        </section>
      )}

      {/* Enum Values Section */}
      {showEnumSection && (
        <section className={`border-b-2 border-slate-800 dark:border-slate-700/60 ${compactMode ? 'px-2 py-1.5' : 'px-3 py-2.5'} min-h-[36px]`}>
          {enumValues.length > 0 ? (
            <ul className="space-y-1.5 text-center">
              {enumValues.map((val) => (
                <li key={val.id} className="text-[10px] font-mono font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                  {val.name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[9px] italic text-slate-400 dark:text-slate-500 text-center opacity-60">Sin valores</p>
          )}
        </section>
      )}

      {/* Methods Section */}
      {showMethodSection && (
        <section className={`${compactMode ? 'px-2 py-1.5' : 'px-3 py-2.5'} min-h-[36px]`}>
          {methods.length > 0 ? (
            <ul className="space-y-1.5">
              {methods.map((method) => {
                const vis = formatVisibility(method.visibility)
                const paramsText = Array.isArray(method.parameters)
                  ? method.parameters.map((p: any) => `${p.name}: ${p.type}`).join(', ')
                  : typeof method.parameters === 'string'
                  ? method.parameters
                  : ''
                const returnTypeSuffix = method.name !== data.name ? ` : ${method.returnType || 'void'}` : ''
                const fullMethodText = `${vis} ${method.name}(${paramsText})${returnTypeSuffix}`

                return (
                  <li key={method.id} className="text-[10px] font-mono text-slate-600 dark:text-slate-300 truncate whitespace-nowrap" title={fullMethodText}>
                    {!hideVisibilitySymbols && <span className="text-emerald-500 font-bold mr-1">{vis}</span>}
                    <span className="font-bold">{method.name}</span>
                    <span>(</span>
                    <span className="text-slate-400 dark:text-slate-500 text-[9px] font-normal">{paramsText}</span>
                    <span>)</span>
                    {method.name !== data.name && (
                      <span className="text-slate-400 dark:text-slate-500 font-normal"> : {method.returnType || 'void'}</span>
                    )}
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="text-[9px] italic text-slate-400 dark:text-slate-500 text-center opacity-60">Sin métodos</p>
          )}
        </section>
      )}
    </article>
  )
}

function formatVisibility(visibility: string): string {
  switch (visibility) {
    case 'public': return '+'
    case 'private': return '-'
    case 'protected': return '#'
    case 'package': return '~'
    default: return '+'
  }
}

export const ClassNode = memo(ClassNodeComponent, (prev, next) => {
  if (!prev.data || !next.data) return false
  return (
    prev.selected === next.selected &&
    prev.data.id === next.data.id &&
    prev.data.name === next.data.name &&
    prev.data.umlType === next.data.umlType &&
    (prev.data as any).packageId === (next.data as any).packageId &&
    (prev.data as any).isDraggedOver === (next.data as any).isDraggedOver &&
    prev.data.attributes === next.data.attributes &&
    prev.data.methods === next.data.methods &&
    prev.data.enumValues === next.data.enumValues
  )
})

ClassNode.displayName = 'ClassNode'
