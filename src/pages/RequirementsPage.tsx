import { useState } from 'react'
import { useEffect } from 'react'
import { useAuth } from '../auth/useAuth'
import { graphFacade } from '../facades/graph.facade'
import { useApiOperation } from '../hooks/useLoadingError'
import { requirementFacade } from '../facades/requirement.facade'
import type {
  DuplicateMatchResponse,
  RequirementDTO,
  RequirementNode,
  SearchResponse,
} from '../types/requirements'
import {
  DuplicateList,
  RequirementDetailCard,
  RequirementNodeList,
  SearchResultList,
} from '../components/requirements/RequirementDataViews'
import { DataCard } from '../components/ui/DataDisplay'
import { RequirementGraphView } from '../components/graph/RequirementGraphView'

const EMPTY_REQUIREMENT: RequirementDTO = {
  id: '',
  code: '',
  title: '',
  description: '',
  actors: [],
  acceptanceCriteria: [],
  isoClassification: '',
  projectId: '',
  relatedCodes: [],
}

export function RequirementsPage() {
  const { user } = useAuth()
  const { run } = useApiOperation()

  const [projectId, setProjectId] = useState(user?.userId ?? '')
  const [text, setText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [requirement, setRequirement] = useState<RequirementDTO>(EMPTY_REQUIREMENT)
  const [status, setStatus] = useState('Listo para administrar requisitos')
  const [projectRequirements, setProjectRequirements] = useState<RequirementDTO[]>([])
  const [searchResults, setSearchResults] = useState<SearchResponse[]>([])
  const [duplicateResults, setDuplicateResults] = useState<DuplicateMatchResponse[]>([])
  const [impactResults, setImpactResults] = useState<RequirementNode[]>([])
  const [conflictResults, setConflictResults] = useState<RequirementNode[]>([])
  const [impactGraph, setImpactGraph] = useState<Record<string, unknown> | null>(null)
  const [inferenceGraph, setInferenceGraph] = useState<Record<string, unknown> | null>(null)

  async function handleConvert(): Promise<void> {
    if (!projectId.trim() || !text.trim()) return

    const data = await run(
      () => requirementFacade.convertTextToRequirement(projectId.trim(), text.trim()),
      {
        operationName: 'convertRequirement',
        errorMessage: 'No fue posible convertir el texto a requisito.',
      },
    )

    if (data) setRequirement(data)
  }

  async function handleSave(): Promise<void> {
    if (!requirement.title.trim() || !requirement.projectId.trim()) return

    const data = await run(
      () => requirementFacade.saveRequirement(requirement),
      {
        operationName: 'saveRequirement',
        errorMessage: 'No fue posible guardar el requisito.',
      },
    )

    if (data) setRequirement(data)
  }

  async function handleSearch(): Promise<void> {
    if (!searchQuery.trim()) return

    const data = await run(
      () => requirementFacade.searchRequirements(searchQuery),
      {
        operationName: 'searchRequirements',
        errorMessage: 'No fue posible buscar requisitos.',
      },
    )

    if (data) setSearchResults(data)
  }

  async function handleLoadProjectRequirements(): Promise<void> {
    if (!projectId.trim()) return

    const data = await run(
      () => requirementFacade.getRequirementsByProject(projectId.trim()),
      {
        operationName: 'loadProjectRequirements',
        errorMessage: 'No fue posible cargar los requisitos del proyecto.',
      },
    )

    if (data) {
      setProjectRequirements(data)
      setStatus(`Requisitos del proyecto cargados: ${data.length}`)
    }
  }

  async function handleDuplicates(): Promise<void> {
    if (!projectId.trim() || !requirement.title.trim()) return

    const data = await run(
      () => requirementFacade.checkDuplicates({
        projectId: projectId.trim(),
        title: requirement.title.trim(),
        description: requirement.description.trim(),
      }),
      {
        operationName: 'checkDuplicates',
        errorMessage: 'No fue posible validar duplicados.',
      },
    )

    if (data) setDuplicateResults(data)
  }

  async function handleImpact(): Promise<void> {
    if (!requirement.id.trim()) return

    const data = await run(
      () => graphFacade.getImpact(requirement.id),
      {
        operationName: 'getImpact',
        errorMessage: 'No fue posible consultar impacto.',
      },
    )

    if (data) {
      setImpactResults(Array.isArray(data) ? (data as RequirementNode[]) : [])
      setImpactGraph(data)
    }
  }

  async function handleInferRelations(): Promise<void> {
    if (!projectId.trim()) return

    if (projectRequirements.length === 0) {
      setStatus('Primero carga los requisitos del proyecto para inferir relaciones.')
      return
    }

    const data = await run(
      () => graphFacade.inferRelations(projectId.trim(), projectRequirements),
      {
        operationName: 'inferRelations',
        errorMessage: 'No fue posible inferir relaciones.',
      },
    )

    if (data) {
      setInferenceGraph(data)
      setStatus('Relaciones inferidas correctamente.')
    }
  }

  useEffect(() => {
    if (!requirement.id.trim()) {
      setImpactGraph(null)
      return
    }

    void handleImpact()
  }, [requirement.id])

  async function handleConflicts(): Promise<void> {
    if (!requirement.id.trim()) return

    const data = await run(
      () => requirementFacade.getConflicts(requirement.id),
      {
        operationName: 'getConflicts',
        errorMessage: 'No fue posible consultar conflictos.',
      },
    )

    if (data) setConflictResults(data)
  }

  async function handleDependency(): Promise<void> {
    if (requirement.relatedCodes.length < 2) return

    await run(
      () => requirementFacade.createDependency(requirement.relatedCodes[0], requirement.relatedCodes[1]),
      {
        operationName: 'createDependency',
        errorMessage: 'No fue posible crear la dependencia.',
      },
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <section className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
          <h1 className="text-3xl font-semibold tracking-tight">Requisitos</h1>
          <p className="text-sm text-slate-300">Conversión, guardado, búsqueda, duplicados, impacto y conflictos.</p>
          <p className="mt-2 text-sm text-cyan-300">{status}</p>
        </header>

        <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <article className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900 p-4">
            <h2 className="font-semibold">Asistente de requisitos</h2>
            <input
              className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2"
              placeholder="projectId"
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
            />
            <textarea
              className="min-h-28 w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2"
              placeholder="Texto libre para convertir"
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              <button className="rounded-md bg-cyan-600 px-3 py-2 font-medium" onClick={handleConvert}>
                Convertir
              </button>
              <button className="rounded-md bg-indigo-600 px-3 py-2 font-medium" onClick={handleSave}>
                Guardar
              </button>
              <button className="rounded-md bg-slate-700 px-3 py-2 font-medium" onClick={handleDuplicates}>
                Buscar duplicados
              </button>
              <button className="rounded-md bg-slate-700 px-3 py-2 font-medium" onClick={handleDependency}>
                Crear dependencia
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span>Código</span>
                <input className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2" value={requirement.code} onChange={(event) => setRequirement((current) => ({ ...current, code: event.target.value }))} />
              </label>
              <label className="space-y-1 text-sm">
                <span>ProjectId</span>
                <input className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2" value={requirement.projectId} onChange={(event) => setRequirement((current) => ({ ...current, projectId: event.target.value }))} />
              </label>
              <label className="space-y-1 text-sm sm:col-span-2">
                <span>Título</span>
                <input className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2" value={requirement.title} onChange={(event) => setRequirement((current) => ({ ...current, title: event.target.value }))} />
              </label>
              <label className="space-y-1 text-sm sm:col-span-2">
                <span>Descripción</span>
                <textarea className="min-h-24 w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2" value={requirement.description} onChange={(event) => setRequirement((current) => ({ ...current, description: event.target.value }))} />
              </label>
              <label className="space-y-1 text-sm sm:col-span-2">
                <span>Códigos relacionados (separados por coma)</span>
                <input className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2" value={requirement.relatedCodes.join(', ')} onChange={(event) => setRequirement((current) => ({ ...current, relatedCodes: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) }))} />
              </label>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-700">
              <RequirementDetailCard requirement={requirement} />
            </div>
          </article>

          <article className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900 p-4">
            <h2 className="font-semibold">Búsqueda y análisis</h2>
            <input
              className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2"
              placeholder="Search query"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            <button className="rounded-md bg-cyan-600 px-3 py-2 font-medium" onClick={handleSearch}>
              Buscar
            </button>
            <div className="flex flex-wrap gap-2">
              <button className="rounded-md bg-slate-700 px-3 py-2 font-medium" onClick={handleImpact}>
                Impacto
              </button>
              <button className="rounded-md bg-slate-700 px-3 py-2 font-medium" onClick={handleConflicts}>
                Conflictos
              </button>
              <button className="rounded-md bg-slate-700 px-3 py-2 font-medium" onClick={handleLoadProjectRequirements}>
                Cargar requisitos del proyecto
              </button>
              <button className="rounded-md bg-indigo-600 px-3 py-2 font-medium" onClick={handleInferRelations}>
                Inferir relaciones
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <article className="rounded-xl border border-slate-700 bg-slate-950/50 p-3">
                <h3 className="mb-2 font-semibold">Resultados</h3>
                <div className="max-h-64 overflow-auto">
                  <SearchResultList results={searchResults} />
                </div>
              </article>
              <article className="rounded-xl border border-slate-700 bg-slate-950/50 p-3">
                <h3 className="mb-2 font-semibold">Duplicados</h3>
                <div className="max-h-64 overflow-auto">
                  <DuplicateList results={duplicateResults} />
                </div>
              </article>
              <article className="rounded-xl border border-slate-700 bg-slate-950/50 p-3">
                <h3 className="mb-2 font-semibold">Impacto</h3>
                <div className="max-h-64 overflow-auto">
                  <RequirementNodeList nodes={impactResults} emptyMessage="Sin análisis de impacto." />
                </div>
              </article>
              <article className="rounded-xl border border-slate-700 bg-slate-950/50 p-3">
                <h3 className="mb-2 font-semibold">Conflictos</h3>
                <div className="max-h-64 overflow-auto">
                  <RequirementNodeList nodes={conflictResults} emptyMessage="Sin conflictos detectados." />
                </div>
              </article>
            </div>

            <section className="space-y-3 rounded-xl border border-slate-700 bg-slate-950/50 p-3">
              <h3 className="font-semibold">Requisitos cargados del proyecto</h3>
              {projectRequirements.length === 0 ? (
                <p className="text-sm text-slate-400">Todavia no se han cargado requisitos de proyecto.</p>
              ) : (
                <div className="max-h-72 overflow-auto space-y-2">
                  {projectRequirements.map((item) => (
                    <DataCard key={item.id} title={item.title} subtitle={item.code}>
                      <p className="text-xs text-slate-300 line-clamp-3">{item.description}</p>
                    </DataCard>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-3 rounded-xl border border-slate-700 bg-slate-950/50 p-3">
              <h3 className="font-semibold">Impacto del requisito</h3>
              <RequirementGraphView
                title="Impacto del requisito seleccionado"
                response={impactGraph}
                emptyMessage="Selecciona o carga un requisito para ver su impacto."
              />
            </section>

            <section className="space-y-3 rounded-xl border border-slate-700 bg-slate-950/50 p-3">
              <h3 className="font-semibold">Relaciones inferidas</h3>
              <RequirementGraphView
                title="Relaciones inferidas del proyecto"
                response={inferenceGraph}
                emptyMessage="Ejecuta inferencia para ver el grafo de relaciones."
              />
            </section>
          </article>
        </section>
      </section>
    </main>
  )
}
