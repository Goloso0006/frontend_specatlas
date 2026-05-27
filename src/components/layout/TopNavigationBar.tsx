import React, { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { useTheme } from '../../hooks/useTheme'
import { useProject } from '../../context/ProjectContext'
import { useSmartNavigate } from '../../hooks/useSmartNavigate'

// ── Types ──────────────────────────────────────────────────────────────────

interface BreadcrumbSegment {
  label: string
  path: string
  isCurrent: boolean
}

interface ProjectAction {
  label: string
  shortLabel: string
  icon: React.ReactNode
  path: string
}

// ── Breadcrumb builder ──────────────────────────────────────────────────────

function useBreadcrumbs(): BreadcrumbSegment[] {
  const location = useLocation()
  const { currentProject } = useProject()

  const projectIdMatch = location.pathname.match(/\/app\/projects\/([^/]+)/)
  const urlProjectId = projectIdMatch?.[1] ?? null
  const projectLabel = currentProject?.name ?? (urlProjectId ?? 'Proyecto')

  const segments: BreadcrumbSegment[] = []
  const path = location.pathname

  if (!path.startsWith('/app')) return segments
  if (path === '/app' || path === '/app/') return segments

  if (urlProjectId) {
    const base = `/app/projects/${urlProjectId}`
    segments.push({ label: projectLabel, path: base, isCurrent: path === base })

    // ── Requirements flow breadcrumbs ──────────────────────────────────
    const reqBase = `${base}/requirements`

    if (path.startsWith(reqBase)) {
      // Always show "Requisitos" as intermediate crumb (clickable except on that exact page)
      const isReqRoot = path === reqBase
      segments.push({ label: 'Requisitos', path: reqBase, isCurrent: isReqRoot })

      if (!isReqRoot) {
        // Functional branch
        if (path.startsWith(`${reqBase}/functional`)) {
          const funcBase = `${reqBase}/functional`
          const isFuncRoot = path === funcBase
          segments.push({ label: 'Funcionales', path: funcBase, isCurrent: isFuncRoot })

          if (!isFuncRoot) {
            if (path === `${funcBase}/ai`) {
              segments.push({ label: 'IA', path: `${funcBase}/ai`, isCurrent: true })
            } else if (path === `${funcBase}/manual`) {
              segments.push({ label: 'Manual', path: `${funcBase}/manual`, isCurrent: true })
            }
          }
        }
        // Non-functional branch
        else if (path.startsWith(`${reqBase}/non-functional`)) {
          const nfBase = `${reqBase}/non-functional`
          const isNfRoot = path === nfBase
          segments.push({ label: 'No funcionales', path: nfBase, isCurrent: isNfRoot })

          if (!isNfRoot) {
            if (path === `${nfBase}/ai`) {
              segments.push({ label: 'IA', path: `${nfBase}/ai`, isCurrent: true })
            } else if (path === `${nfBase}/manual`) {
              segments.push({ label: 'Manual', path: `${nfBase}/manual`, isCurrent: true })
            }
          }
        }
        // Legacy branch
        else if (path === `${reqBase}/legacy`) {
          segments.push({ label: 'Legado', path: `${reqBase}/legacy`, isCurrent: true })
        }
        // Map branch
        else if (path === `${reqBase}/map`) {
          segments.push({ label: 'Mapa de requisitos', path: `${reqBase}/map`, isCurrent: true })
        }
      }
    }
    // ── Diagrams navigation flow ──────────────────────────────────
    else if (path.startsWith(`${base}/diagrams`)) {
      const isDiagRoot = path === `${base}/diagrams`
      segments.push({ label: 'Diagramas', path: `${base}/diagrams`, isCurrent: isDiagRoot })

      if (!isDiagRoot) {
        if (path.startsWith(`${base}/diagrams/class`)) {
          const classBase = `${base}/diagrams/class`
          const isClassRoot = path === classBase
          segments.push({ label: 'Diagrama de clases', path: classBase, isCurrent: isClassRoot })

          if (!isClassRoot) {
            const isNew = path === `${classBase}/new`
            const activeName = localStorage.getItem('active_diagram_name') || 'Nuevo diagrama'
            segments.push({
              label: isNew ? 'Nuevo diagrama' : activeName,
              path: path,
              isCurrent: true
            })
          }
        } else if (path.startsWith(`${base}/diagrams/use-case`)) {
          const ucBase = `${base}/diagrams/use-case`
          const isUcRoot = path === ucBase
          segments.push({ label: 'Diagrama de casos de uso', path: ucBase, isCurrent: isUcRoot })

          if (!isUcRoot) {
            const isNew = path === `${ucBase}/new`
            const activeName = localStorage.getItem('active_diagram_name') || 'Nuevo diagrama'
            segments.push({
              label: isNew ? 'Nuevo diagrama' : activeName,
              path: path,
              isCurrent: true
            })
          }
        } else if (path === `${base}/diagrams/new`) {
          segments.push({ label: 'Nuevo diagrama', path: `${base}/diagrams/new`, isCurrent: true })
        } else if (path === `${base}/diagrams/sequence`) {
          segments.push({ label: 'Diagrama de secuencia', path: `${base}/diagrams/sequence`, isCurrent: true })
        } else if (path === `${base}/diagrams/activity`) {
          segments.push({ label: 'Diagrama de actividades', path: `${base}/diagrams/activity`, isCurrent: true })
        } else if (path === `${base}/diagrams/component`) {
          segments.push({ label: 'Diagrama de componentes', path: `${base}/diagrams/component`, isCurrent: true })
        } else if (path === `${base}/diagrams/er`) {
          segments.push({ label: 'Diagrama entidad-relación', path: `${base}/diagrams/er`, isCurrent: true })
        } else {
          const activeName = localStorage.getItem('active_diagram_name') || 'Editor'
          segments.push({ label: activeName, path: path, isCurrent: true })
        }
      }
    } else if (path === `${base}/reports`) {
      segments.push({ label: 'Documentación', path: `${base}/reports`, isCurrent: true })
    } else if (path === `${base}/validation-rules`) {
      segments.push({ label: 'Reglas', path: `${base}/validation-rules`, isCurrent: true })
    } else if (path === `${base}/info`) {
      segments.push({ label: 'Información', path: `${base}/info`, isCurrent: true })
    } else if (path === `${base}/edit`) {
      segments.push({ label: 'Editar proyecto', path: `${base}/edit`, isCurrent: true })
    }
  }

  return segments
}

// ── Icons ──────────────────────────────────────────────────────────────────

const LogoIcon: React.FC = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
  </svg>
)

