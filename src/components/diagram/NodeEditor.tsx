import type { ReactNode } from 'react'
import type {
  DiagramClassAttributeDTO,
  DiagramClassMethodDTO,
  DiagramClassNodeDTO,
} from '../../types/diagrams'

export interface NodeEditorProps {
  node: DiagramClassNodeDTO
  onChange: (node: DiagramClassNodeDTO) => void
}

export function NodeEditor({ node, onChange }: NodeEditorProps) {
  function updateAttribute(index: number, field: keyof DiagramClassAttributeDTO, value: string): void {
    onChange({
      ...node,
      attributes: node.attributes.map((attribute, currentIndex) =>
        currentIndex === index ? { ...attribute, [field]: value } : attribute,
      ),
    })
  }

  function updateMethod(index: number, field: keyof DiagramClassMethodDTO, value: string): void {
    onChange({
      ...node,
      methods: node.methods.map((method, currentIndex) =>
        currentIndex === index ? { ...method, [field]: value } : method,
      ),
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold">Nodo seleccionado</h3>
        <p className="text-xs text-slate-400">{node.id}</p>
      </div>

      <label className="block space-y-1 text-sm">
        <span>Nombre</span>
        <input
          className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2"
          value={node.name}
          onChange={(event) => onChange({ ...node, name: event.target.value })}
        />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="block space-y-1 text-sm">
          <span>X</span>
          <input
            type="number"
            className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2"
            value={node.position.x}
            onChange={(event) =>
              onChange({
                ...node,
                position: { ...node.position, x: Number(event.target.value) },
              })
            }
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>Y</span>
          <input
            type="number"
            className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2"
            value={node.position.y}
            onChange={(event) =>
              onChange({
                ...node,
                position: { ...node.position, y: Number(event.target.value) },
              })
            }
          />
        </label>
      </div>

      <label className="block space-y-1 text-sm">
        <span>Derived from requirements</span>
        <input
          className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2"
          value={node.derivedFromRequirements.join(', ')}
          onChange={(event) => {
            const next = event.target.value
            onChange({
              ...node,
              derivedFromRequirements: next
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean),
            })
          }}
        />
      </label>

      <EditorList
        title="Atributos"
        onAdd={() =>
          onChange({
            ...node,
            attributes: [
              ...node.attributes,
              { name: 'nuevoAtributo', type: 'String', visibility: 'private' },
            ],
          })
        }
      >
        {node.attributes.map((attribute, index) => (
          <div key={`${attribute.name}-${index}`} className="space-y-2 rounded-lg border border-slate-700 p-3">
            <input
              className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm"
              value={attribute.name}
              onChange={(event) => updateAttribute(index, 'name', event.target.value)}
              placeholder="Nombre"
            />
            <input
              className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm"
              value={attribute.type}
              onChange={(event) => updateAttribute(index, 'type', event.target.value)}
              placeholder="Tipo"
            />
            <select
              className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm"
              value={attribute.visibility}
              onChange={(event) => updateAttribute(index, 'visibility', event.target.value)}
            >
              <option value="public">public</option>
              <option value="private">private</option>
              <option value="protected">protected</option>
              <option value="package">package</option>
            </select>
          </div>
        ))}
      </EditorList>

      <EditorList
        title="Métodos"
        onAdd={() =>
          onChange({
            ...node,
            methods: [...node.methods, { name: 'nuevoMetodo', returnType: 'void', visibility: 'public' }],
          })
        }
      >
        {node.methods.map((method, index) => (
          <div key={`${method.name}-${index}`} className="space-y-2 rounded-lg border border-slate-700 p-3">
            <input
              className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm"
              value={method.name}
              onChange={(event) => updateMethod(index, 'name', event.target.value)}
              placeholder="Nombre"
            />
            <input
              className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm"
              value={method.returnType}
              onChange={(event) => updateMethod(index, 'returnType', event.target.value)}
              placeholder="Tipo retorno"
            />
            <select
              className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm"
              value={method.visibility}
              onChange={(event) => updateMethod(index, 'visibility', event.target.value)}
            >
              <option value="public">public</option>
              <option value="private">private</option>
              <option value="protected">protected</option>
              <option value="package">package</option>
            </select>
          </div>
        ))}
      </EditorList>
    </div>
  )
}

function EditorList({
  title,
  onAdd,
  children,
}: {
  title: string
  onAdd: () => void
  children: ReactNode
}) {
  return (
    <div className="space-y-3 rounded-xl border border-slate-700 bg-slate-950/50 p-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="font-semibold">{title}</h4>
        <button className="rounded-md bg-cyan-600 px-3 py-1 text-xs font-medium" onClick={onAdd}>
          Agregar
        </button>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}
