import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

// ── Types ──────────────────────────────────────────────────────────────────

interface MenuItem {
  label: string
  icon: React.ReactNode
  path: string
}

interface ProjectSettingsMenuProps {
  projectId: string
}

// ── Icons ──────────────────────────────────────────────────────────────────

const GearIcon = () => (
  <svg
    width="16" height="16" fill="none" stroke="currentColor"
    viewBox="0 0 24 24" strokeWidth={1.75} aria-hidden="true"
  >
    <path
      strokeLinecap="round" strokeLinejoin="round"
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const InfoIcon = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const EditIcon = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

const RulesIcon = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
)

// ── Component ──────────────────────────────────────────────────────────────

export const ProjectSettingsMenu: React.FC<ProjectSettingsMenuProps> = ({ projectId }) => {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const menuItems: MenuItem[] = [
    {
      label: 'Información del proyecto',
      icon: <InfoIcon />,
      path: `/app/projects/${projectId}/info`,
    },
    {
      label: 'Editar proyecto',
      icon: <EditIcon />,
      path: `/app/projects/${projectId}/edit`,
    },
    {
      label: 'Editar reglas',
      icon: <RulesIcon />,
      path: `/app/projects/${projectId}/validation-rules`,
    },
  ]

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return
    function handlePointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  function handleSelect(path: string) {
    setIsOpen(false)
    navigate(path)
  }

  return (
    <div ref={containerRef} className="relative" style={{ zIndex: 30 }}>
      {/* ── Gear trigger button ── */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Opciones del proyecto"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        title="Opciones del proyecto"
        className={[
          'flex items-center justify-center w-9 h-9 rounded-lg',
          'border border-[var(--color-border)]',
          'bg-[var(--color-bg-card)]',
          'text-[var(--color-text-secondary)]',
          'hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]',
          'transition-all duration-150',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2',
          isOpen ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)]' : '',
        ].join(' ')}
      >
        <GearIcon />
      </button>

      {/* ── Dropdown menu ── */}
      {isOpen && (
        <div
          role="menu"
          aria-label="Opciones del proyecto"
          className={[
            'absolute right-0 top-full mt-2',
            'min-w-[200px] w-max',
            'bg-[var(--color-bg-card)]',
            'border border-[var(--color-border)]',
            'rounded-xl',
            'shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]',
            'py-1.5',
            'overflow-hidden',
          ].join(' ')}
          style={{
            animation: 'fadeInDown 120ms ease both',
          }}
        >
          <style>{`
            @keyframes fadeInDown {
              from { opacity: 0; transform: translateY(-6px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          {menuItems.map((item) => (
            <button
              key={item.path}
              type="button"
              role="menuitem"
              onClick={() => handleSelect(item.path)}
              className={[
                'w-full flex items-center gap-3 px-4 py-2.5',
                'text-[13px] font-medium text-left',
                'text-[var(--color-text-secondary)]',
                'hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]',
                'transition-colors duration-100',
                'focus:outline-none focus-visible:bg-[var(--color-surface)]',
              ].join(' ')}
            >
              <span className="flex-shrink-0 text-[var(--color-text-muted)]">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