const Separator: React.FC = () => (
  <span aria-hidden="true" className="text-[var(--color-text-muted)] text-sm select-none px-0.5" style={{ opacity: 0.4 }}>
    /
  </span>
)

const GearIcon: React.FC<{ isOpen?: boolean }> = ({ isOpen }) => (
  <svg
    width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"
    strokeWidth={1.75} aria-hidden="true"
    style={{
      transition: 'transform 300ms ease',
      transform: isOpen ? 'rotate(60deg)' : 'rotate(0deg)',
    }}
  >
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

// ── Sub-components ──────────────────────────────────────────────────────────

const BreadcrumbSegment: React.FC<{ segment: BreadcrumbSegment; onClick: () => void }> = ({ segment, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-current={segment.isCurrent ? 'page' : undefined}
    className={[
      'inline-flex items-center h-[28px] px-2.5 rounded-md text-[13px] font-medium',
      'transition-all duration-150',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-1',
      'truncate max-w-[140px] sm:max-w-[220px]',
      segment.isCurrent
        ? 'text-[var(--color-text-primary)] bg-[var(--color-surface)]'
        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]',
    ].join(' ')}
  >
    {segment.label}
  </button>
)

const TopThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme()
  return (
    <button type="button" onClick={toggleTheme} aria-label="Cambiar tema"
      title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
      className="relative w-7 h-7 flex items-center justify-center rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
    >
      <svg className={`absolute inset-0 m-auto w-[14px] h-[14px] transition-all duration-200 ${theme === 'dark' ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`}
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
      </svg>
      <svg className={`absolute inset-0 m-auto w-[14px] h-[14px] transition-all duration-200 ${theme === 'light' ? 'opacity-0 -rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`}
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    </button>
  )
}

const TopLogoutButton: React.FC<{ onLogout: () => void }> = ({ onLogout }) => (
  <button type="button" onClick={onLogout} aria-label="Cerrar sesión" title="Cerrar sesión"
    className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
  >
    <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  </button>
)

/**
 * Inline project actions — slide in from the right inside the nav bar.
 * Rendered as compact chip-style buttons, not a floating dropdown.
 */
