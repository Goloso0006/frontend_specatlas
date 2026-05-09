import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectFacade } from '../facades/project.facade'
import { useApiOperation } from '../hooks/useLoadingError'
import { useAuth } from '../auth/useAuth'
import type { ProjectResponse, ProjectRequest } from '../types/projects'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import ProjectSearchBar from '../components/projects/ProjectSearchBar'

const EMPTY_PROJECT: ProjectRequest = {
  name: '',
  description: '',
  ownerId: '',
  status: 'ACTIVE',
}

// 🔹 Tarjeta flip para proyectos (reverso optimizado: descripción ocupa casi todo, eliminar contenido)
function FlipProjectCard({
  project,
  onClick,
  onDelete,
}: {
  project: ProjectResponse
  onClick: () => void
  onDelete: (e: React.MouseEvent) => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const statusConfig: Record<string, { color: string; icon: string; label: string }> = {
    ACTIVE: {
      color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
      icon: '●',
      label: 'Activo',
    },
    INACTIVE: {
      color: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
      icon: '○',
      label: 'Inactivo',
    },
    ARCHIVED: {
      color: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
      icon: '◔',
      label: 'Archivado',
    },
    DRAFT: {
      color: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
      icon: '○',
      label: 'Borrador',
    },
  }

  const status = statusConfig[project.status] || statusConfig.ARCHIVED

  return (
    <div className="flip-card w-full h-56 cursor-pointer group/card" onClick={onClick}>
      <div className="flip-card-inner">
        {/* ── Frente (sin cambios) ── */}
        <div className="flip-card-front flex flex-col justify-between p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-sm hover:shadow-md transition-shadow duration-300">
          {/* Marcas de esquina */}
          <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-[var(--color-accent)] opacity-30 group-hover/card:opacity-80 transition-opacity" />
          <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-[var(--color-accent)] opacity-30 group-hover/card:opacity-80 transition-opacity" />
          <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-[var(--color-accent)] opacity-30 group-hover/card:opacity-80 transition-opacity" />
          <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-[var(--color-accent)] opacity-30 group-hover/card:opacity-80 transition-opacity" />

          <div>
            <div className="w-10 h-10 rounded-lg bg-[var(--color-accent-subtle)] flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] line-clamp-2 leading-tight">
              {project.name}
            </h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--color-text-muted)]">ID:</span>
              <span className="font-mono text-[var(--color-text-secondary)]">
                {project.id || 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--color-text-muted)]">Estado:</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium ${status.color}`}>
                {status.icon} {status.label}
              </span>
            </div>
          </div>
        </div>

        {/* ── Reverso optimizado: descripción ocupa casi toda la tarjeta, botón eliminar dentro ── */}
        <div className="flip-card-back flex flex-col p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
          {/* Pequeño icono de referencia (esquina superior izquierda) */}
          <div className="absolute top-3 left-3 text-[var(--color-text-muted)] opacity-60">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>

          {/* Descripción: ocupa todo el espacio disponible */}
          <div className="flex-1 min-h-0 pt-5 pb-1">
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap break-words line-clamp-5 text-left">
              {project.description || 'Sin descripción disponible'}
            </p>
          </div>

          {/* Footer con eliminar (siempre dentro de la tarjeta) */}
          <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)] text-xs shrink-0">
            {!confirmDelete ? (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setConfirmDelete(true)
                  }}
                  className="flex items-center gap-1 text-[var(--color-text-muted)] hover:text-red-400 hover:bg-red-400/10 px-2 py-1 rounded-md transition-colors"
                  title="Eliminar proyecto"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Eliminar
                </button>
                <span className="text-[10px] text-[var(--color-text-muted)] font-mono">↵ Abrir</span>
              </>
            ) : (
              <div className="flex items-center justify-between w-full gap-2">
                <span className="text-[11px] text-[var(--color-text-muted)]">¿Eliminar?</span>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setConfirmDelete(false)
                    }}
                    className="px-2 py-1 text-[11px] rounded border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] transition-colors"
                  >
                    No
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(e)
                      setConfirmDelete(false)
                    }}
                    className="px-2 py-1 text-[11px] rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                  >
                    Sí
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// 🔹 Tarjeta "Crear Proyecto" (sin cambios)
function CreateProjectCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col items-center justify-center h-56 w-full rounded-xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-bg-card)] hover:border-[var(--color-accent)] hover:shadow-lg transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-subtle)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg)] overflow-hidden"
      aria-label="Crear nuevo proyecto"
    >
      <div className="absolute inset-0 bg-[var(--color-accent-subtle)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-[var(--color-accent-subtle)] flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
          <svg className="w-8 h-8 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <span className="text-lg font-medium text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors">
          Nuevo Proyecto
        </span>
        <span className="text-sm text-[var(--color-text-muted)] mt-1">Crea un nuevo espacio de trabajo</span>
      </div>
    </button>
  )
}

