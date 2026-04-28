import { useState } from 'react'
import { requirementsApi } from '../api/services/requirementsApi'
import { useAuth } from '../auth/useAuth'
import type {
  DuplicateMatchResponse,
  RequirementDTO,
  RequirementNode,
  SearchResponse,
} from '../types/requirements'

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
  const [projectId, setProjectId] = useState(user?.userId ?? '')
  const [text, setText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [requirement, setRequirement] = useState<RequirementDTO>(EMPTY_REQUIREMENT)
  const [searchResults, setSearchResults] = useState<SearchResponse[]>([])
  const [duplicateResults, setDuplicateResults] = useState<DuplicateMatchResponse[]>([])
  const [impactResults, setImpactResults] = useState<RequirementNode[]>([])
  const [conflictResults, setConflictResults] = useState<RequirementNode[]>([])
  const [status, setStatus] = useState('Listo para administrar requisitos')

  async function handleConvert(): Promise<void> {
    if (!projectId.trim() || !text.trim()) {
      setStatus('Debes indicar projectId y texto.')
      return
    }

    try {
      const data = await requirementsApi.convert({ projectId: projectId.trim(), text: text.trim() })
      setRequirement(data)
      setStatus('Requisito convertido correctamente.')
    } catch {
      setStatus('No fue posible convertir el texto a requisito.')
    }
  }

  async function handleSave(): Promise<void> {
    if (!requirement.title.trim() || !requirement.projectId.trim()) {
      setStatus('El requisito necesita title y projectId.')
      return
    }

    try {
      const data = await requirementsApi.save({
        ...requirement,
        projectId: requirement.projectId.trim(),
        title: requirement.title.trim(),
        description: requirement.description.trim(),
      })
      setRequirement(data)
      setStatus('Requisito guardado correctamente.')
    } catch {
      setStatus('No fue posible guardar el requisito.')
    }
  }

  async function handleSearch(): Promise<void> {
    if (!searchQuery.trim()) {
      setStatus('Debes escribir un query de busqueda.')
      return
    }

    try {
      const data = await requirementsApi.search(searchQuery.trim())
      setSearchResults(data)
      setStatus(`Resultados: ${data.length}`)
    } catch {
      setStatus('No fue posible buscar requisitos.')
    }
  }

  async function handleDuplicates(): Promise<void> {
    if (!projectId.trim() || !requirement.title.trim()) {
      setStatus('Debes indicar projectId y titulo.')
      return
    }

    try {
      const data = await requirementsApi.checkDuplicates({
        projectId: projectId.trim(),
        title: requirement.title.trim(),
        description: requirement.description.trim(),
      })
      setDuplicateResults(data)
      setStatus(`Posibles duplicados: ${data.length}`)
    } catch {
      setStatus('No fue posible validar duplicados.')
    }
  }

  async function handleImpact(): Promise<void> {
    if (!requirement.id.trim()) {
      setStatus('Debes cargar un requisito con id.')
      return
    }

    try {
      const data = await requirementsApi.getImpact(requirement.id.trim())
      setImpactResults(data)
      setStatus(`Impacto cargado: ${data.length}`)
    } catch {
      setStatus('No fue posible consultar impacto.')
    }
  }

  async function handleConflicts(): Promise<void> {
    if (!requirement.id.trim()) {
      setStatus('Debes cargar un requisito con id.')
      return
    }

    try {
      const data = await requirementsApi.getConflicts(requirement.id.trim())
      setConflictResults(data)
      setStatus(`Conflictos cargados: ${data.length}`)
    } catch {
      setStatus('No fue posible consultar conflictos.')
    }
  }

  async function handleDependency(): Promise<void> {
    if (requirement.relatedCodes.length < 2) {
      setStatus('Debes tener al menos 2 codigos relacionados para crear dependencia.')
      return
    }

    try {
      await requirementsApi.createDependency(requirement.relatedCodes[0], requirement.relatedCodes[1])
      setStatus('Dependencia creada correctamente.')
    } catch {
      setStatus('No fue posible crear la dependencia.')
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <section className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
          <h1 className="text-3xl font-semibold tracking-tight">Requisitos</h1>
          <p className="text-sm text-slate-300">Conversión, guardado, busqueda, duplicados, impacto y conflictos.</p>
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
                <span>Codigo</span>
                <input className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2" value={requirement.code} onChange={(event) => setRequirement((current) => ({ ...current, code: event.target.value }))} />
              </label>
              <label className="space-y-1 text-sm">
                <span>ProjectId</span>
                <input className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2" value={requirement.projectId} onChange={(event) => setRequirement((current) => ({ ...current, projectId: event.target.value }))} />
              </label>
              <label className="space-y-1 text-sm sm:col-span-2">
                <span>Titulo</span>
                <input className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2" value={requirement.title} onChange={(event) => setRequirement((current) => ({ ...current, title: event.target.value }))} />
              </label>
              <label className="space-y-1 text-sm sm:col-span-2">
                <span>Descripcion</span>
                <textarea className="min-h-24 w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2" value={requirement.description} onChange={(event) => setRequirement((current) => ({ ...current, description: event.target.value }))} />
              </label>
              <label className="space-y-1 text-sm sm:col-span-2">
                <span>Codigos relacionados (separados por coma)</span>
                <input className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2" value={requirement.relatedCodes.join(', ')} onChange={(event) => setRequirement((current) => ({ ...current, relatedCodes: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) }))} />
              </label>
            </div>
          </article>

          <article className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900 p-4">
            <h2 className="font-semibold">Busqueda y analisis</h2>
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
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-950/50 p-3 text-sm">
              <p className="text-slate-300">{status}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <article className="rounded-xl border border-slate-700 bg-slate-950/50 p-3">
                <h3 className="mb-2 font-semibold">Resultados</h3>
                <pre className="max-h-64 overflow-auto text-xs text-slate-300">{JSON.stringify(searchResults, null, 2)}</pre>
              </article>
              <article className="rounded-xl border border-slate-700 bg-slate-950/50 p-3">
                <h3 className="mb-2 font-semibold">Duplicados</h3>
                <pre className="max-h-64 overflow-auto text-xs text-slate-300">{JSON.stringify(duplicateResults, null, 2)}</pre>
              </article>
              <article className="rounded-xl border border-slate-700 bg-slate-950/50 p-3">
                <h3 className="mb-2 font-semibold">Impacto</h3>
                <pre className="max-h-64 overflow-auto text-xs text-slate-300">{JSON.stringify(impactResults, null, 2)}</pre>
              </article>
              <article className="rounded-xl border border-slate-700 bg-slate-950/50 p-3">
                <h3 className="mb-2 font-semibold">Conflictos</h3>
                <pre className="max-h-64 overflow-auto text-xs text-slate-300">{JSON.stringify(conflictResults, null, 2)}</pre>
              </article>
            </div>
          </article>
        </section>
      </section>
    </main>
  )
}
