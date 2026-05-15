import { Badge } from '../ui/Badge'
import type { ValidationRuleResponse } from '../../types/validationRules'

interface ValidationRuleListProps {
  rules: ValidationRuleResponse[]
  selectedRuleId: string | null
  onSelect: (rule: ValidationRuleResponse) => void
  onDelete: (id: string) => void
}

export function ValidationRuleList({
  rules,
  selectedRuleId,
  onSelect,
  onDelete,
}: ValidationRuleListProps) {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between border-b border-app-border pb-4">
        <h2 className="text-2xl font-bold tracking-tight">Reglas Existentes</h2>
        <Badge variant="neutral">{rules.length} Reglas</Badge>
      </div>

      {rules.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-[#1e1e1e] border border-dashed border-app-border rounded-2xl">
          <p className="app-text-secondary">No hay reglas definidas.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {rules.map(rule => (
            <div 
              key={rule.id}
              onClick={() => onSelect(rule)}
              className={`p-5 bg-white dark:bg-[#1e1e1e] border rounded-xl cursor-pointer transition-all hover:shadow-md ${selectedRuleId === rule.id ? 'border-app-accent ring-1 ring-app-accent' : 'border-app-border'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold">{rule.name}</h3>
                <div className="flex items-center gap-2">
                  <Badge variant={rule.severity === 'ERROR' ? 'danger' : rule.severity === 'WARN' ? 'warning' : 'neutral'}>
                    {rule.severity}
                  </Badge>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(rule.id); }}
                    className="p-1.5 hover:bg-red-50 text-red-500 rounded-md transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <p className="text-sm app-text-secondary line-clamp-1">{rule.description}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
