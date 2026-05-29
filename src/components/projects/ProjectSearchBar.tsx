import React from 'react'
import { Input } from '../ui/Input'

export const ProjectSearchBar: React.FC<{
  value: string
  onChange: (v: string) => void
}> = ({ value, onChange }) => {
  return (
    <label className="project-search-shell relative block w-full">
      <span className="sr-only">Buscar proyectos</span>
      <span className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[var(--color-text-muted)]">
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
        </svg>
      </span>
      <Input
        placeholder="Buscar por nombre del proyecto..."
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        maxLength={60}
        className="h-12 pl-12 text-base shadow-none focus:border-[var(--color-accent)] focus:ring-[var(--color-accent-subtle)]"
      />
    </label>
  )
}

export default ProjectSearchBar
