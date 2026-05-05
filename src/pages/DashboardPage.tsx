import { useState, useEffect, useMemo } from 'react'
import { useTheme } from '../hooks/useTheme'
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

// 🔹 Tarjeta flip para proyectos (con botón de eliminar en el reverso)
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
        {/* Frente: Nombre, ID, Estado (sin botón de eliminar) */}
        <div className="flip-card-front flex flex-col justify-between p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-sm hover:shadow-md transition-shadow duration-300">
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
                {project.id?.slice(-6).toUpperCase() || 'N/A'}
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

        {/* Reverso: Descripción + botón de eliminar con confirmación */}
        <div className="flip-card-back flex flex-col justify-between p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-accent-subtle)] flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-3 flex-1 w-full whitespace-pre-wrap break-words line-clamp-4 text-left">
              {project.description || 'Sin descripción disponible'}
            </p>
          </div>

          {/* Botón de eliminar / confirmación */}
          <div className="w-full flex flex-col items-center gap-2 mt-auto">
            {!confirmDelete ? (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setConfirmDelete(true)
                }}
                className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-red-400 hover:bg-red-400/10 px-3 py-1.5 rounded-md transition-colors"
                title="Eliminar proyecto"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Eliminar
              </button>
            ) : (
              <div className="flex flex-col items-center gap-2 w-full">
                <span className="text-[11px] text-[var(--color-text-muted)]">¿Eliminar proyecto?</span>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setConfirmDelete(false)
                    }}
                    className="px-3 py-1 text-[11px] rounded-md border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(e)
                      setConfirmDelete(false)
                    }}
                    className="px-3 py-1 text-[11px] rounded-md bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                  >
                    Sí, eliminar
                  </button>
                </div>
              </div>
            )}
            {/* Indicador de clic para abrir */}
            {!confirmDelete && (
              <span className="text-[10px] text-[var(--color-text-muted)]">Click para abrir</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// 🔹 Tarjeta "Crear Proyecto" (altura h-64)
function CreateProjectCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center justify-center h-56 w-full rounded-xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-bg-card)] hover:border-[var(--color-accent)] hover:bg-[var(--color-surface)] hover:shadow-lg transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-subtle)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg)]"
      aria-label="Crear nuevo proyecto"
    >
      <div className="w-16 h-16 rounded-full bg-[var(--color-accent-subtle)] flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
        <svg className="w-8 h-8 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </div>
      <span className="text-lg font-medium text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors">
        Nuevo Proyecto
      </span>
      <span className="text-sm text-[var(--color-text-muted)] mt-1">Crea un nuevo espacio de trabajo</span>
    </button>
  )
}

