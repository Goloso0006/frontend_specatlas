import type { DiagramType } from '../../types/diagrams'

interface DiagramEditorEmptyStateProps {
  type: DiagramType
}

export function DiagramEditorEmptyState({ type }: DiagramEditorEmptyStateProps) {
  const isClass = type === 'CLASS'
  
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="max-w-md text-center p-8 bg-[var(--color-bg-card)]/70 dark:bg-[#0b0f12]/80 backdrop-blur-sm rounded-2xl border border-[var(--color-border)] border-dashed pointer-events-auto">
        <div className="w-16 h-16 rounded-full bg-app-accent-subtle flex items-center justify-center mx-auto mb-6 text-app-accent">
          {isClass ? (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          ) : (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          )}
        </div>
        <h3 className="text-xl font-semibold text-app-text-primary mb-2">
          {isClass ? 'Agrega tu primera clase' : 'Agrega un actor o caso de uso'}
        </h3>
        <p className="text-sm text-app-text-secondary leading-relaxed">
          {isClass 
            ? 'Comienza a modelar las entidades y relaciones de tu sistema estructural.' 
            : 'Representa las interacciones entre los usuarios y las funcionalidades del sistema.'}
        </p>
        <div className="mt-6 flex items-center justify-center gap-2 text-xs font-medium text-app-accent">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Usa el botón + de la barra lateral para crear una clase, interfaz o enumeración
        </div>
      </div>
    </div>
  )
}
