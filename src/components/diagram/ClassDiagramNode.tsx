import { Handle, Position, type NodeProps } from 'reactflow'
import type { DiagramClassNodeDTO } from '../../types/diagrams'

export function ClassDiagramNode({ data, selected }: NodeProps<DiagramClassNodeDTO>) {
  return (
    <article
      className={`min-w-56 rounded-xl border app-card shadow-lg ${
        selected ? 'border-app-accent ring-2 ring-app-accent/40' : 'app-border-strong'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!h-3 !w-3 !border-0 !bg-app-accent" />
      <header className="border-b app-border-strong px-4 py-3">
        <p className="text-[11px] uppercase tracking-[0.3em] text-app-accent">Class</p>
        <h3 className="text-lg font-semibold text-white">{data.name}</h3>
      </header>
      <section className="border-b app-border-strong px-4 py-3 text-sm app-text-primary">
        <p className="mb-2 text-xs uppercase tracking-[0.2em] app-text-muted">Attributes</p>
        {data.attributes.length === 0 ? (
          <p className="app-text-muted opacity-80">Sin atributos</p>
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
      <section className="px-4 py-3 text-sm app-text-primary">
        <p className="mb-2 text-xs uppercase tracking-[0.2em] app-text-muted">Methods</p>
        {data.methods.length === 0 ? (
          <p className="app-text-muted opacity-80">Sin métodos</p>
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
        className="!h-3 !w-3 !border-0 !bg-app-accent"
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
