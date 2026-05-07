import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { validationRuleFacade } from '../facades/validationRule.facade'
import { useApiOperation } from '../hooks/useLoadingError'
import { isValidProjectId } from '../context/ProjectContext'
import { NoProjectSelected } from '../components/ui/NoProjectSelected'
import type { ValidationRuleRequest, ValidationRuleResponse, ValidationRuleSeverity } from '../types/validationRules'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'

export function ValidationRulesPage() {
  const { projectId: routeProjectId } = useParams()
  const projectId = routeProjectId ?? ''

  const EMPTY_RULE: ValidationRuleRequest = {
    projectId,
    name: '',
    description: '',
    ruleType: '',
    condition: '',
    severity: 'WARN',
    enabled: true,
  }

  const [form, setForm] = useState<ValidationRuleRequest>(EMPTY_RULE)
  const [rules, setRules] = useState<ValidationRuleResponse[]>([])
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null)
  const { run, isLoading } = useApiOperation()

  useEffect(() => {
    if (isValidProjectId(projectId)) {
      handleList()
    }
  }, [projectId])

  async function handleList() {
    await run(async () => {
      const data = await validationRuleFacade.getRulesByProject(projectId)
      setRules(data)
    })
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    
    // Validations: All fields mandatory
    if (!form.name.trim() || !form.ruleType.trim() || !form.condition.trim() || !form.description.trim()) {
      alert('Todos los campos son obligatorios.')
      return
    }

    await run(async () => {
      if (selectedRuleId) {
        await validationRuleFacade.updateRule(selectedRuleId, form)
      } else {
        await validationRuleFacade.createRule(form)
      }
      await handleList()
      handleReset()
    }, { errorMessage: 'Error al guardar la regla.' })
  }

  async function handleDelete(id: string) {
    if (!window.confirm('¿Eliminar esta regla?')) return
    await run(async () => {
      await validationRuleFacade.deleteRule(id)
      await handleList()
      if (selectedRuleId === id) handleReset()
    })
  }

  function handleSelect(rule: ValidationRuleResponse) {
    setSelectedRuleId(rule.id)
    setForm({
      projectId: rule.projectId,
      name: rule.name,
      description: rule.description,
      ruleType: rule.ruleType,
      condition: rule.condition,
      severity: rule.severity,
      enabled: rule.enabled,
    })
  }

  function handleReset() {
    setSelectedRuleId(null)
    setForm(EMPTY_RULE)
  }

  if (!isValidProjectId(projectId)) {
    return <NoProjectSelected message="Selecciona un proyecto para gestionar sus reglas." />
  }

  return (
    <div className="min-h-screen bg-app-bg flex flex-col">
      <main className="max-w-6xl mx-auto w-full py-12 px-8 grid gap-12 lg:grid-cols-[1fr_400px]">
        {/* Left: List */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-app-border pb-4">
            <h2 className="text-2xl font-bold tracking-tight">Reglas Existentes</h2>
            <Badge variant="neutral">{rules.length} Reglas</Badge>
          </div>

          {rules.length === 0 ? (
            <div className="py-20 text-center bg-white dark:bg-[#1e1e1e] border border-dashed border-app-border rounded-2xl">
              <p className="app-text-secondary">No hay reglas definidas.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {rules.map(rule => (
                <div 
                  key={rule.id}
                  onClick={() => handleSelect(rule)}
                  className={`p-5 bg-white dark:bg-[#1e1e1e] border rounded-xl cursor-pointer transition-all hover:shadow-md ${selectedRuleId === rule.id ? 'border-app-accent ring-1 ring-app-accent' : 'border-app-border'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold">{rule.name}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant={rule.severity === 'ERROR' ? 'danger' : rule.severity === 'WARN' ? 'warning' : 'neutral'}>
                        {rule.severity}
                      </Badge>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(rule.id); }}
                        className="p-1.5 hover:bg-red-50 text-red-500 rounded-md transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <p className="text-sm app-text-secondary line-clamp-1">{rule.description}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Right: Form */}
        <section className="space-y-6">
          <div className="bg-white dark:bg-[#1e1e1e] border border-app-border rounded-2xl p-6 shadow-sm sticky top-8">
            <h2 className="text-xl font-bold mb-6 tracking-tight">
              {selectedRuleId ? 'Editar Regla' : 'Nueva Regla'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              <Input
                required
                label="Nombre"
                placeholder="Ej. Formato de Email"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />

              <Input
                required
                label="Tipo"
                placeholder="Ej. Regex, Presence"
                value={form.ruleType}
                onChange={e => setForm({ ...form, ruleType: e.target.value })}
              />

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium app-text-secondary">Descripción</label>
                <textarea
                  required
                  className="w-full bg-[#fcfcfc] dark:bg-[#151515] border border-app-border rounded-lg px-4 py-3 text-[15px] focus:ring-2 focus:ring-app-accent/20 outline-none min-h-[100px] transition-all"
                  placeholder="Explica qué valida esta regla..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium app-text-secondary">Condición (Lógica)</label>
                <textarea
                  required
                  className="w-full bg-[#fcfcfc] dark:bg-[#151515] border border-app-border rounded-lg px-4 py-3 text-[15px] font-mono focus:ring-2 focus:ring-app-accent/20 outline-none min-h-[100px] transition-all"
                  placeholder="Ej. value.match(/^[a-z]+$/)"
                  value={form.condition}
                  onChange={e => setForm({ ...form, condition: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium app-text-secondary">Severidad</label>
                  <select
                    className="w-full bg-[#fcfcfc] dark:bg-[#151515] border border-app-border rounded-lg px-4 py-2.5 text-sm appearance-none"
                    value={form.severity}
                    onChange={e => setForm({ ...form, severity: e.target.value as ValidationRuleSeverity })}
                  >
                    <option value="INFO">INFO</option>
                    <option value="WARN">WARN</option>
                    <option value="ERROR">ERROR</option>
                  </select>
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-3 px-4 py-2.5 bg-[#fcfcfc] dark:bg-[#151515] border border-app-border rounded-lg cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={form.enabled} 
                      onChange={e => setForm({ ...form, enabled: e.target.checked })} 
                      className="w-4 h-4 rounded border-app-border"
                    />
                    <span className="text-sm font-medium">Activa</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                {selectedRuleId && (
                  <Button type="button" variant="ghost" onClick={handleReset} className="flex-1">
                    Limpiar
                  </Button>
                )}
                <Button type="submit" className="flex-1" isLoading={isLoading}>
                  {selectedRuleId ? 'Actualizar' : 'Crear Regla'}
                </Button>
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  )
}
