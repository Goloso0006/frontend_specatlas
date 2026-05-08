import React, { useEffect, useState } from 'react'
import { requirementFacade } from '../../facades/requirement.facade'
import type { RequirementDTO } from '../../types/requirements'
import type { ImpactGraphResponse } from '../../types/graph'

interface DeleteConfirmationModalProps {
  requirement: RequirementDTO
  onConfirm: () => void
  onCancel: () => void
}

type RiskLevel = 'Bajo' | 'Medio' | 'Alto'

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  requirement,
  onConfirm,
  onCancel
}) => {
  const [impact, setImpact] = useState<ImpactGraphResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadImpact = async () => {
      if (!requirement.id) {
        setLoading(false)
        return
      }
      try {
        const data = await requirementFacade.getGraphImpact(requirement.id)
        setImpact(data)
      } catch (err) {
        console.error('Error fetching impact:', err)
        setError('No fue posible consultar el impacto de este requisito.')
      } finally {
        setLoading(false)
      }
    }

    loadImpact()
  }, [requirement.id])

  const relationCount = impact?.edges.length || 0
  
  const riskLevel: RiskLevel = 
    relationCount === 0 ? 'Bajo' :
    relationCount <= 2 ? 'Medio' : 'Alto'

  const riskColor = 
    riskLevel === 'Bajo' ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' :
    riskLevel === 'Medio' ? 'text-amber-600 bg-amber-500/10 border-amber-500/20' :
    'text-rose-600 bg-rose-500/10 border-rose-500/20'

  const hasImpact = relationCount > 0

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--color-text-primary)]">¿Eliminar requisito?</h3>
                <p className="text-sm text-[var(--color-text-muted)] font-mono">{requirement.code || 'Borrador'}</p>
              </div>
            </div>
            {!loading && !error && (
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${riskColor}`}>
                Riesgo {riskLevel}
              </span>
            )}
          </div>
          
          <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/10 mb-6">
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Estás a punto de eliminar permanentemente: <br/>
              <span className="font-bold text-[var(--color-text-primary)]">{requirement.title || 'Sin título'}</span>
            </p>
          </div>

          {/* IMPACT SECTION */}
          <div className="mb-6">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-3">
              Impacto de eliminación
            </h4>
            
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
              {loading ? (
                <div className="p-8 flex flex-col items-center justify-center gap-3">
                  <div className="w-6 h-6 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-[var(--color-text-muted)]">Analizando dependencias...</p>
                </div>
              ) : error ? (
                <div className="p-6 text-center">
                  <p className="text-xs text-rose-500 font-medium">{error}</p>
                </div>
              ) : !hasImpact ? (
                <div className="p-6 text-center">
                  <p className="text-xs text-[var(--color-text-muted)]">No se encontraron relaciones directas para este requisito.</p>
                </div>
              ) : (
                <div className="max-h-[160px] overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--color-border-strong)] p-2">
                  <div className="space-y-1">
                    {impact?.edges.map(edge => {
                      const relatedNode = impact.nodes.find(n => n.id === (edge.source === requirement.id ? edge.target : edge.source))
                      if (!relatedNode) return null
                      return (
                        <div key={edge.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--color-bg)] transition-colors group">
                          <div className="flex flex-col">
                            <span className="text-[11px] font-mono font-bold text-[var(--color-text-primary)]">{relatedNode.code}</span>
                            <span className="text-[11px] text-[var(--color-text-secondary)] line-clamp-1">{relatedNode.title}</span>
                          </div>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--color-bg-card)] text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] transition-colors">
                            {edge.label || 'Relacionado'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
            {hasImpact && !loading && (
              <p className="text-[10px] text-rose-600/70 mt-3 italic font-medium">
                * La eliminación romperá {relationCount} relación(es) existente(s).
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold bg-[var(--color-surface)] border border-[var(--color-border-strong)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg)] transition-all active:scale-95"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-lg ${
                hasImpact 
                  ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-rose-500/20' 
                  : 'bg-rose-500/90 text-white hover:bg-rose-600 shadow-rose-500/10'
              }`}
            >
              {hasImpact ? 'Eliminar de todas formas' : 'Eliminar requisito'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
