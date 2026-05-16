import React from 'react'
import type { ValidationRule, RuleType, RuleTarget, RuleSeverity } from '../../types/requirements'

interface Props {
  form: ValidationRule
  selectedRuleId: string | null
  isLoading: boolean
  onFormValueChange: <K extends keyof ValidationRule>(key: K, value: ValidationRule[K]) => void
  onSave: (e: React.FormEvent) => void
  onReset: () => void
}

const ruleTypes: { id: RuleType; label: string }[] = [
  { id: 'AMBIGUOUS_TERMS', label: 'No usar términos ambiguos' },
  { id: 'RNF_REQUIRES_METRIC', label: 'Todo RNF debe tener métrica' },
  { id: 'RNF_REQUIRES_VERIFICATION_METHOD', label: 'Todo RNF debe tener método de verificación' },
  { id: 'RF_REQUIRES_ACTOR', label: 'Todo RF debe tener actor' },
  { id: 'ACCEPTANCE_CRITERIA_BDD', label: 'Criterios en formato BDD' },
  { id: 'NO_RF_RNF_MIX', label: 'No mezclar RF y RNF' },
  { id: 'TITLE_REQUIRED', label: 'Título obligatorio' },
  { id: 'DESCRIPTION_REQUIRED', label: 'Descripción obligatoria' },
]

export const ValidationRuleForm: React.FC<Props> = ({ form, selectedRuleId, isLoading, onFormValueChange, onSave, onReset }) => {
  const inp = "w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)] transition-all"
  const labelCls = "text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] ml-1"

  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl shadow-xl overflow-hidden flex flex-col h-fit sticky top-8">
      <div className="px-6 py-5 border-b border-[var(--color-border)] bg-[var(--color-surface)]/30">
        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
          {selectedRuleId ? 'Editar regla' : 'Nueva regla'}
        </h2>
        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Configura una regla de calidad personalizada.</p>
      </div>

      <form onSubmit={onSave} className="p-6 space-y-6">
        <div className="space-y-1.5">
          <label className={labelCls}>Nombre de la regla</label>
          <input
            value={form.name}
            onChange={e => onFormValueChange('name', e.target.value)}
            placeholder="Ej: Calidad de lenguaje RNF"
            className={inp}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className={labelCls}>Descripción</label>
          <textarea
            value={form.description}
            onChange={e => onFormValueChange('description', e.target.value)}
            placeholder="Explica el propósito de esta regla..."
            className={`${inp} min-h-[80px] resize-none`}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className={labelCls}>Tipo de regla</label>
            <select
              value={form.type}
              onChange={e => onFormValueChange('type', e.target.value as RuleType)}
              className={inp}
              required
            >
              {ruleTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className={labelCls}>Severidad</label>
            <select
              value={form.severity}
              onChange={e => onFormValueChange('severity', e.target.value as RuleSeverity)}
              className={inp}
              required
            >
              <option value="INFO">Informativo</option>
              <option value="WARNING">Advertencia</option>
              <option value="ERROR">Error</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className={labelCls}>Aplicar a</label>
          <select
            value={form.target}
            onChange={e => onFormValueChange('target', e.target.value as RuleTarget)}
            className={inp}
            required
          >
            <option value="FUNCTIONAL">Requisitos funcionales</option>
            <option value="NON_FUNCTIONAL">Requisitos no funcionales</option>
            <option value="BOTH">Ambos</option>
          </select>
        </div>

        {form.type === 'AMBIGUOUS_TERMS' && (
          <div className="space-y-1.5 p-4 bg-[var(--color-accent-subtle)]/5 border border-[var(--color-accent-subtle)] rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
            <label className={labelCls}>Términos ambiguos (separados por coma)</label>
            <textarea
              value={form.config || ''}
              onChange={e => onFormValueChange('config', e.target.value)}
              placeholder="rápido, seguro, eficiente, fácil..."
              className={`${inp} min-h-[60px] resize-none mt-1`}
            />
            <p className="text-[10px] text-[var(--color-text-muted)] italic mt-1 leading-tight">
              Si se deja vacío, se usarán los términos por defecto del sistema.
            </p>
          </div>
        )}

        <div className="flex items-center gap-3 py-2">
          <label className="flex items-center gap-2 cursor-pointer group">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                checked={form.active}
                onChange={e => onFormValueChange('active', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--color-accent)]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--color-accent)]"></div>
            </div>
            <span className="text-xs font-bold text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors">Activar esta regla</span>
          </label>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-[var(--color-border)]">
          <button
            type="button"
            onClick={onReset}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-[2] px-6 py-2.5 bg-[var(--color-text-primary)] text-[var(--color-bg-card)] rounded-xl text-sm font-bold shadow-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
          >
            {isLoading ? 'Guardando...' : selectedRuleId ? 'Actualizar regla' : 'Crear regla'}
          </button>
        </div>
      </form>
    </div>
  )
}
