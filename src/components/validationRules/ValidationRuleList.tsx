import React from 'react'
import type { ValidationRule } from '../../types/requirements'

interface Props {
  rules: ValidationRule[]
  selectedRuleId: string | null
  onSelect: (rule: ValidationRule) => void
  onDelete: (id: string) => void
  onToggle: (id: string) => void
}

const severityLabel = { INFO: 'Informativo', WARNING: 'Advertencia', ERROR: 'Error' }
const targetLabel = { FUNCTIONAL: 'Requisitos funcionales', NON_FUNCTIONAL: 'Requisitos no funcionales', BOTH: 'Ambos' }

export const ValidationRuleList: React.FC<Props> = ({ rules, selectedRuleId, onSelect, onDelete, onToggle }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Reglas de validación</h2>
        <span className="px-3 py-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full text-xs font-bold text-[var(--color-text-muted)]">
          {rules.length} {rules.length === 1 ? 'regla' : 'reglas'}
        </span>
      </div>

      {rules.length === 0 ? (
        <div className="p-12 border-2 border-dashed border-[var(--color-border)] rounded-2xl flex flex-col items-center justify-center text-center bg-[var(--color-surface)]/20">
          <div className="w-16 h-16 bg-[var(--color-surface)] rounded-2xl flex items-center justify-center mb-4 border border-[var(--color-border)]">
            <svg className="w-8 h-8 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <p className="text-[var(--color-text-secondary)] font-medium">No hay reglas de validación configuradas.</p>
          <p className="text-[var(--color-text-muted)] text-sm mt-1">Crea una nueva regla para empezar a validar tus requisitos.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {rules.map(rule => (
            <div
              key={rule.id}
              onClick={() => onSelect(rule)}
              className={`group p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden
                ${selectedRuleId === rule.id ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)]/5 shadow-lg' : 'border-[var(--color-border)] bg-[var(--color-bg-card)] hover:border-[var(--color-accent)] hover:shadow-md'}
                ${!rule.active ? 'opacity-60 grayscale-[0.5]' : ''}
              `}
            >
              <div className="flex items-start justify-between relative z-10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">{rule.name}</h3>
                    <div className={`w-2 h-2 rounded-full ${rule.active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] line-clamp-1">{rule.description}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest
                    ${rule.severity === 'ERROR' ? 'bg-rose-500/10 text-rose-500' : rule.severity === 'WARNING' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}
                  `}>
                    {severityLabel[rule.severity as keyof typeof severityLabel]}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider relative z-10">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    {targetLabel[rule.target as keyof typeof targetLabel]}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                    {rule.type}
                  </span>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button
                    onClick={(e) => { e.stopPropagation(); onToggle(rule.id!); }}
                    className="p-1.5 rounded-lg hover:bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                    title={rule.active ? "Desactivar regla" : "Activar regla"}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(rule.id!); }}
                    className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500"
                    title="Eliminar regla"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
