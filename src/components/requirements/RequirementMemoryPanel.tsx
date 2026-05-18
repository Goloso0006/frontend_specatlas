import React, { useState } from 'react'
import type { RequirementMemoryResponse, StructuralRelation } from '../../types/requirements'
import { formatSimilarityPercentage } from './RequirementSimilarityPanel'

interface RequirementMemoryPanelProps {
  memory: RequirementMemoryResponse
  onClose: () => void
  qualityIssues?: any[]
}

type TabType = 'semantica' | 'estructural' | 'procedimental' | 'trazabilidad'

export const RequirementMemoryPanel: React.FC<RequirementMemoryPanelProps> = ({ memory, onClose, qualityIssues }) => {
  const [activeTab, setActiveTab] = useState<TabType>('semantica')

  // Global warnings from any section
  const allWarnings = [
    ...(memory.semantic?.warnings || []),
    ...(memory.structural?.warnings || []),
    ...(memory.procedural?.warnings || []),
    ...(memory.traceability?.warnings || []),
    ...((memory as any).warnings || [])
  ]

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'semantica', label: 'Semántica', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> },
    { id: 'estructural', label: 'Estructural', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> },
    { id: 'procedimental', label: 'Procedimental', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> },
    { id: 'trazabilidad', label: 'Trazabilidad', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg> }
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm p-4 md:p-6">
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] w-full max-w-2xl h-full rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-surface)]/50">
          <div>
            <h2 className="text-xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <svg className="w-6 h-6 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Memoria del requisito
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] mt-1 font-mono uppercase tracking-wider">
              {memory.code} · {memory.title}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--color-border)] transition-colors text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--color-border)] bg-[var(--color-surface)]/30 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[120px] px-4 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-all relative
                ${activeTab === tab.id ? 'text-[var(--color-accent)] bg-[var(--color-accent-subtle)]/10' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]'}
              `}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--color-accent)] rounded-full" />}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {allWarnings.length > 0 && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase tracking-wider">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                Advertencias del sistema
              </div>
              <ul className="list-disc list-inside space-y-1">
                {Array.from(new Set(allWarnings)).map((w, i) => (
                  <li key={i} className="text-[11px] text-amber-700/80 leading-tight">{w}</li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === 'semantica' && <SemanticSection memory={memory.semantic} />}
          {activeTab === 'estructural' && <StructuralSection memory={memory.structural} />}
          {activeTab === 'procedimental' && <ProceduralSection memory={memory.procedural} qualityIssues={qualityIssues} />}
          {activeTab === 'trazabilidad' && <TraceabilitySection memory={memory.traceability} />}
        </div>
      </div>
    </div>
  )
}

function SemanticSection({ memory: rawMemory }: { memory: RequirementMemoryResponse['semantic'] }) {
  const memory = rawMemory ?? { similarRequirements: [], warnings: [] }
  const similarRequirements = memory.similarRequirements || []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[var(--color-accent)]">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        Análisis Semántico
      </div>
      
      {similarRequirements.length === 0 ? (
        <div className="p-8 border-2 border-dashed border-[var(--color-border)] rounded-2xl flex flex-col items-center justify-center text-center bg-[var(--color-surface)]/20 shadow-sm">
          <svg className="w-12 h-12 text-[var(--color-border-strong)] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
          <p className="text-[var(--color-text-primary)] font-bold text-sm mb-1.5">No hay memoria semántica generada para este requisito.</p>
          <p className="text-[var(--color-text-muted)] text-xs max-w-sm leading-relaxed">Este requisito aún no ha sido comparado con otros o no presenta coincidencias significativas en el corpus del proyecto.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {similarRequirements.map(match => (
            <div key={match.requirementId} className="border border-[var(--color-border)] rounded-xl p-4 bg-[var(--color-bg)] hover:border-[var(--color-accent)] transition-colors group">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] font-bold text-[var(--color-text-muted)] bg-[var(--color-surface)] px-2 py-1 rounded border border-[var(--color-border)] uppercase tracking-tighter">
                    {match.code}
                  </span>
                  <span className="font-bold text-sm text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">{match.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[var(--color-accent)]">{formatSimilarityPercentage(match)}%</span>
                </div>
              </div>
              {match.explanation && <p className="text-xs text-[var(--color-text-secondary)] mb-3 leading-relaxed">{match.explanation}</p>}
              {match.recommendation && (
                <div className="bg-[var(--color-surface)]/50 rounded-lg p-2.5 border border-[var(--color-border)]">
                  <p className="text-[11px] text-[var(--color-text-secondary)]">
                    <span className="font-bold text-[var(--color-text-primary)]">Sugerencia:</span> {match.recommendation}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StructuralSection({ memory: rawMemory }: { memory: RequirementMemoryResponse['structural'] }) {
  const memory = rawMemory ?? { 
    outgoingRelations: [], 
    incomingRelations: [], 
    dependencies: [], 
    conflicts: [], 
    impactedRequirements: [], 
    warnings: [] 
  }
  const hasNeo4jWarning = (memory.warnings || []).some(w => w.toLowerCase().includes('neo4j') || w.toLowerCase().includes('nodo'))
  
  const sections: { title: string; items: StructuralRelation[] }[] = [
    { title: 'Relaciones salientes', items: memory.outgoingRelations || [] },
    { title: 'Relaciones entrantes', items: memory.incomingRelations || [] },
    { title: 'Dependencias', items: memory.dependencies || [] },
    { title: 'Conflictos', items: memory.conflicts || [] },
    { title: 'Requisitos impactados', items: memory.impactedRequirements || [] }
  ]

  const totalRelations = sections.reduce((acc, s) => acc + (s.items?.length || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[var(--color-accent)]">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
        Memoria Estructural
      </div>

      {hasNeo4jWarning && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3 text-amber-600">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <p className="text-xs leading-tight font-medium">Este requisito aún no tiene nodo en el grafo o el grafo está sincronizándose.</p>
        </div>
      )}

      {totalRelations === 0 ? (
        <div className="p-8 border-2 border-dashed border-[var(--color-border)] rounded-2xl flex flex-col items-center justify-center text-center">
          <svg className="w-12 h-12 text-[var(--color-border-strong)] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          <p className="text-[var(--color-text-muted)] text-sm">No hay relaciones registradas en el grafo para este requisito.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sections.filter(s => s.items && s.items.length > 0).map(section => (
            <div key={section.title} className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] ml-1">{section.title}</h4>
              <div className="grid gap-2">
                {section.items.map((rel, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-xs">
                    <span className="font-mono font-bold text-[var(--color-accent)]">{rel.sourceCode}</span>
                    <div className="flex-1 flex items-center justify-center gap-2">
                      <div className="h-[1px] flex-1 bg-[var(--color-border-strong)]" />
                      <span className="px-2 py-0.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[9px] font-bold uppercase tracking-tighter text-[var(--color-text-muted)]">
                        {rel.relationType}
                      </span>
                      <div className="h-[1px] flex-1 bg-[var(--color-border-strong)]" />
                    </div>
                    <span className="font-mono font-bold text-[var(--color-accent)]">{rel.targetCode}</span>
                    {rel.targetTitle && <span className="text-[var(--color-text-muted)] line-clamp-1 italic ml-2">— {rel.targetTitle}</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ProceduralSection({ memory: rawMemory, qualityIssues }: { memory: RequirementMemoryResponse['procedural'], qualityIssues?: any[] }) {
  const memory = rawMemory ?? { activeRules: [], violations: [], warnings: [] }
  const activeRules = memory.activeRules || []
  const violations = memory.violations || []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[var(--color-accent)]">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
        Memoria Procedimental
      </div>

      {activeRules.length === 0 ? (
        <div className="p-8 border-2 border-dashed border-[var(--color-border)] rounded-2xl flex flex-col items-center justify-center text-center">
          <p className="text-[var(--color-text-muted)] text-sm">No hay reglas activas para este proyecto.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] ml-1">Reglas de validación activas</h4>
            <div className="grid gap-3">
              {activeRules.map(rule => (
                <div key={rule.id} className="p-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--color-text-primary)]">{rule.title}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase 
                      ${rule.severity === 'ERROR' ? 'bg-rose-500/10 text-rose-500' : 
                        rule.severity === 'WARNING' ? 'bg-amber-500/10 text-amber-500' : 
                        'bg-blue-500/10 text-blue-500'}
                    `}>
                      {rule.severity}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">{rule.description}</p>
                </div>
              ))}
            </div>
          </div>

          {(violations.length > 0 || (qualityIssues && qualityIssues.length > 0)) && (
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-rose-500 ml-1">Observaciones detectadas</h4>
              <div className="grid gap-2">
                {violations.map((v, i) => {
                  const severity = v.severity || 'WARNING'
                  const colorCls = severity === 'ERROR' ? 'bg-rose-500/5 border-rose-500/20 text-rose-600' : 
                                   severity === 'WARNING' ? 'bg-amber-500/5 border-amber-500/20 text-amber-600' : 
                                   'bg-blue-500/5 border-blue-500/20 text-blue-600'
                  return (
                    <div key={i} className={`flex items-start gap-3 p-3 border rounded-xl text-xs ${colorCls}`}>
                      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      <div>
                        <p className="font-bold mb-0.5">{v.ruleName}</p>
                        <p className="leading-tight">{v.message}</p>
                      </div>
                    </div>
                  )
                })}
                {qualityIssues?.map((issue, i) => {
                  const colorCls = issue.severity === 'error' ? 'bg-rose-500/5 border-rose-500/20 text-rose-600' : 
                                   issue.severity === 'warning' ? 'bg-amber-500/5 border-amber-500/20 text-amber-600' : 
                                   'bg-blue-500/5 border-blue-500/20 text-blue-600'
                  return (
                    <div key={`local-${i}`} className={`flex items-start gap-3 p-3 border rounded-xl text-xs ${colorCls}`}>
                      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <div>
                         <p className="font-bold mb-0.5">Analizador local</p>
                         <p className="leading-tight">{issue.message}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function TraceabilitySection({ memory: rawMemory }: { memory: RequirementMemoryResponse['traceability'] }) {
  const memory = rawMemory ?? { 
    relatedCodes: [], 
    relatedDiagrams: [], 
    relatedTestCases: [], 
    relatedArchitecture: [], 
    links: [], 
    warnings: [] 
  }
  const relatedTestCases = memory.relatedTestCases || []
  const relatedDiagrams = memory.relatedDiagrams || []
  const relatedArchitecture = memory.relatedArchitecture || []
  const links = memory.links || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[var(--color-accent)]">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>
          Trazabilidad
        </div>
      </div>

      <div className="grid gap-6">
        {/* Test Cases */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] ml-1">Casos de prueba</h4>
          {relatedTestCases.length === 0 ? (
            <p className="text-xs text-[var(--color-text-muted)] ml-1 italic">No hay casos de prueba asociados.</p>
          ) : (
            <div className="grid gap-2">
              {relatedTestCases.map(tc => (
                <div key={tc.id} className="flex items-center gap-3 p-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-xs">
                  <span className="font-mono font-bold text-cyan-600 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">{tc.code}</span>
                  <span className="font-bold text-[var(--color-text-primary)]">{tc.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Diagrams */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] ml-1">Diagramas asociados</h4>
          {relatedDiagrams.length === 0 ? (
            <p className="text-xs text-[var(--color-text-muted)] ml-1 italic">No hay diagramas asociados.</p>
          ) : (
            <div className="grid gap-2">
              {relatedDiagrams.map(diag => (
                <div key={diag.id} className="flex items-center gap-3 p-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-xs">
                  <svg className="w-4 h-4 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <span className="font-bold text-[var(--color-text-primary)]">{diag.name}</span>
                  <span className="text-[10px] uppercase tracking-tighter bg-[var(--color-surface)] px-1.5 py-0.5 rounded border border-[var(--color-border)] text-[var(--color-text-muted)] ml-auto">
                    {diag.type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Architecture */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] ml-1">Arquitectura / Código</h4>
          {relatedArchitecture.length === 0 ? (
            <p className="text-xs text-[var(--color-text-muted)] ml-1 italic">No hay elementos de arquitectura asociados.</p>
          ) : (
            <div className="grid gap-2">
              {relatedArchitecture.map((arch, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl text-xs">
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 text-[9px] font-bold uppercase tracking-tighter border border-amber-500/20">{arch.type}</span>
                  <span className="font-bold text-[var(--color-text-primary)]">{arch.name}</span>
                  <span className="text-[9px] uppercase text-[var(--color-text-muted)] ml-auto font-medium">{arch.relation}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Generic Links */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] ml-1">Enlaces de trazabilidad</h4>
          {links.length === 0 ? (
            <p className="text-xs text-[var(--color-text-muted)] ml-1 italic">No hay enlaces adicionales.</p>
          ) : (
            <div className="grid gap-2">
              {links.map(link => (
                <div key={link.id} className="p-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-cyan-600 uppercase">{link.targetType}</span>
                    <span className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase italic">{link.relationType}</span>
                  </div>
                  <p className="text-xs font-bold text-[var(--color-text-primary)]">{link.targetName}</p>
                  {link.description && <p className="text-[10px] text-[var(--color-text-secondary)]">{link.description}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