export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<ProjectResponse[]>([])
  const [query, setQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState<ProjectRequest>({ ...EMPTY_PROJECT, ownerId: user?.userId ?? '' })

  const { run, isLoading } = useApiOperation()

  useEffect(() => {
    if (!user?.userId) return
    handleFetch()
  }, [user?.userId])

  async function handleFetch() {
    if (!user?.userId) return
    await run(async () => {
      const data = await projectFacade.getProjectsByUser(user.userId)
      setProjects(data)
    }, { errorMessage: 'No fue posible listar los proyectos.' })
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return projects
    return projects.filter((p) => p.name.toLowerCase().includes(q))
  }, [projects, query])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !user?.userId) return

    await run(async () => {
      // Create project and navigate to ISO rules setup (next step)
      const created = await projectFacade.createProject({ ...form, ownerId: user.userId })
      // Refresh list
      await handleFetch()
      // Reset form/modal
      setIsModalOpen(false)
      setForm({ ...EMPTY_PROJECT, ownerId: user.userId })

      // Navigate to the ISO rules selection for the newly created project
      if (created && created.id) {
        navigate(`/app/projects/${created.id}/iso-rules`)
      }
    }, { errorMessage: 'Error al crear el proyecto.' })
  }

  async function handleDeleteProject(projectId: string, e: React.MouseEvent) {
    e.stopPropagation()
    await run(async () => {
      await projectFacade.deleteProject(projectId)
      setProjects(prev => prev.filter(p => p.id !== projectId))
      await handleFetch()
    }, { errorMessage: 'Error al eliminar el proyecto.' })
  }

  function openProject(id: string) {
    navigate(`/app/projects/${id}`)
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      {/* ─── Estilos ─── */}
      <style>{`
        /* Flip card */
        .flip-card {
          perspective: 1200px;
        }
        .flip-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 0.55s cubic-bezier(0.4, 0, 0.2, 1);
          transform-style: preserve-3d;
        }
        .flip-card:hover .flip-card-inner {
          transform: rotateY(180deg);
        }
        .flip-card-front, .flip-card-back {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .flip-card-back {
          transform: rotateY(180deg);
          overflow: hidden; /* Contenido nunca se sale */
        }

        /* Logo */
        .sa-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }
        .sa-logo-mark {
          width: 28px;
          height: 28px;
          border: 1.5px solid var(--color-accent);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-accent-subtle);
        }
        .sa-logo-name {
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--color-text-primary);
          text-transform: uppercase;
        }

        /* Hero */
        .sa-hero-eyebrow {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--color-accent);
        }
        .sa-hero-title {
          font-size: clamp(2rem, 5vw, 3.25rem);
          font-weight: 800;
          letter-spacing: -0.025em;
          line-height: 1.05;
          color: var(--color-text-primary);
          margin: 0;
        }
        .sa-hero-title span {
          color: var(--color-accent);
        }
        .sa-hero-sub {
          font-size: 15px;
          color: var(--color-text-secondary);
          font-weight: 400;
          max-width: 480px;
          line-height: 1.6;
        }

        /* Stat pills */
        .sa-stats {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .sa-stat {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 999px;
          border: 0.5px solid var(--color-border);
          background: var(--color-bg-card);
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          color: var(--color-text-secondary);
        }
        .sa-stat-num {
          color: var(--color-text-primary);
          font-weight: 500;
        }

        /* Theme toggle & logout (sin colores fijos) */
        .background {
          border-radius: 8px;
          border: 0.5px solid var(--color-border);
          background: var(--color-bg-card);
          width: 40px;
          height: 40px;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
        }
        .background:hover {
          border-color: var(--color-border-strong, var(--color-text-muted));
        }
        .change-theme__icon {
          width: 20px;
          height: 20px;
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
        }

        /* Iconos SVG monocromáticos (reemplazan emojis) */
        .icon-sun, .icon-moon {
          position: absolute;
          color: var(--color-text-secondary);
          transition: opacity 0.3s, transform 0.3s;
        }
        .icon-sun { opacity: 1; transform: rotate(0deg); }
        .icon-moon { opacity: 0; transform: rotate(-45deg) scale(0.8); }
        .background:hover .icon-sun { opacity: 0; transform: rotate(-45deg) scale(0.8); }
        .background:hover .icon-moon { opacity: 1; transform: rotate(0deg) scale(1); }

        .logout-btn {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          border: 0.5px solid var(--color-border);
          background: var(--color-bg-card);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          overflow: hidden;
          transition: width 0.3s ease, background 0.2s;
          cursor: pointer;
        }
        .logout-btn:hover {
          width: 88px;
          justify-content: flex-start;
          padding-left: 11px;
          border-color: var(--color-border-strong, var(--color-border));
        }
        .logout-icon {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .logout-text {
          white-space: nowrap;
          font-size: 0.75rem;
          font-weight: 500;
          opacity: 0;
          width: 0;
          overflow: hidden;
          transition: opacity 0.3s ease, width 0.3s ease;
        }
        .logout-btn:hover .logout-text {
          opacity: 1;
          width: 34px;
        }
      `}</style>

      {/* ─── Main ─── */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-12 flex flex-col items-start gap-1">
          <span className="sa-hero-eyebrow">// workspace</span>
          <h1 className="sa-hero-title">
            Tus <span>proyectos</span>
          </h1>
          <p className="sa-hero-sub mt-2">
            Gestiona, analiza y organiza tus arquitecturas de software con precisión.
          </p>
          <div className="sa-stats mt-5">
            <div className="sa-stat">
              <span className="sa-stat-num">{projects.length}</span>
              proyectos
            </div>
            <div className="sa-stat">
              <span className="sa-stat-num">
                {projects.filter(p => p.status === 'ACTIVE').length}
              </span>
              activos
            </div>
          </div>
        </div>

        <div className="w-full max-w-2xl mx-auto mb-10">
          <ProjectSearchBar value={query} onChange={setQuery} />
        </div>

        {isLoading && projects.length === 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <CreateProjectCard onClick={() => setIsModalOpen(true)} />
            {[1, 2, 3].map(i => (
              <div key={i} className="h-56 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl animate-pulse flex items-center justify-center">
                <svg className="w-8 h-8 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <CreateProjectCard onClick={() => setIsModalOpen(true)} />
            {filtered.map((project) => (
              <FlipProjectCard
                key={project.id}
                project={project}
                onClick={() => openProject(project.id)}
                onDelete={(e) => handleDeleteProject(project.id, e)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modal de creación (sin cambios) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-bg)]/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-200 scale-100">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">
                  Nuevo Proyecto
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors p-2 rounded-lg"
                  aria-label="Cerrar modal"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-6">
                <Input
                  required
                  maxLength={60}
                  label="Nombre"
                  placeholder="Mi Arquitectura de Referencia"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
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
                    onChange={e => setForm({ ...form, description: e.target.value })}
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
                    onChange={e => setForm({ ...form, status: e.target.value as any })}
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
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 border border-[var(--color-border)] hover:bg-[var(--color-surface)] text-[var(--color-text-secondary)] rounded-xl"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-accent-foreground)] rounded-xl"
                  >
                    Siguiente
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardPage