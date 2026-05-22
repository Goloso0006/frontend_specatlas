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
    <div className="group relative h-80 w-full perspective-1000 focus-within:outline-none">
      <div className="relative h-full w-full transform-style-3d transition-all duration-700 ease-out group-hover:rotate-y-180">
        {/* Front */}
        <div className="absolute inset-0 backface-hidden">
          <div className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[linear-gradient(180deg,var(--color-bg-card),var(--color-surface))] p-6 text-left shadow-[0_12px_34px_rgba(43,43,43,0.06)] transition-all duration-300 group-hover:-translate-y-1 group-hover:border-[var(--color-border-strong)] group-hover:shadow-[0_22px_55px_rgba(43,43,43,0.11)]">
            <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[var(--color-accent-subtle)] opacity-70 blur-2xl transition-transform duration-500 group-hover:scale-125" />
            <div className="relative mb-6 grid h-16 w-16 place-items-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-sm transition-transform group-hover:scale-105">
              <div className="opacity-80">{icon}</div>
            </div>
            <div className="relative mt-auto">
              <h3 className="text-2xl font-black tracking-[-0.04em] text-[var(--color-text-primary)]">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">{description}</p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-transparent bg-app-accent px-3 py-1 text-xs font-semibold text-app-accent-foreground">
                <span>Explorar módulo</span>
                <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Back */}
        <div className="absolute inset-0 backface-hidden rotate-y-180">
          <div className="h-full rounded-3xl border border-[var(--color-border-strong)] bg-[var(--color-bg-card)] p-6 shadow-inner">
            <div className="flex h-full flex-col justify-center text-center">
              {backContent || (
                <>
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-accent-subtle)]">
                    <span className="text-3xl">{icon}</span>
                  </div>
                  <h4 className="mb-3 text-xl font-bold text-[var(--color-text-primary)]">{title}</h4>
                  <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{description}</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
