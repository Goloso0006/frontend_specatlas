import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { projectFacade } from '../facades/project.facade'
import { useApiOperation } from '../hooks/useLoadingError'
import { isValidProjectId } from '../context/ProjectContext'
import type { ProjectRequest, ProjectStatus } from '../types/projects'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export function EditProjectPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState<ProjectRequest>({
    name: '',
    description: '',
    ownerId: '',
    status: 'ACTIVE'
  })
  const { run, isLoading } = useApiOperation()

  useEffect(() => {
    if (!isValidProjectId(projectId)) return

    run(async () => {
      const data = await projectFacade.getProject(projectId)
      setForm({
        name: data.name,
        description: data.description,
        ownerId: data.ownerId,
        status: data.status
      })
    })
  }, [projectId])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!isValidProjectId(projectId)) return

    // Validations: No empty fields
    if (!form.name.trim() || !form.description.trim() || !form.status) {
      alert('Todos los campos son obligatorios.')
      return
    }

    await run(async () => {
      await projectFacade.updateProject(projectId, form)
      navigate(`/app/projects/${projectId}/info`)
    }, { errorMessage: 'No fue posible actualizar el proyecto.' })
  }

  if (!isValidProjectId(projectId)) return null

  return (
    <div className="min-h-screen bg-app-bg">
      <nav className="h-16 px-8 flex items-center justify-between border-b border-app-border bg-white dark:bg-[#1e1e1e]">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/app/projects/${projectId}`)}
            className="text-app-text-muted hover:text-app-text-primary transition-colors text-sm font-medium"
          >
            ← Hub
          </button>
          <div className="h-4 w-[1px] bg-app-border" />
          <span className="font-semibold app-text-primary tracking-tight">Editar Proyecto</span>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto py-16 px-8">
        <div className="bg-white dark:bg-[#1e1e1e] border border-app-border rounded-2xl p-8 shadow-sm">
          <h1 className="text-2xl font-bold mb-8 tracking-tight">Configuración General</h1>
          
          <form onSubmit={handleSave} className="space-y-6">
            <Input
              required
              label="Nombre del Proyecto"
              placeholder="Ej. Sistema de Pagos"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />

            <div className="space-y-1.5">
              <label className="text-[13px] font-medium app-text-secondary">Descripción</label>
              <textarea
                required
                className="w-full bg-[#fcfcfc] dark:bg-[#151515] border border-app-border rounded-lg px-4 py-3 text-[15px] focus:ring-2 focus:ring-app-accent/20 outline-none min-h-[150px] transition-all"
                placeholder="Describe el propósito del proyecto..."
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-medium app-text-secondary">Estado</label>
              <select
                required
                className="w-full bg-[#fcfcfc] dark:bg-[#151515] border border-app-border rounded-lg px-4 py-3 text-[15px] focus:ring-2 focus:ring-app-accent/20 outline-none appearance-none transition-all"
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value as ProjectStatus })}
              >
                <option value="ACTIVE">Activo</option>
                <option value="DRAFT">Borrador</option>
                <option value="ARCHIVED">Archivado</option>
              </select>
            </div>

            <div className="flex gap-4 pt-6 border-t border-app-border">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => navigate(`/app/projects/${projectId}/info`)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                isLoading={isLoading}
              >
                Guardar Cambios
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
