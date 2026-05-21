import type { Dispatch, FormEventHandler, SetStateAction } from 'react'
import type { ProjectRequest } from '../../types/projects'

const PROJECT_NAME_WORD_LIMIT = 8

function limitProjectNameWords(value: string) {
  const words = value.trim().split(/\s+/).filter(Boolean)
  if (words.length <= PROJECT_NAME_WORD_LIMIT) return value
  return words.slice(0, PROJECT_NAME_WORD_LIMIT).join(' ')
}

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

  const projectNameWordCount = form.name.trim() ? form.name.trim().split(/\s+/).filter(Boolean).length : 0

  return (
    <div className="project-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="project-modal-title">
      <div className="project-modal-card">
        <div className="project-modal-aside" aria-hidden="true">
          <span className="project-modal-kicker">SpecAtlas</span>
          <h2 id="project-modal-title">Nuevo proyecto</h2>
          <p>
            Define el espacio donde vivirán los requisitos, reglas ISO, decisiones técnicas y diagramas del sistema.
          </p>
          <div className="project-modal-steps">
            <span>01 Datos base</span>
            <span>02 Reglas ISO</span>
            <span>03 Modelado</span>
          </div>
        </div>

        <form onSubmit={onSubmit} className="project-modal-form">
          <div className="project-modal-form-header">
            <div>
              <span className="project-modal-kicker">Configura el workspace</span>
              <h3>Datos del proyecto</h3>
              <p>Usa un nombre reconocible y una descripción breve para ubicarlo rápido en tu tablero.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="project-modal-close"
              aria-label="Cerrar modal"
            >
              ✕
            </button>
          </div>

          <label className="project-field">
            <span>Nombre del proyecto</span>
            <input
              required
              maxLength={80}
              aria-describedby="project-name-limit"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: limitProjectNameWords(event.target.value) })}
              placeholder="Sistema de reservas clínicas"
              autoFocus
            />
            <small id="project-name-limit">
              Máximo {PROJECT_NAME_WORD_LIMIT} palabras · {projectNameWordCount}/{PROJECT_NAME_WORD_LIMIT}
            </small>
          </label>

          <label className="project-field">
            <span>Descripción</span>
            <textarea
              maxLength={240}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="Describe alcance, módulos principales o el problema que resolverá este proyecto."
            />
            <small>{form.description.length}/240 caracteres</small>
          </label>

          <label className="project-field">
            <span>Estado inicial</span>
            <select
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value as ProjectRequest['status'] })}
            >
              <option value="ACTIVE">Activo — listo para trabajar</option>
              <option value="DRAFT">Borrador — aún en definición</option>
              <option value="ARCHIVED">Archivado — solo referencia</option>
            </select>
          </label>

          <div className="project-modal-note">
            <strong>Siguiente paso:</strong> al crear el proyecto irás directo a configurar reglas ISO y documentación inicial.
          </div>

          <div className="project-modal-actions">
            <button type="button" onClick={onClose} className="project-secondary-action">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting || !form.name.trim()} className="project-primary-action">
              {isSubmitting ? 'Creando…' : 'Crear y continuar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProjectCreationModal
