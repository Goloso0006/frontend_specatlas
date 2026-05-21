import React, { useState } from 'react'
import type { RequirementDeleteImpactResponse, RiskLevel, DeleteImpactRelation } from '../../types/requirements'

interface RequirementDeleteImpactModalProps {
  impact: RequirementDeleteImpactResponse
  onConfirm: () => void
  onCancel: () => void
  isDeleting: boolean
}

export const RequirementDeleteImpactModal: React.FC<RequirementDeleteImpactModalProps> = ({
  impact,
  onConfirm,
  onCancel,
  isDeleting
}) => {
  const [understood, setUnderstood] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const hasCriticalImpact = 
    (impact.affectedDiagrams && impact.affectedDiagrams.length > 0) || 
    (impact.affectedActors && impact.affectedActors.length > 0)

  const getRiskStyles = (level: RiskLevel) => {
    if (hasCriticalImpact) {
      return { 
        bg: 'bg-rose-500/10', 
        text: 'text-rose-600', 
        border: 'border-rose-300 dark:border-rose-800', 
        badge: 'bg-rose-600 text-white animate-pulse',
        label: 'IMPACTO CRÍTICO' 
      }
    }
    switch (level) {
      case 'HIGH':
        return { 
          bg: 'bg-rose-500/10', 
          text: 'text-rose-600', 
          border: 'border-rose-200', 
          badge: 'bg-rose-600 text-white',
          label: 'Impacto alto' 
        }
      case 'MEDIUM':
        return { 
          bg: 'bg-amber-500/10', 
          text: 'text-amber-600', 
          border: 'border-amber-200', 
          badge: 'bg-amber-600 text-white',
          label: 'Impacto medio' 
        }
      case 'LOW':
        return { 
          bg: 'bg-blue-500/10', 
          text: 'text-blue-600', 
          border: 'border-blue-200', 
          badge: 'bg-blue-600 text-white',
          label: 'Impacto bajo' 
        }
      case 'NONE':
      default:
        return { 
          bg: 'bg-emerald-500/10', 
          text: 'text-emerald-600', 
          border: 'border-emerald-200', 
          badge: 'bg-emerald-600 text-white',
          label: 'Sin impacto detectado' 
        }
    }
  }

  const styles = getRiskStyles(impact.riskLevel)
  const isHighRisk = impact.riskLevel === 'HIGH' || impact.riskLevel === 'MEDIUM' || hasCriticalImpact

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`bg-[var(--color-bg-card)] border ${hasCriticalImpact ? 'border-rose-500 shadow-rose-500/10' : 'border-[var(--color-border)]'} w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200`}>
        {/* Header */}
        <div className={`px-6 py-5 border-b border-[var(--color-border)] flex items-center justify-between ${hasCriticalImpact ? 'bg-rose-500/10' : 'bg-rose-500/5'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${styles.bg} ${styles.text}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h2 className={`text-xl font-black ${hasCriticalImpact ? 'text-rose-600 dark:text-rose-500' : 'text-[var(--color-text-primary)]'}`}>
                {hasCriticalImpact ? '¡ADVERTENCIA DE IMPACTO CRÍTICO!' : 'Confirmar eliminación'}
              </h2>
              <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
                {hasCriticalImpact ? 'Esta eliminación romperá elementos del modelado vivo.' : 'Esta acción no se puede deshacer.'}
              </p>
            </div>
          </div>
          <button onClick={onCancel} className="p-2 rounded-lg hover:bg-[var(--color-surface)] transition-colors text-[var(--color-text-muted)]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar max-h-[70vh]">
          {/* Summary Card */}
          <div className={`p-4 rounded-xl border ${styles.border} ${styles.bg} space-y-3`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-white dark:bg-black/20 rounded font-mono text-[10px] font-bold border border-black/5 dark:border-white/5 uppercase tracking-tight">
                  {impact.code}
                </span>
                <span className="font-bold text-sm text-[var(--color-text-primary)]">{impact.title}</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${styles.badge}`}>
                {styles.label}
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              {impact.summary || "Se eliminará el requisito del sistema permanentemente."}
            </p>
          </div>

          {/* CRITICAL IMPACT LIVE ASSETS (VIBRANT RED LIST) */}
          {hasCriticalImpact && (
            <div className="p-5 rounded-xl border border-rose-500/30 bg-rose-500/5 space-y-4">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-500">
                <svg className="w-5 h-5 flex-shrink-0 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="text-xs font-black uppercase tracking-wider">Elementos Vivos que Quedarán Huérfanos/Rotos:</h3>
              </div>
              
              <div className="space-y-3.5">
                {impact.affectedActors && impact.affectedActors.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">Actores en Lienzos de Casos de Uso</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {impact.affectedActors.map((actor, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 rounded-lg text-xs font-bold">
                          <span>👤</span>
                          <span className="truncate">{actor}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {impact.affectedDiagrams && impact.affectedDiagrams.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">Diagramas de Casos de Uso Afectados</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {impact.affectedDiagrams.map((diag, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 rounded-lg text-xs font-bold">
                          <span>📊</span>
                          <span className="truncate">{diag}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Impact Sections */}
          <div className="grid gap-6">
            <ImpactSection 
              title="Relaciones del grafo" 
              items={[
                ...impact.incomingRelations.map(r => ({ ...r, category: 'Entrante' })),
                ...impact.outgoingRelations.map(r => ({ ...r, category: 'Saliente' })),
                ...impact.dependentRequirements.map(r => ({ ...r, category: 'Dependencia' })),
                ...impact.impactedRequirements.map(r => ({ ...r, category: 'Impacto' })),
                ...impact.conflicts.map(r => ({ ...r, category: 'Conflicto' }))
              ]} 
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SimpleSection title="Diagramas relacionados" items={impact.relatedDiagrams.map(d => `${d.name} (${d.type})`)} />
              <SimpleSection title="Casos de prueba" items={impact.relatedTestCases?.map(tc => `[${tc.code}] ${tc.title}`) || []} />
              <SimpleSection title="Arquitectura" items={impact.relatedArchitecture?.map(a => `${a.name} (${a.type})`) || []} />
              <SimpleSection title="Códigos relacionados" items={impact.relatedCodes} />
            </div>

            {impact.warnings.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-rose-500 ml-1">Advertencias críticas</h4>
                <div className="space-y-1.5">
                  {impact.warnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 bg-rose-500/5 border border-rose-500/20 rounded-lg text-[11px] text-rose-600 font-medium">
                      <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      {w}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-[var(--color-border)] bg-[var(--color-surface)]/30 flex flex-col gap-4">
          {/* Explicit ELIMINAR Confirmation Input for Critical Impact */}
          {hasCriticalImpact ? (
            <div className="p-4 bg-rose-500/5 rounded-xl border border-rose-500/20 space-y-2">
              <label className="block text-xs font-bold text-[var(--color-text-primary)]">
                Para autorizar la eliminación de este requisito y romper sus vínculos en el modelo, escribe <span className="text-rose-500 font-mono font-black select-all">ELIMINAR</span> a continuación:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder="Escribe ELIMINAR para habilitar"
                className="w-full bg-white dark:bg-zinc-950 border border-rose-500/30 rounded-xl px-3 py-2 text-xs text-rose-600 dark:text-rose-400 font-mono font-bold uppercase focus:border-rose-500 outline-none placeholder:text-rose-500/30"
              />
            </div>
          ) : isHighRisk ? (
            <label className="flex items-start gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={understood} 
                onChange={e => setUnderstood(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-[var(--color-border-strong)] text-rose-600 focus:ring-rose-500"
              />
              <span className="text-xs text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors leading-relaxed">
                Entiendo que este requisito tiene relaciones asociadas en el grafo o trazabilidad (pruebas, diagramas, arquitectura) y su eliminación puede afectar la integridad de otros componentes.
              </span>
            </label>
          ) : null}

          <div className="flex items-center justify-end gap-3">
            <button 
              onClick={onCancel}
              disabled={isDeleting}
              className="px-5 py-2 text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button 
              onClick={onConfirm}
              disabled={isDeleting || (hasCriticalImpact ? confirmText !== 'ELIMINAR' : (isHighRisk && !understood))}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed
                ${isHighRisk ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-[var(--color-text-primary)] text-[var(--color-bg-card)] hover:opacity-90'}
              `}
            >
              {isDeleting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Eliminando…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  {hasCriticalImpact ? 'Destruir y Eliminar' : 'Eliminar de todas formas'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ImpactSection({ title, items }: { title: string, items: (DeleteImpactRelation & { category: string })[] }) {
  if (items.length === 0) return (
    <div className="space-y-2">
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] ml-1">{title}</h4>
      <div className="p-4 border-2 border-dashed border-[var(--color-border)] rounded-xl text-center">
        <p className="text-[10px] text-[var(--color-text-muted)]">No se encontraron relaciones registradas.</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-2">
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] ml-1">{title}</h4>
      <div className="grid gap-2">
        {items.map((rel, i) => (
          <div key={i} className="flex items-center gap-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl p-3 text-xs">
            <span className="font-mono font-bold text-[var(--color-accent)]">{rel.sourceCode}</span>
            <div className="flex-1 flex items-center justify-center gap-2">
              <div className="h-[1px] flex-1 bg-[var(--color-border-strong)]" />
              <div className="flex flex-col items-center">
                <span className="px-2 py-0.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[8px] font-bold uppercase tracking-tighter text-[var(--color-text-muted)]">
                  {rel.relationType}
                </span>
                <span className="text-[7px] font-bold uppercase text-[var(--color-accent)] mt-0.5">{rel.category}</span>
              </div>
              <div className="h-[1px] flex-1 bg-[var(--color-border-strong)]" />
            </div>
            <span className="font-mono font-bold text-[var(--color-accent)]">{rel.targetCode}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SimpleSection({ title, items }: { title: string, items: string[] }) {
  return (
    <div className="space-y-2">
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] ml-1">{title}</h4>
      {items.length === 0 ? (
        <p className="text-[10px] text-[var(--color-text-muted)] ml-1 italic">Sin datos.</p>
      ) : (
        <ul className="space-y-1 ml-1">
          {items.map((it, i) => (
            <li key={i} className="text-[11px] text-[var(--color-text-secondary)] flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-[var(--color-accent)]" />
              {it}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
