import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { PageShell } from '../components/layout/PageShell'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import IsoRuleCard from '../components/isoRules/IsoRuleCard'
import SelectedRulesTable from '../components/isoRules/SelectedRulesTable'
import FiltersToolbar from '../components/isoRules/FiltersToolbar'
import PresetsList from '../components/isoRules/PresetsList'
import { isValidProjectId } from '../context/ProjectContext'
import { ISO_PRESETS, getPresetWithRules } from '../constants/validationRuleTemplates'
import { useProjectIsoRules } from '../hooks/useProjectIsoRules'

type Tab = 'plantillas' | 'busqueda' | 'seleccionadas'

export function ProjectIsoRulesPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [activeTab, setActiveTab] = useState<Tab>('plantillas')

  const {
    searchQuery,
    setSearchQuery,
    filterCategory,
    setFilterCategory,
    selectedRuleIds,
    expandedRules,
    filteredRules,
    selectedRules,
    categories,
    isLoading,
    toggleRule,
    toggleExpandRule,
    applyPreset,
    removeRule,
    getCategoryLabel,
    handleNext,
    handleSkip,
  } = useProjectIsoRules(projectId)

  if (!isValidProjectId(projectId)) {
    return (
      <PageShell>
        <PageHeader title="Error" description="Project ID inválido o no disponible." />
      </PageShell>
    )
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'plantillas', label: 'Plantillas' },
    { id: 'busqueda', label: 'Búsqueda' },
    { id: 'seleccionadas', label: 'Seleccionadas' },
  ]

  return (
    <PageShell>
      <PageHeader
        title="Reglas del Proyecto"
        description="Selecciona los estándares ISO y mejores prácticas que guiarán el desarrollo de tu proyecto."
      />

      <main className="max-w-6xl mx-auto w-full px-8 pb-10 space-y-6">

        {/* ── Tab Panel ─────────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-app-border bg-app-card shadow-sm overflow-hidden">

          {/* Tab bar */}
          <div className="flex items-stretch border-b border-app-border">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={[
                    'relative flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-colors duration-150 focus:outline-none',
                    isActive
                      ? 'text-[var(--color-accent)] border-b-2 border-[var(--color-accent)] -mb-px bg-transparent'
                      : 'app-text-secondary hover:app-text-primary hover:bg-[var(--color-surface)]',
                  ].join(' ')}
                >
                  {tab.label}
                  {tab.id === 'seleccionadas' && selectedRules.length > 0 && (
                    <Badge variant="success" className="text-[10px] px-1.5 py-0.5">
                      {selectedRules.length}
                    </Badge>
                  )}
                  {tab.id === 'busqueda' && filteredRules.length > 0 && (
                    <Badge variant="neutral" className="text-[10px] px-1.5 py-0.5 border border-app-border">
                      {filteredRules.length}
                    </Badge>
                  )}
                </button>
              )
            })}
          </div>

          {/* ── Plantillas ──────────────────────────────────────────────── */}
          {activeTab === 'plantillas' && (
            <div className="p-6 space-y-5">
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
            </div>
          )}

          {/* ── Búsqueda ────────────────────────────────────────────────── */}
          {activeTab === 'busqueda' && (
            <div className="p-6 space-y-4">
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

              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <h4 className="text-base font-semibold tracking-tight app-text-primary">
                    Reglas disponibles
                  </h4>
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
              </div>
            </div>
          )}

          {/* ── Seleccionadas ───────────────────────────────────────────── */}
          {activeTab === 'seleccionadas' && (
            <div className="p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold tracking-tight app-text-primary">
                    Reglas seleccionadas
                  </h3>
                  <p className="mt-1 text-sm app-text-secondary">
                    Puedes quitar reglas individuales desde la tabla inferior.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="success">{selectedRules.length} activas</Badge>
                  {selectedRules.length > 0 && (
                    <Button
                      variant="ghost"
                      onClick={() => selectedRules.forEach((r) => removeRule(r.id))}
                      className="text-[var(--color-danger)] hover:bg-[var(--color-danger-subtle)] border border-[var(--color-danger)] text-xs px-3 py-1.5"
                    >
                      Eliminar todas
                    </Button>
                  )}
                </div>
              </div>

              {selectedRules.length === 0 ? (
                <div className="rounded-xl border border-dashed border-app-border bg-app-surface p-8 text-center">
                  <p className="text-sm app-text-secondary">
                    Aún no has seleccionado ninguna regla. Ve a <strong>Plantillas</strong> o <strong>Búsqueda</strong> para añadir.
                  </p>
                </div>
              ) : (
                <SelectedRulesTable selectedRules={selectedRules} onRemove={removeRule} />
              )}
            </div>
          )}
        </section>

        {/* ── Footer actions ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 rounded-2xl border border-app-border bg-app-card p-4 shadow-sm">
          <Button variant="ghost" onClick={handleSkip}>
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
