import { useState } from 'react'
import { validationRulesApi } from '../api/services/validationRulesApi'
import type { ValidationRuleRequest, ValidationRuleResponse, ValidationRuleSeverity } from '../types/validationRules'
import { DataCard, DataField, EmptyState } from '../components/ui/DataDisplay'
const EMPTY_RULE: ValidationRuleRequest = {
  projectId: '',
  name: '',
  description: '',
  ruleType: '',
  condition: '',
  severity: 'WARN',
  enabled: true,
}

export function ValidationRulesPage() {
  const [projectId, setProjectId] = useState('')
  const [ruleId, setRuleId] = useState('')
  const [form, setForm] = useState<ValidationRuleRequest>(EMPTY_RULE)
  const [rules, setRules] = useState<ValidationRuleResponse[]>([])
  const [selectedRule, setSelectedRule] = useState<ValidationRuleResponse | null>(null)
  const [status, setStatus] = useState('Listo para administrar reglas de validacion')

  async function handleList(): Promise<void> {
    if (!projectId.trim()) {
      setStatus('Debes indicar projectId.')
      return
    }

    try {
      const data = await validationRulesApi.listByProject(projectId.trim())
      setRules(data)
      setStatus(`Reglas cargadas: ${data.length}`)
    } catch {
      setStatus('No fue posible listar las reglas.')
    }
  }

  async function handleLoadById(): Promise<void> {
    if (!ruleId.trim()) {
      setStatus('Debes indicar ruleId.')
      return
    }

    const match = rules.find((rule) => rule.id === ruleId.trim())
    if (!match) {
      setStatus('La regla no esta en el listado actual.')
      return
    }

    setSelectedRule(match)
    setForm({
      projectId: match.projectId,
      name: match.name,
      description: match.description,
      ruleType: match.ruleType,
      condition: match.condition,
      severity: match.severity,
      enabled: match.enabled,
    })
    setProjectId(match.projectId)
    setStatus('Regla cargada para edicion.')
  }

  async function handleSave(): Promise<void> {
    if (!form.projectId.trim() || !form.name.trim() || !form.ruleType.trim() || !form.condition.trim()) {
      setStatus('Completa projectId, nombre, tipo y condicion.')
      return
    }

    try {
      const payload = {
        ...form,
        projectId: form.projectId.trim(),
        name: form.name.trim(),
        description: form.description.trim(),
        ruleType: form.ruleType.trim(),
        condition: form.condition.trim(),
      }
      const data = selectedRule
        ? await validationRulesApi.update(selectedRule.id, payload)
        : await validationRulesApi.create(payload)
      setSelectedRule(data)
      setRuleId(data.id)
      setForm({
        projectId: data.projectId,
        name: data.name,
        description: data.description,
        ruleType: data.ruleType,
        condition: data.condition,
        severity: data.severity,
        enabled: data.enabled,
      })
      setStatus('Regla guardada correctamente.')
    } catch {
      setStatus('No fue posible guardar la regla.')
    }
  }

  async function handleDelete(): Promise<void> {
    if (!selectedRule) {
      setStatus('Primero carga una regla.')
      return
    }

    try {
      await validationRulesApi.remove(selectedRule.id)
      setSelectedRule(null)
      setRuleId('')
      setForm(EMPTY_RULE)
      setStatus('Regla eliminada correctamente.')
    } catch {
      setStatus('No fue posible eliminar la regla.')
    }
  }

  function updateField<K extends keyof ValidationRuleRequest>(key: K, value: ValidationRuleRequest[K]): void {
    setForm((current) => ({ ...current, [key]: value }))
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <section className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
          <h1 className="text-3xl font-semibold tracking-tight">Reglas de validacion</h1>
          <p className="text-sm text-slate-300">CRUD basico por proyecto para administrar validaciones.</p>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900 p-4">
            <h2 className="font-semibold">Formulario</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2" placeholder="projectId" value={form.projectId} onChange={(event) => updateField('projectId', event.target.value)} />
              <input className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2" placeholder="ruleId para cargar" value={ruleId} onChange={(event) => setRuleId(event.target.value)} />
              <input className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2 sm:col-span-2" placeholder="Nombre" value={form.name} onChange={(event) => updateField('name', event.target.value)} />
              <input className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2 sm:col-span-2" placeholder="Tipo de regla" value={form.ruleType} onChange={(event) => updateField('ruleType', event.target.value)} />
              <textarea className="min-h-24 rounded-md border border-slate-600 bg-slate-800 px-3 py-2 sm:col-span-2" placeholder="Descripcion" value={form.description} onChange={(event) => updateField('description', event.target.value)} />
              <textarea className="min-h-28 rounded-md border border-slate-600 bg-slate-800 px-3 py-2 sm:col-span-2" placeholder="Condicion" value={form.condition} onChange={(event) => updateField('condition', event.target.value)} />
              <select className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2" value={form.severity} onChange={(event) => updateField('severity', event.target.value as ValidationRuleSeverity)}>
                <option value="INFO">INFO</option>
                <option value="WARN">WARN</option>
                <option value="ERROR">ERROR</option>
              </select>
              <label className="flex items-center gap-2 rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm">
                <input type="checkbox" checked={form.enabled} onChange={(event) => updateField('enabled', event.target.checked)} />
                Activa
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="rounded-md bg-cyan-600 px-3 py-2 font-medium" onClick={handleSave}>
                Guardar regla
              </button>
              <button className="rounded-md bg-slate-700 px-3 py-2 font-medium" onClick={handleLoadById}>
                Cargar por id
              </button>
              <button className="rounded-md bg-rose-600 px-3 py-2 font-medium" onClick={handleDelete}>
                Eliminar regla
              </button>
            </div>
          </article>

          <aside className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900 p-4">
            <input
              className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2"
              placeholder="projectId para listar"
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
            />
            <button className="w-full rounded-md bg-indigo-600 px-3 py-2 font-medium" onClick={handleList}>
              Listar reglas por proyecto
            </button>
            <div className="rounded-xl border border-slate-700 bg-slate-950/50 p-3 text-sm">
              <p className="text-slate-300">{status}</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-950/50 p-3">
              <h3 className="mb-3 font-semibold">Regla seleccionada</h3>
              {selectedRule ? (
                <dl className="space-y-3">
                  <DataField label="ID">{selectedRule.id}</DataField>
                  <DataField label="Nombre">{selectedRule.name}</DataField>
                  <DataField label="Descripción">{selectedRule.description}</DataField>
                  <DataField label="Tipo">{selectedRule.ruleType}</DataField>
                  <DataField label="Condición">
                    <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-slate-300">
                      {selectedRule.condition}
                    </code>
                  </DataField>
                  <DataField label="Severidad">
                    <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs uppercase tracking-wider">
                      {selectedRule.severity}
                    </span>
                  </DataField>
                  <DataField label="Estado">
                    {selectedRule.enabled ? (
                      <span className="text-emerald-400">Activa</span>
                    ) : (
                      <span className="text-rose-400">Inactiva</span>
                    )}
                  </DataField>
                </dl>
              ) : (
                <EmptyState message="Selecciona una regla del listado." />
              )}
            </div>
          </aside>
        </section>

        <article className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
          <h2 className="mb-3 font-semibold">Listado</h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {rules.length === 0 ? (
              <div className="col-span-full">
                <EmptyState message="Sin reglas cargadas." />
              </div>
            ) : (
              rules.map((rule) => (
                <DataCard
                  key={rule.id}
                  title={rule.name}
                  subtitle={rule.ruleType}
                  onClick={() => {
                    setSelectedRule(rule)
                    setRuleId(rule.id)
                    setProjectId(rule.projectId)
                    setForm({
                      projectId: rule.projectId,
                      name: rule.name,
                      description: rule.description,
                      ruleType: rule.ruleType,
                      condition: rule.condition,
                      severity: rule.severity,
                      enabled: rule.enabled,
                    })
                  }}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-widest text-slate-400">{rule.severity}</span>
                    {rule.enabled ? (
                      <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-slate-600"></span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-300 line-clamp-2">{rule.description}</p>
                </DataCard>
              ))
            )}
          </div>
        </article>
      </section>
    </main>
  )
}
