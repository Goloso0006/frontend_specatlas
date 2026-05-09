import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { PageShell } from '../components/layout/PageShell'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useApiOperation } from '../hooks/useLoadingError'
import { validationRuleFacade } from '../facades/validationRule.facade'
import { isValidProjectId } from '../context/ProjectContext'
import {
  ISO_PRESETS,
  ISO_RULE_CATALOG,
  getPresetWithRules,
  searchIsoRules,
} from '../constants/validationRuleTemplates'
import type { ValidationRuleRequest } from '../types/validationRules'

type IsoRulesDraft = {
  manualSelectedRuleIds: string[]
  activePresetIds: string[]
  excludedRuleIds: string[]
}

function toSet(values: string[] | undefined): Set<string> {
  return new Set(values || [])
}

function inferActivePresetIds(selectedRuleIds: Set<string>): Set<string> {
  const active = ISO_PRESETS.filter((preset) => {
    const presetRules = getPresetWithRules(preset.id)?.rules || []
    return presetRules.length > 0 && presetRules.every((rule) => selectedRuleIds.has(rule.id))
  }).map((preset) => preset.id)

  return new Set(active)
}

export function ProjectIsoRulesPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { run, isLoading } = useApiOperation()

  const [searchQuery, setSearchQuery] = useState('')
  const [manualSelectedRuleIds, setManualSelectedRuleIds] = useState<Set<string>>(new Set())
  const [activePresetIds, setActivePresetIds] = useState<Set<string>>(new Set())
  const [excludedRuleIds, setExcludedRuleIds] = useState<Set<string>>(new Set())
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set())
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  const selectedRuleIds = useMemo(() => {
    const ids = new Set(manualSelectedRuleIds)

    activePresetIds.forEach((presetId) => {
      const preset = getPresetWithRules(presetId)
      preset?.rules.forEach((rule) => ids.add(rule.id))
    })

    excludedRuleIds.forEach((ruleId) => ids.delete(ruleId))

    return ids
  }, [manualSelectedRuleIds, activePresetIds, excludedRuleIds])

  const filteredRules =
    filterCategory === null
      ? searchIsoRules(searchQuery)
      : searchIsoRules(searchQuery).filter((rule) => rule.category === filterCategory)

  const selectedRules = ISO_RULE_CATALOG.filter((rule) => selectedRuleIds.has(rule.id))
  const categories = Array.from(new Set(ISO_RULE_CATALOG.map((rule) => rule.category)))

  if (!isValidProjectId(projectId)) {
    return (
      <PageShell>
        <PageHeader title="Error" description="Project ID inválido o no disponible." />
      </PageShell>
    )
  }

  function toggleRule(ruleId: string) {
    if (selectedRuleIds.has(ruleId)) {
      setManualSelectedRuleIds((current) => {
        const next = new Set(current)
        next.delete(ruleId)
        return next
      })

      setExcludedRuleIds((current) => {
        const next = new Set(current)
        next.add(ruleId)
        return next
      })
      return
    }

    setManualSelectedRuleIds((current) => {
      const next = new Set(current)
      next.add(ruleId)
      return next
    })

    setExcludedRuleIds((current) => {
      const next = new Set(current)
      next.delete(ruleId)
      return next
    })
  }

  function toggleExpandRule(ruleId: string) {
    setExpandedRules((current) => {
      const next = new Set(current)
      if (next.has(ruleId)) {
        next.delete(ruleId)
      } else {
        next.add(ruleId)
      }
      return next
    })
  }

  function applyPreset(presetId: string) {
    const preset = getPresetWithRules(presetId)
    if (!preset) return

    setActivePresetIds((current) => {
      const next = new Set(current)
      if (next.has(presetId)) {
        next.delete(presetId)
      } else {
        next.add(presetId)
      }
      return next
    })

    setExcludedRuleIds((current) => {
      const next = new Set(current)
      if (!activePresetIds.has(presetId)) {
        preset.rules.forEach((rule) => next.delete(rule.id))
      }
      return next
    })
  }

  function removeRule(ruleId: string) {
    toggleRule(ruleId)
  }

  function getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      quality: 'Calidad',
      security: 'Seguridad',
      governance: 'Gobernanza',
      agile: 'Ágil',
      architecture: 'Arquitectura',
    }

    return labels[category] || category
  }

  useEffect(() => {
    if (!projectId || !isHydrated) return

    const draftKey = `iso_rules_draft_${projectId}`
    const payload: IsoRulesDraft = {
      manualSelectedRuleIds: Array.from(manualSelectedRuleIds),
      activePresetIds: Array.from(activePresetIds),
      excludedRuleIds: Array.from(excludedRuleIds),
    }

    try {
      localStorage.setItem(draftKey, JSON.stringify(payload))
    } catch {
      // ignore storage errors
    }
  }, [projectId, isHydrated, manualSelectedRuleIds, activePresetIds, excludedRuleIds])

  useEffect(() => {
    if (!projectId) return

    const init = async () => {
      const skipKey = `iso_rules_skipped_${projectId}`
      const skipped = localStorage.getItem(skipKey)
      if (skipped === '1') {
        navigate(`/app/projects/${projectId}`)
        return
      }

      try {
        const existing = await validationRuleFacade.getRulesByProject(projectId)
        if (existing.length > 0) {
          const ids = existing
            .map((rule) => ISO_RULE_CATALOG.find((candidate) => candidate.code === rule.name)?.id)
            .filter((id): id is string => Boolean(id))

          const selectedIds = new Set(ids)
          setManualSelectedRuleIds(selectedIds)
          setActivePresetIds(inferActivePresetIds(selectedIds))
          setExcludedRuleIds(new Set())
          setIsHydrated(true)
          return
        }
      } catch {
        // ignore and try draft
      }

      try {
        const draftKey = `iso_rules_draft_${projectId}`
        const raw = localStorage.getItem(draftKey)
        if (raw) {
          const parsed = JSON.parse(raw) as IsoRulesDraft | string[]

          if (Array.isArray(parsed)) {
            setManualSelectedRuleIds(toSet(parsed))
            setActivePresetIds(new Set())
            setExcludedRuleIds(new Set())
          } else {
            setManualSelectedRuleIds(toSet(parsed.manualSelectedRuleIds))
            setActivePresetIds(toSet(parsed.activePresetIds))
            setExcludedRuleIds(toSet(parsed.excludedRuleIds))
          }

          setIsHydrated(true)
          return
        }
      } catch {
        // ignore draft errors
      }

      setIsHydrated(true)
    }

    void init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  async function handleNext() {
    if (selectedRules.length === 0) {
      alert('Por favor, selecciona al menos una regla.')
      return
    }

    if (!projectId || !isValidProjectId(projectId)) {
      alert('Error: Project ID inválido.')
      return
    }

    await run(
      async () => {
        const rulesToCreate: ValidationRuleRequest[] = selectedRules.map((rule) => ({
          projectId,
          name: rule.code,
          description: rule.description,
          ruleType: rule.ruleType,
          condition: rule.condition,
          severity: rule.level === 'essential' ? 'ERROR' : 'WARN',
          enabled: true,
        }))

        await Promise.all(rulesToCreate.map((rule) => validationRuleFacade.createRule(rule)))

        try {
          localStorage.removeItem(`iso_rules_draft_${projectId}`)
          localStorage.removeItem(`iso_rules_skipped_${projectId}`)
        } catch {
          // ignore storage cleanup errors
        }

        navigate(`/app/projects/${projectId}`)
      },
      { errorMessage: 'No fue posible guardar las reglas del proyecto.' }
    )
  }

  return (
    <PageShell>
      <PageHeader
        title="Reglas del Proyecto"
        description="Selecciona los estándares ISO y mejores prácticas que guiarán el desarrollo de tu proyecto."
      />

      <div className="max-w-6xl mx-auto space-y-8">
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider app-text-muted">
            Plantillas recomendadas
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {ISO_PRESETS.map((preset) => {
              const result = getPresetWithRules(preset.id)
              const presetRuleIds = result?.rules.map((rule) => rule.id) || []
              const isApplied =
                presetRuleIds.length > 0 &&
                presetRuleIds.every((ruleId) => selectedRuleIds.has(ruleId))
              const isPartiallyApplied =
                !isApplied && presetRuleIds.some((ruleId) => selectedRuleIds.has(ruleId))

              return (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset.id)}
                  className={`p-5 rounded-lg border-2 transition-all text-left ${
                    isApplied
                      ? 'border-app-accent bg-app-accent/5'
                      : isPartiallyApplied
                        ? 'border-amber-400 bg-amber-50/40 dark:bg-amber-900/10'
                        : 'border-app-border bg-app-card hover:border-app-accent/50'
                  }`}
                >
                  <div className="text-2xl mb-2">{preset.emoji}</div>
                  <h4 className="font-semibold text-base mb-1">{preset.name}</h4>
                  <p className="text-sm app-text-secondary leading-relaxed mb-3">
                    {preset.description}
                  </p>
                  <div className="flex flex-wrap gap-1 items-center">
                    {result?.rules.slice(0, 2).map((rule) => (
                      <Badge key={rule.id} variant="neutral" className="text-[10px]">
                        {rule.code}
                      </Badge>
                    ))}
                    {result && (
                      <Badge variant="neutral" className="text-[10px]">
                        {result.rules.length} reglas
                      </Badge>
                    )}
                    {isPartiallyApplied && !isApplied && (
                      <Badge variant="warning" className="text-[10px]">
                        Selección parcial
                      </Badge>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider app-text-muted">
            Buscar manualmente
          </h3>
          <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
            <Input
              placeholder="Busca por código ISO, nombre o descripción..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              type="search"
            />
            <select
              className="w-full app-card border border-app-border-strong rounded-md px-3 py-2 text-[15px] app-text-primary focus-ring interactive appearance-none"
              value={filterCategory || ''}
              onChange={(e) => setFilterCategory(e.target.value || null)}
            >
              <option value="">Todas las categorías</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {getCategoryLabel(category)}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider app-text-muted">
              Reglas disponibles ({filteredRules.length})
            </h3>
            {selectedRules.length > 0 && (
              <Badge variant="success">
                {selectedRules.length} seleccionada{selectedRules.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {filteredRules.length === 0 ? (
            <div className="p-8 text-center bg-app-surface rounded-lg border border-dashed border-app-border">
              <p className="app-text-secondary">No se encontraron reglas para tu búsqueda.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredRules.map((rule) => {
                const isSelected = selectedRuleIds.has(rule.id)
                const isExpanded = expandedRules.has(rule.id)

                return (
                  <div
                    key={rule.id}
                    className="bg-app-card border border-app-border rounded-lg overflow-hidden hover:border-app-border-strong transition-colors"
                  >
                    <button
                      onClick={() => toggleExpandRule(rule.id)}
                      className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-app-surface transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRule(rule.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded border-app-border cursor-pointer"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-[14px]">{rule.code}</span>
                          <span className="text-[13px] app-text-secondary">{rule.name}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant={
                            rule.level === 'essential'
                              ? 'danger'
                              : rule.level === 'recommended'
                                ? 'warning'
                                : 'neutral'
                          }
                          className="text-[10px]"
                        >
                          {rule.level === 'essential'
                            ? 'Esencial'
                            : rule.level === 'recommended'
                              ? 'Recomendado'
                              : 'Opcional'}
                        </Badge>
                        <svg
                          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 14l-7 7m0 0l-7-7m7 7V3"
                          />
                        </svg>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 py-3 bg-app-surface border-t border-app-border space-y-2">
                        <div>
                          <p className="text-[12px] font-semibold uppercase tracking-wider app-text-muted mb-1">
                            Descripción
                          </p>
                          <p className="text-[13px] app-text-secondary leading-relaxed">
                            {rule.description}
                          </p>
                        </div>
                        <div>
                          <p className="text-[12px] font-semibold uppercase tracking-wider app-text-muted mb-1">
                            Condición / Guía de Implementación
                          </p>
                          <p className="text-[13px] app-text-secondary leading-relaxed font-mono bg-app-card px-2 py-1.5 rounded border border-app-border">
                            {rule.condition}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {selectedRules.length > 0 && (
          <section className="space-y-3 bg-app-surface border border-app-border rounded-lg p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider app-text-muted">
              Reglas seleccionadas ({selectedRules.length})
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-app-border text-left">
                    <th className="pb-2 font-semibold app-text-muted px-3 py-2">Código ISO</th>
                    <th className="pb-2 font-semibold app-text-muted px-3 py-2">Descripción</th>
                    <th className="pb-2 font-semibold app-text-muted px-3 py-2 w-20">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedRules.map((rule) => (
                    <tr
                      key={rule.id}
                      className="border-b border-app-border hover:bg-app-card transition-colors"
                    >
                      <td className="px-3 py-3 font-semibold">{rule.code}</td>
                      <td className="px-3 py-3 app-text-secondary">{rule.description}</td>
                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={() => removeRule(rule.id)}
                          className="inline-flex items-center justify-center w-6 h-6 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Eliminar"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <div className="flex gap-3 justify-end pt-4 border-t border-app-border">
          <Button
            variant="ghost"
            onClick={() => {
              try {
                localStorage.setItem(`iso_rules_skipped_${projectId}`, '1')
                localStorage.removeItem(`iso_rules_draft_${projectId}`)
              } catch {
                // ignore storage errors
              }
              navigate(`/app/projects/${projectId}`)
            }}
          >
            Omitir
          </Button>
          <Button onClick={handleNext} isLoading={isLoading} disabled={selectedRules.length === 0}>
            Guardar reglas y continuar
          </Button>
        </div>
      </div>
    </PageShell>
  )
}

export default ProjectIsoRulesPage
