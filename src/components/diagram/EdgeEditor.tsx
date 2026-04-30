import type { DiagramRelationDTO, DiagramRelationType } from '../../types/diagrams'

const RELATION_TYPES: DiagramRelationType[] = [
  'association',
  'inheritance',
  'aggregation',
  'composition',
  'dependency',
]

export interface EdgeEditorProps {
  edge: DiagramRelationDTO
  onChange: (edge: DiagramRelationDTO) => void
}

export function EdgeEditor({ edge, onChange }: EdgeEditorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold">Relación seleccionada</h3>
        <p className="text-xs text-slate-400">{edge.id}</p>
      </div>

      <label className="block space-y-1 text-sm">
        <span>Label</span>
        <input
          className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2"
          value={edge.label}
          onChange={(event) => onChange({ ...edge, label: event.target.value })}
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span>Tipo</span>
        <select
          className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2"
          value={edge.type}
          onChange={(event) =>
            onChange({
              ...edge,
              type: event.target.value as DiagramRelationType,
            })
          }
        >
          {RELATION_TYPES.map((relationType) => (
            <option key={relationType} value={relationType}>
              {relationType}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-md border border-slate-700 p-3">
          <p className="text-slate-400">From</p>
          <p>{edge.from}</p>
        </div>
        <div className="rounded-md border border-slate-700 p-3">
          <p className="text-slate-400">To</p>
          <p>{edge.to}</p>
        </div>
      </div>

      <label className="block space-y-1 text-sm">
        <span>Derived from requirements</span>
        <input
          className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2"
          value={edge.derivedFromRequirements.join(', ')}
          onChange={(event) => {
            const next = event.target.value
            onChange({
              ...edge,
              derivedFromRequirements: next
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean),
            })
          }}
        />
      </label>
    </div>
  )
}
