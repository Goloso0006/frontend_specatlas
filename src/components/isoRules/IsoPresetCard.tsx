
import { Badge } from '../ui/Badge'

export default function IsoPresetCard({
  preset,
  result,
  isApplied,
  isPartiallyApplied,
  onToggle,
}: any) {
  return (
    <button
      type="button"
      onClick={() => onToggle(preset.id)}
      className={`group relative overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${
        isApplied
          ? 'border-app-accent bg-app-accent/5 shadow-sm ring-1 ring-app-accent/20'
          : isPartiallyApplied
          ? 'border-amber-400 bg-amber-50/30 dark:bg-amber-900/10'
          : 'border-app-border bg-app-surface hover:border-app-accent/50 hover:bg-app-card'
      }`}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-transparent via-app-accent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="text-2xl">
          {preset.emoji.startsWith('/') ? (
            <img src={preset.emoji} alt={preset.name} className="h-8 w-8 object-contain" />
          ) : (
            preset.emoji
          )}
        </div>
        <div className="flex items-center gap-2">
          {isApplied && <Badge variant="success" className="text-[10px]">Activa</Badge>}
          {isPartiallyApplied && !isApplied && <Badge variant="warning" className="text-[10px]">Parcial</Badge>}
        </div>
      </div>

      <h4 className="mb-2 text-base font-semibold app-text-primary">{preset.name}</h4>
      <p className="mb-4 min-h-11 text-sm leading-relaxed app-text-secondary">{preset.description}</p>

      <div className="flex flex-wrap items-center gap-1.5">
        {result?.rules.slice(0, 2).map((rule: any) => (
          <Badge key={rule.id} variant="neutral" className="text-[10px] border border-app-border">{rule.code}</Badge>
        ))}
        {result && <Badge variant="neutral" className="text-[10px] border border-app-border">{result.rules.length} reglas</Badge>}
      </div>
    </button>
  )
}
