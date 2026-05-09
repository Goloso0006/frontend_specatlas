import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PageShell } from '../components/layout/PageShell'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { useApiOperation } from '../hooks/useLoadingError'
import { validationRuleFacade } from '../facades/validationRule.facade'
import { isValidProjectId } from '../context/ProjectContext'
import {
  ISO_RULE_CATALOG,
  ISO_PRESETS,
  getPresetWithRules,
  searchIsoRules,
} from '../constants/validationRuleTemplates'
import type { ValidationRuleRequest } from '../types/validationRules'

export function ProjectIsoRulesPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { run, isLoading } = useApiOperation()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRuleIds, setSelectedRuleIds] = useState<Set<string>>(new Set())
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set())
  const [filterCategory, setFilterCategory] = useState<string | null>(null)

  if (!isValidProjectId(projectId)) {
    return (
      <PageShell>
        <PageHeader
          title="Error"
          description="Project ID inválido o no disponible."
        />
      </PageShell>
    )
  }

  // Get visible rules based on search and filter
  const filteredRules =
    filterCategory === null
      ? searchIsoRules(searchQuery)
      : searchIsoRules(searchQuery).filter((r) => r.category === filterCategory)

  // Get selected rule objects
  const selectedRules = ISO_RULE_CATALOG.filter((r) =>
    selectedRuleIds.has(r.id)
  )

  // Categories from catalog
  const categories = Array.from(
    new Set(ISO_RULE_CATALOG.map((r) => r.category))
  )

  function toggleRule(ruleId: string) {
    const newSelected = new Set(selectedRuleIds)
    if (newSelected.has(ruleId)) {
      newSelected.delete(ruleId)
    } else {
      newSelected.add(ruleId)
    }
    setSelectedRuleIds(newSelected)
  }

  function toggleExpandRule(ruleId: string) {
    const newExpanded = new Set(expandedRules)
    if (newExpanded.has(ruleId)) {
      newExpanded.delete(ruleId)
    } else {
      newExpanded.add(ruleId)
    }
    setExpandedRules(newExpanded)
  }

  function applyPreset(presetId: string) {
    const result = getPresetWithRules(presetId)
    if (result) {
      const newSelected = new Set(selectedRuleIds)
      const allApplied = result.rules.every((r) => newSelected.has(r.id))

      if (allApplied) {
        // If preset already applied, remove its rules (toggle off)
        result.rules.forEach((rule) => newSelected.delete(rule.id))
      } else {
        // Otherwise add all preset rules
        result.rules.forEach((rule) => newSelected.add(rule.id))
      }

      setSelectedRuleIds(newSelected)
    }
  }

  function removeRule(ruleId: string) {
    const newSelected = new Set(selectedRuleIds)
    newSelected.delete(ruleId)
    setSelectedRuleIds(newSelected)
  }

  // Persist draft selections locally so user can navigate away and return
  useEffect(() => {
    if (!projectId) return
    const draftKey = `iso_rules_draft_${projectId}`
    const arr = Array.from(selectedRuleIds)
    try {
      localStorage.setItem(draftKey, JSON.stringify(arr))
    } catch (e) {
      // ignore storage errors
    }
  }, [selectedRuleIds, projectId])

  // On mount: load existing saved rules (backend) or draft from localStorage.
  useEffect(() => {
    if (!projectId) return

    const init = async () => {
      const skipKey = `iso_rules_skipped_${projectId}`
      const skipped = localStorage.getItem(skipKey)
      if (skipped === '1') {
        // If user explicitly omitted onboarding, go back to project
        navigate(`/app/projects/${projectId}`)
        return
      }

      try {
        const existing = await validationRuleFacade.getRulesByProject(projectId)
        if (existing && existing.length > 0) {
          // Match by name (we store rule.code as the name when creating)
          const ids = existing
            .map((r) => ISO_RULE_CATALOG.find((c) => c.code === r.name)?.id)
            .filter((id): id is string => !!id)
          setSelectedRuleIds(new Set(ids))
          return
        }
      } catch (e) {
        // ignore and try draft
      }

      // Fallback to draft in localStorage
      const draftKey = `iso_rules_draft_${projectId}`
      try {
        const raw = localStorage.getItem(draftKey)
        if (raw) {
          const arr: string[] = JSON.parse(raw)
          setSelectedRuleIds(new Set(arr))
        }
      } catch (e) {
        // ignore
      }
    }

    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  function getCategoryLabel(cat: string): string {
    const labels: Record<string, string> = {
      quality: 'Calidad',
      security: 'Seguridad',
      governance: 'Gobernanza',
      agile: 'Ágil',
      architecture: 'Arquitectura',
    }
    return labels[cat] || cat
  }

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
        // Convert selected rules to ValidationRuleRequest objects
        const rulesToCreate: ValidationRuleRequest[] = selectedRules.map(
          (rule) => ({
            projectId,
            name: rule.code,
            description: rule.description,
            ruleType: rule.ruleType,
            condition: rule.condition,
            severity: rule.level === 'essential' ? 'ERROR' : 'WARN',
            enabled: true,
          })
        )

        // Create all rules in parallel
        await Promise.all(
          rulesToCreate.map((rule) => validationRuleFacade.createRule(rule))
        )

        // Clear any draft and skipped flag
        try {
          localStorage.removeItem(`iso_rules_draft_${projectId}`)
          localStorage.removeItem(`iso_rules_skipped_${projectId}`)
        } catch (e) {}

        // Navigate to project workspace
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
        {/* ── Preset Templates ── */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider app-text-muted">
            Plantillas Recomendadas
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {ISO_PRESETS.map((preset) => {
              const result = getPresetWithRules(preset.id)
              const isApplied = result
                ? result.rules.every((r) => selectedRuleIds.has(r.id)) &&
                  result.rules.length > 0
                : false

              return (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset.id)}
                  className={`p-5 rounded-lg border-2 transition-all text-left ${
                    isApplied
                      ? 'border-app-accent bg-app-accent/5'
                      : 'border-app-border bg-app-card hover:border-app-accent/50'
                  }`}
                >
                  <div className="text-2xl mb-2">{preset.emoji}</div>
                  <h4 className="font-semibold text-base mb-1">
                    {preset.name}
                  </h4>
                  <p className="text-sm app-text-secondary leading-relaxed mb-3">
                    {preset.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {result?.rules.slice(0, 2).map((r) => (
                      <Badge key={r.id} variant="neutral" className="text-[10px]">
                        {r.code}
                      </Badge>
                    ))}
                    {result && result.rules.length > 2 && (
                      <Badge variant="neutral" className="text-[10px]">
                        +{result.rules.length - 2}
                      </Badge>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {/* ── Search & Filter ── */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider app-text-muted">
            O Busca Manualmente
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
              onChange={(e) =>
                setFilterCategory(e.target.value || null)
              }
            >
              <option value="">Todas las categorías</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {getCategoryLabel(cat)}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* ── Rules List ── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider app-text-muted">
              Reglas Disponibles ({filteredRules.length})
            </h3>
            {selectedRules.length > 0 && (
              <Badge variant="success">
                {selectedRules.length} seleccionada{
                  selectedRules.length !== 1 ? 's' : ''
                }
              </Badge>
            )}
          </div>

          {filteredRules.length === 0 ? (
            <div className="p-8 text-center bg-app-surface rounded-lg border border-dashed border-app-border">
              <p className="app-text-secondary">
                No se encontraron reglas para tu búsqueda.
              </p>
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
                    {/* Rule Header */}
                    <button
                      onClick={() => toggleExpandRule(rule.id)}
                      className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-app-surface transition-colors"
                    >
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRule(rule.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded border-app-border cursor-pointer"
                      />

                      {/* Rule Code & Name */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-[14px]">
                            {rule.code}
                          </span>
                          <span className="text-[13px] app-text-secondary">
                            {rule.name}
                          </span>
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex items-center gap-2 flex-shrink-0">
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
                          className={`w-4 h-4 transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
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

                    {/* Rule Details (Expanded) */}
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

        {/* ── Selected Rules Summary ── */}
        {selectedRules.length > 0 && (
          <section className="space-y-3 bg-app-surface border border-app-border rounded-lg p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider app-text-muted">
              Reglas Seleccionadas ({selectedRules.length})
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-app-border text-left">
                    <th className="pb-2 font-semibold app-text-muted px-3 py-2">
                      Código ISO
                    </th>
                    <th className="pb-2 font-semibold app-text-muted px-3 py-2">
                      Descripción
                    </th>
                    <th className="pb-2 font-semibold app-text-muted px-3 py-2 w-20">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedRules.map((rule) => (
                    <tr
                      key={rule.id}
                      className="border-b border-app-border hover:bg-app-card transition-colors"
                    >
                      <td className="px-3 py-3 font-semibold">{rule.code}</td>
                      <td className="px-3 py-3 app-text-secondary">
                        {rule.description}
                      </td>
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

        {/* ── Navigation Buttons ── */}
        <div className="flex gap-3 justify-end pt-4 border-t border-app-border">
          <Button
            variant="ghost"
            onClick={() => {
              // Mark as skipped so we don't force onboarding again
              try {
                localStorage.setItem(`iso_rules_skipped_${projectId}`, '1')
                // also clear draft
                localStorage.removeItem(`iso_rules_draft_${projectId}`)
              } catch (e) {}
              navigate(`/app/projects/${projectId}`)
            }}
          >
            Omitir
          </Button>
          <Button onClick={handleNext} isLoading={isLoading} disabled={selectedRules.length === 0}>
            Guardar Reglas y Continuar
          </Button>
        </div>
      </div>
    </PageShell>
  )
}
