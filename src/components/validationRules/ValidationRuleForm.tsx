import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import type { ValidationRuleRequest, ValidationRuleSeverity } from '../../types/validationRules'

interface ValidationRuleFormProps {
  form: ValidationRuleRequest
  selectedRuleId: string | null
  isLoading: boolean
  onFormValueChange: <K extends keyof ValidationRuleRequest>(key: K, value: ValidationRuleRequest[K]) => void
  onSave: (e: React.FormEvent) => void
  onReset: () => void
}

export function ValidationRuleForm({
  form,
  selectedRuleId,
  isLoading,
  onFormValueChange,
  onSave,
  onReset,
}: ValidationRuleFormProps) {
  return (
    <section className="space-y-6">
      <div className="bg-white dark:bg-[#1e1e1e] border border-app-border rounded-2xl p-6 shadow-sm sticky top-8">
        <h2 className="text-xl font-bold mb-6 tracking-tight">
          {selectedRuleId ? 'Editar Regla' : 'Nueva Regla'}
        </h2>

        <form onSubmit={onSave} className="space-y-4">
          <Input
            required
            label="Nombre"
            placeholder="Ej. Formato de Email"
            value={form.name}
            onChange={e => onFormValueChange('name', e.target.value)}
          />

          <Input
            required
            label="Tipo"
            placeholder="Ej. Regex, Presence"
            value={form.ruleType}
            onChange={e => onFormValueChange('ruleType', e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium app-text-secondary">Descripción</label>
            <textarea
              required
              className="w-full bg-[#fcfcfc] dark:bg-[#151515] border border-app-border rounded-lg px-4 py-3 text-[15px] focus:ring-2 focus:ring-app-accent/20 outline-none min-h-[100px] transition-all"
              placeholder="Explica qué valida esta regla..."
              value={form.description}
              onChange={e => onFormValueChange('description', e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium app-text-secondary">Condición (Lógica)</label>
            <textarea
              required
              className="w-full bg-[#fcfcfc] dark:bg-[#151515] border border-app-border rounded-lg px-4 py-3 text-[15px] font-mono focus:ring-2 focus:ring-app-accent/20 outline-none min-h-[100px] transition-all"
              placeholder="Ej. value.match(/^[a-z]+$/)"
              value={form.condition}
              onChange={e => onFormValueChange('condition', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium app-text-secondary">Severidad</label>
              <select
                className="w-full bg-[#fcfcfc] dark:bg-[#151515] border border-app-border rounded-lg px-4 py-2.5 text-sm appearance-none"
                value={form.severity}
                onChange={e => onFormValueChange('severity', e.target.value as ValidationRuleSeverity)}
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
                  onChange={e => onFormValueChange('enabled', e.target.checked)} 
                  className="w-4 h-4 rounded border-app-border"
                />
                <span className="text-sm font-medium">Activa</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            {selectedRuleId && (
              <Button type="button" variant="ghost" onClick={onReset} className="flex-1">
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
  )
}
