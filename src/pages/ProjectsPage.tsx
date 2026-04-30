import { useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { projectFacade } from '../facades/project.facade'
import { useApiOperation } from '../hooks/useLoadingError'
import type { ProjectRequest, ProjectResponse, ProjectStatus } from '../types/projects'
import { DataField, EmptyState } from '../components/ui/DataDisplay'

const EMPTY_PROJECT: ProjectRequest = {
  name: '',
  description: '',
  ownerId: '',
  status: 'ACTIVE',
}

export function ProjectsPage() {
  const { user } = useAuth()
  const [ownerId, setOwnerId] = useState(user?.userId ?? '')
  const [projectId, setProjectId] = useState('')
  const [form, setForm] = useState<ProjectRequest>({ ...EMPTY_PROJECT, ownerId: user?.userId ?? '' })
  const [status, setStatus] = useState('Listo para administrar proyectos')
  const [projects, setProjects] = useState<ProjectResponse[]>([])
  const [selectedProject, setSelectedProject] = useState<ProjectResponse | null>(null)
  
  const { run } = useApiOperation()

  async function handleList(): Promise<void> {
    if (!ownerId.trim()) {
      setStatus('Debes indicar un ownerId.')
      return
    }

    await run(
      async () => {
        const data = await projectFacade.getProjectsByUser(ownerId)
        setProjects(data)
        setStatus(`Proyectos cargados: ${data.length}`)
      },
      { errorMessage: 'No fue posible listar los proyectos.' }
    )
  }

  async function handleLoadById(): Promise<void> {
    if (!projectId.trim()) {
      setStatus('Debes indicar un id de proyecto.')
      return
    }

    await run(
      async () => {
        const data = await projectFacade.getProject(projectId)
        setSelectedProject(data)
        setForm({
          name: data.name,
          description: data.description,
          ownerId: data.ownerId,
          status: data.status,
        })
        setOwnerId(data.ownerId)
        setStatus('Proyecto cargado correctamente.')
      },
      { errorMessage: 'No fue posible cargar el proyecto.' }
    )
  }

  async function handleSave(): Promise<void> {
    if (!form.name.trim() || !form.ownerId.trim()) {
      setStatus('Nombre y ownerId son obligatorios.')
      return
    }

    await run(
      async () => {
        const data = selectedProject
          ? await projectFacade.updateProject(selectedProject.id, form)
          : await projectFacade.createProject(form)
        setSelectedProject(data)
        setProjectId(data.id)
        setForm({ name: data.name, description: data.description, ownerId: data.ownerId, status: data.status })
        setStatus('Proyecto guardado correctamente.')
      },
      { errorMessage: 'No fue posible guardar el proyecto.' }
    )
  }

  async function handleDelete(): Promise<void> {
    if (!selectedProject) {
      setStatus('Primero carga un proyecto.')
      return
    }

    await run(
      async () => {
        await projectFacade.deleteProject(selectedProject.id)
        setSelectedProject(null)
        setProjectId('')
        setForm({ ...EMPTY_PROJECT, ownerId })
        setStatus('Proyecto eliminado correctamente.')
      },
      { errorMessage: 'No fue posible eliminar el proyecto.' }
    )
  }

  function updateField<K extends keyof ProjectRequest>(key: K, value: ProjectRequest[K]): void {
    setForm((current) => ({ ...current, [key]: value }))
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <section className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
          <h1 className="text-3xl font-semibold tracking-tight">Proyectos</h1>
          <p className="text-sm text-slate-300">CRUD base para listar, crear, editar y eliminar proyectos.</p>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900 p-4">
            <h2 className="font-semibold">Formulario</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2"
                placeholder="ownerId"
                value={form.ownerId}
                onChange={(event) => updateField('ownerId', event.target.value)}
              />
              <input
                className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2"
                placeholder="projectId para cargar"
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
              />
              <input
                className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2 sm:col-span-2"
                placeholder="Nombre"
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
              />
              <textarea
                className="min-h-32 rounded-md border border-slate-600 bg-slate-800 px-3 py-2 sm:col-span-2"
                placeholder="Descripcion"
                value={form.description}
                onChange={(event) => updateField('description', event.target.value)}
              />
              <select
                className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2"
                value={form.status}
                onChange={(event) => updateField('status', event.target.value as ProjectStatus)}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="ARCHIVED">ARCHIVED</option>
                <option value="DRAFT">DRAFT</option>
              </select>
            </div>

            <div className="flex flex-wrap gap-2">
              <button className="rounded-md bg-cyan-600 px-3 py-2 font-medium" onClick={handleSave}>
                Guardar proyecto
              </button>
              <button className="rounded-md bg-slate-700 px-3 py-2 font-medium" onClick={handleLoadById}>
                Cargar por id
              </button>
              <button className="rounded-md bg-rose-600 px-3 py-2 font-medium" onClick={handleDelete}>
                Eliminar proyecto
              </button>
            </div>
          </article>

          <aside className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900 p-4">
            <div className="space-y-2">
              <input
                className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2"
                placeholder="ownerId para listar"
                value={ownerId}
                onChange={(event) => setOwnerId(event.target.value)}
              />
              <button className="w-full rounded-md bg-indigo-600 px-3 py-2 font-medium" onClick={handleList}>
                Listar proyectos por usuario
              </button>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-950/50 p-3 text-sm">
              <h3 className="mb-2 font-semibold">Estado</h3>
              <p className="text-slate-300">{status}</p>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-950/50 p-3">
              <h3 className="mb-3 font-semibold">Proyecto seleccionado</h3>
              {selectedProject ? (
                <dl className="space-y-3">
                  <DataField label="Nombre">{selectedProject.name}</DataField>
                  <DataField label="Descripción">{selectedProject.description}</DataField>
                  <DataField label="Estado">
                    <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs uppercase tracking-wider">
                      {selectedProject.status}
                    </span>
                  </DataField>
                  <DataField label="Owner">{selectedProject.ownerId}</DataField>
                  <DataField label="Creado">{new Date(selectedProject.createdAt).toLocaleString()}</DataField>
                  <DataField label="Actualizado">{new Date(selectedProject.updatedAt).toLocaleString()}</DataField>
                </dl>
              ) : (
                <EmptyState message="Selecciona un proyecto del listado." />
              )}
            </div>
          </aside>
        </section>

        <article className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
          <h2 className="mb-3 font-semibold">Listado</h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {projects.length === 0 ? (
              <p className="text-slate-400">Sin proyectos cargados</p>
            ) : (
              projects.map((project) => (
                <button
                  key={project.id}
                  className="rounded-xl border border-slate-700 bg-slate-950/60 p-4 text-left hover:border-cyan-400"
                  onClick={() => {
                    setSelectedProject(project)
                    setProjectId(project.id)
                    setForm({
                      name: project.name,
                      description: project.description,
                      ownerId: project.ownerId,
                      status: project.status,
                    })
                  }}
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">{project.status}</p>
                  <h3 className="text-lg font-semibold">{project.name}</h3>
                  <p className="mt-1 text-sm text-slate-300">{project.description}</p>
                </button>
              ))
            )}
          </div>
        </article>
      </section>
    </main>
  )
}
