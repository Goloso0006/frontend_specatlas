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
      governance: 'Gestión y control',
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

      <main className="max-w-6xl mx-auto w-full px-8 pb-10 space-y-8">
        <section className="rounded-2xl border border-app-border bg-app-card p-6 shadow-sm space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-lg font-bold tracking-tight app-text-primary">
                Plantillas recomendadas
              </h3>
              <p className="text-sm app-text-secondary mt-1 max-w-2xl">
                Activa una plantilla para aplicar varias reglas a la vez. Si la vuelves a pulsar, se desactiva sin afectar otras selecciones.
              </p>
            </div>
            <Badge variant="neutral" className="w-fit border border-app-border">
              {selectedRules.length} reglas activas
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                  type="button"
                  onClick={() => applyPreset(preset.id)}
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
                    <div className="text-2xl">{preset.emoji}</div>
                    <div className="flex items-center gap-2">
                      {isApplied && (
                        <Badge variant="success" className="text-[10px]">
                          Activa
                        </Badge>
                      )}
                      {isPartiallyApplied && !isApplied && (
                        <Badge variant="warning" className="text-[10px]">
                          Parcial
                        </Badge>
                      )}
                    </div>
                  </div>

                  <h4 className="mb-2 text-base font-semibold app-text-primary">
                    {preset.name}
                  </h4>

                  <p className="mb-4 min-h-11 text-sm leading-relaxed app-text-secondary">
                    {preset.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {result?.rules.slice(0, 2).map((rule) => (
                      <Badge key={rule.id} variant="neutral" className="text-[10px] border border-app-border">
                        {rule.code}
                      </Badge>
                    ))}
                    {result && (
                      <Badge variant="neutral" className="text-[10px] border border-app-border">
                        {result.rules.length} reglas
                      </Badge>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-app-border bg-app-card p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-lg font-bold tracking-tight app-text-primary">
              Buscar manualmente
            </h3>
            <p className="mt-1 text-sm app-text-secondary">
              Usa el buscador para encontrar una regla específica y el filtro para acotar por categoría.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_220px]">
            <Input
              placeholder="Busca por código ISO, nombre o descripción..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              type="search"
            />
            <select
              className="w-full rounded-xl border border-app-border bg-app-surface px-4 py-3 text-[15px] app-text-primary outline-none transition-colors focus:border-app-accent"
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

        <section className="rounded-2xl border border-app-border bg-app-card p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold tracking-tight app-text-primary">
                Reglas disponibles
              </h3>
              <p className="mt-1 text-sm app-text-secondary">
                Selecciona una o varias reglas. La tarjeta se resalta cuando está activa.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="neutral" className="border border-app-border">
                {filteredRules.length} visibles
              </Badge>
              {selectedRules.length > 0 && (
                <Badge variant="success">
                  {selectedRules.length} seleccionada{selectedRules.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>

          {filteredRules.length === 0 ? (
            <div className="rounded-xl border border-dashed border-app-border bg-app-surface p-8 text-center">
              <p className="text-sm app-text-secondary">No se encontraron reglas para tu búsqueda.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredRules.map((rule) => {
                const isSelected = selectedRuleIds.has(rule.id)
                const isExpanded = expandedRules.has(rule.id)

                return (
                  <button
                    key={rule.id}
                    type="button"
                    onClick={() => toggleExpandRule(rule.id)}
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
                        onChange={() => toggleRule(rule.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 h-4 w-4 shrink-0 rounded border-app-border text-app-accent focus:ring-app-accent"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-[15px] app-text-primary">
                                {rule.code}
                              </span>
                              <span className="text-[13px] app-text-secondary">
                                {rule.name}
                              </span>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
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
                              {isSelected && (
                                <Badge variant="success" className="text-[10px]">
                                  Seleccionada
                                </Badge>
                              )}
                            </div>
                          </div>

                          <svg
                            className={`shrink-0 w-4 h-4 app-text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}
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

                        {isExpanded && (
                          <div className="mt-4 grid gap-3 rounded-xl border border-app-border bg-app-card p-4">
                            <div>
                              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider app-text-muted">
                                Descripción
                              </p>
                              <p className="text-[13px] leading-relaxed app-text-secondary">
                                {rule.description}
                              </p>
                            </div>
                            <div>
                              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider app-text-muted">
                                Condición / Guía de Implementación
                              </p>
                              <p className="rounded-lg border border-app-border bg-app-surface px-3 py-2 font-mono text-[12px] leading-relaxed app-text-secondary">
                                {rule.condition}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </section>

        {selectedRules.length > 0 && (
          <section className="rounded-2xl border border-app-border bg-app-card p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold tracking-tight app-text-primary">
                  Reglas seleccionadas
                </h3>
                <p className="mt-1 text-sm app-text-secondary">
                  Puedes quitar reglas individuales desde la tabla inferior.
                </p>
              </div>
              <Badge variant="success">{selectedRules.length} activas</Badge>
            </div>

            <div className="overflow-hidden rounded-xl border border-app-border">
              <table className="w-full text-sm">
                <thead className="bg-app-surface">
                  <tr className="border-b border-app-border text-left">
                    <th className="px-4 py-3 font-semibold app-text-muted">Código ISO</th>
                    <th className="px-4 py-3 font-semibold app-text-muted">Descripción</th>
                    <th className="w-20 px-4 py-3 font-semibold app-text-muted">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedRules.map((rule) => (
                    <tr key={rule.id} className="border-b border-app-border last:border-b-0 bg-app-card">
                      <td className="px-4 py-3 font-semibold app-text-primary">{rule.code}</td>
                      <td className="px-4 py-3 app-text-secondary">{rule.description}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => removeRule(rule.id)}
                          className="inline-flex items-center justify-center rounded-lg px-2 py-1 text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
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

        <div className="flex items-center justify-end gap-3 rounded-2xl border border-app-border bg-app-card p-4 shadow-sm">
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
      </main>
    </PageShell>
  )
}

export default ProjectIsoRulesPage
