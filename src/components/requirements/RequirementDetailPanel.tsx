import React, { useState } from 'react'
import type { RequirementDTO, RequirementNode } from '../../types/requirements'
import { RequirementGraphFlow } from '../graph/RequirementGraphFlow'

// ── Types ──────────────────────────────────────────────────────────────────

type TabId = 'info' | 'criteria' | 'dependencies' | 'relations'

interface Tab {
  id: TabId
  label: string
  shortLabel: string
}

interface RequirementDetailPanelProps {
  requirements: RequirementDTO[]
  requirement: RequirementDTO | null
  impactGraph: Record<string, unknown> | null
  inferenceGraph: Record<string, unknown> | null
  impactNodes: RequirementNode[]
  isLoadingGraph: boolean
  onInferRelations: () => void
}

// ── Constants ──────────────────────────────────────────────────────────────

const TABS: Tab[] = [
  { id: 'info',         label: 'Información',         shortLabel: 'Info' },
  { id: 'criteria',     label: 'Criterios de aceptación', shortLabel: 'Criterios' },
  { id: 'dependencies', label: 'Grafo de dependencias',   shortLabel: 'Grafo' },
  { id: 'relations',    label: 'Relaciones inferidas',    shortLabel: 'Relaciones' },
]

// ── Sub-components ──────────────────────────────────────────────────────────

/** Metadata pill */
const MetaPill: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">{label}</span>
    <span className="text-[13px] font-medium text-[var(--color-text-primary)]">{value || '—'}</span>
  </div>
)

/** Tag chip */
const TagChip: React.FC<{ label: string }> = ({ label }) => (
  <span className="inline-flex items-center h-6 px-2.5 rounded-full text-[11px] font-medium bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)]">
    {label}
  </span>
)

/** Empty state within tabs */
const TabEmptyState: React.FC<{ icon?: string; message: string; sub?: string }> = ({
  icon = '✦',
  message,
  sub,
}) => (
  <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
    <span className="text-2xl opacity-20">{icon}</span>
    <p className="text-[13px] font-medium text-[var(--color-text-muted)]">{message}</p>
    {sub && <p className="text-[11.5px] text-[var(--color-text-muted)] opacity-70">{sub}</p>}
  </div>
)

// ── Tab contents ──────────────────────────────────────────────────────────

const InfoTab: React.FC<{ req: RequirementDTO }> = ({ req }) => (
  <div className="space-y-6">
    {/* Meta grid */}
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-5 pb-5 border-b border-[var(--color-border)]">
      <MetaPill label="Código" value={req.code} />
      <MetaPill label="Clasificación ISO" value={req.isoClassification} />
      <MetaPill label="Proyecto ID" value={req.projectId} />
    </div>

    {/* Title */}
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-1">Título</p>
      <h3 className="text-[18px] font-bold text-[var(--color-text-primary)] leading-snug">
        {req.title || 'Sin título'}
      </h3>
    </div>

    {/* Description */}
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-2">Descripción</p>
      <p className="text-[13.5px] text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">
        {req.description || 'Sin descripción.'}
      </p>
    </div>

    {/* Actors */}
    {(req.actors ?? []).length > 0 && (
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-2">Actores</p>
        <div className="flex flex-wrap gap-1.5">
          {req.actors.map(a => <TagChip key={a} label={a} />)}
        </div>
      </div>
    )}

    {/* Related codes */}
    {(req.relatedCodes ?? []).length > 0 && (
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-2">Códigos relacionados</p>
        <div className="flex flex-wrap gap-1.5">
          {req.relatedCodes.map(c => <TagChip key={c} label={c} />)}
        </div>
      </div>
    )}
  </div>
)

const CriteriaTab: React.FC<{ req: RequirementDTO }> = ({ req }) => {
  const criteria = req.acceptanceCriteria ?? []

  if (criteria.length === 0) {
    return (
      <TabEmptyState
        icon="✓"
        message="Sin criterios de aceptación"
        sub="Los criterios aparecerán aquí una vez definidos."
      />
    )
  }

  return (
    <div className="space-y-2">
      {criteria.map((crit, i) => (
        <div
          key={i}
          className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] transition-colors"
        >
          <span className="flex-shrink-0 mt-0.5 w-5 h-5 flex items-center justify-center rounded-full border border-[var(--color-border-strong)] text-[10px] font-bold text-[var(--color-text-muted)]">
            {i + 1}
          </span>
          <p className="text-[13px] text-[var(--color-text-primary)] leading-relaxed whitespace-pre-wrap break-words">{crit}</p>
        </div>
      ))}
    </div>
  )
}

