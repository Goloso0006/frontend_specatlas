import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { PageShell } from '../components/layout/PageShell'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import IsoRuleCard from '../components/isoRules/IsoRuleCard'
import SelectedRulesTable from '../components/isoRules/SelectedRulesTable'
import FiltersToolbar from '../components/isoRules/FiltersToolbar'
import PresetsList from '../components/isoRules/PresetsList'
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

          <PresetsList
            presets={ISO_PRESETS}
            getPresetWithRules={getPresetWithRules}
            selectedRuleIds={selectedRuleIds}
            onToggle={applyPreset}
          />
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

          <FiltersToolbar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            categories={categories}
            getCategoryLabel={getCategoryLabel}
          />
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
              {filteredRules.map((rule) => (
                <IsoRuleCard
                  key={rule.id}
                  rule={rule}
                  isSelected={selectedRuleIds.has(rule.id)}
                  isExpanded={expandedRules.has(rule.id)}
                  onToggleSelect={toggleRule}
                  onToggleExpand={toggleExpandRule}
                />
              ))}
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

              <SelectedRulesTable selectedRules={selectedRules} onRemove={removeRule} />
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
