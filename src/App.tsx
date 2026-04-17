import { useState } from 'react'
import { authApi } from './api/services/authApi'
import { projectsApi } from './api/services/projectsApi'
import { requirementsApi } from './api/services/requirementsApi'
import { clearSession, getSessionUser } from './store/session'
import type { LoginResponse } from './types/auth'
import type { ProjectResponse } from './types/projects'
import type { SearchResponse } from './types/requirements'

function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [query, setQuery] = useState('')
  const [loginData, setLoginData] = useState<LoginResponse | null>(null)
  const [projects, setProjects] = useState<ProjectResponse[]>([])
  const [results, setResults] = useState<SearchResponse[]>([])
  const [status, setStatus] = useState('Listo para probar integracion')

  async function handleLogin(): Promise<void> {
    try {
      const data = await authApi.login({ email, password })
      setLoginData(data)
      setStatus('Login exitoso. Token guardado en sesion.')
    } catch {
      setStatus('Error de login. Verifica credenciales y backend.')
    }
  }

  async function handleGetProjects(): Promise<void> {
    const user = getSessionUser()
    if (!user) {
      setStatus('No hay sesion activa.')
      return
    }

    try {
      const data = await projectsApi.listByUser(user.userId)
      setProjects(data)
      setStatus(`Proyectos cargados: ${data.length}`)
    } catch {
      setStatus('No fue posible cargar proyectos.')
    }
  }

  async function handleSearchRequirements(): Promise<void> {
    try {
      const data = await requirementsApi.search(query)
      setResults(data)
      setStatus(`Resultados de requisitos: ${data.length}`)
    } catch {
      setStatus('No fue posible consultar requisitos.')
    }
  }

  function handleLogout(): void {
    clearSession()
    setLoginData(null)
    setProjects([])
    setResults([])
    setStatus('Sesion cerrada manualmente.')
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <section className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Capa API lista</h1>

        <div className="grid gap-3 rounded-xl border border-slate-700 bg-slate-900 p-4 sm:grid-cols-2">
          <input
            className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <input
            className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button className="rounded-md bg-emerald-600 px-3 py-2 font-medium" onClick={handleLogin}>
            Login
          </button>
          <button className="rounded-md bg-slate-700 px-3 py-2 font-medium" onClick={handleLogout}>
            Cerrar sesion
          </button>
        </div>

        <div className="grid gap-3 rounded-xl border border-slate-700 bg-slate-900 p-4 sm:grid-cols-2">
          <button
            className="rounded-md bg-indigo-600 px-3 py-2 font-medium"
            onClick={handleGetProjects}
          >
            Obtener proyectos del usuario logueado
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
        </div>

        <p className="rounded-md border border-slate-700 bg-slate-900 p-3 text-sm">Estado: {status}</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-xl border border-slate-700 bg-slate-900 p-4">
            <h2 className="mb-2 font-semibold">Sesion</h2>
            <pre className="overflow-auto text-xs text-slate-300">
              {JSON.stringify(loginData, null, 2)}
            </pre>
          </article>
          <article className="rounded-xl border border-slate-700 bg-slate-900 p-4">
            <h2 className="mb-2 font-semibold">Proyectos</h2>
            <pre className="overflow-auto text-xs text-slate-300">
              {JSON.stringify(projects, null, 2)}
            </pre>
          </article>
        </div>

        <article className="rounded-xl border border-slate-700 bg-slate-900 p-4">
          <h2 className="mb-2 font-semibold">Resultados de requisitos</h2>
          <pre className="overflow-auto text-xs text-slate-300">{JSON.stringify(results, null, 2)}</pre>
        </article>
      </section>
    </main>
  )
}

export default App