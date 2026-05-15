import type { ProjectRequest, ProjectResponse, ProjectStatus } from '../../types/projects'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'

interface ProjectFormProps {
  form: ProjectRequest
  selectedProject: ProjectResponse | null
  onUpdateField: <K extends keyof ProjectRequest>(key: K, value: ProjectRequest[K]) => void
  onSave: (event: React.FormEvent) => void
  onCancel: () => void
}

export default function ProjectForm({
  form,
  selectedProject,
  onUpdateField,
  onSave,
  onCancel,
}: ProjectFormProps) {
  return (
    <Card className="max-w-2xl p-6 sm:p-8">
      <h2 className="text-xl font-semibold mb-6 app-text-primary tracking-tight">
        {selectedProject ? 'Editar proyecto' : 'Crear nuevo proyecto'}
      </h2>
      <form onSubmit={onSave} className="space-y-5">
        <Input
          required
          maxLength={60}
          label="Nombre del proyecto"
          placeholder="Ej. Sistema de E-commerce"
          value={form.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdateField('name', e.target.value)}
        />
        
        <div className="space-y-1.5">
          <label className="block text-[13px] font-medium app-text-primary">
            Descripción
          </label>
          <textarea
            className="w-full app-card border border-app-border-strong rounded-md px-3 py-2 text-[15px] app-text-primary placeholder-app-text-muted focus-ring interactive min-h-[120px] overflow-auto"
            maxLength={240}
            placeholder="Describe brevemente el alcance del proyecto..."
            value={form.description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onUpdateField('description', e.target.value)}
          />
          <div className="flex justify-end text-[11px] app-text-muted">
            {form.description.length}/240
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[13px] font-medium app-text-primary">
            Estado
          </label>
          <select
            className="w-full app-card border border-app-border-strong rounded-md px-3 py-2 text-[15px] app-text-primary focus-ring interactive appearance-none"
            value={form.status}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onUpdateField('status', e.target.value as ProjectStatus)}
          >
            <option value="ACTIVE">Activo</option>
            <option value="DRAFT">Borrador</option>
            <option value="ARCHIVED">Archivado</option>
          </select>
        </div>

        <div className="flex gap-3 pt-4 border-t border-app-border">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">
            {selectedProject ? 'Guardar cambios' : 'Siguiente'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
