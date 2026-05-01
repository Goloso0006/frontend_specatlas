import { useState } from 'react'
import { Link } from 'react-router-dom'
import { projectFacade } from '../facades/project.facade'
import { requirementFacade } from '../facades/requirement.facade'
import { useApiOperation } from '../hooks/useLoadingError'
import { useAuth } from '../auth/useAuth'
import type { ProjectResponse } from '../types/projects'
import type { SearchResponse } from '../types/requirements'
import { DataCard, EmptyState } from '../components/ui/DataDisplay'
import { SearchResultList } from '../components/requirements/RequirementDataViews'

export function DashboardPage() {
  const { user, logout } = useAuth()
  const [query, setQuery] = useState('')
  const [projects, setProjects] = useState<ProjectResponse[]>([])
  const [results, setResults] = useState<SearchResponse[]>([])
  const [status, setStatus] = useState('Sesion activa')

  const { run } = useApiOperation()

  async function handleGetProjects(): Promise<void> {
    if (!user) {
      setStatus('No hay sesion activa')
      return
    }

    await run(
      async () => {
        const data = await projectFacade.getProjectsByUser(user.userId)
        setProjects(data)
        setStatus(`Proyectos cargados: ${data.length}`)
      },
      { errorMessage: 'No fue posible obtener proyectos' }
    )
  }

  async function handleSearchRequirements(): Promise<void> {
    const normalizedQuery = query.trim()
    if (!normalizedQuery) {
      setStatus('Escribe un texto para buscar requisitos.')
      setResults([])
      return
    }

    await run(
      async () => {
        const data = await requirementFacade.searchRequirements(normalizedQuery)
        setResults(data)
        setStatus(`Resultados de requisitos: ${data.length}`)
      },
      { errorMessage: 'No fue posible consultar requisitos' }
    )
  }

  return (
    <main className="min-h-screen app-bg p-6 app-text-primary">
      <section className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Area privada</h1>
            <p className="text-sm app-text-secondary">Usuario: {user?.userId ?? 'sin sesion'}</p>
          </div>
          <button className="rounded-md bg-app-danger text-white hover:opacity-90 px-3 py-2 font-medium" onClick={logout}>
            Logout
          </button>
        </div>

        <div className="grid gap-3 rounded-xl border app-border-strong app-card p-4 sm:grid-cols-2">
          <button
            className="rounded-md bg-app-accent text-app-accent-foreground hover:bg-app-accent-hover px-3 py-2 font-medium"
            onClick={handleGetProjects}
          >
            Obtener proyectos
          </button>
          <input
            className="rounded-md border app-border-strong app-surface px-3 py-2"
            placeholder="Buscar requisito (query)"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button
            className="rounded-md bg-app-accent text-app-accent-foreground hover:bg-app-accent-hover px-3 py-2 font-medium sm:col-span-2"
            onClick={handleSearchRequirements}
          >
            Consultar requisitos
          </button>
          <Link
            className="rounded-md bg-app-success text-white hover:opacity-90 px-3 py-2 font-medium text-center sm:col-span-2"
            to="/app/diagrams"
          >
            Abrir editor de diagramas
          </Link>
          <Link
            className="rounded-md bg-app-surface border border-app-border-strong px-3 py-2 font-medium text-center sm:col-span-2"
            to="/app/projects"
          >
            Gestionar proyectos
          </Link>
          <Link
            className="rounded-md bg-app-surface border border-app-border-strong px-3 py-2 font-medium text-center sm:col-span-2"
            to="/app/requirements"
          >
            Gestionar requisitos
          </Link>
          <Link
            className="rounded-md bg-app-surface border border-app-border-strong px-3 py-2 font-medium text-center sm:col-span-2"
            to="/app/validation-rules"
          >
            Gestionar reglas de validacion
          </Link>
        </div>

        <p className="rounded-md border app-border-strong app-card p-3 text-sm">Estado: {status}</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-xl border app-border-strong app-card p-4">
            <h2 className="mb-3 font-semibold">Proyectos</h2>
            {projects.length === 0 ? (
              <EmptyState message="Sin proyectos cargados." />
            ) : (
              <div className="max-h-72 space-y-2 overflow-auto">
                {projects.map((project) => (
                  <DataCard key={project.id} title={project.name} subtitle={project.status}>
                    <p className="text-xs app-text-secondary line-clamp-2">{project.description}</p>
                  </DataCard>
                ))}
              </div>
            )}
          </article>
          <article className="rounded-xl border app-border-strong app-card p-4">
            <h2 className="mb-3 font-semibold">Resultados requisitos</h2>
            <div className="max-h-72 overflow-auto">
              <SearchResultList results={results} />
            </div>
          </article>
        </div>
      </section>
    </main>
  )
}
