import IsoPresetCard from './IsoPresetCard'

type Preset = {
  id: string
  name: string
  description: string
  emoji: string
}

type Rule = {
  id: string
  code: string
}

type PresetWithRules = {
  rules: Rule[]
}

type PresetsListProps = {
  presets: Preset[]
  getPresetWithRules: (id: string) => PresetWithRules | undefined | null
  selectedRuleIds: Set<string>
  onToggle: (id: string) => void
}

export default function PresetsList({
  presets,
  getPresetWithRules,
  selectedRuleIds,
  onToggle,
}: PresetsListProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {presets.map((preset) => {
        const result = getPresetWithRules(preset.id)
        const presetRuleIds = result?.rules.map((rule) => rule.id) || []
        const isApplied =
          presetRuleIds.length > 0 &&
          presetRuleIds.every((ruleId) => selectedRuleIds.has(ruleId))
        const isPartiallyApplied =
          !isApplied && presetRuleIds.some((ruleId) => selectedRuleIds.has(ruleId))

        return (
          <IsoPresetCard
            key={preset.id}
            preset={preset}
            result={result}
            isApplied={isApplied}
            isPartiallyApplied={isPartiallyApplied}
            onToggle={onToggle}
          />
        )
      })}
    </div>
  )
}
