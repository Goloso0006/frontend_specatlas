import type { Dispatch, FormEventHandler, SetStateAction } from 'react'
import type { ProjectRequest } from '../../types/projects'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

interface ProjectCreationModalProps {
  open: boolean
  form: ProjectRequest
  setForm: Dispatch<SetStateAction<ProjectRequest>>
  onClose: () => void
  onSubmit: FormEventHandler<HTMLFormElement>
  isSubmitting?: boolean
}

export function ProjectCreationModal({
  open,
  form,
  setForm,
  onClose,
  onSubmit,
  isSubmitting = false,
}: ProjectCreationModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-bg)]/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-200 scale-100">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">
              Nuevo Proyecto
            </h2>
            <button
              onClick={onClose}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors p-2 rounded-lg"
              aria-label="Cerrar modal"
            >
              ✕
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            <Input
              required
              maxLength={60}
              label="Nombre"
              placeholder="Mi Arquitectura de Referencia"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              className="bg-[var(--color-bg)] border-[var(--color-border)] focus:border-[var(--color-accent)] focus:ring-[var(--color-accent-subtle)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
            />

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                Descripción
              </label>
              <textarea
                className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-subtle)] focus:border-[var(--color-accent)] transition-all resize-none min-h-[120px]"
                maxLength={240}
                placeholder="Describe brevemente el alcance..."
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />
              <div className="flex justify-end text-[11px] text-[var(--color-text-muted)]">
                {form.description.length}/240
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                Estado del Proyecto
              </label>
              <select
                className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-subtle)] focus:border-[var(--color-accent)] transition-all appearance-none"
                value={form.status}
                onChange={(event) => setForm({ ...form, status: event.target.value as ProjectRequest['status'] })}
              >
                <option value="ACTIVE"> ✔︎ Activo</option>
                <option value="DRAFT">🗒 Borrador</option>
                <option value="ARCHIVED">🗃️ Archivado</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="flex-1 border border-[var(--color-border)] hover:bg-[var(--color-surface)] text-[var(--color-text-secondary)] rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-accent-foreground)] rounded-xl"
              >
                Siguiente
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ProjectCreationModal