const DependenciesTab: React.FC<{
  requirements: RequirementDTO[]
  impactGraph: Record<string, unknown> | null
  impactNodes?: RequirementNode[]
  selectedRequirementId?: string
}> = ({ requirements, impactGraph, selectedRequirementId }) => {
  if (!impactGraph) {
    return (
      <TabEmptyState
        icon="⬡"
        message="Sin datos de dependencias"
        sub="Selecciona un requisito para cargar su grafo de impacto."
      />
    )
  }

  return (
    <RequirementGraphFlow
      requirements={requirements}
      graphData={impactGraph}
      selectedRequirementId={selectedRequirementId}
      selectedRequirementCode={requirements.find(r => r.id === selectedRequirementId)?.code}
      mode="focused"
    />
  )
}

const RelationsTab: React.FC<{
  requirements: RequirementDTO[]
  inferenceGraph: Record<string, unknown> | null
  selectedRequirementId?: string
  onInfer: () => void
}> = ({ requirements, inferenceGraph, selectedRequirementId, onInfer }) => {
  if (!inferenceGraph) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-14 text-center">
        <span className="text-2xl opacity-20">⬡</span>
        <p className="text-[13px] font-medium text-[var(--color-text-muted)]">Sin relaciones inferidas aún</p>
        <p className="text-[11.5px] text-[var(--color-text-muted)] opacity-70">
          Ejecuta la inferencia para descubrir relaciones entre requisitos.
        </p>
        <button
          type="button"
          onClick={onInfer}
          className={[
            'mt-1 inline-flex items-center gap-2 h-8 px-4',
            'text-[12px] font-medium rounded-lg',
            'bg-[var(--color-surface)] border border-[var(--color-border-strong)]',
            'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
            'hover:bg-[var(--color-bg)] transition-all duration-150',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
          ].join(' ')}
        >
          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Inferir relaciones
        </button>
      </div>
    )
  }

  return (
    <RequirementGraphFlow
      requirements={requirements}
      graphData={inferenceGraph}
      selectedRequirementId={selectedRequirementId}
      selectedRequirementCode={requirements.find(r => r.id === selectedRequirementId)?.code}
      mode="focused"
    />
  )
}

// ── Main component ──────────────────────────────────────────────────────────

export const RequirementDetailPanel: React.FC<RequirementDetailPanelProps> = ({
  requirements,
  requirement,
  impactGraph,
  inferenceGraph,
  isLoadingGraph,
  onInferRelations,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('info')

  // Reset to info tab when requirement changes
  React.useEffect(() => {
    if (requirement) setActiveTab('info')
  }, [requirement?.id])

  // ── No selection state ──
  if (!requirement) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 h-full min-h-[320px] text-center px-8">
        <div className="w-12 h-12 rounded-2xl bg-[var(--color-surface)] flex items-center justify-center">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"
            strokeWidth={1.5} className="text-[var(--color-text-muted)]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-[13.5px] font-medium text-[var(--color-text-muted)]">
          Selecciona un requisito
        </p>
        <p className="text-[12px] text-[var(--color-text-muted)] opacity-70 max-w-[200px]">
          Elige un requisito de la lista para ver sus detalles aquí.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ── Tab bar ── */}
      <div className="flex-shrink-0 flex items-center gap-1 p-2 border-b border-[var(--color-border)]">
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            aria-selected={activeTab === tab.id}
            className={[
              'inline-flex items-center h-7 px-2.5 rounded-lg text-[12px] font-medium',
              'transition-all duration-150',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
              activeTab === tab.id
                ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]/50',
            ].join(' ')}
          >
            {/* Show short label on smaller containers */}
            <span className="hidden lg:inline">{tab.label}</span>
            <span className="lg:hidden">{tab.shortLabel}</span>
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div className="flex-1 overflow-y-auto min-h-0 p-5">
        {activeTab === 'info' && <InfoTab req={requirement} />}
        {activeTab === 'criteria' && <CriteriaTab req={requirement} />}
        {activeTab === 'dependencies' && (
          isLoadingGraph
            ? (
              <div className="flex items-center justify-center py-14">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-6 h-6 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
                  <p className="text-[12px] text-[var(--color-text-muted)]">Cargando grafo…</p>
                </div>
              </div>
            )
            : (
              <DependenciesTab
                requirements={requirements}
                impactGraph={impactGraph}
                selectedRequirementId={requirement.id}
              />
            )
        )}
        {activeTab === 'relations' && (
          <RelationsTab
            requirements={requirements}
            inferenceGraph={inferenceGraph}
            selectedRequirementId={requirement.id}
            onInfer={onInferRelations}
          />
        )}
      </div>
    </div>
  )
}
