
import { Badge } from '../ui/Badge'

export default function IsoRuleCard({ rule, isSelected, isExpanded, onToggleSelect, onToggleExpand }: any) {
  return (
    <button
      type="button"
      onClick={() => onToggleExpand(rule.id)}
      className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 ${
        isSelected
          ? 'border-app-accent bg-app-accent/5 shadow-sm ring-1 ring-app-accent/20'
          : 'border-app-border bg-app-surface hover:border-app-accent/40 hover:bg-app-card'
      }`}
    >
      <div className={`absolute left-0 top-0 h-full w-1 transition-colors ${isSelected ? 'bg-app-accent' : 'bg-transparent group-hover:bg-app-accent/30'}`} />

      <div className="flex items-start gap-3 pl-1">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(rule.id)}
          onClick={(e) => e.stopPropagation()}
          className="mt-1 h-4 w-4 shrink-0 rounded border-app-border text-app-accent focus:ring-app-accent"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-[15px] app-text-primary">{rule.code}</span>
                <span className="text-[13px] app-text-secondary">{rule.name}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant={rule.level === 'essential' ? 'danger' : rule.level === 'recommended' ? 'warning' : 'neutral'} className="text-[10px]">
                  {rule.level === 'essential' ? 'Esencial' : rule.level === 'recommended' ? 'Recomendado' : 'Opcional'}
                </Badge>
                {isSelected && <Badge variant="success" className="text-[10px]">Seleccionada</Badge>}
              </div>
            </div>

            <svg className={`shrink-0 w-4 h-4 app-text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>

          {isExpanded && (
            <div className="mt-4 grid gap-3 rounded-xl border border-app-border bg-app-card p-4">
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider app-text-muted">Descripción</p>
                <p className="text-[13px] leading-relaxed app-text-secondary">{rule.description}</p>
              </div>
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider app-text-muted">Condición / Guía de Implementación</p>
                <p className="rounded-lg border border-app-border bg-app-surface px-3 py-2 font-mono text-[12px] leading-relaxed app-text-secondary">{rule.condition}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </button>
  )
}
