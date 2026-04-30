import type {
  DuplicateMatchResponse,
  RequirementDTO,
  RequirementNode,
  SearchResponse,
} from '../../types/requirements'
import { DataCard, DataField, EmptyState, SimilarityBadge, TagList } from '../ui/DataDisplay'

/**
 * Renders a list of search results as styled cards.
 */
export function SearchResultList({ results }: { results: SearchResponse[] }) {
  if (results.length === 0) return <EmptyState message="Sin resultados de búsqueda." />

  return (
    <div className="space-y-2">
      {results.map((item) => (
        <DataCard key={item.id} title={item.title} subtitle={item.code}>
          <p className="text-xs text-slate-300 line-clamp-2">{item.description}</p>
          {item.similarity !== undefined && (
            <div className="mt-2">
              <SimilarityBadge value={item.similarity} />
            </div>
          )}
        </DataCard>
      ))}
    </div>
  )
}

/**
 * Renders a list of duplicate match results.
 */
export function DuplicateList({ results }: { results: DuplicateMatchResponse[] }) {
  if (results.length === 0) return <EmptyState message="No se encontraron duplicados." />

  return (
    <div className="space-y-2">
      {results.map((item) => (
        <DataCard
          key={item.requirementId}
          title={item.title}
          subtitle={item.requirementCode}
        >
          <SimilarityBadge value={item.similarity} />
        </DataCard>
      ))}
    </div>
  )
}

/**
 * Renders a list of requirement nodes (impact/conflicts).
 */
export function RequirementNodeList({ nodes, emptyMessage }: {
  nodes: RequirementNode[]
  emptyMessage?: string
}) {
  if (nodes.length === 0) return <EmptyState message={emptyMessage ?? 'Sin datos.'} />

  return (
    <div className="space-y-2">
      {nodes.map((node) => (
        <DataCard key={node.id} title={node.title} subtitle={node.code}>
          <p className="text-xs text-slate-300 line-clamp-2">{node.description}</p>
        </DataCard>
      ))}
    </div>
  )
}

/**
 * Renders a detailed view of a RequirementDTO.
 */
export function RequirementDetailCard({ requirement }: { requirement: RequirementDTO }) {
  if (!requirement.title) return <EmptyState message="No hay un requisito cargado." />

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-950/50 p-4">
      <h3 className="mb-4 text-lg font-semibold text-slate-100">
        {requirement.code && <span className="mr-2 text-cyan-400">{requirement.code}</span>}
        {requirement.title}
      </h3>
      
      <dl className="space-y-4">
        <DataField label="Descripción">
          <p className="whitespace-pre-wrap">{requirement.description}</p>
        </DataField>

        <div className="grid gap-4 sm:grid-cols-2">
          <DataField label="Actores">
            <TagList items={requirement.actors ?? []} emptyMessage="Sin actores definidos" />
          </DataField>
          
          <DataField label="Clasificación ISO">
            <TagList items={requirement.isoClassification ? [requirement.isoClassification] : []} emptyMessage="Sin clasificación" />
          </DataField>
        </div>

        <DataField label="Criterios de Aceptación">
          {(requirement.acceptanceCriteria ?? []).length === 0 ? (
            <span className="text-slate-500 text-sm">Sin criterios definidos</span>
          ) : (
            <ul className="list-inside list-disc space-y-1 text-sm text-slate-300">
              {requirement.acceptanceCriteria.map((crit, i) => (
                <li key={i}>{crit}</li>
              ))}
            </ul>
          )}
        </DataField>

        {requirement.relatedCodes && requirement.relatedCodes.length > 0 && (
          <DataField label="Códigos Relacionados">
            <TagList items={requirement.relatedCodes} />
          </DataField>
        )}
      </dl>
    </div>
  )
}
