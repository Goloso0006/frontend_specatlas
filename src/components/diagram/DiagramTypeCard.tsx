import React from 'react'
import { Button } from '../ui/Button'
import type { DiagramType } from '../../types/diagrams'

interface DiagramTypeCardProps {
  type: DiagramType | 'COMPONENT' | 'SEQUENCE'
  title: string
  description: string
  icon: React.ReactNode
  onCreate: () => void
  onGenerate?: () => void
  disabled?: boolean
}

export function DiagramTypeCard({
  title,
  description,
  icon,
  onCreate,
  onGenerate,
  disabled = false
}: DiagramTypeCardProps) {
  return (
    <div className={`group relative flex flex-col p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] hover:border-[var(--color-accent)] transition-all duration-300 ${disabled ? 'opacity-60 grayscale' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-[var(--color-accent-subtle)] flex items-center justify-center text-[var(--color-accent)] group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        {disabled && (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)]">
            Próximamente
          </span>
        )}
      </div>

      <div className="flex-1">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2 group-hover:text-[var(--color-accent)] transition-colors">
          {title}
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-6">
          {description}
        </p>
      </div>

      <div className="flex gap-2">
        <Button 
          variant="secondary" 
          size="sm" 
          className="flex-1" 
          onClick={onCreate}
          disabled={disabled}
        >
          Crear
        </Button>
        {onGenerate && (
          <Button 
            size="sm" 
            className="flex-1 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white" 
            onClick={onGenerate}
            disabled={disabled}
          >
            Generar con IA
          </Button>
        )}
      </div>
    </div>
  )
}
