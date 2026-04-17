import { Handle, Position, type NodeProps } from 'reactflow'
import type { DiagramClassNodeDTO } from '../../types/diagrams'

export function ClassDiagramNode({ data, selected }: NodeProps<DiagramClassNodeDTO>) {
  return (
    <article
      className={`min-w-56 rounded-xl border bg-slate-900 shadow-lg ${
        selected ? 'border-cyan-400 ring-2 ring-cyan-400/40' : 'border-slate-600'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!h-3 !w-3 !border-0 !bg-cyan-400" />
      <header className="border-b border-slate-700 px-4 py-3">
        <p className="text-[11px] uppercase tracking-[0.3em] text-cyan-300">Class</p>
        <h3 className="text-lg font-semibold text-white">{data.name}</h3>
      </header>
      <section className="border-b border-slate-700 px-4 py-3 text-sm text-slate-200">
        <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-400">Attributes</p>
        {data.attributes.length === 0 ? (
          <p className="text-slate-500">Sin atributos</p>
        ) : (
          <ul className="space-y-1">
            {data.attributes.map((attribute, index) => (
              <li key={`${attribute.name}-${index}`}>
                {formatVisibility(attribute.visibility)} {attribute.name}: {attribute.type}
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="px-4 py-3 text-sm text-slate-200">
        <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-400">Methods</p>
        {data.methods.length === 0 ? (
          <p className="text-slate-500">Sin métodos</p>
        ) : (
          <ul className="space-y-1">
            {data.methods.map((method, index) => (
              <li key={`${method.name}-${index}`}>
                {formatVisibility(method.visibility)} {method.name}(): {method.returnType}
              </li>
            ))}
          </ul>
        )}
      </section>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !border-0 !bg-cyan-400"
      />
    </article>
  )
}

function formatVisibility(visibility: DiagramClassNodeDTO['attributes'][number]['visibility']): string {
  switch (visibility) {
    case 'public':
      return '+'
    case 'private':
      return '-'
    case 'protected':
      return '#'
    case 'package':
    default:
      return '~'
  }
}
