import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import type { DiagramClassNodeDTO } from '../../types/diagrams'

export function ClassNode({ data, selected }: NodeProps<Node<DiagramClassNodeDTO>>) {
  if (!data) return null
  
  const umlType = data.umlType || 'CLASS'
  const isAbstract = umlType === 'ABSTRACT_CLASS'
  const isInterface = umlType === 'INTERFACE'
  const isEnum = umlType === 'ENUM'

  const attributes = Array.isArray(data.attributes) ? data.attributes : []
  const methods = Array.isArray(data.methods) ? data.methods : []
  const enumValues = Array.isArray(data.enumValues) ? data.enumValues : []

  return (
    <article
      className={`group relative min-w-52 bg-white dark:bg-slate-900 rounded-xl border-2 transition-all duration-300 shadow-sm ${
        selected 
          ? 'border-blue-500 shadow-[0_10px_25px_-5px_rgba(59,130,246,0.3)] z-10 scale-[1.02]' 
          : 'border-slate-800 dark:border-slate-700'
      }`}
      style={{ zIndex: 10 }}
    >
      {/* Target Handles */}
      <Handle type="target" position={Position.Top} id="t-top" className="!w-2 !h-2 opacity-0 group-hover:opacity-100 hover:scale-125 !bg-blue-500 !border-0 transition-all duration-200" />
      <Handle type="target" position={Position.Bottom} id="t-bottom" className="!w-2 !h-2 opacity-0 group-hover:opacity-100 hover:scale-125 !bg-blue-500 !border-0 transition-all duration-200" />
      <Handle type="target" position={Position.Left} id="t-left" className="!w-2 !h-2 opacity-0 group-hover:opacity-100 hover:scale-125 !bg-blue-500 !border-0 transition-all duration-200" />
      <Handle type="target" position={Position.Right} id="t-right" className="!w-2 !h-2 opacity-0 group-hover:opacity-100 hover:scale-125 !bg-blue-500 !border-0 transition-all duration-200" />

      {/* Source Handles */}
      <Handle type="source" position={Position.Top} id="s-top" className="!w-2 !h-2 opacity-0 group-hover:opacity-100 hover:scale-125 !bg-emerald-500 !border-0 transition-all duration-200" />
      <Handle type="source" position={Position.Bottom} id="s-bottom" className="!w-2 !h-2 opacity-0 group-hover:opacity-100 hover:scale-125 !bg-emerald-500 !border-0 transition-all duration-200" />
      <Handle type="source" position={Position.Left} id="s-left" className="!w-2 !h-2 opacity-0 group-hover:opacity-100 hover:scale-125 !bg-emerald-500 !border-0 transition-all duration-200" />
      <Handle type="source" position={Position.Right} id="s-right" className="!w-2 !h-2 opacity-0 group-hover:opacity-100 hover:scale-125 !bg-emerald-500 !border-0 transition-all duration-200" />
      
      {/* Header: Stereotype & Name */}
      <header className={`border-b-2 border-slate-800 dark:border-slate-700 px-4 py-3 text-center rounded-t-xl ${
        isInterface ? 'bg-amber-50/50 dark:bg-amber-900/10' : 
        isEnum ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : 
        'bg-slate-50 dark:bg-slate-800/50'
      }`}>
        {(isAbstract || isInterface || isEnum) && (
          <p className="text-[9px] font-bold text-blue-600 dark:text-blue-400 mb-0.5 leading-none uppercase tracking-widest">
            {isAbstract ? '<<abstract>>' : isInterface ? '<<interface>>' : '<<enum>>'}
          </p>
        )}
        <h3 className={`text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider ${isAbstract ? 'italic underline decoration-blue-500/30' : ''}`}>
          {data.name || 'NuevaClase'}
        </h3>
      </header>

      {/* Attributes Section */}
      {!isInterface && !isEnum && (
        <section className="border-b-2 border-slate-800 dark:border-slate-700 px-3 py-2.5 min-h-[32px]">
          {attributes.length > 0 ? (
            <ul className="space-y-1">
              {attributes.map((attr) => (
                <li key={attr.id} className="text-[10px] font-mono text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <span className="text-blue-500 font-bold w-2">{formatVisibility(attr.visibility)}</span>
                  <span className="font-bold">{attr.name}</span>
                  <span className="text-slate-400">: {attr.type || 'String'}{attr.required ? ' *' : ''}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[9px] italic text-slate-400 text-center opacity-60">Sin atributos</p>
          )}
        </section>
      )}

      {/* Enum Values Section */}
      {isEnum && (
        <section className="border-b-2 border-slate-800 dark:border-slate-700 px-3 py-2.5 min-h-[32px]">
          {enumValues.length > 0 ? (
            <ul className="space-y-1 text-center">
              {enumValues.map((val) => (
                <li key={val.id} className="text-[10px] font-mono font-bold text-slate-700 dark:text-slate-200 uppercase">
                  {val.name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[9px] italic text-slate-400 text-center opacity-60">Sin valores</p>
          )}
        </section>
      )}

      {/* Methods Section */}
      {!isEnum && (
        <section className="px-3 py-2.5 min-h-[32px]">
          {methods.length > 0 ? (
            <ul className="space-y-1">
              {methods.map((method) => (
                <li key={method.id} className="text-[10px] font-mono text-slate-600 dark:text-slate-300 flex items-center gap-1.5 truncate">
                  <span className="text-emerald-500 font-bold w-2">{formatVisibility(method.visibility)}</span>
                  <span className="font-bold truncate">{method.name}()</span>
                  <span className="text-slate-400">: {method.returnType || 'void'}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[9px] italic text-slate-400 text-center opacity-60">Sin métodos</p>
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