export function DashboardPage() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
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
      await projectFacade.createProject({ ...form, ownerId: user.userId })
      await handleFetch()
      setIsModalOpen(false)
      setForm({ ...EMPTY_PROJECT, ownerId: user.userId })
    }, { errorMessage: 'Error al crear el proyecto.' })
  }

  async function handleDeleteProject(projectId: string, e: React.MouseEvent) {
    e.stopPropagation()
    // La confirmación ahora se maneja dentro de la tarjeta, aquí solo se ejecuta el borrado
    await run(async () => {
      await projectFacade.deleteProject(projectId)
      setProjects(prev => prev.filter(p => p.id !== projectId))
      await handleFetch()
    }, { errorMessage: 'Error al eliminar el proyecto.' })
  }

  function openProject(id: string) {
    navigate(`/app/projects/${id}`)
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      {/* CSS personalizado para flip, logout y línea divisoria fina */}
      <style>{`
        .flip-card {
          perspective: 1200px;
        }
        .flip-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
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
        }
        .logout-btn {
          width: 40px;
          height: 40px;
          border-radius: 16px;
          border: 1px solid #1a1a1a;
          background: rgba(74, 74, 74, 0.39);
          mix-blend-mode: luminosity;
          box-shadow: 0px 0px 0px 1px rgba(0, 0, 0, 0.20);
          backdrop-filter: blur(15px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          overflow: hidden;
          transition: width 0.3s ease, transform 0.3s ease, background 0.3s ease;
        }

        .logout-btn:hover {
          width: 88px;
          transform: scale(1.03);
          justify-content: flex-start;
          padding-left: 11px;
        }

        .logout-btn:hover .logout-icon {
          margin-right: 8px;
        }

        .logout-icon {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
          transition: margin-right 0.3s ease;
        }

        .logout-text {
          display: inline-block;
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
        /* Línea divisoria más delgada */
        .header-divider-thin {
          border-bottom-width: 0.5px !important;
        }

        /* Theme toggle - Glassmorphism with rotating icons */
        .background {
          border-radius: 16px;
          border: 1px solid #1a1a1a;
          background: rgba(74, 74, 74, 0.39);
          mix-blend-mode: luminosity;
          box-shadow: 0px 0px 0px 1px rgba(0, 0, 0, 0.20);
          backdrop-filter: blur(15px);
          width: 40px;
          height: 40px;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .background:hover {
          transform: scale(1.05);
        }

        .change-theme__icon {
          width: 20px;
          height: 20px;
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
          overflow: hidden;
        }

        .icon-sun,
        .icon-moon {
          display: flex;
          justify-content: center;
          align-items: center;
          position: absolute;
          font-size: 1.25rem;
        }

        .icon-sun {
          animation: ease reverse-change-theme-sun .6s forwards;
        }

        .background:hover .icon-sun {
          animation: ease change-theme-sun .4s forwards;
        }

        @keyframes reverse-change-theme-sun {
          0% {
            transform: rotate(-45deg) scale(.8);
            opacity: 0;
          }

          50% {
            transform: rotate(8deg);
          }

          100% {
            transform: rotate(0deg) scale(1);
            opacity: 1;
          }
        }

        @keyframes change-theme-sun {
          0% {
            transform: rotate(0deg) scale(1);
            opacity: 1;
          }

          100% {
            transform: rotate(-45deg) scale(.8);
            opacity: 0;
          }
        }

        .icon-moon {
          animation: ease reverse-change-theme-moon .4s forwards;
        }

        .background:hover .icon-moon {
          animation: change-theme-moon .6s forwards;
        }

        @keyframes change-theme-moon {
          0% {
            transform: rotate(-45deg) scale(.8);
            opacity: 0;
          }

          50% {
            transform: rotate(8deg);
          }

          100% {
            transform: rotate(0deg) scale(1);
            opacity: 1;
          }
        }

        @keyframes reverse-change-theme-moon {
          0% {
            transform: rotate(0deg) scale(1);
            opacity: 1;
          }

          100% {
            transform: rotate(-45deg) scale(.8);
            opacity: 0;
          }
        }
      `}</style>

      {/* Header sin logo y con línea más fina */}
      <header className="sticky top-0 z-40 bg-[var(--color-bg)]/95 backdrop-blur-sm border-b border-[var(--color-border)] header-divider-thin">
        <div className="w-full px-2 sm:px-4 py-2 flex items-center justify-end gap-1">
          {/* Theme toggle - Glassmorphic */}
          <button
            onClick={toggleTheme}
            className="background"
            title="Cambiar tema (claro/oscuro)"
            aria-label="Cambiar tema"
          >
            <div className="change-theme__icon">
              {theme === 'light' ? (
                <>
                  <span className="icon-sun">☀️</span>
                  <span className="icon-moon">🌙</span>
                </>
              ) : (
                <>
                  <span className="icon-sun">☀️</span>
                  <span className="icon-moon">🌙</span>
                </>
              )}
            </div>
          </button>

          {/* Logout button - Glassmorphic */}
          <button
            className="logout-btn"
            onClick={handleLogout}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            <span className="logout-icon">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </span>
            <span className="logout-text">Salir</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-10 py-12">
        {/* Título principal cambiado a SpecAtlas */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-[var(--color-text-primary)]">
            SpecAtlas
          </h2>
          <p className="text-base text-[var(--color-text-secondary)] max-w-xl mx-auto leading-relaxed">
            Gestiona, analiza y organiza tus arquitecturas de software con precisión.
          </p>
        </div>


        {/* 🔍 Barra de búsqueda */}
        <div className="w-full max-w-2xl mx-auto mb-10">
          <ProjectSearchBar value={query} onChange={setQuery} />
        </div>

        {/* 📦 Grid de tarjetas */}
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
            {/* 🔒 Siempre va primero */}
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

      {/* Modal de creación */}
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
                    Crear Proyecto
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