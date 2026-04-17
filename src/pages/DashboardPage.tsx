import { useState } from 'react'
import { Link } from 'react-router-dom'
import { projectsApi } from '../api/services/projectsApi'
import { requirementsApi } from '../api/services/requirementsApi'
import { useAuth } from '../auth/useAuth'
import type { ProjectResponse } from '../types/projects'
import type { SearchResponse } from '../types/requirements'

export function DashboardPage() {
  const { user, logout } = useAuth()
  const [query, setQuery] = useState('')
  const [projects, setProjects] = useState<ProjectResponse[]>([])
  const [results, setResults] = useState<SearchResponse[]>([])
  const [status, setStatus] = useState('Sesion activa')

  async function handleGetProjects(): Promise<void> {
    if (!user) {
      setStatus('No hay sesion activa')
      return
    }

    try {
      const data = await projectsApi.listByUser(user.userId)
      setProjects(data)
      setStatus(`Proyectos cargados: ${data.length}`)
    } catch {
      setStatus('No fue posible obtener proyectos')
    }
  }

  async function handleSearchRequirements(): Promise<void> {
    try {
      const data = await requirementsApi.search(query)
      setResults(data)
      setStatus(`Resultados de requisitos: ${data.length}`)
    } catch {
      setStatus('No fue posible consultar requisitos')
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <section className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Area privada</h1>
            <p className="text-sm text-slate-300">Usuario: {user?.userId ?? 'sin sesion'}</p>
          </div>
          <button className="rounded-md bg-rose-600 px-3 py-2 font-medium" onClick={logout}>
            Logout
          </button>
        </div>

        <div className="grid gap-3 rounded-xl border border-slate-700 bg-slate-900 p-4 sm:grid-cols-2">
          <button
            className="rounded-md bg-indigo-600 px-3 py-2 font-medium"
            onClick={handleGetProjects}
          >
            Obtener proyectos
          </button>
          <input
            className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2"
            placeholder="Buscar requisito (query)"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button
            className="rounded-md bg-cyan-600 px-3 py-2 font-medium sm:col-span-2"
            onClick={handleSearchRequirements}
          >
            Consultar requisitos
          </button>
          <Link
            className="rounded-md bg-emerald-600 px-3 py-2 font-medium text-center sm:col-span-2"
            to="/app/diagrams"
          >
            Abrir editor de diagramas
          </Link>
        </div>

        <p className="rounded-md border border-slate-700 bg-slate-900 p-3 text-sm">Estado: {status}</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-xl border border-slate-700 bg-slate-900 p-4">
            <h2 className="mb-2 font-semibold">Proyectos</h2>
            <pre className="overflow-auto text-xs text-slate-300">{JSON.stringify(projects, null, 2)}</pre>
          </article>
          <article className="rounded-xl border border-slate-700 bg-slate-900 p-4">
            <h2 className="mb-2 font-semibold">Resultados requisitos</h2>
            <pre className="overflow-auto text-xs text-slate-300">{JSON.stringify(results, null, 2)}</pre>
          </article>
        </div>
      </section>
    </main>
  )
}
