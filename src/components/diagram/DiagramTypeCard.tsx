import React from 'react'
import { Button } from '../ui/Button'

interface DiagramTypeCardProps {
  title: string
  description: string
  icon: React.ReactNode
  onClick: () => void
  disabled?: boolean
}

export function DiagramTypeCard({
  title,
  description,
  icon,
  onClick,
  disabled = false
}: DiagramTypeCardProps) {
  return (
    <div 
      onClick={onClick}
      className={`group relative flex flex-col p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] hover:border-[var(--color-accent)] hover:shadow-lg transition-all duration-300 cursor-pointer ${
        disabled ? 'opacity-70 hover:border-[var(--color-border)]' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${
          disabled 
            ? 'bg-[var(--color-surface)] text-[var(--color-text-muted)]' 
            : 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)]'
        }`}>
          {icon}
        </div>
        {disabled && (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)]">
            Próximamente
          </span>
        )}
      </div>

      <div className="flex-1">
        <h3 className={`text-lg font-bold mb-2 transition-colors ${
          disabled 
            ? 'text-[var(--color-text-secondary)]' 
            : 'text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)]'
        }`}>
          {title}
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-6">
          {description}
        </p>
      </div>

      <div className="pt-2">
        <Button 
          variant={disabled ? "secondary" : "primary"} 
          size="sm" 
          className={`w-full h-9 font-semibold text-xs rounded-xl transition-all duration-300 ${
            disabled 
              ? 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)] cursor-not-allowed' 
              : 'bg-[var(--color-accent)] hover:opacity-90 text-[var(--color-accent-foreground)]'
          }`}
          onClick={(e) => {
            // Prevent event bubbling if clicked directly on the button
            e.stopPropagation();
            onClick();
          }}
        >
          {disabled ? 'Explorar (Próximamente)' : 'Gestionar'}
        </Button>
      </div>
    </div>
  )
}