const ProjectInlineActions: React.FC<{
  isOpen: boolean
  actions: ProjectAction[]
  onSelect: (path: string) => void
}> = ({ isOpen, actions, onSelect }) => {
  return (
    /*
     * Outer container: overflow-hidden + flex row.
     * We animate max-width from 0 → natural width for the slide-in effect.
     * The translate on the inner container makes the items appear to
     * "fly in" from the right.
     */
    <div
      aria-hidden={!isOpen}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        overflow: 'hidden',
        // Drive the slide animation via max-width transition
        maxWidth: isOpen ? '440px' : '0px',
        opacity: isOpen ? 1 : 0,
        // Combined timing: width slides, then items fade+slide
        transition: isOpen
          ? 'max-width 240ms cubic-bezier(0.16,1,0.3,1), opacity 160ms ease 60ms'
          : 'max-width 200ms cubic-bezier(0.55,0,1,0.45), opacity 120ms ease',
        pointerEvents: isOpen ? 'auto' : 'none',
        // A thin left separator
        borderLeft: isOpen ? '1px solid var(--color-border)' : 'none',
        marginLeft: isOpen ? '6px' : '0',
        paddingLeft: isOpen ? '8px' : '0',
      }}
    >
      {actions.map((action, i) => (
        <button
          key={action.path}
          type="button"
          onClick={() => onSelect(action.path)}
          title={action.label}
          tabIndex={isOpen ? 0 : -1}
          style={{
            // Staggered slide-in per chip
            transform: isOpen ? 'translateX(0)' : 'translateX(18px)',
            opacity: isOpen ? 1 : 0,
            transition: isOpen
              ? `transform 220ms cubic-bezier(0.16,1,0.3,1) ${i * 40 + 40}ms, opacity 180ms ease ${i * 40 + 40}ms`
              : `transform 140ms ease, opacity 100ms ease`,
          }}
          className={[
            'inline-flex items-center gap-1.5 h-[26px] px-2.5 whitespace-nowrap flex-shrink-0',
            'rounded-md text-[12px] font-medium',
            'text-[var(--color-text-secondary)]',
            'hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]',
            'transition-colors duration-100',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-1',
          ].join(' ')}
        >
          <span className="text-[var(--color-text-muted)] flex-shrink-0">{action.icon}</span>
          <span className="hidden sm:inline">{action.shortLabel}</span>
          <span className="sm:hidden">{action.icon}</span>
        </button>
      ))}
    </div>
  )
}

// ── Action icons ────────────────────────────────────────────────────────────

const InfoIcon = () => (
  <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)
const EditProjIcon = () => (
  <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)
const RulesIcon = () => (
  <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
)

// ── Main component ──────────────────────────────────────────────────────────

