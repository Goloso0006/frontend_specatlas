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

export function ProjectIsoRulesPage() {
  const { projectId } = useParams<{ projectId: string }>()

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
