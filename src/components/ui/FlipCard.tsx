import React from 'react'

export default function FlipCard({
  title,
  description,
  icon,
  backContent
}: {
  title: string
  description: string
  icon: React.ReactNode
  backContent?: React.ReactNode
}) {
  return (
    <div className="group relative w-full h-80 perspective-1000">
      <div className="relative w-full h-full transition-all duration-700 ease-out transform-style-3d group-hover:rotate-y-180">
        {/* Front */}
        <div className="absolute inset-0 backface-hidden">
          <div className="h-full rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border)] p-6 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all duration-300 hover:border-[var(--color-border-strong)]">
            <div className="text-5xl mb-5 opacity-80 transition-transform group-hover:scale-105">{icon}</div>
            <h3 className="text-xl font-semibold tracking-tight text-[var(--color-text-primary)] mb-2">{title}</h3>
            <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{description}</p>
            <div className="mt-5 text-xs text-[var(--color-text-muted)] opacity-60 flex items-center gap-1">
              <span>Hover para explorar</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Back */}
        <div className="absolute inset-0 backface-hidden rotate-y-180">
          <div className="h-full rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-strong)] p-6 shadow-inner">
            <div className="h-full flex flex-col items-center justify-center text-center">
              {backContent || (
                <>
                  <div className="w-16 h-16 rounded-full bg-[var(--color-accent-subtle)] flex items-center justify-center mb-5">
                    <span className="text-3xl">{icon}</span>
                  </div>
                  <h4 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">{title}</h4>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{description}</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