export const TopNavigationBar: React.FC = () => {
  const navigate = useNavigate()
  const smartNavigate = useSmartNavigate()
  const location = useLocation()
  const { logout } = useAuth()
  const breadcrumbs = useBreadcrumbs()

  const isHome = location.pathname === '/app' || location.pathname === '/app/'
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  // Project settings toggle — only relevant when inside a project
  const [settingsOpen, setSettingsOpen] = useState(false)
  const gearButtonRef = useRef<HTMLButtonElement>(null)
  const navBarRef = useRef<HTMLElement>(null)

  // Extract projectId from URL for inline actions
  const projectIdMatch = location.pathname.match(/\/app\/projects\/([^/]+)/)
  const urlProjectId = projectIdMatch?.[1] ?? null
  // Gear only appears on the project hub (exact path), not inside sub-modules
  const isInProject =
    Boolean(urlProjectId) &&
    location.pathname === `/app/projects/${urlProjectId}`

  // Close settings when navigating away from project
  useEffect(() => {
    if (!isInProject) setSettingsOpen(false)
  }, [isInProject, location.pathname])

  // Close on Escape
  useEffect(() => {
    if (!settingsOpen) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setSettingsOpen(false)
        gearButtonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [settingsOpen])

  // Close on click outside the nav bar
  useEffect(() => {
    if (!settingsOpen) return
    function handlePointer(e: PointerEvent) {
      if (navBarRef.current && !navBarRef.current.contains(e.target as Node)) {
        setSettingsOpen(false)
      }
    }
    document.addEventListener('pointerdown', handlePointer)
    return () => document.removeEventListener('pointerdown', handlePointer)
  }, [settingsOpen])

  function handleLogout() { logout(); navigate('/login') }
  function handleHomeClick() { smartNavigate('/app', { replace: true }) }
  function handleActionSelect(path: string) {
    setSettingsOpen(false)
    navigate(path)
  }

  const projectActions: ProjectAction[] = urlProjectId
    ? [
        { label: 'Información del proyecto', shortLabel: 'Información', icon: <InfoIcon />, path: `/app/projects/${urlProjectId}/info` },
        { label: 'Editar proyecto',          shortLabel: 'Editar',      icon: <EditProjIcon />, path: `/app/projects/${urlProjectId}/edit` },
        { label: 'Editar reglas',            shortLabel: 'Reglas',      icon: <RulesIcon />,    path: `/app/projects/${urlProjectId}/validation-rules` },
      ]
    : []

  return (
    <div className="sticky top-0 z-50 px-3 sm:px-5 pt-3 pb-2" style={{ background: 'var(--color-bg)' }}>
      <header
        ref={navBarRef}
        role="banner"
        className={[
          'flex items-center h-11 px-3 sm:px-4',
          'rounded-xl',
          // Light mode: stronger, more visible border
          'border border-[var(--color-border-strong)]',
          'dark:border-[var(--color-border)]',
          'bg-[var(--color-bg-card)]/95 backdrop-blur-sm',
          // Light: more visible shadow; dark: dramatic depth
          'shadow-[0_1px_6px_rgba(0,0,0,0.09),0_0_0_0.5px_rgba(0,0,0,0.04)]',
          'dark:shadow-[0_1px_8px_rgba(0,0,0,0.35)]',
        ].join(' ')}
      >
        {/* ── Left: Logo + "SpecAtlas" (home) + Breadcrumbs ── */}
        <nav aria-label="Navegación principal" className="flex items-center gap-1 flex-1 min-w-0 overflow-hidden">
          {/* Home button */}
          <button type="button" onClick={handleHomeClick} aria-label="Ir al inicio" title="Ir al inicio"
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          >
            <LogoIcon />
          </button>

          {/* SpecAtlas title — home only, collapses away */}
          <span
            aria-hidden={!isHome}
            style={{
              display: 'inline-block', overflow: 'hidden', whiteSpace: 'nowrap',
              maxWidth: mounted && !isHome ? '0px' : '120px',
              opacity:   mounted && !isHome ? 0 : 1,
              transform: mounted && !isHome ? 'translateX(-8px)' : 'translateX(0)',
              transition: mounted ? 'max-width 220ms ease, opacity 200ms ease, transform 200ms ease' : 'none',
              marginLeft: mounted && !isHome ? '0px' : '6px',
            }}
            className="font-bold text-[14px] tracking-[0.08em] uppercase text-[var(--color-text-primary)] select-none"
          >
            SpecAtlas
          </span>

          {/* Breadcrumb trail */}
          {breadcrumbs.length > 0 && (
            <ol aria-label="Ruta de navegación"
              className="flex items-center gap-0.5 min-w-0 overflow-x-auto"
              style={{ opacity: mounted ? 1 : 0, transition: 'opacity 200ms ease 80ms' }}
            >
              {breadcrumbs.map((segment) => (
                <React.Fragment key={segment.path}>
                  <li className="flex-shrink-0"><Separator /></li>
                  <li className="flex-shrink-0 min-w-0">
                    <BreadcrumbSegment segment={segment} onClick={() => !segment.isCurrent && smartNavigate(segment.path)} />
                  </li>
                </React.Fragment>
              ))}
            </ol>
          )}

          {/* Flex spacer */}
          <span className="flex-1" aria-hidden="true" />

          {/* ── Inline project settings (slide in from right within the bar) ── */}
          {isInProject && (
            <div className="flex items-center gap-1.5 flex-shrink-0 overflow-hidden">
              {/* Animated chip row */}
              <ProjectInlineActions
                isOpen={settingsOpen}
                actions={projectActions}
                onSelect={handleActionSelect}
              />

              {/* Gear toggle button */}
              <button
                ref={gearButtonRef}
                type="button"
                onClick={() => setSettingsOpen((prev) => !prev)}
                aria-label="Opciones del proyecto"
                aria-expanded={settingsOpen}
                title="Opciones del proyecto"
                className={[
                  'flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md',
                  'text-[var(--color-text-secondary)]',
                  'transition-all duration-150',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
                  settingsOpen
                    ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)]'
                    : 'hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]',
                ].join(' ')}
              >
                <GearIcon isOpen={settingsOpen} />
              </button>
            </div>
          )}
        </nav>

        {/* ── Right: Theme + Logout — home only ── */}
        <div
          aria-hidden={!isHome}
          style={{
            display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0, overflow: 'hidden',
            maxWidth: mounted && !isHome ? '0px' : '80px',
            opacity:  mounted && !isHome ? 0 : 1,
            pointerEvents: mounted && !isHome ? 'none' : 'auto',
            transition: mounted ? 'max-width 220ms ease, opacity 180ms ease' : 'none',
            marginLeft: '4px',
          }}
        >
          <TopThemeToggle />
          <TopLogoutButton onLogout={handleLogout} />
        </div>
      </header>
    </div>
  )
}
